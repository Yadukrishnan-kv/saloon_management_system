import React, { useState, useEffect, useCallback } from "react";
import { FiDollarSign, FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Table from "../../../components/common/Table/Table";
import Button from "../../../components/common/Button/Button";
import Loading from "../../../components/common/Loading/Loading";
import api from "../../../utils/api";
import { formatDateTime } from "../../../utils/helpers";
import "../UserManagement/UserList/UserList.css";

const PayoutManagement = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);

  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/admin/payouts/pending");
      setPayouts(data.payouts || []);
      setTotalPending(data.totalPendingAmount || 0);
    } catch (error) {
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const handleProcessPayout = async (bookingId) => {
    if (!window.confirm("Process this payout? This will credit the beautician's wallet.")) return;
    try {
      const { data } = await api.post(`/api/admin/payouts/${bookingId}/process`);
      toast.success(`Payout of ₹${data.payoutAmount} processed`);
      fetchPayouts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process payout");
    }
  };

  const columns = [
    { key: "beautician", label: "Beautician", render: (row) => row.beautician?.fullName || "-" },
    { key: "service", label: "Service", render: (row) => row.services?.[0]?.serviceName || "-" },
    { key: "finalAmount", label: "Booking Amount", render: (row) => `₹${row.finalAmount}` },
    { key: "commission", label: "Commission", render: (row) => `₹${row.platformPayment?.platformCommission || 200}` },
    { key: "payout", label: "Beautician Payout", render: (row) => <strong>₹{row.platformPayment?.beauticianPayout || (row.finalAmount - 200)}</strong> },
    {
      key: "payoutDate", label: "Due Date",
      render: (row) => {
        const dueDate = new Date(row.platformPayment?.beauticianPayoutDate);
        const isOverdue = dueDate < new Date();
        return <span style={{ color: isOverdue ? "#e74c3c" : "#636e72", fontWeight: isOverdue ? 600 : 400 }}>{formatDateTime(row.platformPayment?.beauticianPayoutDate)}{isOverdue ? " (Overdue)" : ""}</span>;
      },
    },
    { key: "completedAt", label: "Completed", render: (row) => formatDateTime(row.completedAt) },
    {
      key: "actions", label: "Actions",
      render: (row) => (
        <Button onClick={() => handleProcessPayout(row._id)} style={{ fontSize: "12px", padding: "6px 12px" }}>
          <FiCheck /> Pay
        </Button>
      ),
    },
  ];

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header">
          <h1>Payout Management</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ background: "#fff3cd", padding: "8px 16px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FiDollarSign />
              <span><strong>Total Pending:</strong> ₹{totalPending}</span>
            </div>
          </div>
        </div>
        {loading ? <Loading /> : <Table columns={columns} data={payouts} emptyMessage="No pending payouts" />}
      </main>
    </div>
  );
};

export default PayoutManagement;
