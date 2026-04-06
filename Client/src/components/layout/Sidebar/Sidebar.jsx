import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiScissors,
  FiCalendar,
  FiStar,
  FiFileText,
  FiBarChart2,
  FiShoppingBag,
  FiMessageCircle,
  FiImage,
  FiList,
  FiClock,
  FiDollarSign,
  FiUser,
  FiBell,
  FiPackage,
  FiCheckCircle,
} from "react-icons/fi";
import useAuth from "../../../hooks/useAuth";
import { ROLES } from "../../../utils/constants";
import "./Sidebar.css";

const Sidebar = ({ collapsed }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const adminMenu = [
    { label: "Dashboard", icon: <FiGrid />, path: "/dashboard" },
    { label: "Users", icon: <FiUsers />, path: "/admin/users" },
    { label: "Beauticians", icon: <FiScissors />, path: "/admin/beauticians" },
    { label: "Beautician Verify", icon: <FiStar />, path: "/admin/beautician-verification" },
    { label: "Categories", icon: <FiList />, path: "/admin/categories" },
    { label: "Services", icon: <FiShoppingBag />, path: "/admin/services" },
    { label: "Bookings", icon: <FiCalendar />, path: "/admin/bookings" },
    { label: "Banners", icon: <FiImage />, path: "/admin/banners" },
    { label: "Complaints", icon: <FiMessageCircle />, path: "/admin/complaints" },
    { label: "Reviews", icon: <FiCheckCircle />, path: "/admin/reviews" },
    { label: "Cosmetics", icon: <FiPackage />, path: "/admin/cosmetics" },
    { label: "Payouts", icon: <FiDollarSign />, path: "/admin/payouts" },
    { label: "Notifications", icon: <FiBell />, path: "/admin/notifications" },
    { label: "Reports", icon: <FiBarChart2 />, path: "/admin/reports" },
  ];

  const customerMenu = [
    { label: "Dashboard", icon: <FiGrid />, path: "/customer/dashboard" },
    { label: "Browse Services", icon: <FiShoppingBag />, path: "/customer/services" },
    { label: "Book Service", icon: <FiCalendar />, path: "/customer/book" },
    { label: "My Bookings", icon: <FiFileText />, path: "/customer/bookings" },
    { label: "My Complaints", icon: <FiMessageCircle />, path: "/customer/complaints" },
    { label: "Profile", icon: <FiUser />, path: "/profile" },
  ];

  const beauticianMenu = [
    { label: "Dashboard", icon: <FiGrid />, path: "/beautician/dashboard" },
    { label: "My Schedule", icon: <FiClock />, path: "/beautician/schedule" },
    { label: "Service Requests", icon: <FiCalendar />, path: "/beautician/requests" },
    { label: "Earnings", icon: <FiDollarSign />, path: "/beautician/earnings" },
    { label: "Profile", icon: <FiUser />, path: "/profile" },
  ];

  const getMenu = () => {
    if (user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN) return adminMenu;
    if (user?.role === ROLES.CUSTOMER) return customerMenu;
    if (user?.role === ROLES.BEAUTICIAN) return beauticianMenu;
    return [];
  };

  const menu = getMenu();

  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!collapsed && <h2>Menu</h2>}
      </div>

      <nav className="sidebar-nav">
        {menu.map((item) => (
          <button
            key={item.path}
            className={`sidebar-item ${location.pathname === item.path ? "active" : ""}`}
            onClick={() => navigate(item.path)}
            title={collapsed ? item.label : ""}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-label">{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
