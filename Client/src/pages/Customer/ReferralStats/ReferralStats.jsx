import React, { useState, useEffect } from "react";
import { FiCopy, FiTrendingUp, FiUsers, FiGift, FiCheck, FiClock } from "react-icons/fi";
import toast from "react-hot-toast";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Loading from "../../../components/common/Loading/Loading";
import axios from "axios";
import "./ReferralStats.css";

const ReferralStats = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReferralStats();
  }, [page]);

  const fetchReferralStats = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/mobileapp/referral/stats`, {
        params: { page, limit: 5 },
      });
      setStats(data.stats);

      // Also fetch history for pagination
      const historyData = await axios.get(`${backendUrl}/api/mobileapp/referral/history`, {
        params: { page, limit: 5 },
      });
      setTotalPages(historyData.data.pagination.totalPages);
    } catch (error) {
      console.error("Fetch referral stats error:", error);
      toast.error("Failed to load referral stats");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Referral code copied!");
  };

  if (loading) return <Loading />;

  return (
    <div className="page-wrapper">
      <Header onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />

      <main className="main-content">
        <div className="referral-container">
          <div className="page-header">
            <h1>My Referral Program</h1>
            <p>Earn rewards by referring friends and family</p>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            {/* Referral Code Card */}
            <div className="stat-card referral-code-card">
              <div className="stat-icon" style={{ background: "#e3f2fd" }}>
                <FiGift color="#2196F3" size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Your Referral Code</p>
                <div className="referral-code-display">
                  <span className="code-text">{stats?.referralCode}</span>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(stats?.referralCode)}
                    title="Copy code"
                  >
                    <FiCopy size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Total Referrals Card */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "#f3e5f5" }}>
                <FiUsers color="#9C27B0" size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">People Referred</p>
                <p className="stat-value">{stats?.totalReferrals || 0}</p>
              </div>
            </div>

            {/* Total Earned Card */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "#e8f5e9" }}>
                <FiTrendingUp color="#4CAF50" size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Earned</p>
                <p className="stat-value">{stats?.totalRewardPoints || 0} points</p>
              </div>
            </div>

            {/* Wallet Points Card */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "#fff3e0" }}>
                <FiGift color="#FF9800" size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Wallet Points</p>
                <p className="stat-value">{stats?.walletPoints || 0} pts</p>
              </div>
            </div>
          </div>

          {/* Referrals List */}
          <div className="referrals-section">
            <h2>Referral History</h2>

            {stats?.referrals && stats.referrals.length > 0 ? (
              <>
                <div className="referrals-table">
                  <div className="table-header">
                    <div className="col-name">Referred Person</div>
                    <div className="col-email">Email</div>
                    <div className="col-points">Points Earned</div>
                    <div className="col-status">Status</div>
                  </div>

                  {stats.referrals.map((ref) => (
                    <div key={ref.referredUserId} className="table-row">
                      <div className="col-name">
                        <span className="name">{ref.referredUserName}</span>
                      </div>
                      <div className="col-email">{ref.referredUserEmail}</div>
                      <div className="col-points">
                        <span className="points">{ref.rewardPoints} pts</span>
                      </div>
                      <div className="col-status">
                        <span className={`status-badge ${ref.rewardStatus}`}>
                          {ref.rewardStatus === "completed" ? (
                            <>
                              <FiCheck size={14} /> Completed
                            </>
                          ) : (
                            <>
                              <FiClock size={14} /> Pending
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      Previous
                    </button>
                    <span>
                      Page {page} of {totalPages}
                    </span>
                    <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <FiUsers size={48} />
                <p>No referrals yet</p>
                <p className="subtitle">Share your referral code to start earning rewards!</p>
              </div>
            )}
          </div>

          {/* How it Works */}
          <div className="how-it-works">
            <h2>How It Works</h2>
            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Share Your Code</h3>
                  <p>Share your unique referral code with friends and family</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>They Sign Up</h3>
                  <p>They enter your code when registering on our platform</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>You Earn</h3>
                  <p>Get reward points that can be redeemed or used as wallet credit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReferralStats;
