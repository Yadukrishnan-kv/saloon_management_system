import React, { useState, useEffect, useCallback } from "react";
import { FiMessageCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import Table from "../../../../components/common/Table/Table";
import Modal from "../../../../components/common/Modal/Modal";
import Button from "../../../../components/common/Button/Button";
import Loading from "../../../../components/common/Loading/Loading";
import api from "../../../../utils/api";
import { formatDateTime, getStatusColor } from "../../../../utils/helpers";
import "../../UserManagement/UserList/UserList.css";

const ComplaintsList = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState("InProgress");

  const fetchComplaints = useCallback(async () => {
    try {
      const { data } = await api.get("/api/complaints");
      setComplaints(data);
    } catch (error) {
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleResolve = async () => {
    try {
      await api.put(`/api/complaints/${selected._id}`, { status: newStatus, adminResponse: response });
      toast.success("Complaint updated");
      setModalOpen(false);
      fetchComplaints();
    } catch (error) {
      toast.error("Failed");
    }
  };

  const columns = [
    { key: "user", label: "User", render: (row) => row.user?.username || "-" },
    { key: "subject", label: "Subject" },
    { key: "category", label: "Category" },
    { key: "priority", label: "Priority", render: (row) => <span style={{ fontWeight: 600, color: row.priority === "Urgent" ? "#e74c3c" : row.priority === "High" ? "#f39c12" : "#636e72" }}>{row.priority}</span> },
    { key: "status", label: "Status", render: (row) => <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, background: `${getStatusColor(row.status)}20`, color: getStatusColor(row.status) }}>{row.status}</span> },
    { key: "createdAt", label: "Date", render: (row) => formatDateTime(row.createdAt) },
    {
      key: "actions", label: "Actions",
      render: (row) => (
        <button className="action-btn edit" onClick={() => { setSelected(row); setResponse(row.adminResponse || ""); setNewStatus(row.status); setModalOpen(true); }}>
          <FiMessageCircle />
        </button>
      ),
    },
  ];

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header"><h1>Complaints</h1></div>
        {loading ? <Loading /> : <Table columns={columns} data={complaints} emptyMessage="No complaints" />}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Resolve Complaint">
          {selected && (
            <>
              <p><strong>Subject:</strong> {selected.subject}</p>
              <p><strong>Description:</strong> {selected.description}</p>
              <div className="form-group">
                <label>Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="Open">Open</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="form-group">
                <label>Admin Response</label>
                <textarea rows="3" value={response} onChange={(e) => setResponse(e.target.value)} style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px", fontFamily: "inherit" }} />
              </div>
              <div className="form-actions">
                <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={handleResolve}>Update</Button>
              </div>
            </>
          )}
        </Modal>
      </main>
    </div>
  );
};

export default ComplaintsList;
