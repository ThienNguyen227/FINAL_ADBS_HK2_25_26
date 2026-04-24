import React from "react";
import "../styles/Header.css";
import evnLogo from "../assets/EVN-LOGO.png";
import { useAuth } from "../hooks/useAuth";

export default function Header() {

  const { user } = useAuth();

  return (
    <header className="admin-header">
      <div className="header-left">
        <img src={evnLogo} alt="logo" />
      </div>

      <div className="header-right">
        <span>
          Welcome, {user?.user_name}
        </span>
      </div>
    </header>
  );
}