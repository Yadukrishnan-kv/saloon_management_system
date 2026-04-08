import React, { useState, useEffect, useCallback } from "react";
import { FiCheckCircle, FiXCircle, FiEye } from "react-icons/fi";
import toast from "react-hot-toast";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import Table from "../../../../components/common/Table/Table";
import Modal from "../../../../components/common/Modal/Modal";
import Button from "../../../../components/common/Button/Button";
import Loading from "../../../../components/common/Loading/Loading";
import BeauticianDetailsCard from "../../../../components/common/BeauticianDetailsCard/BeauticianDetailsCard";
import axios from "axios";
import "../../UserManagement/UserList/UserList.css";

const BeauticianVerification = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [beauticians, setBeauticians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchPending = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/beauticians`, { params: { verificationStatus: "Pending" } });
      setBeauticians(data.beauticians || []);
    } catch (error) {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleVerify = async (id, status) => {
    try {
      await axios.put(`${backendUrl}/api/beauticians/${id}/verify`, { verificationStatus: status });
      toast.success(`Beautician ${status.toLowerCase()}`);
      setSelected(null);
      setBeauticians((prev) => prev.filter((b) => b._id !== id));
    } catch (error) {
      toast.error("Failed to verify");
    }
  };

  const columns = [
    { key: "fullName", label: "Name" },
    { key: "phoneNumber", label: "Phone" },
    { key: "skills", label: "Skills", render: (row) => row.skills?.join(", ") },
    { key: "experience", label: "Exp.", render: (row) => `${row.experience || 0} yrs` },
    { key: "documents", label: "Docs", render: (row) => `${row.documents?.length || 0} files` },
    {
      key: "actions", label: "Actions",
      render: (row) => (
        <div className="table-actions">
          <button className="action-btn edit" onClick={() => setSelected(row)} title="View"><FiEye /></button>
          <button className="action-btn success" onClick={() => handleVerify(row._id, "Approved")} title="Approve"><FiCheckCircle /></button>
          <button className="action-btn danger" onClick={() => handleVerify(row._id, "Rejected")} title="Reject"><FiXCircle /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header"><h1>Beautician Verification</h1><p>Review and approve beautician applications</p></div>
        {loading ? <Loading /> : <Table columns={columns} data={beauticians} emptyMessage="No pending verifications" />}
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Beautician Details" size="large">
          {selected && (
            <>
              <BeauticianDetailsCard beautician={selected} />
              <div className="form-actions" style={{ marginTop: "20px" }}>
                <Button variant="danger" onClick={() => handleVerify(selected._id, "Rejected")}>Reject</Button>
                <Button onClick={() => handleVerify(selected._id, "Approved")}>Approve</Button>
              </div>
            </>
          )}
        </Modal>
      </main>
    </div>
  );
};

export default BeauticianVerification;
