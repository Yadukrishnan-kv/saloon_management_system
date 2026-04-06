import React, { useState, useEffect } from "react";
import { FiUsers, FiScissors, FiCalendar, FiDollarSign, FiAlertCircle, FiTrendingUp } from "react-icons/fi";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Card from "../../../components/common/Card/Card";
import Loading from "../../../components/common/Loading/Loading";
import api from "../../../utils/api";
import { formatCurrency } from "../../../utils/helpers";
import "./Dashboard.css";

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [metricsRes, activityRes] = await Promise.all([
          api.get("/api/dashboard/metrics"),
          api.get("/api/dashboard/activity"),
        ]);
        setMetrics(metricsRes.data);
        setActivity(activityRes.data);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <Loading text="Loading dashboard..." />;

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />

      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Welcome to your admin dashboard</p>
        </div>

        <div className="metrics-grid">
          <Card title="Total Customers" value={metrics?.totalUsers || 0} icon={<FiUsers />} color="#6c5ce7" />
          <Card title="Total Beauticians" value={metrics?.totalBeauticians || 0} icon={<FiScissors />} color="#00b894" />
          <Card title="Total Bookings" value={metrics?.totalBookings || 0} icon={<FiCalendar />} color="#0984e3" />
          <Card title="Active Bookings" value={metrics?.activeBookings || 0} icon={<FiTrendingUp />} color="#e17055" />
          <Card title="Total Revenue" value={formatCurrency(metrics?.totalRevenue || 0)} icon={<FiDollarSign />} color="#00b894" />
          <Card title="Today's Revenue" value={formatCurrency(metrics?.todayRevenue || 0)} icon={<FiDollarSign />} color="#fdcb6e" subtitle={`${metrics?.todayBookings || 0} bookings today`} />
          <Card title="Pending Verifications" value={metrics?.pendingVerifications || 0} icon={<FiAlertCircle />} color="#f39c12" />
          <Card title="Open Complaints" value={metrics?.openComplaints || 0} icon={<FiAlertCircle />} color="#e74c3c" />
        </div>

        <div className="dashboard-sections">
          <div className="dashboard-section">
            <h2>Recent Bookings</h2>
            <div className="activity-list">
              {activity?.recentBookings?.map((booking) => (
                <div key={booking._id} className="activity-item">
                  <div className="activity-info">
                    <strong>{booking.customer?.username}</strong>
                    <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </div>
                  <span className="activity-meta">
                    {booking.beautician?.fullName ? `Assigned to ${booking.beautician.fullName}` : "Unassigned"}
                  </span>
                </div>
              ))}
              {(!activity?.recentBookings || activity.recentBookings.length === 0) && (
                <p className="no-data">No recent bookings</p>
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <h2>New Users</h2>
            <div className="activity-list">
              {activity?.recentUsers?.map((user) => (
                <div key={user._id} className="activity-item">
                  <div className="activity-info">
                    <strong>{user.username}</strong>
                    <span className="activity-role">{user.role}</span>
                  </div>
                  <span className="activity-meta">{user.email}</span>
                </div>
              ))}
              {(!activity?.recentUsers || activity.recentUsers.length === 0) && (
                <p className="no-data">No new users</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
