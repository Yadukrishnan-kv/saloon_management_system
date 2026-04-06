import React, { useState, useEffect, useCallback } from "react";
import { FiBell, FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Loading from "../../../components/common/Loading/Loading";
import Button from "../../../components/common/Button/Button";
import api from "../../../utils/api";
import { formatDateTime } from "../../../utils/helpers";
import "../UserManagement/UserList/UserList.css";

const AdminNotifications = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/admin/notifications");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = async (notificationId) => {
    try {
      await api.put(`/api/admin/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/api/admin/notifications/read-all");
      toast.success("All notifications marked as read");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed");
    }
  };

  const getTypeColor = (type) => {
    const colors = { booking: "#3498db", payment: "#27ae60", review: "#f39c12", payout: "#9b59b6", cosmetic_order: "#e67e22", system: "#636e72" };
    return colors[type] || "#636e72";
  };

  const getTypeLabel = (type) => {
    const labels = { booking: "Booking", payment: "Payment", review: "Review", payout: "Payout", cosmetic_order: "Cosmetic Order", system: "System" };
    return labels[type] || type;
  };

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header">
          <h1>
            <FiBell style={{ marginRight: "8px" }} />
            Notifications {unreadCount > 0 && <span style={{ background: "#e74c3c", color: "#fff", borderRadius: "50%", padding: "2px 8px", fontSize: "14px", marginLeft: "8px" }}>{unreadCount}</span>}
          </h1>
          {unreadCount > 0 && <Button variant="secondary" onClick={handleMarkAllRead}>Mark All Read</Button>}
        </div>

        {loading ? (
          <Loading />
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#636e72" }}>No notifications</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {notifications.map((n) => (
              <div
                key={n._id}
                style={{
                  background: n.isRead ? "#fff" : "#f0f7ff",
                  border: `1px solid ${n.isRead ? "#dfe6e9" : "#3498db30"}`,
                  borderRadius: "10px",
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600, background: `${getTypeColor(n.type)}20`, color: getTypeColor(n.type) }}>{getTypeLabel(n.type)}</span>
                    <strong style={{ fontSize: "14px" }}>{n.title}</strong>
                  </div>
                  <p style={{ margin: 0, color: "#636e72", fontSize: "13px" }}>{n.message}</p>
                  <span style={{ fontSize: "11px", color: "#b2bec3" }}>{formatDateTime(n.createdAt)}</span>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n._id)}
                    style={{ border: "none", background: "#3498db20", color: "#3498db", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <FiCheck /> Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminNotifications;
