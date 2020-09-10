import React, { Component} from 'react';
import {connect} from 'react-redux';

class Nav extends Component {  
  
  renderContent(){
    if(this.props.auth){
      var name =this.props.auth.name;
    }

    switch (this.props.auth){
      case null:
        return ;
      case false:
        return (
          <li><a className="btn btn-primary" href="/auth/google">Login with Google</a></li>
        );
      default:
        return (
          <>
          <li className="nav-item active">
            <p className="nav-link" href="#">Welcome back, {name}! <span className="sr-only">{name}</span></p>
          </li>
          <li><a href="/api/logout" className="btn btn-primary">Logout</a></li>
          </>    
        
        );
    }
  }
  render(){
    function toggleNav (){
      document.getElementById("wrapper").classList.toggle("toggled");
      if(document.getElementById("wrapper").classList.value === "d-flex"){
        document.getElementById("menu-toggle").innerText="Hide Menu";
      }else{
        document.getElementById("menu-toggle").innerText="Show Menu";
      }
      
    }
  
    return (
      <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom mb-2">
      <button className="btn btn-primary" onClick={toggleNav} id="menu-toggle">Hide Menu</button>

      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarSupportedContent">
        <ul className="navbar-nav ml-auto mt-2 mt-lg-0">                                
            {this.renderContent()}          
        </ul>
      </div>
    </nav>
    );
  }
}

function mapStateToProps(state){
  return { auth: state.auth };
}

export default connect(mapStateToProps)(Nav);