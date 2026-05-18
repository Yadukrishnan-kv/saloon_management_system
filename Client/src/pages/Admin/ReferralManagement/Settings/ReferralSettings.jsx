import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { FiSave, FiRefreshCw } from "react-icons/fi";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import "./ReferralSettings.css";

const ReferralSettings = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settings, setSettings] = useState({
    pointsPerReferral: 10,
    pointsRedemptionLimit: 100,
    isActive: true,
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/admin/referral/settings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error(error.response?.data?.message || "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (settings.pointsPerReferral < 1) {
      toast.error("Points per referral must be at least 1");
      return;
    }

    if (settings.pointsRedemptionLimit < 1) {
      toast.error("Redemption limit must be at least 1");
      return;
    }

    try {
      setSaving(true);
      const response = await axios.put(`${backendUrl}/api/admin/referral/settings`, settings, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        toast.success("Referral settings updated successfully");
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error(error.response?.data?.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="app-container">
          <Sidebar collapsed={sidebarCollapsed} />
          <main className="app-main">
            <div className="referral-settings loading">Loading settings...</div>
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
              <div>
                <h1>Referral Program Settings</h1>
                <p>Configure the referral reward system for your platform</p>
              </div>
            </div>

            <div className="settings-card">
              <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label htmlFor="pointsPerReferral">
              <span className="label-text">Points Per Referral</span>
              <span className="label-hint">Points awarded when someone registers with a referral code</span>
            </label>
            <input
              type="number"
              id="pointsPerReferral"
              name="pointsPerReferral"
              value={settings.pointsPerReferral}
              onChange={handleChange}
              min="1"
              max="10000"
              className="form-input"
            />
            <p className="input-description">Current: {settings.pointsPerReferral} points per referral</p>
          </div>

          <div className="form-group">
            <label htmlFor="pointsRedemptionLimit">
              <span className="label-text">Points Redemption Limit</span>
              <span className="label-hint">Total points needed to claim a free service</span>
            </label>
            <input
              type="number"
              id="pointsRedemptionLimit"
              name="pointsRedemptionLimit"
              value={settings.pointsRedemptionLimit}
              onChange={handleChange}
              min="1"
              max="100000"
              className="form-input"
            />
            <p className="input-description">
              Users need {settings.pointsRedemptionLimit} points to redeem a free service
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              <span className="label-text">Description</span>
              <span className="label-hint">Internal notes about the referral program</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={settings.description}
              onChange={handleChange}
              className="form-input"
              rows="4"
              placeholder="Add any internal notes..."
            />
          </div>

          <div className="form-group checkbox-group">
            <label htmlFor="isActive" className="checkbox-label">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={settings.isActive}
                onChange={handleChange}
                className="checkbox-input"
              />
              <span className="checkbox-text">Active</span>
              <span className="label-hint">Enable or disable the referral program</span>
            </label>
          </div>

          <div className="form-info">
            <h3>Calculation Example</h3>
            <p>
              If a customer gets referred and registers with your code:
              <br />
              • You earn: <strong>{settings.pointsPerReferral} points</strong>
              <br />
              • After <strong>{Math.ceil(settings.pointsRedemptionLimit / settings.pointsPerReferral)}</strong> referrals, you can claim a free service
              <br />
              • Points are added to your wallet automatically
            </p>
          </div>

          <div className="form-actions">
            <button type="button" onClick={fetchSettings} disabled={saving} className="btn btn-secondary">
              <FiRefreshCw /> Reset
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              <FiSave /> {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReferralSettings;
