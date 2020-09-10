const express = require("express");
const mongoose = require("mongoose");
// purpose of keys file is to load appropriate credentials, depending on the environment
const keys = require("./config/keys");
const cookieSession = require("cookie-session");
const passport = require("passport");
const fileUpload = require("express-fileupload");
const path = require("path");
require("dotenv").config();

// database connection
mongoose
  .connect(process.env.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database is connected!"))
  .catch((err) => console.log(err));

const app = express();

require("./models/SentEmail");
require("./models/User");
require("./services/passport");
const EmailSent = mongoose.model("sentemails");

// tell express to use Cookies
app.use(
  cookieSession({
    maxAge: 30 * 24 * 60 * 60 * 1000,
    keys: [keys.cookieKey],
  })
);
// tell express about authorization
app.use(passport.initialize());
app.use(passport.session());

require("./routes/authRoutes")(app);

// CSV an EMail Processing
const csv = require("csv-parser");
const fs = require("fs");
var nodemailer = require("nodemailer");
const { USER_EMAIL, EMAIL_PASSWORD } = process.env;

app.use(fileUpload());

// Upload Endpoint
app.post("/upload", (req, res) => {
  if (req.files === null) {
    return res.status(400).json({ msg: "No file uploaded" });
  }
  // get file
  const file = req.files.file;
  // rename uploaded file to data.csv
  file.name = "data.csv";

  file.mv(`${__dirname}/client/public/uploads/${file.name}`, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }
    // create temp list of emails to render
    const tempResults = [];
    var tempList = [];
    const path = `${__dirname}/client/public/uploads/${file.name}`;
    fs.createReadStream(path)
      .pipe(csv())
      .on("data", (data) => tempResults.push(data))
      .on("end", () => {
        for (var i = 0; i < tempResults.length; i++) {
          tempList.push(tempResults[i].Email);
        }

        res.json({
          fileName: file.name,
          filePath: `/uploads/${file.name}`,
          fileContent: tempList,
          entireFile: file,
        });
      });

    // end create temp list of emails to render
  });
});
// send Email Function
function sendEmail(list, text) {
  var transporter = nodemailer.createTransport({
    // service: "gmail",
    host: "smtp.privateemail.com",
    port: 587,
    secure: false,
    auth: {
      user: USER_EMAIL,
      pass: EMAIL_PASSWORD,
    },
  });

  var mailOptions = {
    from: USER_EMAIL,
    to: list,
    subject: "Just Testing",
    text: `
    I am sending you this email from 
    application using emails from uploaded CSV file.
    Following text is from front-end input field >>>>>>>:  ${text}
    `,
    dsn: {
      id: "some random message specific id",
      return: "headers",
      notify: "success",
      recipient: "vitaliy_bulyma@yahoo.ca",
    },
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("this is accepted email: " + info.accepted[0]);
    }
  });
}
// Compares two arrays, returns new array with unique items
function compare(arr1, arr2) {
  var tempArray = [];
  for (var i = 0; i < arr1.length; i++) {
    if (arr2.indexOf(arr1[i]) === -1) {
      tempArray.push(arr1[i]);
    }
  }
  for (var j = 0; j < arr2.length; j++) {
    if (arr1.indexOf(arr2[j]) === -1) {
      tempArray.push(arr2[j]);
    }
  }
  return tempArray;
}

// Send email Route
app.post("/sendemails", (req, res) => {
  // Initialize empty arrays
  // console.log(req.body.emailContent);
  const emailContent = req.body.emailContent;
  const results = [];
  var list = [];

  // Read data from CSV file and get emails only

  const path = `${__dirname}/client/public/uploads/data.csv`;

  fs.access(path, fs.F_OK, (err) => {
    // file does not exist
    if (err) {
      console.error(err);
      res.send("CSV file containing emails list does not exist");
      return;
    } else {
      //file exists
      fs.createReadStream(path)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => {
          // add all emails from csv file to array
          for (var i = 0; i < results.length; i++) {
            list.push(results[i].Email);
          }
          // now check if emails exist in db
          EmailSent.find({
            email: list.map((item) => item),
          }).exec((err, listOfRecordsInDB) => {
            if (err) {
              console.log(err);
            }
            console.log(
              "list of records in database :" +
                listOfRecordsInDB.map((item) => item.email)
            );
            var newArray = [];
            // looking for emails that don't exist in Db
            newArray = compare(
              list,
              listOfRecordsInDB.map((item) => item.email)
            );
            console.log("this is a TempArray of differences " + newArray);
            // sends email to emails that do not exist in db and save them to db
            for (var i = 0; i < newArray.length; i++) {
              sendEmail(newArray[i], emailContent);
              let emailsent = new EmailSent({
                email: newArray[i],
                sentEmailFlag: true,
              });
              emailsent.save((err, success) => {
                if (err) {
                  console.log(err);
                }
              });
            }
            // check if newArray is empty
            if (newArray.length === 0) {
              newArray = "No New Records in csv file. ";
            }

            res.send({
              mess: `Email(s) are sent to:

              ${newArray}

              File containing data removed from the server
              `,
            });
          });

          return list;
        });
      // Delete File from server - MAKE IT A FUNCTION
      setTimeout(() => {
        try {
          fs.unlinkSync(path);
          //file removed
        } catch (err) {
          console.error(err);
        }
        // End Delete File from server
      }, 3000);

      // Confirmation of file Deletion - MAKE IT A FUNCTION
      setTimeout(() => {
        fs.access(path, fs.F_OK, (err) => {
          if (err) {
            console.log("File is successfully removed from the server");
            return;
          }
          //file exists
          console.log("File was not removed from the system");
        });
      }, 3001);
    }
  });
}); // End Send email Route

// code below will instruct heroku to serve Build folder
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
  });
}

// assign port and listen to it
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server Started... on port ${PORT}`));
