import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar"; // <-- import Sidebar từ folder Components
// import "../styles/adminLayout.css"; // nếu có CSS riêng
import Header from "../components/Header";

export default function AdminLayout({ username, role}) {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Header username={username} />
    
      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-64 bg-gray-100">
          <Sidebar role={role} />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 bg-gray-50 overflow-auto">
          <Outlet />
        </div>

      </div>
    </div>
  );
}