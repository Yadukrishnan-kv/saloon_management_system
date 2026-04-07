import React, { useState, useEffect, useCallback } from "react";
import { FiSearch, FiPlus, FiEdit2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import Table from "../../../../components/common/Table/Table";
import Button from "../../../../components/common/Button/Button";
import Loading from "../../../../components/common/Loading/Loading";
import api from "../../../../utils/api";
import { formatDateTime } from "../../../../utils/helpers";
import "../../UserManagement/UserList/UserList.css";

const CustomerList = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/users/customers", {
        params: { page, limit: 10, search, status: statusFilter },
      });
      setCustomers(data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleStatusChange = async (id, action) => {
    try {
      await api.put(`/api/users/customers/${id}/status`, { action });
      toast.success(`Customer ${action}d successfully`);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update customer status");
    }
  };

  const columns = [
    { key: "username", label: "Customer Name" },
    { key: "email", label: "Email" },
    { key: "phoneNumber", label: "Phone", render: (row) => row.phoneNumber || "-" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`user-status ${row.isSuspended ? "suspended" : row.isActive ? "active" : "inactive"}`}>
          {row.isSuspended ? "Suspended" : row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    { key: "createdAt", label: "Joined On", render: (row) => formatDateTime(row.createdAt) },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="table-actions">
          <button className="action-btn edit" onClick={() => navigate(`/admin/customers/add?edit=${row._id}`)} title="Edit">
            <FiEdit2 />
          </button>
          {row.isActive && !row.isSuspended && (
            <>
              <button className="action-btn warning" onClick={() => handleStatusChange(row._id, "suspend")} title="Suspend">
                S
              </button>
              <button className="action-btn warning" onClick={() => handleStatusChange(row._id, "deactivate")} title="Deactivate">
                D
              </button>
            </>
          )}
          {row.isSuspended && (
            <button className="action-btn success" onClick={() => handleStatusChange(row._id, "activate")} title="Un-suspend">
              U
            </button>
          )}
          {!row.isActive && (
            <button className="action-btn success" onClick={() => handleStatusChange(row._id, "activate")} title="Activate">
              A
            </button>
          )}
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
            <h1>Customer</h1>
            <p>View customer profiles and manage customer account status</p>
          </div>
          <Button onClick={() => navigate("/admin/customers/add")}><FiPlus /> Add Customer</Button>
        </div>

        <div className="filters-row">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <>
            <Table columns={columns} data={customers} emptyMessage="No customers found" />
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

export default CustomerList;
