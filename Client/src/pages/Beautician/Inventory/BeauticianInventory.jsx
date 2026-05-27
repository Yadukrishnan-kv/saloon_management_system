import React, { useEffect, useState } from "react";
import axios from "axios";
import { QrReader } from "react-qr-reader";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Table from "../../../components/common/Table/Table";
import Loading from "../../../components/common/Loading/Loading";
import toast from "react-hot-toast";

const BeauticianInventory = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/inventory/list`);
      setInventory(data.inventory || []);
    } catch (err) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/inventory/usage-history`);
      setHistory(data.history || []);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchHistory();
  }, []);

  const handleScan = async (data) => {
    if (data) {
      setShowScanner(false);
      setScanResult(null);
      try {
        const res = await axios.post(`${backendUrl}/api/inventory/use`, { qr: data });
        setScanResult({ success: true, message: res.data.message });
        fetchInventory();
        fetchHistory();
      } catch (err) {
        setScanResult({ success: false, message: err.response?.data?.message || "Invalid QR or already used." });
      }
    }
  };

  const handleError = (err) => {
    setScanResult({ success: false, message: "QR Scan Error" });
    setShowScanner(false);
  };

  return (
    <div className="beautician-layout">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="main-content">
        <Header title="My Cosmetics Inventory" onMenuClick={() => setSidebarCollapsed((c) => !c)} />
        <button onClick={() => setShowScanner(true)} style={{ margin: 10 }}>Scan QR to Use</button>
        {showScanner && (
          <div className="qr-scanner-modal">
            <QrReader delay={300} onError={handleError} onScan={handleScan} style={{ width: "100%" }} />
            <button onClick={() => setShowScanner(false)}>Close</button>
          </div>
        )}
        {scanResult && (
          <div className={`scan-result ${scanResult.success ? "success" : "error"}`}>{scanResult.message}</div>
        )}
        <h3>Available Inventory</h3>
        {loading ? <Loading /> : (
          <Table
            columns={[
              { Header: "Product", accessor: (row) => row.productId?.name || row.productId },
              { Header: "Status", accessor: "status" },
              { Header: "QR", accessor: (row) => row.qrImage ? <img src={row.qrImage} alt="QR" style={{ width: 40 }} /> : "-" },
            ]}
            data={inventory}
            rowKey="_id"
          />
        )}
        <h3>Usage History</h3>
        <Table
          columns={[
            { Header: "Product", accessor: (row) => row.productId?.name || row.productId },
            { Header: "Used At", accessor: (row) => row.usedAt ? new Date(row.usedAt).toLocaleString() : "-" },
            { Header: "Booking", accessor: (row) => row.usedInBookingId?.jobId || "-" },
            { Header: "Status", accessor: "status" },
          ]}
          data={history}
          rowKey="_id"
        />
      </div>
    </div>
  );
};

export default BeauticianInventory;
