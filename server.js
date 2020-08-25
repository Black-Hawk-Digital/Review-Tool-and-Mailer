const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();

// database connection
mongoose
  .connect(process.env.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database is connected!"))
  .catch((err) => console.log(err));

require("./models/SentEmail");
const EmailSent = mongoose.model("sentemails");

// CSV an EMail Processing

const csv = require("csv-parser");
const fs = require("fs");
var nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const { parseJSON } = require("jquery");
dotenv.config();
const { USER_EMAIL, EMAIL_PASSWORD } = process.env;

// End CSV an EMail Processing

app.use(fileUpload());

// Upload Endpoint
app.post("/upload", (req, res) => {
  if (req.files === null) {
    return res.status(400).json({ msg: "No file uploaded" });
  }

  const file = req.files.file;

  // console.log("this is from upload");

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
function sendEmail(list) {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: USER_EMAIL,
      pass: EMAIL_PASSWORD,
    },
  });

  var mailOptions = {
    from: USER_EMAIL,
    to: list,
    subject: "Just Testing",
    text: `I am sending you this email 
    from Node.js application using emails from uploaded CSV file`,
    // html: '<h1>Hello</h1>'
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      // res.send("Email(s) are sent to: " + list+". File containing data has been removed from the server");
      //  res.send('Email(s) are sent to: ' +list +'Tech Details: '+ info.response);
    }
  });
}
// End send Email Function

// Send email Route
app.post("/sendemails", (req, res) => {
  // Start
  // Initialize empty arrays
  const results = [];
  var list = [];
  var newList= [];
  // Read data from CSV file and get emails only

  const path = `${__dirname}/client/public/uploads/data.csv`;

  fs.access(path, fs.F_OK, (err) => {
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
          // console.log(results);
          for (var i = 0; i < results.length; i++) {
            list.push(results[i].Email);

            // check if email already in the DB
            // if email in the database, means they received email

            EmailSent.find({
              sentEmailFlag: true,
              email: results[i].Email,
            }).exec((err, listOfRecordsInDB) => {
              if (err) {
                console.log(err);
              }

              // else{console.log("list is empty, all emails already in DB");}

              // console.log(newList);
              
              // console.log(typeof(listOfFlaggedFalse));//is object
            });

            // if email not in database, add email to list and send emails to those and save new emails
            // End check if email already in the DB

            // console.log(typeof(results[i].Email));
            // let emailsent = new EmailSent({
            //   email: results[i].Email,
            //   sentEmailFlag: true,
            // });
            // emailsent.save((err, success) => {
            //   if (err) {
            //     console.log(err);
            //   }
            //   // console.log(success);
            //   // return res.json(success);
            // });

          }
          // console.log(typeof(list));
          // console.log(list[0]);

          res.send(
          `Email(s) are successfully sent to:

           ${list}

           File containing data has been removed from the server
           `
          );
          // console.log(typeof(list[0]));
        });

      // send Email

      // if(newList){
      //   sendEmail(newList);
      // } 

      // res.send({mess:`Email(s) are successfully sent.  File containing data has been removed from the server` });

      // Delete File from server - MAKE IT A FUNCTION
      try {
        fs.unlinkSync(path);
        //file removed
      } catch (err) {
        console.error(err);
      }
      // End Delete File from server

      // Confirmation of file Deletion - MAKE IT A FUNCTION
      fs.access(path, fs.F_OK, (err) => {
        if (err) {
          // console.error(err);
          console.log("File is successfully removed from the server");
          return;
        }

        //file exists
        console.log("File was not removed from the system");
      });
      // End Confirmation of file Deletion

      // End
    }
  });
});
// End Send email Route
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server Started... on port ${PORT}`));
