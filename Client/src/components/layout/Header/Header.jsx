import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiBell, FiUser, FiLogOut, FiSettings } from "react-icons/fi";
import useAuth from "../../../hooks/useAuth";
import "./Header.css";

const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onToggleSidebar} aria-label="Toggle menu">
          <FiMenu size={22} />
        </button>
        <h1 className="header-logo">Salon<span>Pro</span></h1>
      </div>

      <div className="header-right">
        <button className="header-icon-btn" aria-label="Notifications">
          <FiBell size={20} />
          <span className="notification-dot"></span>
        </button>

        <div className="header-profile" ref={dropdownRef}>
          <button
            className="profile-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="profile-avatar">
              {user?.username?.charAt(0)?.toUpperCase()}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.username}</span>
              <span className="profile-role">{user?.role}</span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="profile-dropdown">
              <button onClick={() => { navigate("/profile"); setDropdownOpen(false); }}>
                <FiUser size={16} /> My Profile
              </button>
              <button onClick={() => { navigate("/change-password"); setDropdownOpen(false); }}>
                <FiSettings size={16} /> Change Password
              </button>
              <hr />
              <button onClick={handleLogout} className="logout-btn">
                <FiLogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
