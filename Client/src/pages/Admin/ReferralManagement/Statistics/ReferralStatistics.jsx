import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { FiRefreshCw, FiTrendingUp, FiUsers, FiAward } from "react-icons/fi";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import "./ReferralStatistics.css";

const ReferralStatistics = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    usersWithReferralCode: 0,
    totalReferrals: 0,
    topReferrers: [],
    recentReferrals: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/admin/referral/statistics`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setStatistics(response.data.statistics);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error(error.response?.data?.message || "Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="app-container">
          <Sidebar collapsed={sidebarCollapsed} />
          <main className="app-main">
            <div className="referral-statistics loading">Loading statistics...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="app-container">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="app-main">
          <div className="page-content">
            <div className="page-header">
              <h1>Referral Program Analytics</h1>
              <div className="header-actions">
                <button onClick={fetchStatistics} className="btn btn-secondary">
                  <FiRefreshCw /> Refresh
                </button>
              </div>
            </div>

            <div className="referral-statistics">

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon users">
              <FiUsers />
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Users</p>
              <h3 className="stat-value">{statistics.totalUsers}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon active">
              <FiAward />
            </div>
            <div className="stat-content">
              <p className="stat-label">Users with Referral Code</p>
              <h3 className="stat-value">{statistics.usersWithReferralCode}</h3>
              <p className="stat-percentage">
                {statistics.totalUsers > 0
                  ? ((statistics.usersWithReferralCode / statistics.totalUsers) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon referrals">
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Referrals</p>
              <h3 className="stat-value">{statistics.totalReferrals}</h3>
            </div>
          </div>
        </div>

        {/* Top Referrers */}
        <div className="section">
          <h2>Top 10 Referrers</h2>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Referral Code</th>
                  <th>Referrals</th>
                </tr>
              </thead>
              <tbody>
                {statistics.topReferrers && statistics.topReferrers.length > 0 ? (
                  statistics.topReferrers.map((referrer, index) => (
                    <tr key={referrer._id}>
                      <td className="rank">{index + 1}</td>
                      <td>{referrer.username}</td>
                      <td>{referrer.email}</td>
                      <td>
                        <code className="referral-code">{referrer.referralCode}</code>
                      </td>
                      <td className="count">{referrer.referralCount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      No referrers yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Referrals */}
        <div className="section">
          <h2>Recent Completed Referrals</h2>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Referrer</th>
                  <th>Referred User</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {statistics.recentReferrals && statistics.recentReferrals.length > 0 ? (
                  statistics.recentReferrals.map((referral) => (
                    <tr key={referral._id}>
                      <td>{referral.referrerUser.username}</td>
                      <td>{referral.referredUser.username}</td>
                      <td>{new Date(referral.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${referral.rewardStatus}`}>
                          {referral.rewardStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      No recent referrals
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReferralStatistics;
