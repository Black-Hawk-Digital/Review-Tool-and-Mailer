import React, { Component } from "react";
import { BrowserRouter, Route } from "react-router-dom";
import { connect } from 'react-redux';
import * as actions from './actions';
import FileUpload from "./components/FileUpload";
import Nav from "./components/Nav";
import SideBar from "./components/SideBar";
import Card from "./components/Reviews";
import Dash from "./components/Dashboard";
import Landing from "./components/Landing";



import "./App.css";

class App extends Component {

  componentDidMount(){
    this.props.fetchUser();    
  
  }

  render() {
    return (
      <BrowserRouter>
        <div className="d-flex" id="wrapper">
          <SideBar />
          <div id="page-content-wrapper">
            <Nav />
            <Route path="/" exact component={Landing} />
            <Route path="/dashboard" exact component={Dash} />
            <Route path="/reviews" exact component={Card} />
            <Route path="/mailer" exact component={FileUpload} />
          </div>
        </div>
      </BrowserRouter>
    );
  }
}
export default connect(null, actions)(App);
