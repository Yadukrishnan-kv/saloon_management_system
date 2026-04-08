import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiCheckCircle, FiXCircle, FiEye } from "react-icons/fi";
import toast from "react-hot-toast";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import Table from "../../../../components/common/Table/Table";
import Button from "../../../../components/common/Button/Button";
import Modal from "../../../../components/common/Modal/Modal";
import Loading from "../../../../components/common/Loading/Loading";
import BeauticianDetailsCard from "../../../../components/common/BeauticianDetailsCard/BeauticianDetailsCard";
import axios from "axios";
import "../../UserManagement/UserList/UserList.css";

const BeauticianList = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [beauticians, setBeauticians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const fetchBeauticians = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/beauticians`, {
        params: { page, limit: 10, search, status: statusFilter },
      });
      setBeauticians(data.beauticians);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error("Failed to load beauticians");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchBeauticians(); }, [fetchBeauticians]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${backendUrl}/api/beauticians/${id}`);
      toast.success("Beautician deleted");
      fetchBeauticians();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`${backendUrl}/api/beauticians/${id}/status`, { status });
      toast.success(`Beautician ${status.toLowerCase()}`);
      fetchBeauticians();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const columns = [
    { key: "fullName", label: "Name" },
    { key: "phoneNumber", label: "Phone" },
    {
      key: "skills", label: "Skills",
      render: (row) => <div className="skills-cell">{row.skills?.slice(0, 3).join(", ")}{row.skills?.length > 3 ? "..." : ""}</div>,
    },
    {
      key: "isVerified", label: "Verified",
      render: (row) => row.isVerified ? <FiCheckCircle color="#00b894" /> : <FiXCircle color="#e74c3c" />,
    },
    {
      key: "status", label: "Status",
      render: (row) => <span className={`user-status ${row.status?.toLowerCase()}`}>{row.status}</span>,
    },
    { key: "rating", label: "Rating", render: (row) => `${row.rating || 0} ★` },
    {
      key: "actions", label: "Actions",
      render: (row) => (
        <div className="table-actions">
          <button className="action-btn edit" onClick={() => setSelected(row)} title="View details"><FiEye /></button>
          <button className="action-btn edit" onClick={() => navigate(`/admin/beauticians/add?edit=${row._id}`)}><FiEdit2 /></button>
          {row.status !== "Active" && <button className="action-btn success" onClick={() => handleStatusChange(row._id, "Active")} title="Activate">A</button>}
          {row.status === "Active" && <button className="action-btn warning" onClick={() => handleStatusChange(row._id, "Suspended")} title="Suspend">S</button>}
          <button className="action-btn danger" onClick={() => handleDelete(row._id)}><FiTrash2 /></button>
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
          <div><h1>Beautician Management</h1><p>Manage service providers</p></div>
          <Button onClick={() => navigate("/admin/beauticians/add")}><FiPlus /> Add Beautician</Button>
        </div>
        <div className="filters-row">
          <div className="search-box"><FiSearch /><input placeholder="Search beauticians..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
        {loading ? <Loading /> : (
          <>
            <Table columns={columns} data={beauticians} emptyMessage="No beauticians found" />
            {totalPages > 1 && (
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            )}
          </>
        )}
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Beautician Details" size="large">
          <BeauticianDetailsCard beautician={selected} />
        </Modal>
      </main>
    </div>
  );
};

export default BeauticianList;
