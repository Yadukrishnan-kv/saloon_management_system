import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import Button from "../../../../components/common/Button/Button";
import api from "../../../../utils/api";
import "../../../../pages/Admin/UserManagement/UserList/UserList.css";

const CreateUser = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", password: "", role: "", phoneNumber: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [userId, setUserId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    else if (formData.username.trim().length < 3) newErrors.username = "Min 3 characters";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email";
    if (!isEdit && !formData.password) newErrors.password = "Password is required";
    else if (formData.password && formData.password.length < 6) newErrors.password = "Min 6 characters";
    if (!formData.role) newErrors.role = "Role is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      if (isEdit) {
        await api.put(`/api/users/updateUser/${userId}`, {
          username: formData.username,
          email: formData.email,
          role: formData.role,
          phoneNumber: formData.phoneNumber,
        });
        toast.success("User updated successfully!");
      } else {
        await api.post("/api/users/createUser", formData);
        toast.success("User created successfully!");
      }
      setTimeout(() => navigate("/admin/users"), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserForEdit = useCallback(async (editId) => {
    try {
      const { data } = await api.get(`/api/users/${editId}`);
      setFormData({
        username: data.username || "",
        email: data.email || "",
        password: "",
        role: data.role || "",
        phoneNumber: data.phoneNumber || "",
      });
      setIsEdit(true);
      setUserId(editId);
    } catch (error) {
      toast.error("Failed to load user data");
      navigate("/admin/users");
    }
  }, [navigate]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const editId = searchParams.get("edit");
    if (editId) loadUserForEdit(editId);
  }, [location.search, loadUserForEdit]);

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />

      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header">
          <h1>{isEdit ? "Edit User" : "Create New User"}</h1>
        </div>

        <div className="form-card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input id="username" name="username" type="text" value={formData.username} onChange={handleChange} />
                {errors.username && <p className="error-text">{errors.username}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input id="phoneNumber" name="phoneNumber" type="text" value={formData.phoneNumber} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select id="role" name="role" value={formData.role} onChange={handleChange}>
                  <option value="">Select a role</option>
                  <option value="SuperAdmin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Customer">Customer</option>
                  <option value="Beautician">Beautician</option>
                </select>
                {errors.role && <p className="error-text">{errors.role}</p>}
              </div>
            </div>

            {!isEdit && (
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} />
                {errors.password && <p className="error-text">{errors.password}</p>}
              </div>
            )}

            <div className="form-actions">
              <Button variant="secondary" onClick={() => navigate("/admin/users")}>Cancel</Button>
              <Button type="submit" loading={isLoading}>{isEdit ? "Update User" : "Create User"}</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateUser;
