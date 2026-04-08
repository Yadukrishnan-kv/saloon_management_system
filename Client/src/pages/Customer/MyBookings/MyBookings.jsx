import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Table from "../../../components/common/Table/Table";
import Loading from "../../../components/common/Loading/Loading";
import Modal from "../../../components/common/Modal/Modal";
import Button from "../../../components/common/Button/Button";
import axios from "axios";
import { formatDate, formatCurrency, getStatusColor } from "../../../utils/helpers";
import "./MyBookings.css";

const MyBookings = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const fetchBookings = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/bookings`);
      setBookings(data.bookings || []);
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async () => {
    try {
      await axios.put(`${backendUrl}/api/bookings/${selected._id}/cancel`, { reason: cancelReason });
      toast.success("Booking cancelled");
      setSelected(null);
      setCancelReason("");
      fetchBookings();
    } catch (error) {
      toast.error("Failed to cancel");
    }
  };

  const columns = [
    { key: "services", label: "Services", render: (row) => row.services?.map((s) => s.name).join(", ") || "-" },
    { key: "bookingDate", label: "Date", render: (row) => formatDate(row.bookingDate) },
    { key: "timeSlot", label: "Time", render: (row) => `${row.timeSlot?.startTime} - ${row.timeSlot?.endTime}` },
    { key: "beautician", label: "Beautician", render: (row) => row.beautician?.fullName || "Pending" },
    { key: "finalAmount", label: "Amount", render: (row) => formatCurrency(row.finalAmount) },
    {
      key: "status", label: "Status",
      render: (row) => (
        <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, background: `${getStatusColor(row.status)}20`, color: getStatusColor(row.status) }}>
          {row.status}
        </span>
      ),
    },
    {
      key: "actions", label: "",
      render: (row) =>
        !["Completed", "Cancelled"].includes(row.status) ? (
          <button className="action-btn danger" onClick={() => setSelected(row)}>Cancel</button>
        ) : null,
    },
  ];

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header"><h1>My Bookings</h1><p>Track your appointments</p></div>
        {loading ? <Loading /> : <Table columns={columns} data={bookings} emptyMessage="No bookings yet" />}
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Cancel Booking">
          <p>Are you sure you want to cancel this booking?</p>
          <div className="form-group">
            <label>Reason (optional)</label>
            <textarea rows="3" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px", fontFamily: "inherit" }} />
          </div>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setSelected(null)}>Keep Booking</Button>
            <Button variant="danger" onClick={handleCancel}>Cancel Booking</Button>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default MyBookings;
