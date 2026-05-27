import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Table from "../../../components/common/Table/Table";
import Loading from "../../../components/common/Loading/Loading";
import toast from "react-hot-toast";

const InventoryMonitoring = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [filters, setFilters] = useState({ beauticianId: "", productId: "", serviceId: "", status: "", from: "", to: "" });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v));
      const { data } = await axios.get(`${backendUrl}/api/inventory/admin/inventory`, { params });
      setInventory(data.inventory || []);
    } catch (err) {
      toast.error("Failed to load inventory usage");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="admin-layout">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="main-content">
        <Header title="Beautician Cosmetics Usage Tracking" onMenuClick={() => setSidebarCollapsed((c) => !c)} />
        <div className="filters">
          <input name="beauticianId" placeholder="Beautician ID" value={filters.beauticianId} onChange={handleFilterChange} />
          <input name="productId" placeholder="Product ID" value={filters.productId} onChange={handleFilterChange} />
          <input name="serviceId" placeholder="Service ID" value={filters.serviceId} onChange={handleFilterChange} />
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="USED">Used</option>
            <option value="DAMAGED">Damaged</option>
            <option value="EXPIRED">Expired</option>
          </select>
          <input name="from" type="date" value={filters.from} onChange={handleFilterChange} />
          <input name="to" type="date" value={filters.to} onChange={handleFilterChange} />
          <button onClick={fetchInventory}>Filter</button>
        </div>
        {loading ? <Loading /> : (
          <Table
            columns={[
              { Header: "Beautician", accessor: (row) => row.beauticianId?.fullName || row.beauticianId },
              { Header: "Product", accessor: (row) => row.productId?.name || row.productId },
              { Header: "Status", accessor: "status" },
              { Header: "Used At", accessor: (row) => row.usedAt ? new Date(row.usedAt).toLocaleString() : "-" },
              { Header: "Booking", accessor: (row) => row.usedInBookingId?.jobId || "-" },
              { Header: "QR", accessor: (row) => row.qrImage ? <img src={row.qrImage} alt="QR" style={{ width: 40 }} /> : "-" },
            ]}
            data={inventory}
            rowKey="_id"
          />
        )}
      </div>
    </div>
  );
};

export default InventoryMonitoring;
