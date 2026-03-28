import React from "react";
import "../styles/Header.css"; 
import evnLogo from "../assets/EVN-LOGO.png";

export default function Header({ username }) {
  return (
    <header className="admin-header">
      <div className="header-left">
        <img src={evnLogo} alt="logo"/>
      </div>
      <div className="header-right">
        <span>Welcome, {username}</span>
      </div>
    </header>
  );
}