import React, { useState, useEffect } from "react";
import { FiCalendar, FiClock, FiDollarSign, FiStar } from "react-icons/fi";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Card from "../../../components/common/Card/Card";
import Loading from "../../../components/common/Loading/Loading";
import axios from "axios";
import { formatCurrency, formatDate, getStatusColor } from "../../../utils/helpers";

const BeauticianDashboard = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [data, setData] = useState({ profile: null, todayBookings: [], stats: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, bookingsRes] = await Promise.all([
          axios.get(`${backendUrl}/api/beauticians/me`),
          axios.get(`${backendUrl}/api/bookings/today`),
        ]);
        setData({
          profile: profileRes.data,
          todayBookings: bookingsRes.data || [],
          stats: {
            rating: profileRes.data?.rating || 0,
            totalReviews: profileRes.data?.totalReviews || 0,
            earnings: profileRes.data?.earnings?.total || 0,
          },
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loading text="Loading dashboard..." />;

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header">
          <h1>Welcome, {data.profile?.fullName || "Beautician"}!</h1>
          <p>Your performance overview</p>
        </div>
        <div className="metrics-grid">
          <Card title="Today's Bookings" value={data.todayBookings.length} icon={<FiCalendar />} color="#6c5ce7" />
          <Card title="Rating" value={`${data.stats.rating} ★`} icon={<FiStar />} color="#f39c12" subtitle={`${data.stats.totalReviews} reviews`} />
          <Card title="Total Earnings" value={formatCurrency(data.stats.earnings)} icon={<FiDollarSign />} color="#00b894" />
        </div>
        <div className="dashboard-section" style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "17px", margin: "0 0 16px" }}>Today's Schedule</h2>
          <div className="activity-list">
            {data.todayBookings.map((b) => (
              <div key={b._id} className="activity-item">
                <div className="activity-info">
                  <strong>{b.customer?.username}</strong>
                  <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: `${getStatusColor(b.status)}20`, color: getStatusColor(b.status) }}>{b.status}</span>
                </div>
                <span className="activity-meta">{b.timeSlot?.startTime} - {b.timeSlot?.endTime} | {b.services?.map((s) => s.name).join(", ")}</span>
              </div>
            ))}
            {data.todayBookings.length === 0 && <p className="no-data">No bookings scheduled for today</p>}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BeauticianDashboard;
