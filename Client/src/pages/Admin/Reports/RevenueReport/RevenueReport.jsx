import React, { useState, useEffect } from "react";
import { FiDollarSign, FiTrendingUp, FiCalendar } from "react-icons/fi";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import Card from "../../../../components/common/Card/Card";
import Loading from "../../../../components/common/Loading/Loading";
import api from "../../../../utils/api";
import { formatCurrency } from "../../../../utils/helpers";

const RevenueReport = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, revenueRes] = await Promise.all([
          api.get("/api/dashboard/metrics"),
          api.get("/api/dashboard/revenue", { params: { period } }),
        ]);
        setMetrics(metricsRes.data);
        setRevenue(revenueRes.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  if (loading) return <Loading text="Loading reports..." />;

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header"><h1>Revenue Reports</h1><p>Track income and financial metrics</p></div>
        <div className="metrics-grid">
          <Card title="Total Revenue" value={formatCurrency(metrics?.totalRevenue || 0)} icon={<FiDollarSign />} color="#00b894" />
          <Card title="Today's Revenue" value={formatCurrency(metrics?.todayRevenue || 0)} icon={<FiTrendingUp />} color="#6c5ce7" />
          <Card title="Total Bookings" value={metrics?.totalBookings || 0} icon={<FiCalendar />} color="#0984e3" />
        </div>
        <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "17px" }}>Revenue Over Time</h2>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: "8px 14px", border: "1.5px solid #dfe6e9", borderRadius: "8px", fontFamily: "inherit" }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {revenue.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                <span style={{ fontSize: "14px", color: "#636e72" }}>{item._id || item.period || `Period ${i + 1}`}</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#2d3436" }}>{formatCurrency(item.total || item.revenue || 0)}</span>
              </div>
            ))}
            {revenue.length === 0 && <p style={{ color: "#b2bec3", textAlign: "center", padding: "20px" }}>No revenue data available</p>}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RevenueReport;
