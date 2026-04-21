import React, { useMemo, useState } from "react";
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
  FiChevronDown,
} from "react-icons/fi";
import useAuth from "../../../hooks/useAuth";
import "./Sidebar.css";

const Sidebar = ({ collapsed }) => {
  const { user, permissions } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState({ users: false, categories: false });

  const adminMenu = [
    { label: "Dashboard", icon: <FiGrid />, path: "/dashboard" },
    {
      label: "Users",
      icon: <FiUsers />,
      sectionKey: "users",
      children: [
        { label: "User Management", path: "/admin/users" },
        { label: "Role", path: "/admin/roles" },
      ],
    },
    { label: "Customer", permission: "Customer Management", icon: <FiUsers />, path: "/admin/customers" },
    { label: "Beauticians", icon: <FiScissors />, path: "/admin/beauticians" },
    { label: "Beautician Verify", icon: <FiStar />, path: "/admin/beautician-verification" },
    {
      label: "Categories",
      icon: <FiList />,
      sectionKey: "categories",
      children: [
        { label: "Category", path: "/admin/categories", permission: "Categories" },
        { label: "Sub Category", path: "/admin/sub-categories", permission: "Categories" },
      ],
    },
    { label: "Services", icon: <FiShoppingBag />, path: "/admin/services" },
    { label: "Bookings", icon: <FiCalendar />, path: "/admin/bookings" },
    { label: "Banners", icon: <FiImage />, path: "/admin/banners" },
    { label: "Complaints", icon: <FiMessageCircle />, path: "/admin/complaints" },
    { label: "Reviews", icon: <FiCheckCircle />, path: "/admin/reviews" },
    { label: "Cosmetics", icon: <FiPackage />, path: "/admin/cosmetics" },
    { label: "Payouts", icon: <FiDollarSign />, path: "/admin/payouts" },
    { label: "Notifications", icon: <FiBell />, path: "/admin/notifications" },
    { label: "Reports", icon: <FiBarChart2 />, path: "/admin/reports" },
    {
      label: "Curated Services",
      icon: <FiShoppingBag />,
      path: "/admin/curated-services",
      permission: "Curated Services",
    },
  ];

  const customerMenu = [
    { label: "Customer Dashboard", icon: <FiGrid />, path: "/customer/dashboard" },
    { label: "Browse Services", icon: <FiShoppingBag />, path: "/customer/services" },
    { label: "Book Service", icon: <FiCalendar />, path: "/customer/book" },
    { label: "My Bookings", icon: <FiFileText />, path: "/customer/bookings" },
    { label: "My Complaints", icon: <FiMessageCircle />, path: "/customer/complaints" },
    { label: "Profile", icon: <FiUser />, path: "/profile" },
  ];

  const beauticianMenu = [
    { label: "Beautician Dashboard", icon: <FiGrid />, path: "/beautician/dashboard" },
    { label: "My Schedule", icon: <FiClock />, path: "/beautician/schedule" },
    { label: "Service Requests", icon: <FiCalendar />, path: "/beautician/requests" },
    { label: "Earnings", icon: <FiDollarSign />, path: "/beautician/earnings" },
    { label: "Profile", icon: <FiUser />, path: "/profile" },
  ];

  const hasPermission = (name) => {
    if (!name) return true;
    if (permissions?.length > 0) return permissions.includes(name);
    return user?.role === "SuperAdmin" || user?.role === "Admin";
  };

  const buildAdminMenu = () => {
    return adminMenu
      .map((item) => {
        if (item.children) {
          const allowedChildren = item.children.filter((child) => hasPermission(child.permission || child.label));
          return allowedChildren.length > 0 ? { ...item, children: allowedChildren } : null;
        }
        return hasPermission(item.permission || item.label) ? item : null;
      })
      .filter(Boolean);
  };

  const flatMenu = (items) =>
    items.flatMap((item) => {
      if (item.children) {
        return item.children.map((child) => ({
          label: child.label,
          path: child.path,
          icon: item.icon,
        }));
      }
      return [item];
    });

  const getMenu = () => {
    if (user?.role === "SuperAdmin" || user?.role === "Admin") return buildAdminMenu();
    if (user?.role === "Customer") return customerMenu;
    if (user?.role === "Beautician") return beauticianMenu;
    return [];
  };

  const menu = useMemo(() => getMenu(), [user, permissions]);
  const renderMenu = collapsed ? flatMenu(menu) : menu;

  const isPathActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!collapsed && <h2>Menu</h2>}
      </div>

      <nav className="sidebar-nav">
        {renderMenu.map((item) => {
          if (item.children && !collapsed) {
            const sectionOpen = expanded[item.sectionKey] !== false;
            const sectionActive = item.children.some((child) => isPathActive(child.path));

            return (
              <div key={item.label} className="sidebar-group">
                <button
                  className={`sidebar-item sidebar-group-btn ${sectionActive ? "active" : ""}`}
                  onClick={() => setExpanded((prev) => {
                    const newExpanded = {};
                    Object.keys(prev).forEach(key => newExpanded[key] = false);
                    newExpanded[item.sectionKey] = !sectionOpen;
                    return newExpanded;
                  })}
                  title={item.label}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                  <FiChevronDown className={`sidebar-chevron ${sectionOpen ? "open" : ""}`} />
                </button>

                {sectionOpen && (
                  <div className="sidebar-submenu">
                    {item.children.map((child) => (
                      <button
                        key={child.path}
                        className={`sidebar-subitem ${isPathActive(child.path) ? "active" : ""}`}
                        onClick={() => { setExpanded({}); navigate(child.path); }}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.path}
              className={`sidebar-item ${isPathActive(item.path) ? "active" : ""}`}
              onClick={() => { setExpanded({}); navigate(item.path); }}
              title={collapsed ? item.label : ""}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
