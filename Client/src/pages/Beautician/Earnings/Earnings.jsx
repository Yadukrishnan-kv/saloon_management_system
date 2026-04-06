import React, { useState, useEffect } from "react";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Card from "../../../components/common/Card/Card";
import Loading from "../../../components/common/Loading/Loading";
import { FiDollarSign, FiTrendingUp } from "react-icons/fi";
import api from "../../../utils/api";
import { formatCurrency } from "../../../utils/helpers";

const Earnings = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const { data } = await api.get("/api/beauticians/me");
        setProfile(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  if (loading) return <Loading text="Loading earnings..." />;

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header"><h1>Earnings</h1><p>Track your income</p></div>
        <div className="metrics-grid">
          <Card title="Total Earnings" value={formatCurrency(profile?.earnings?.total || 0)} icon={<FiDollarSign />} color="#00b894" />
          <Card title="This Month" value={formatCurrency(profile?.earnings?.monthly || 0)} icon={<FiTrendingUp />} color="#6c5ce7" />
          <Card title="Completed Services" value={profile?.totalReviews || 0} icon={<FiDollarSign />} color="#0984e3" />
        </div>
        <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginTop: "24px" }}>
          <h2 style={{ fontSize: "17px", margin: "0 0 12px" }}>Earnings Breakdown</h2>
          <p style={{ color: "#636e72", fontSize: "14px" }}>
            Detailed earnings reports will be available as you complete more services. Keep providing great service to boost your income!
          </p>
        </div>
      </main>
    </div>
  );
};

export default Earnings;
