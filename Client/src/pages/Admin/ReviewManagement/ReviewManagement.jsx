import React, { useState, useEffect, useCallback } from "react";
import { FiCheck, FiX, FiTrash2, FiStar } from "react-icons/fi";
import toast from "react-hot-toast";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Table from "../../../components/common/Table/Table";
import Modal from "../../../components/common/Modal/Modal";
import Button from "../../../components/common/Button/Button";
import Loading from "../../../components/common/Loading/Loading";
import api from "../../../utils/api";
import { formatDateTime } from "../../../utils/helpers";
import "../UserManagement/UserList/UserList.css";

const ReviewManagement = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending");
  const [rejectModal, setRejectModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = filter === "Pending" ? "/api/admin/reviews/pending" : `/api/admin/reviews?status=${filter}`;
      const { data } = await api.get(endpoint);
      setReviews(data.reviews || []);
    } catch (error) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleApprove = async (reviewId) => {
    try {
      await api.put(`/api/admin/reviews/${reviewId}/approve`);
      toast.success("Review approved");
      fetchReviews();
    } catch (error) {
      toast.error("Failed to approve review");
    }
  };

  const handleReject = async () => {
    try {
      await api.put(`/api/admin/reviews/${selected._id}/reject`, { reason: rejectReason });
      toast.success("Review rejected");
      setRejectModal(false);
      setRejectReason("");
      fetchReviews();
    } catch (error) {
      toast.error("Failed to reject review");
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) return;
    try {
      await api.delete(`/api/admin/reviews/${reviewId}`);
      toast.success("Review deleted");
      fetchReviews();
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar key={i} style={{ color: i < rating ? "#f39c12" : "#dfe6e9", fill: i < rating ? "#f39c12" : "none" }} />
    ));
  };

  const columns = [
    { key: "customer", label: "Customer", render: (row) => row.customer?.username || "-" },
    { key: "beautician", label: "Beautician", render: (row) => row.beautician?.fullName || "-" },
    { key: "rating", label: "Rating", render: (row) => <span style={{ display: "flex", gap: "2px" }}>{renderStars(row.rating)}</span> },
    { key: "comment", label: "Comment", render: (row) => <span style={{ maxWidth: "200px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.comment || "-"}</span> },
    {
      key: "adminApproval", label: "Status",
      render: (row) => {
        const colors = { Pending: "#f39c12", Approved: "#27ae60", Rejected: "#e74c3c" };
        return <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, background: `${colors[row.adminApproval]}20`, color: colors[row.adminApproval] }}>{row.adminApproval}</span>;
      },
    },
    { key: "createdAt", label: "Date", render: (row) => formatDateTime(row.createdAt) },
    {
      key: "actions", label: "Actions",
      render: (row) => (
        <div style={{ display: "flex", gap: "6px" }}>
          {row.adminApproval === "Pending" && (
            <>
              <button className="action-btn edit" onClick={() => handleApprove(row._id)} title="Approve"><FiCheck /></button>
              <button className="action-btn" onClick={() => { setSelected(row); setRejectModal(true); }} title="Reject" style={{ color: "#e74c3c" }}><FiX /></button>
            </>
          )}
          <button className="action-btn" onClick={() => handleDelete(row._id)} title="Delete" style={{ color: "#e74c3c" }}><FiTrash2 /></button>
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
          <h1>Review Management</h1>
          <div style={{ display: "flex", gap: "8px" }}>
            {["Pending", "Approved", "Rejected"].map((s) => (
              <Button key={s} variant={filter === s ? "primary" : "secondary"} onClick={() => setFilter(s)}>{s}</Button>
            ))}
          </div>
        </div>
        {loading ? <Loading /> : <Table columns={columns} data={reviews} emptyMessage="No reviews found" />}
        <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="Reject Review">
          {selected && (
            <>
              <p><strong>Rating:</strong> {selected.rating}/5</p>
              <p><strong>Comment:</strong> {selected.comment}</p>
              <div className="form-group">
                <label>Rejection Reason</label>
                <textarea rows="3" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px", fontFamily: "inherit" }} />
              </div>
              <div className="form-actions">
                <Button variant="secondary" onClick={() => setRejectModal(false)}>Cancel</Button>
                <Button onClick={handleReject} style={{ background: "#e74c3c" }}>Reject Review</Button>
              </div>
            </>
          )}
        </Modal>
      </main>
    </div>
  );
};

export default ReviewManagement;
