import React from "react";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";
import { FaMoneyBillTrendUp, FaBolt, FaUsers } from "react-icons/fa6";
import { FaTachometerAlt } from "react-icons/fa";
import { SiDowndetector } from "react-icons/si";
import { LiaFileContractSolid } from "react-icons/lia";
import { MdDashboard } from "react-icons/md";
import { TbReportSearch } from "react-icons/tb";

export default function Sidebar({ role }) {
  // Định nghĩa menu theo role
  const menus = {
    Admin: [
      { name: "Dashboard", path: "/admin/dashboard", icon: <MdDashboard /> },
      { name: "Customers", path: "/admin/customers", icon: <FaUsers /> },
      { name: "Contracts", path: "/admin/contracts", icon: <LiaFileContractSolid /> },
      { name: "Meter Readings", path: "/admin/meter-readings", icon: <FaTachometerAlt /> },
      { name: "Anomaly Detection", path: "/admin/anomaly-detection", icon: <SiDowndetector /> },
      { name: "Billing", path: "/admin/billing", icon: <FaMoneyBillTrendUp /> },
      { name: "Reports", path: "/admin/reports", icon: <TbReportSearch /> },
    ],
    Billing: [
      { name: "Dashboard", path: "/admin/dashboard", icon: <MdDashboard /> },
      { name: "Billing", path: "/admin/billing", icon: <FaMoneyBillTrendUp /> },
      { name: "Reports", path: "/admin/reports", icon: <TbReportSearch /> },
    ],
    Operator: [
      { name: "Dashboard", path: "/admin/dashboard", icon: <MdDashboard /> },
      { name: "Meter Readings", path: "/admin/meter-readings", icon: <FaTachometerAlt /> },
      { name: "Anomaly Detection", path: "/admin/anomaly-detection", icon: <SiDowndetector /> },
    ],
    Customer: [
      // { name: "Dashboard", path: "/dashboard" },
      { name: "My Usage", path: "/customers/myusage", icon: <FaBolt /> },
      { name: "My Billing", path: "/customers/mybilling", icon: <FaMoneyBillTrendUp /> },
    ],
  };

  const menuItems = menus[role] || [];

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">{role.toUpperCase()} MENU</h2>

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