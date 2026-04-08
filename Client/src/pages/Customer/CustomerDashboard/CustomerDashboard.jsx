import React, { useState, useEffect } from "react";
import { FiCalendar, FiClock, FiDollarSign } from "react-icons/fi";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Card from "../../../components/common/Card/Card";
import Loading from "../../../components/common/Loading/Loading";
import useAuth from "../../../hooks/useAuth";
import axios from "axios";
import { formatCurrency, formatDate } from "../../../utils/helpers";
import "./CustomerDashboard.css";

const CustomerDashboard = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/bookings`, { params: { limit: 5 } });
        setBookings(data.bookings || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeBookings = bookings.filter((b) => !["Completed", "Cancelled"].includes(b.status));
  const completedBookings = bookings.filter((b) => b.status === "Completed");

  if (loading) return <Loading text="Loading dashboard..." />;

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header">
          <h1>Welcome, {user?.username || "Customer"}!</h1>
          <p>Here's your booking overview</p>
        </div>
        <div className="metrics-grid">
          <Card title="Active Bookings" value={activeBookings.length} icon={<FiCalendar />} color="#6c5ce7" />
          <Card title="Completed" value={completedBookings.length} icon={<FiClock />} color="#00b894" />
          <Card title="Total Spent" value={formatCurrency(completedBookings.reduce((sum, b) => sum + (b.finalAmount || 0), 0))} icon={<FiDollarSign />} color="#0984e3" />
        </div>
        <div className="dashboard-section">
          <h2>Recent Bookings</h2>
          <div className="activity-list">
            {bookings.map((b) => (
              <div key={b._id} className="activity-item">
                <div className="activity-info">
                  <strong>{b.services?.map((s) => s.name).join(", ")}</strong>
                  <span className={`status-badge status-${b.status.toLowerCase()}`}>{b.status}</span>
                </div>
                <span className="activity-meta">{formatDate(b.bookingDate)} - {formatCurrency(b.finalAmount)}</span>
              </div>
            ))}
            {bookings.length === 0 && <p className="no-data">No bookings yet. Browse our services!</p>}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
