import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from "react-icons/fi";
import toast from "react-hot-toast";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import Table from "../../../../components/common/Table/Table";
import Button from "../../../../components/common/Button/Button";
import Loading from "../../../../components/common/Loading/Loading";
import api from "../../../../utils/api";
import "../../UserManagement/UserList/UserList.css";

const RoleList = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/roles", { params: { search } });
      setRoles(data.roles || []);
    } catch (error) {
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;
    try {
      await api.delete(`/api/roles/${id}`);
      toast.success("Role deleted successfully");
      fetchRoles();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete role");
    }
  };

  const columns = [
    { key: "name", label: "Role Name" },
    { key: "description", label: "Description", render: (row) => row.description || "-" },
    {
      key: "permissions",
      label: "Menu Permissions",
      render: (row) => <span>{row.permissions?.length || 0}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`user-status ${row.isActive ? "active" : "inactive"}`}>
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="table-actions">
          <button className="action-btn edit" onClick={() => navigate(`/admin/roles/create?edit=${row._id}`)} title="Edit">
            <FiEdit2 />
          </button>
          <button
            className="action-btn danger"
            onClick={() => handleDelete(row._id)}
            title={row.isSystem ? "System role cannot be deleted" : "Delete"}
            disabled={row.isSystem}
          >
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />

      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header">
          <div>
            <h1>Role Management</h1>
            <p>Manage dynamic roles and menu permissions</p>
          </div>
          <Button onClick={() => navigate("/admin/roles/create")}>
            <FiPlus /> Create Role
          </Button>
        </div>

        <div className="filters-row">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? <Loading /> : <Table columns={columns} data={roles} emptyMessage="No roles found" />}
      </main>
    </div>
  );
};

export default RoleList;
