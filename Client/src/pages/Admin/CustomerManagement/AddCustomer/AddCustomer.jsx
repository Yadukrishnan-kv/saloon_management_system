import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import Button from "../../../../components/common/Button/Button";
import "../../UserManagement/UserList/UserList.css";
import axios from "axios";

const AddCustomer = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const navigate = useNavigate();
  const location = useLocation();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email";
    if (!isEdit && !formData.password) newErrors.password = "Password is required";
    else if (formData.password && formData.password.length < 6) newErrors.password = "Minimum 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      if (isEdit) {
        await axios.put(`${backendUrl}/api/users/customers/${customerId}`, {
          username: formData.username,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
        });
        toast.success("Customer updated successfully");
      } else {
        await axios.post(`${backendUrl}/api/auth/register`, formData);
        toast.success("Customer created successfully");
      }
      setTimeout(() => navigate("/admin/customers"), 800);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save customer");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomerForEdit = useCallback(async (editId) => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/users/customers/${editId}`);
      setFormData({
        username: data.username || "",
        email: data.email || "",
        password: "",
        phoneNumber: data.phoneNumber || "",
      });
      setIsEdit(true);
      setCustomerId(editId);
    } catch (error) {
      toast.error("Failed to load customer");
      navigate("/admin/customers");
    }
  }, [navigate]);

  useEffect(() => {
    const editId = new URLSearchParams(location.search).get("edit");
    if (editId) {
      loadCustomerForEdit(editId);
    }
  }, [location.search, loadCustomerForEdit]);

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />

      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header">
          <h1>{isEdit ? "Edit Customer" : "Add Customer"}</h1>
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
              {!isEdit && (
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} />
                  {errors.password && <p className="error-text">{errors.password}</p>}
                </div>
              )}
            </div>

            <div className="form-actions">
              <Button variant="secondary" onClick={() => navigate("/admin/customers")}>Cancel</Button>
              <Button type="submit" loading={isLoading}>{isEdit ? "Update Customer" : "Create Customer"}</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddCustomer;
