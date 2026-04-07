import React, { useState, useEffect, useCallback } from "react";
import { FiEye, FiMapPin, FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import Table from "../../../../components/common/Table/Table";
import Modal from "../../../../components/common/Modal/Modal";
import Button from "../../../../components/common/Button/Button";
import Loading from "../../../../components/common/Loading/Loading";
import api from "../../../../utils/api";
import { formatDateTime, formatCurrency, getStatusColor } from "../../../../utils/helpers";
import "../../UserManagement/UserList/UserList.css";

const lifecycleSteps = ["Requested", "Assigned", "Accepted", "InProgress", "Completed", "Cancelled"];

const AllBookings = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [beauticians, setBeauticians] = useState([]);
  const [selectedBeautician, setSelectedBeautician] = useState("");
  const [assignmentMode, setAssignmentMode] = useState("assign");
  const [assignmentSource, setAssignmentSource] = useState("available");

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/bookings", { params: { page, limit: 10, status: statusFilter } });
      setBookings(data.bookings);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const openDetails = async (booking) => {
    try {
      const { data } = await api.get(`/api/bookings/${booking._id}`);
      setSelectedBooking(data);
      setDetailsOpen(true);
    } catch (error) {
      toast.error("Failed to load booking details");
    }
  };

  const openAssignModal = async (booking, mode = "assign") => {
    setSelectedBooking(booking);
    setAssignmentMode(mode);
    setSelectedBeautician(booking.beautician?._id || "");

    try {
      const lat = booking.address?.coordinates?.lat;
      const lng = booking.address?.coordinates?.lng;
      const date = booking.bookingDate;
      const time = booking.timeSlot?.startTime;

      if (lat && lng) {
        const { data } = await api.get("/api/beauticians/nearby", {
          params: { lat, lng, date, time, radius: 15 },
        });
        if (data.length > 0) {
          setBeauticians(data);
          setAssignmentSource("nearest");
          setSelectedBeautician((current) => current || data[0]._id);
        } else {
          const fallback = await api.get("/api/beauticians/available", { params: { date, time } });
          setBeauticians(fallback.data);
          setAssignmentSource("available");
        }
      } else {
        const { data } = await api.get("/api/beauticians/available", { params: { date, time } });
        setBeauticians(data);
        setAssignmentSource("available");
      }
    } catch (error) {
      toast.error("Failed to load beauticians");
    }
    setAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedBeautician) { toast.error("Select a beautician"); return; }
    try {
      const endpoint = assignmentMode === "reassign"
        ? `/api/bookings/${selectedBooking._id}/reassign`
        : `/api/bookings/${selectedBooking._id}/assign`;

      await api.post(endpoint, { beauticianId: selectedBeautician });
      toast.success(assignmentMode === "reassign" ? "Beautician reassigned!" : "Beautician assigned!");
      setAssignModal(false);
      setSelectedBeautician("");
      fetchBookings();
    } catch (error) {
      toast.error("Failed to assign");
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/api/bookings/${id}`, { status });
      toast.success(`Booking ${status.toLowerCase()}`);
      fetchBookings();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const currentAssignment = beauticians.find((item) => item._id === selectedBeautician);

  const columns = [
    { key: "customer", label: "Customer", render: (row) => row.customer?.username || "-" },
    { key: "beautician", label: "Beautician", render: (row) => row.beautician?.fullName || "Unassigned" },
    { key: "bookingDate", label: "Date", render: (row) => formatDateTime(row.bookingDate) },
    { key: "timeSlot", label: "Time", render: (row) => `${row.timeSlot?.startTime} - ${row.timeSlot?.endTime}` },
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
      key: "actions", label: "Actions",
      render: (row) => (
        <div className="table-actions">
          <button className="action-btn edit" onClick={() => openDetails(row)} title="View"><FiEye /></button>
          {row.status === "Requested" && <button className="action-btn success" onClick={() => openAssignModal(row)} title="Assign">A</button>}
          {row.beautician && ["Assigned", "Accepted", "InProgress"].includes(row.status) && <button className="action-btn edit" onClick={() => openAssignModal(row, "reassign")} title="Reassign"><FiRefreshCw /></button>}
          {["Accepted", "InProgress"].includes(row.status) && <button className="action-btn success" onClick={() => handleStatusUpdate(row._id, "Completed")} title="Complete">C</button>}
          {!["Completed", "Cancelled"].includes(row.status) && <button className="action-btn danger" onClick={() => handleStatusUpdate(row._id, "Cancelled")} title="Cancel">X</button>}
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header"><div><h1>All Bookings</h1><p>Manage and track bookings</p></div></div>
        <div style={{ background: "#f4fbff", border: "1px solid #d7eefd", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", color: "#285c7a" }}>
          This page implements booking operations: all-booking monitoring, lifecycle tracking, nearest-available beautician assignment, manual reassignment, cancellation, completion control, and operational intervention. Customer feedback moderation continues in Review Management after the service is completed.
        </div>
        <div className="filters-row">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="Requested">Requested</option>
            <option value="Assigned">Assigned</option>
            <option value="Accepted">Accepted</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        {loading ? <Loading /> : (
          <>
            <Table columns={columns} data={bookings} emptyMessage="No bookings found" />
            {totalPages > 1 && (
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            )}
          </>
        )}
        <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title={assignmentMode === "reassign" ? "Reassign Beautician" : "Assign Beautician"}>
          <div style={{ marginBottom: "12px", padding: "10px 12px", background: assignmentSource === "nearest" ? "#eefaf2" : "#fff7ea", borderRadius: "10px", color: assignmentSource === "nearest" ? "#256f46" : "#8a6218", fontSize: "13px" }}>
            {assignmentSource === "nearest"
              ? "Beauticians are ranked by distance and availability for this booking slot."
              : "Location data is unavailable for this booking, so the list falls back to available beauticians for the selected slot."}
          </div>
          <div className="form-group">
            <label>Select Beautician</label>
            <select value={selectedBeautician} onChange={(e) => setSelectedBeautician(e.target.value)}>
              <option value="">Choose...</option>
              {beauticians.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.fullName} - ★{b.rating}{typeof b.distanceKm === "number" ? ` - ${b.distanceKm} km` : ""}
                </option>
              ))}
            </select>
          </div>
          {currentAssignment && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "#576574", fontSize: "13px" }}>
              <FiMapPin />
              <span>{currentAssignment.location?.city || "Unknown city"}{typeof currentAssignment.distanceKm === "number" ? ` • ${currentAssignment.distanceKm} km away` : ""}</span>
            </div>
          )}
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setAssignModal(false)}>Cancel</Button>
            <Button onClick={handleAssign}>{assignmentMode === "reassign" ? "Reassign" : "Assign"}</Button>
          </div>
        </Modal>
        <Modal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} title="Booking Details" size="large">
          {selectedBooking && (
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
                <div className="meta-item"><span>Customer</span><strong>{selectedBooking.customer?.username || "-"}</strong></div>
                <div className="meta-item"><span>Beautician</span><strong>{selectedBooking.beautician?.fullName || "Unassigned"}</strong></div>
                <div className="meta-item"><span>Booking Date</span><strong>{formatDateTime(selectedBooking.bookingDate)}</strong></div>
                <div className="meta-item"><span>Time Slot</span><strong>{selectedBooking.timeSlot?.startTime} - {selectedBooking.timeSlot?.endTime}</strong></div>
                <div className="meta-item"><span>Amount</span><strong>{formatCurrency(selectedBooking.finalAmount)}</strong></div>
                <div className="meta-item"><span>Payment Status</span><strong>{selectedBooking.paymentStatus}</strong></div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 8px", color: "#2d3436" }}>Lifecycle</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {lifecycleSteps.map((step) => (
                    <span key={step} style={{ padding: "6px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: selectedBooking.status === step ? `${getStatusColor(step)}20` : "#f1f2f6", color: selectedBooking.status === step ? getStatusColor(step) : "#7f8c8d" }}>
                      {step}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: "12px", display: "grid", gap: "6px", color: "#636e72", fontSize: "13px" }}>
                  {selectedBooking.assignedAt && <span>Assigned: {formatDateTime(selectedBooking.assignedAt)}</span>}
                  {selectedBooking.acceptedAt && <span>Accepted: {formatDateTime(selectedBooking.acceptedAt)}</span>}
                  {selectedBooking.startedAt && <span>Started: {formatDateTime(selectedBooking.startedAt)}</span>}
                  {selectedBooking.completedAt && <span>Completed: {formatDateTime(selectedBooking.completedAt)}</span>}
                  {selectedBooking.cancelledAt && <span>Cancelled: {formatDateTime(selectedBooking.cancelledAt)}</span>}
                </div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 8px", color: "#2d3436" }}>Operational Notes</h4>
                <p style={{ margin: 0, color: "#636e72", lineHeight: 1.6 }}>
                  Address: {[selectedBooking.address?.street, selectedBooking.address?.city, selectedBooking.address?.state, selectedBooking.address?.pincode].filter(Boolean).join(", ") || "Not provided"}
                </p>
                <p style={{ margin: "8px 0 0", color: "#636e72", lineHeight: 1.6 }}>
                  Manual intervention is available here through assignment, reassignment, completion, and cancellation controls. Customer feedback for completed bookings is reviewed on the Reviews page.
                </p>
              </div>

              <div className="form-actions">
                {selectedBooking.status === "Requested" && <Button onClick={() => { setDetailsOpen(false); openAssignModal(selectedBooking, "assign"); }}>Assign</Button>}
                {selectedBooking.beautician && ["Assigned", "Accepted", "InProgress"].includes(selectedBooking.status) && <Button onClick={() => { setDetailsOpen(false); openAssignModal(selectedBooking, "reassign"); }}>Reassign</Button>}
                {["Accepted", "InProgress"].includes(selectedBooking.status) && <Button onClick={() => handleStatusUpdate(selectedBooking._id, "Completed")}>Mark Completed</Button>}
                {! ["Completed", "Cancelled"].includes(selectedBooking.status) && <Button style={{ background: "#e74c3c" }} onClick={() => handleStatusUpdate(selectedBooking._id, "Cancelled")}>Cancel Booking</Button>}
                <Button variant="secondary" onClick={() => setDetailsOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
};

export default AllBookings;
