import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import Button from "../../../../components/common/Button/Button";
import axios from "axios";
import "../../UserManagement/UserList/UserList.css";
import "./CreateRole.css";

const MENU_OPTIONS = [
  "Dashboard",
  "Customer Dashboard",
  "Beautician Dashboard",
  "User Management",
  "Customer Management",
  "Role",
  "Beauticians",
  "Beautician Verify",
  "Categories",
  "Services",
  "Bookings",
  "Banners",
  "Complaints",
  "Reviews",
  "Cosmetics",
  "Payouts",
  "Notifications",
  "Reports",
  "Browse Services",
  "Book Service",
  "My Bookings",
  "My Complaints",
  "My Schedule",
  "Service Requests",
  "Earnings",
  "Profile",
];

const CreateRole = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [],
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [roleId, setRoleId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Role name is required";
    if (formData.permissions.length === 0) newErrors.permissions = "Select at least one menu permission";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePermissionToggle = (permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((item) => item !== permission)
        : [...prev.permissions, permission],
    }));
    if (errors.permissions) setErrors((prev) => ({ ...prev, permissions: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isEdit) {
        await axios.put(`${backendUrl}/api/roles/${roleId}`, formData);
        toast.success("Role updated successfully");
      } else {
        await axios.post(`${backendUrl}/api/roles`, formData);
        toast.success("Role created successfully");
      }
      setTimeout(() => navigate("/admin/roles"), 600);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoleForEdit = useCallback(async (editId) => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/roles/${editId}`);
      setFormData({
        name: data.name || "",
        description: data.description || "",
        permissions: data.permissions || [],
        isActive: data.isActive !== false,
      });
      setIsEdit(true);
      setRoleId(editId);
    } catch (error) {
      toast.error("Failed to load role");
      navigate("/admin/roles");
    }
  }, [navigate]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const editId = searchParams.get("edit");
    if (editId) loadRoleForEdit(editId);
  }, [location.search, loadRoleForEdit]);

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />

      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header">
          <h1>{isEdit ? "Edit Role" : "Create Role"}</h1>
        </div>

        <div className="form-card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Role Name</label>
                <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} />
                {errors.name && <p className="error-text">{errors.name}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ marginBottom: "10px", display: "block" }}>Menu Permissions</label>
              <div className="permission-grid">
                {MENU_OPTIONS.map((permission) => (
                  <label key={permission} className="permission-item">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission)}
                      onChange={() => handlePermissionToggle(permission)}
                    />
                    <span>{permission}</span>
                  </label>
                ))}
              </div>
              {errors.permissions && <p className="error-text">{errors.permissions}</p>}
            </div>

            <div className="form-group">
              <label className="permission-item">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
                <span>Active Role</span>
              </label>
            </div>

            <div className="form-actions">
              <Button variant="secondary" onClick={() => navigate("/admin/roles")}>Cancel</Button>
              <Button type="submit" loading={isLoading}>{isEdit ? "Update Role" : "Create Role"}</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateRole;
