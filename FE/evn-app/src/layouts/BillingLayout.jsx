import React from "react";
import Sidebar from "../components/Sidebar"; // <-- import Sidebar từ folder Components
// import "../styles/adminLayout.css"; // nếu có CSS riêng
import Header from "../components/Header";

export default function BillingLayout({ children }) {
  return (
    <div className="billing-layout">
      <Header username="Billing" />
      <Sidebar role="Billing"/> {/* Sidebar sẽ luôn hiển thị bên trái */}
      <div className="billing-content">
        {children} {/* Nội dung trang sẽ được render ở đây */}
      </div>
    </div>
  );
}