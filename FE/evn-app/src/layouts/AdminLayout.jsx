import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function AdminLayout({ username, role }) {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Header username={username} />
    
      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Sidebar */}
        <div style={{ backgroundColor: "#f3f4f6" }}>
          <Sidebar role={role} />
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: "24px", backgroundColor: "#f9fafb", overflow: "auto", width: "100%", boxSizing: "border-box" }}>
          <Outlet />
        </div>

      </div>
    </div>
  );
}