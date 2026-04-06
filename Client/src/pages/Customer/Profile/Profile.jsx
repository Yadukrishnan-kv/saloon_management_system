import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Button from "../../../components/common/Button/Button";
import useAuth from "../../../hooks/useAuth";
import api from "../../../utils/api";
import "./Profile.css";

const Profile = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({ username: "", email: "", phoneNumber: "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isPwdLoading, setIsPwdLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ username: user.username || "", email: user.email || "", phoneNumber: user.phoneNumber || "" });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await api.put("/api/users/profile", formData);
      updateUser(data);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsPwdLoading(true);
    try {
      await api.put("/api/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Password changed!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setIsPwdLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header"><h1>My Profile</h1></div>
        <div className="profile-sections">
          <div className="form-card">
            <h2>Profile Information</h2>
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label>Username</label>
                <input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} />
              </div>
              <Button type="submit" loading={isLoading}>Update Profile</Button>
            </form>
          </div>

          <div className="form-card">
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
              </div>
              <Button type="submit" loading={isPwdLoading}>Change Password</Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
