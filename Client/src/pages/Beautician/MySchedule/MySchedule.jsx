import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Table from "../../../components/common/Table/Table";
import Button from "../../../components/common/Button/Button";
import Loading from "../../../components/common/Loading/Loading";
import api from "../../../utils/api";
import { formatDate, getStatusColor } from "../../../utils/helpers";

const MySchedule = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    try {
      const { data } = await api.get("/api/bookings", { params: { status: "Accepted" } });
      setBookings(data.bookings || []);
    } catch (error) {
      toast.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleStart = async (id) => {
    try {
      await api.put(`/api/bookings/${id}`, { status: "InProgress" });
      toast.success("Service started");
      fetchBookings();
    } catch (error) { toast.error("Failed"); }
  };

  const handleComplete = async (id) => {
    try {
      await api.put(`/api/bookings/${id}/complete`);
      toast.success("Service completed!");
      fetchBookings();
    } catch (error) { toast.error("Failed"); }
  };

  const columns = [
    { key: "customer", label: "Customer", render: (row) => row.customer?.username || "-" },
    { key: "services", label: "Services", render: (row) => row.services?.map((s) => s.name).join(", ") },
    { key: "bookingDate", label: "Date", render: (row) => formatDate(row.bookingDate) },
    { key: "timeSlot", label: "Time", render: (row) => `${row.timeSlot?.startTime} - ${row.timeSlot?.endTime}` },
    {
      key: "status", label: "Status",
      render: (row) => <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, background: `${getStatusColor(row.status)}20`, color: getStatusColor(row.status) }}>{row.status}</span>,
    },
    {
      key: "actions", label: "",
      render: (row) => (
        <div className="table-actions">
          {row.status === "Accepted" && <Button size="small" onClick={() => handleStart(row._id)}>Start</Button>}
          {row.status === "InProgress" && <Button size="small" onClick={() => handleComplete(row._id)}>Complete</Button>}
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header"><h1>My Schedule</h1><p>Upcoming and active appointments</p></div>
        {loading ? <Loading /> : <Table columns={columns} data={bookings} emptyMessage="No scheduled appointments" />}
      </main>
    </div>
  );
};

export default MySchedule;
