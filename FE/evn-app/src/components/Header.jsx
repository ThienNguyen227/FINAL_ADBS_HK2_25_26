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

  return (
    <header className="admin-header">
      <div className="header-left">
        <img src={evnLogo} alt="logo" />
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span>
          Welcome, {user?.user_name}
        </span>
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