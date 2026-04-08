import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Table from "../../../components/common/Table/Table";
import Button from "../../../components/common/Button/Button";
import Loading from "../../../components/common/Loading/Loading";
import axios from "axios";
import { formatDate, formatCurrency, getStatusColor } from "../../../utils/helpers";

const ServiceRequests = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/bookings`, { params: { status: "Assigned" } });
      setBookings(data.bookings || []);
    } catch (error) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleAccept = async (id) => {
    try {
      await axios.put(`${backendUrl}/api/bookings/${id}/accept`);
      toast.success("Booking accepted!");
      fetchBookings();
    } catch (error) {
      toast.error("Failed to accept");
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`${backendUrl}/api/bookings/${id}`, { status: "Rejected" });
      toast.success("Booking rejected");
      fetchBookings();
    } catch (error) {
      toast.error("Failed");
    }
  };

  const columns = [
    { key: "customer", label: "Customer", render: (row) => row.customer?.username || "-" },
    { key: "services", label: "Services", render: (row) => row.services?.map((s) => s.name).join(", ") },
    { key: "bookingDate", label: "Date", render: (row) => formatDate(row.bookingDate) },
    { key: "timeSlot", label: "Time", render: (row) => `${row.timeSlot?.startTime} - ${row.timeSlot?.endTime}` },
    { key: "finalAmount", label: "Amount", render: (row) => formatCurrency(row.finalAmount) },
    {
      key: "actions", label: "Actions",
      render: (row) => (
        <div className="table-actions">
          <Button size="small" onClick={() => handleAccept(row._id)}>Accept</Button>
          <Button size="small" variant="danger" onClick={() => handleReject(row._id)}>Reject</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header"><h1>Service Requests</h1><p>Accept or decline assigned bookings</p></div>
        {loading ? <Loading /> : <Table columns={columns} data={bookings} emptyMessage="No pending requests" />}
      </main>
    </div>
  );
};

export default ServiceRequests;
