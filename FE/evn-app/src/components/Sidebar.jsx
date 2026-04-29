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
      { name: "Dashboard", path: "/admin/dashboard", icon: <MdDashboard /> },
      { name: "Customers", path: "/admin/customers", icon: <FaUsers /> },
      { name: "Contracts", path: "/admin/contracts", icon: <LiaFileContractSolid /> },
      { name: "Meter Readings", path: "/admin/meter-readings", icon: <FaTachometerAlt /> },
      { name: "Anomaly Detection", path: "/admin/anomaly-detection", icon: <SiDowndetector /> },
      { name: "Geo Monitoring", path: "/admin/geo-monitoring", icon: <MdLocationOn /> },
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
      { name: "Geo Monitoring", path: "/admin/geo-monitoring", icon: <MdLocationOn /> },
    ],
    Customer: [
      { name: "My Information", path: "/customers/myinformation", icon: <IoInformationCircle /> },
      { name: "My Contract ", path: "/customers/mycontract", icon: <TbContract /> },
      { name: "My Usage", path: "/customers/myusage", icon: <FaBolt /> },
      { name: "My Billing", path: "/customers/mybilling", icon: <FaMoneyBillTrendUp /> },
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