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
import "./UserList.css";

const UserList = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/users/getAllUsers", {
        params: { page, limit: 10, search, role: roleFilter },
      });
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/api/users/deleteUser/${id}`);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleStatusChange = async (id, action) => {
    try {
      await api.put(`/api/users/${id}/status`, { action });
      toast.success(`User ${action}d successfully`);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const columns = [
    { key: "username", label: "Username" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (row) => <span className="role-badge">{row.role}</span> },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`user-status ${row.isSuspended ? "suspended" : row.isActive ? "active" : "inactive"}`}>
          {row.isSuspended ? "Suspended" : row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="table-actions">
          <button className="action-btn edit" onClick={() => navigate(`/admin/users/create?edit=${row._id}`)} title="Edit">
            <FiEdit2 />
          </button>
          {row.isActive && !row.isSuspended && (
            <button className="action-btn warning" onClick={() => handleStatusChange(row._id, "suspend")} title="Suspend">
              S
            </button>
          )}
          {!row.isActive && (
            <button className="action-btn success" onClick={() => handleStatusChange(row._id, "activate")} title="Activate">
              A
            </button>
          )}
          <button className="action-btn danger" onClick={() => handleDelete(row._id)} title="Delete">
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
            <h1>User Management</h1>
            <p>Manage all system users</p>
          </div>
          <Button onClick={() => navigate("/admin/users/create")}>
            <FiPlus /> Create User
          </Button>
        </div>

        <div className="filters-row">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            <option value="SuperAdmin">Super Admin</option>
            <option value="Admin">Admin</option>
            <option value="Customer">Customer</option>
            <option value="Beautician">Beautician</option>
          </select>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <>
            <Table columns={columns} data={users} emptyMessage="No users found" />
            {totalPages > 1 && (
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default UserList;
