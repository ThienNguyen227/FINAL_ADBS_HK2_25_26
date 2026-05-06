import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";

import { FaMoneyBillTrendUp, FaBolt, FaUsers } from "react-icons/fa6";
import { FaTachometerAlt } from "react-icons/fa";
import { SiDowndetector } from "react-icons/si";
import { LiaFileContractSolid } from "react-icons/lia";
import { MdDashboard } from "react-icons/md";
import { TbReportSearch, TbContract } from "react-icons/tb";
import { IoInformationCircle } from "react-icons/io5";
import { MdLocationOn } from "react-icons/md";

import { useAuth } from "../hooks/useAuth";

export default function Sidebar() {
  // lấy user từ context
  const { user } = useAuth();

  // map role id -> role name
  const roleMap = {
    1: "Admin",
    2: "Operator",
    3: "Billing",
    4: "Customer",
  };

  const role = roleMap[user?.user_role_id];

  const menus = {
    Admin: [
      { name: "Trang chủ", path: "/admin/dashboard", icon: <MdDashboard /> },
      { name: "Khách hàng", path: "/admin/customers", icon: <FaUsers /> },
      { name: "Hợp đồng", path: "/admin/contracts", icon: <LiaFileContractSolid /> },
      { name: "Đọc chỉ số công tơ", path: "/admin/meter-readings", icon: <FaTachometerAlt /> },
      { name: "Phát hiện bất thường", path: "/admin/anomaly-detection", icon: <SiDowndetector /> },
      { name: "Giám sát địa lý", path: "/admin/geo-monitoring", icon: <MdLocationOn /> },
      { name: "Hóa đơn", path: "/admin/billing", icon: <FaMoneyBillTrendUp /> },
      { name: "Báo cáo", path: "/admin/reports", icon: <TbReportSearch /> },
    ],
    Billing: [
      { name: "Trang chủ", path: "/admin/dashboard", icon: <MdDashboard /> },
      { name: "Hóa đơn", path: "/admin/billing", icon: <FaMoneyBillTrendUp /> },
      { name: "Báo cáo", path: "/admin/reports", icon: <TbReportSearch /> },
    ],
    Operator: [
      { name: "Trang chủ", path: "/admin/dashboard", icon: <MdDashboard /> },
      { name: "Đọc chỉ số công tơ", path: "/admin/meter-readings", icon: <FaTachometerAlt /> },
      { name: "Phát hiện bất thường", path: "/admin/anomaly-detection", icon: <SiDowndetector /> },
      { name: "Giám sát địa lý", path: "/admin/geo-monitoring", icon: <MdLocationOn /> },
    ],
    Customer: [
      { name: "Thông tin của tôi", path: "/customers/myinformation", icon: <IoInformationCircle /> },
      { name: "Hợp đồng của tôi ", path: "/customers/mycontract", icon: <TbContract /> },
      { name: "Tiêu thụ của tôi", path: "/customers/myusage", icon: <FaBolt /> },
      { name: "Hóa đơn của tôi", path: "/customers/mybilling", icon: <FaMoneyBillTrendUp /> },
    ],
  };

  const menuItems = menus[role] || [];

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">
        {role ? role.toUpperCase() : "MENU"}
      </h2>

      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                "menu-item " + (isActive ? "active" : "")
              }
            >
              <div className="menu-content">
                {item.icon}
                <span>{item.name}</span>
              </div>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}