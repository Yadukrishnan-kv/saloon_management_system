import React, { useState, useEffect, useCallback } from "react";
import { FiSearch, FiEye } from "react-icons/fi";
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

const AllBookings = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [assignModal, setAssignModal] = useState(false);
  const [beauticians, setBeauticians] = useState([]);
  const [selectedBeautician, setSelectedBeautician] = useState("");

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

  const openAssignModal = async (booking) => {
    setSelectedBooking(booking);
    try {
      const { data } = await api.get("/api/beauticians/available");
      setBeauticians(data);
    } catch (error) {
      toast.error("Failed to load beauticians");
    }
    setAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedBeautician) { toast.error("Select a beautician"); return; }
    try {
      await api.post(`/api/bookings/${selectedBooking._id}/assign`, { beauticianId: selectedBeautician });
      toast.success("Beautician assigned!");
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
          <button className="action-btn edit" onClick={() => setSelectedBooking(row)} title="View"><FiEye /></button>
          {row.status === "Requested" && <button className="action-btn success" onClick={() => openAssignModal(row)} title="Assign">A</button>}
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
        <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assign Beautician">
          <div className="form-group">
            <label>Select Beautician</label>
            <select value={selectedBeautician} onChange={(e) => setSelectedBeautician(e.target.value)}>
              <option value="">Choose...</option>
              {beauticians.map((b) => <option key={b._id} value={b._id}>{b.fullName} - ★{b.rating}</option>)}
            </select>
          </div>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setAssignModal(false)}>Cancel</Button>
            <Button onClick={handleAssign}>Assign</Button>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default AllBookings;
