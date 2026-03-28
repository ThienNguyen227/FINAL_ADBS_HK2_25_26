import React from "react";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";
import { FaMoneyBillTrendUp, FaBolt } from "react-icons/fa6";

export default function Sidebar({ role }) {
  // Định nghĩa menu theo role
  const menus = {
    Admin: [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Customers", path: "/customers" },
      { name: "Contracts", path: "/contracts" },
      { name: "Meter Readings", path: "/meter-readings" },
      { name: "Anomaly Detection", path: "/anomaly-detection" },
      { name: "Billing", path: "/billing" },
      { name: "Reports", path: "/reports" },
    ],
    Billing: [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Billing", path: "/billing" },
      { name: "Reports", path: "/reports" },
    ],
    Operator: [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Meter Readings", path: "/meter-readings" },
      { name: "Anomaly Detection", path: "/anomaly-detection"  },
      
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