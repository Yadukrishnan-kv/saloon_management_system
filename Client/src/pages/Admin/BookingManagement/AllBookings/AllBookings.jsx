import React, { useState, useEffect, useCallback } from "react";
import { FiEye, FiMapPin, FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import Table from "../../../../components/common/Table/Table";
import Modal from "../../../../components/common/Modal/Modal";
import Button from "../../../../components/common/Button/Button";
import Loading from "../../../../components/common/Loading/Loading";
import axios from "axios";
import { formatDateTime, formatCurrency, getStatusColor } from "../../../../utils/helpers";
import "../../UserManagement/UserList/UserList.css";

const lifecycleSteps = ["Requested", "Approved", "Assigned", "Accepted", "InProgress", "Completed", "Cancelled"];

const AllBookings = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
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
      const { data } = await axios.get(`${backendUrl}/api/bookings`, { params: { page, limit: 10, status: statusFilter } });
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
      const { data } = await axios.get(`${backendUrl}/api/bookings/${booking._id}`);
      setSelectedBooking(data);
      setDetailsOpen(true);
    } catch (error) {
      toast.error("Failed to load booking details");
    }
  };

  const openAssignModal = async (booking, mode = "assign") => {
      // Debug: log beauticians before filtering
      console.log("Fetched beauticians from backend:", data.beauticians);
    // Only allow assign for Approved status
    if (booking.status !== "Approved") {
      toast.error("Booking must be approved before assigning beautician");
      return;
    }

    setSelectedBooking(booking);
    setAssignmentMode(mode);
    setSelectedBeautician(booking.beautician?._id || "");

    try {
      // Fetch beauticians filtered by wallet balance for this booking amount
      const { data } = await axios.get(`${backendUrl}/api/beauticians/filter/by-balance`, {
        params: { bookingId: booking._id }
      });

      let beauticiansArray = data.beauticians || [];

      // --- Additional filtering for required cosmetic and assignedServiceIds ---
      // Assume booking.services is an array of service objects with _id
      const requiredServiceIds = (booking.services || []).map(s => s._id);

      // If assignedServiceIds is not present, skip filtering and show all eligible beauticians
      if (beauticiansArray.length > 0 && !beauticiansArray[0].assignedServiceIds) {
        // Log a warning for missing assignedServiceIds
        console.warn("assignedServiceIds missing from beautician objects. Skipping frontend filter.");
      } else {
        beauticiansArray = beauticiansArray.filter(b => {
          // Check assignedServiceIds includes all required services
          const hasAllServices = requiredServiceIds.every(sid => Array.isArray(b.assignedServiceIds) && b.assignedServiceIds.includes(sid));
          return hasAllServices;
        });
      }

      setBeauticians(beauticiansArray);
      setAssignmentSource("filtered");

      if (beauticiansArray.length > 0 && !booking.beautician?._id) {
        setSelectedBeautician(beauticiansArray[0]._id);
      }

      // Show info about the filter
      if (beauticiansArray.length === 0) {
        toast.warning(`No beauticians meet all requirements for this booking.`);
      }
    } catch (error) {
      console.error("Beautician fetch error:", error);
      toast.error(error.response?.data?.message || "Failed to load beauticians");
    }
    setAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedBeautician) { toast.error("Select a beautician"); return; }
    try {
      const endpoint = assignmentMode === "reassign"
        ? `/api/bookings/${selectedBooking._id}/reassign`
        : `/api/bookings/${selectedBooking._id}/assign`;

      await axios.post(`${backendUrl}${endpoint}`, { beauticianId: selectedBeautician });
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
      await axios.put(`${backendUrl}/api/bookings/${id}`, { status });
      toast.success(`Booking ${status.toLowerCase()}`);
      fetchBookings();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const handleApprove = async (bookingId) => {
    try {
      await axios.post(`${backendUrl}/api/admin/bookings/${bookingId}/approve`);
      toast.success("Booking approved! Now assign a beautician.");
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve booking");
    }
  };

  const handleReject = async (bookingId) => {
    try {
      await axios.put(`${backendUrl}/api/bookings/${bookingId}`, { status: "Cancelled" });
      toast.success("Booking rejected!");
      setDetailsOpen(false);
      fetchBookings();
    } catch (error) {
      toast.error("Failed to reject booking");
    }
  };

  const handleApproveFromModal = async (bookingId) => {
    try {
      await axios.post(`${backendUrl}/api/admin/bookings/${bookingId}/approve`);
      toast.success("Booking approved!");
      // Refresh the selected booking to update its status
      const { data } = await axios.get(`${backendUrl}/api/bookings/${bookingId}`);
      setSelectedBooking(data);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve booking");
    }
  };

  const currentAssignment = beauticians.find((item) => item._id === selectedBeautician);

  // Modern card-based table design
  const columns = [
    {
      key: "bookingInfo", label: "Booking Info",
      render: (row) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontWeight: 600, color: "#2d3436" }}>
            Booking #{row._id?.slice(-6).toUpperCase() || "N/A"}
          </div>
          <div style={{ fontSize: "12px", color: "#7f8c8d" }}>
            {row.customer?.username || "Unknown"} • {formatDateTime(row.bookingDate).split(',')[0]}
          </div>
        </div>
      ),
    },
    {
      key: "serviceInfo", label: "Services",
      render: (row) => (
        <div style={{ fontSize: "13px" }}>
          <div style={{ fontWeight: 500, color: "#2d3436", marginBottom: "4px" }}>
            {row.services?.length || 0} Service{(row.services?.length || 0) !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: "11px", color: "#7f8c8d" }}>
            {row.services?.[0]?.serviceName || "N/A"}
            {(row.services?.length || 0) > 1 && ` +${row.services.length - 1} more`}
          </div>
        </div>
      ),
    },
    {
      key: "beauticianInfo", label: "Beautician",
      render: (row) => (
        <div style={{ fontSize: "13px" }}>
          <div style={{ fontWeight: 500, color: row.beautician ? "#2d3436" : "#bdc3c7" }}>
            {row.beautician?.fullName || "Not Assigned"}
          </div>
          {row.beautician && (
            <div style={{ fontSize: "11px", color: "#7f8c8d" }}>
              ★ {row.beautician?.rating || "N/A"}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "timeSlot", label: "Time Slot",
      render: (row) => (
        <div style={{ fontSize: "13px", fontWeight: 500, color: "#2d3436" }}>
          {row.timeSlot?.startTime || "N/A"} - {row.timeSlot?.endTime || "N/A"}
        </div>
      ),
    },
    {
      key: "amount", label: "Amount",
      render: (row) => (
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#27ae60" }}>
          {formatCurrency(row.finalAmount)}
        </div>
      ),
    },
    {
      key: "status", label: "Status",
      render: (row) => (
        <span style={{
          padding: "6px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: 600,
          background: `${getStatusColor(row.status)}20`,
          color: getStatusColor(row.status),
          border: `1px solid ${getStatusColor(row.status)}40`,
          display: "inline-block"
        }}>
          {row.status}
        </span>
      ),
    },
    {
      key: "actions", label: "Actions",
      render: (row) => (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button className="action-btn edit" onClick={() => openDetails(row)} title="View Details" style={{ padding: "6px 10px", fontSize: "12px" }}>
            <FiEye size={14} /> View
          </button>
          {row.status === "Requested" && (
            <>
              <button className="action-btn success" onClick={() => handleApprove(row._id)} title="Approve" style={{ padding: "6px 10px", fontSize: "12px" }}>
                ✓ Approve
              </button>
              <button className="action-btn danger" onClick={() => handleReject(row._id)} title="Reject" style={{ padding: "6px 10px", fontSize: "12px" }}>
                ✕ Reject
              </button>
            </>
          )}
          {row.status === "Approved" && (
            <button className="action-btn success" onClick={() => openAssignModal(row)} title="Assign Beautician" style={{ padding: "6px 10px", fontSize: "12px" }}>
              → Assign
            </button>
          )}
          {row.beautician && ["Assigned", "Accepted", "InProgress"].includes(row.status) && (
            <button className="action-btn edit" onClick={() => openAssignModal(row, "reassign")} title="Reassign" style={{ padding: "6px 10px", fontSize: "12px" }}>
              <FiRefreshCw size={14} />
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
        <div className="page-header"><div><h1>All Bookings</h1><p>Manage and track bookings</p></div></div>
        <div style={{ background: "#f4fbff", border: "1px solid #d7eefd", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", color: "#285c7a" }}>
          <strong>📋 Booking Management:</strong> View all bookings with complete service details. Click "View" to see full details, then approve or reject bookings. After approval, assign any beautician from our database and manage the booking lifecycle.
        </div>
        <div className="filters-row">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="Requested">Requested</option>
            <option value="Approved">Approved</option>
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
          <div style={{ marginBottom: "12px", padding: "10px 12px", background: "#eefaf2", borderRadius: "10px", color: "#256f46", fontSize: "13px" }}>
            <strong>Note:</strong> Only beauticians with at least the service percentage amount of the service price in their wallet are shown below.
          </div>
          <div className="form-group">
            <label>Select Beautician *</label>
            <select value={selectedBeautician} onChange={(e) => setSelectedBeautician(e.target.value)}>
              <option value="">-- Choose a Beautician --</option>
              {beauticians && beauticians.length > 0 ? (
                beauticians.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.fullName} {b.rating ? `(★${b.rating})` : ""} - Wallet: ₹{b.walletBalance || 0} {b.phoneNumber ? `- ${b.phoneNumber}` : ""}
                  </option>
                ))
              ) : (
                <option disabled>No beauticians with sufficient wallet balance</option>
              )}
            </select>
          </div>
          {beauticians && beauticians.length === 0 && (
            <div style={{ padding: "10px 12px", background: "#ffe6e6", borderRadius: "10px", color: "#c0392b", fontSize: "13px", marginBottom: "12px" }}>
              <strong>No beauticians found.</strong> No beauticians have ₹{selectedBooking?.finalAmount} or more in their wallet. Beautician wallet balances need to be funded.
            </div>
          )}
          {currentAssignment && (
            <div style={{ padding: "10px 12px", background: "#f0f3f7", borderRadius: "10px", marginBottom: "12px", color: "#576574", fontSize: "13px" }}>
              <strong>Selected:</strong> {currentAssignment.fullName}<br/>
              <strong>Wallet Balance:</strong> ₹{currentAssignment.walletBalance || 0}<br/>
              {currentAssignment.phoneNumber && <>Phone: {currentAssignment.phoneNumber}<br/></>}
              {currentAssignment.rating && <>Rating: ★{currentAssignment.rating}</>}
            </div>
          )}
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setAssignModal(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedBeautician}>{assignmentMode === "reassign" ? "Reassign" : "Assign"}</Button>
          </div>
        </Modal>
        <Modal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} title="Booking Details" size="large">
          {selectedBooking && (
            <div style={{ display: "grid", gap: "20px" }}>
              {/* Header Info */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px", padding: "16px", background: "#f8f9fa", borderRadius: "12px" }}>
                <div>
                  <span style={{ display: "block", fontSize: "12px", color: "#7f8c8d", marginBottom: "4px" }}>Customer</span>
                  <strong style={{ fontSize: "14px", color: "#2d3436" }}>{selectedBooking.customer?.username || "-"}</strong>
                  <div style={{ fontSize: "11px", color: "#7f8c8d", marginTop: "4px" }}>{selectedBooking.customer?.email}</div>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "12px", color: "#7f8c8d", marginBottom: "4px" }}>Beautician</span>
                  <strong style={{ fontSize: "14px", color: selectedBooking.beautician ? "#2d3436" : "#bdc3c7" }}>
                    {selectedBooking.beautician?.fullName || "Not Assigned"}
                  </strong>
                  {selectedBooking.beautician && (
                    <div style={{ fontSize: "11px", color: "#7f8c8d", marginTop: "4px" }}>
                      ★ {selectedBooking.beautician?.rating} • {selectedBooking.beautician?.phoneNumber}
                    </div>
                  )}
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "12px", color: "#7f8c8d", marginBottom: "4px" }}>Booking Date</span>
                  <strong style={{ fontSize: "14px", color: "#2d3436" }}>{formatDateTime(selectedBooking.bookingDate).split(',')[0]}</strong>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "12px", color: "#7f8c8d", marginBottom: "4px" }}>Time Slot</span>
                  <strong style={{ fontSize: "14px", color: "#2d3436" }}>{selectedBooking.timeSlot?.startTime} - {selectedBooking.timeSlot?.endTime}</strong>
                </div>
              </div>

              {/* Services Section */}
              <div>
                <h4 style={{ margin: "0 0 12px", color: "#2d3436", fontSize: "14px", fontWeight: 600 }}>📋 Services ({selectedBooking.services?.length || 0})</h4>
                <div style={{ display: "grid", gap: "10px" }}>
                  {selectedBooking.services && selectedBooking.services.length > 0 ? (
                    selectedBooking.services.map((s, idx) => (
                      <div key={idx} style={{
                        padding: "12px",
                        background: "#f0f7ff",
                        borderRadius: "10px",
                        border: "1px solid #d0e8ff",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "#2d3436", marginBottom: "4px" }}>
                            {s.serviceName || "Service"}
                          </div>
                          <div style={{ color: "#7f8c8d", fontSize: "12px" }}>
                            ⏱️ Duration: {s.duration || 0} mins
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "#27ae60" }}>₹{s.price || 0}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#7f8c8d", fontSize: "13px", margin: 0 }}>No services in this booking</p>
                  )}
                </div>
              </div>

              {/* Add-ons Section */}
              {selectedBooking.addons && selectedBooking.addons.length > 0 && (
                <div>
                  <h4 style={{ margin: "0 0 12px", color: "#2d3436", fontSize: "14px", fontWeight: 600 }}>✨ Add-ons ({selectedBooking.addons.length})</h4>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {selectedBooking.addons.map((a, idx) => (
                      <div key={idx} style={{
                        padding: "10px 12px",
                        background: "#fef5e7",
                        borderRadius: "8px",
                        border: "1px solid #fce0b3",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span style={{ color: "#2d3436", fontWeight: 500 }}>{a.addonName || "Add-on"}</span>
                        <span style={{ color: "#e67e22", fontWeight: 600 }}>₹{a.price || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Summary */}
              <div style={{
                padding: "16px",
                background: "#e8f5e9",
                borderRadius: "10px",
                border: "1px solid #c8e6c9",
                display: "grid",
                gap: "8px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span>Services:</span>
                  <strong>{formatCurrency((selectedBooking.totalAmount || 0) - (selectedBooking.addonsAmount || 0))}</strong>
                </div>
                {selectedBooking.addonsAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span>Add-ons:</span>
                    <strong>{formatCurrency(selectedBooking.addonsAmount)}</strong>
                  </div>
                )}
                {selectedBooking.discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#e74c3c" }}>
                    <span>Discount:</span>
                    <strong>-{formatCurrency(selectedBooking.discountAmount)}</strong>
                  </div>
                )}
                {selectedBooking.travelFee > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span>Travel Fee:</span>
                    <strong>{formatCurrency(selectedBooking.travelFee)}</strong>
                  </div>
                )}
                <div style={{ borderTop: "1px solid #a5d6a7", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <strong>Total:</strong>
                  <strong style={{ fontSize: "16px", color: "#27ae60" }}>{formatCurrency(selectedBooking.finalAmount)}</strong>
                </div>
              </div>

              {/* Status & Timeline */}
              <div>
                <h4 style={{ margin: "0 0 12px", color: "#2d3436", fontSize: "14px", fontWeight: 600 }}>📍 Status & Timeline</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                  {lifecycleSteps.map((step) => (
                    <span key={step} style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: 600,
                      background: selectedBooking.status === step ? `${getStatusColor(step)}20` : "#f1f2f6",
                      color: selectedBooking.status === step ? getStatusColor(step) : "#7f8c8d",
                      border: selectedBooking.status === step ? `1px solid ${getStatusColor(step)}` : "1px solid #e0e0e0"
                    }}>
                      {step}
                    </span>
                  ))}
                </div>
                <div style={{ display: "grid", gap: "6px", color: "#636e72", fontSize: "12px" }}>
                  {selectedBooking.approvedAt && <span>✓ Approved: {formatDateTime(selectedBooking.approvedAt)}</span>}
                  {selectedBooking.assignedAt && <span>✓ Assigned: {formatDateTime(selectedBooking.assignedAt)}</span>}
                  {selectedBooking.acceptedAt && <span>✓ Accepted: {formatDateTime(selectedBooking.acceptedAt)}</span>}
                  {selectedBooking.startedAt && <span>✓ Started: {formatDateTime(selectedBooking.startedAt)}</span>}
                  {selectedBooking.completedAt && <span>✓ Completed: {formatDateTime(selectedBooking.completedAt)}</span>}
                  {selectedBooking.cancelledAt && <span>✗ Cancelled: {formatDateTime(selectedBooking.cancelledAt)}</span>}
                </div>
              </div>

              {/* Address */}
              {selectedBooking.address && (
                <div>
                  <h4 style={{ margin: "0 0 8px", color: "#2d3436", fontSize: "14px", fontWeight: 600 }}>📍 Service Location</h4>
                  <div style={{ padding: "12px", background: "#fafafa", borderRadius: "10px", fontSize: "13px", color: "#636e72", lineHeight: 1.6 }}>
                    {selectedBooking.address.street && <div>{selectedBooking.address.street}</div>}
                    <div>{selectedBooking.address.city}, {selectedBooking.address.pincode}</div>
                    {selectedBooking.address.gateCode && <div style={{ fontSize: "12px", color: "#95a5a6" }}>Gate Code: {selectedBooking.address.gateCode}</div>}
                  </div>
                </div>
              )}

              {/* Actions - Only show based on status */}
              <div className="form-actions" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px" }}>
                {selectedBooking.status === "Requested" && (
                  <>
                    <Button style={{ background: "#27ae60" }} onClick={() => handleApproveFromModal(selectedBooking._id)}>
                      ✓ Approve
                    </Button>
                    <Button style={{ background: "#e74c3c" }} onClick={() => handleReject(selectedBooking._id)}>
                      ✕ Reject
                    </Button>
                  </>
                )}
                {selectedBooking.status === "Approved" && (
                  <Button style={{ background: "#3498db" }} onClick={() => { setDetailsOpen(false); openAssignModal(selectedBooking, "assign"); }}>
                    → Assign Beautician
                  </Button>
                )}
                {selectedBooking.beautician && ["Assigned", "Accepted", "InProgress"].includes(selectedBooking.status) && (
                  <Button style={{ background: "#f39c12" }} onClick={() => { setDetailsOpen(false); openAssignModal(selectedBooking, "reassign"); }}>
                    ⟳ Reassign
                  </Button>
                )}
                {["Accepted", "InProgress"].includes(selectedBooking.status) && (
                  <Button style={{ background: "#27ae60" }} onClick={() => handleStatusUpdate(selectedBooking._id, "Completed")}>
                    ✓ Mark Completed
                  </Button>
                )}
                {!["Completed", "Cancelled", "Rejected"].includes(selectedBooking.status) && selectedBooking.status !== "Requested" && (
                  <Button style={{ background: "#95a5a6" }} onClick={() => handleStatusUpdate(selectedBooking._id, "Cancelled")}>
                    ✕ Cancel
                  </Button>
                )}
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
