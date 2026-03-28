import React from "react";
import Sidebar from "../components/Sidebar"; // <-- import Sidebar từ folder Components
// import "../styles/adminLayout.css"; // nếu có CSS riêng
import Header from "../components/Header";

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <Header username="Admin" />
      <Sidebar role="Admin"/> {/* Sidebar sẽ luôn hiển thị bên trái */}
      <div className="admin-content">
        {children} {/* Nội dung trang sẽ được render ở đây */}
      </div>
    </div>
  );
}