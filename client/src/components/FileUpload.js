import React, { Fragment, useState, Component } from "react";
import { connect } from "react-redux";
import {
  BrowserRouter as Router,
  // Switch,
  // Route,
  // Link,
  Redirect,
} from "react-router-dom";
import Message from "./Message";
import Progress from "./Progress";

import axios from "axios";
// import fileUpload from 'express-fileupload';

const Upload = () => {
  const [file, setFile] = useState("");
  const [filename, setFilename] = useState("Choose File");
  const [uploadedFile, setUploadedFile] = useState({});
  const [message, setMessage] = useState("");
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [link, setLink] = useState(false);
  const [notify, setNotify] = useState({
    filename: "No File Uploaded",
    mess: "",
    list: "",
  });
  const [emailContent, setEmailContent] = useState("");

  const onChange = (e) => {
    setFile(e.target.files[0]);
    // console.log(e.target.files[0]);
    setFilename(e.target.files[0].name);
  };
  const TAOnChange = (e) => {
    setEmailContent(e.target.value);
    // setFilename(e.target.files[0].name);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("emailContent", emailContent);

    try {
      const res = await axios.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          setUploadPercentage(
            parseInt(
              Math.round((progressEvent.loaded * 100) / progressEvent.total)
            )
          );

          // Clear percentage
          setTimeout(() => setUploadPercentage(0), 10000);
        },
      });

      const { fileName, filePath, fileContent } = res.data;
      // console.log(fileContent[0]);
      setUploadedFile({ fileName, filePath, fileContent });
      setMessage("File Uploaded");
      setLink(true);

      setNotify({ filename: fileName });
    } catch (err) {
      if (err.response.status === 500) {
        setMessage("There was a problem with the server");
      } else {
        setMessage(err.response.data.msg);
      }
    }
  };

  // console.log(uploadedFile);
  function ActionButton() {
    async function handleClick(e) {
      e.preventDefault();
      // console.log('the link was clicked');
      const formData = new FormData();
      formData.append("emailContent", emailContent);

      const res = await axios.post("/sendemails", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // console.log(link);
      console.log(res.data);
      setNotify({ mess: res.data.mess, list: res.data.list });
      setUploadedFile({ fileContent: "" });
    }
    return (
      <div>
        <button className="btn btn-danger" onClick={handleClick}>
          Send Emails
        </button>
        <p>
          Email Status :{notify.mess === "" ? notify.filename : notify.mess}
        </p>
        <p>{notify.list}</p>
      </div>
    );
  }
  return (
    <Fragment>
      <div className="m-2">
        {message ? <Message msg={message} /> : null}
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="TextareaForEmail">
              Enter your promotional link
            </label>
            <textarea
              className="form-control"
              id="TextareaForEmail"
              rows="2"
              onChange={TAOnChange}
            ></textarea>
          </div>
          <div className="custom-file mb-4">
            <input
              type="file"
              className="custom-file-input"
              id="customFile"
              onChange={onChange}
            />
            <label className="custom-file-label" htmlFor="customFile">
              {filename}
            </label>
          </div>

          <Progress percentage={uploadPercentage} />

          <input
            type="submit"
            value="Upload"
            className="btn btn-primary btn-block mt-4"
          />
        </form>
        {uploadedFile ? (
          <div className="row mt-5">
            <div className="col-md-6 m-auto">
              <h3 className="text-center">{uploadedFile.fileName}</h3>
              <img
                style={{ width: "100%" }}
                src={uploadedFile.filePath}
                alt=""
              />

              <ul>
                {uploadedFile.fileContent
                  ? uploadedFile.fileContent.map((item) => (
                      <li key={item}>{item}</li>
                    ))
                  : ""}
              </ul>
            </div>
          </div>
        ) : null}

        <ActionButton />
        <Router>{link && <Redirect to={"/sendemails"} />}</Router>
      </div>
    </Fragment>
  );
};

class FileUpload extends Component {
  renderContent() {
    switch (this.props.auth) {
      case null:
        return;
      case false:
        return (
          <div className="m-4">
            <div className="card">
              <div className="card-body text-center">
                <h4 className="card-title">Mailer page</h4>
                <p>Must be logged in to view the page</p>
              </div>
            </div>
          </div>
        );
      default:
        return <Upload />;
    }
  }
  render() {
    return <div>{this.renderContent()}</div>;
  }
}

function mapStateToProps(state) {
  return { auth: state.auth };
}
export default connect(mapStateToProps)(FileUpload);
