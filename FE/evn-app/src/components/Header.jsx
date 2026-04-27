import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Header.css";
import evnLogo from "../assets/EVN-LOGO.png";
import { useAuth } from "../hooks/useAuth";

export default function Header() {

  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  // UI header
  return (
    <header className="admin-header">
      {/* 1. EVN logo */}
      <div className="header-left">
        <img src={evnLogo} alt="logo" />
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {/* 2. Display user name */}
        <div
          onClick={() => navigate("/profile")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "6px 12px",
            borderRadius: "999px",
            cursor: "pointer",
            transition: "0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#f3f4f6")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
            }}
          >
            {user?.user_name?.charAt(0)?.toUpperCase()}
          </div>

          <span style={{ fontWeight: 500 }}>
            {user?.user_name}
          </span>
        </div>
        {/* 3. Logout button */}
        <button 
          onClick={handleLogout}
          style={{
            padding: '6px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}