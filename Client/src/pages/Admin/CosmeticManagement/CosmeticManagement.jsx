import React, { useState, useEffect, useCallback } from "react";
import { FiEdit, FiTrash2, FiPlus, FiPackage } from "react-icons/fi";
import toast from "react-hot-toast";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Table from "../../../components/common/Table/Table";
import Modal from "../../../components/common/Modal/Modal";
import Button from "../../../components/common/Button/Button";
import Loading from "../../../components/common/Loading/Loading";
import api from "../../../utils/api";
import { formatDateTime } from "../../../utils/helpers";
import "../UserManagement/UserList/UserList.css";

const CosmeticManagement = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("items");
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemModal, setItemModal] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", category: "", brand: "", price: "", stockQuantity: "" });

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/admin/cosmetics/items");
      setItems(data.items || []);
    } catch (error) {
      toast.error("Failed to load cosmetic items");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/admin/cosmetics/orders");
      setOrders(data.orders || []);
    } catch (error) {
      toast.error("Failed to load cosmetic orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "items") fetchItems();
    else fetchOrders();
  }, [activeTab, fetchItems, fetchOrders]);

  const handleSaveItem = async () => {
    try {
      if (!form.name || !form.category || !form.price) {
        return toast.error("Name, category, and price are required");
      }
      if (editing) {
        await api.put(`/api/admin/cosmetics/items/${editing._id}`, form);
        toast.success("Item updated");
      } else {
        await api.post("/api/admin/cosmetics/items", form);
        toast.success("Item created");
      }
      setItemModal(false);
      setEditing(null);
      setForm({ name: "", description: "", category: "", brand: "", price: "", stockQuantity: "" });
      fetchItems();
    } catch (error) {
      toast.error("Failed to save item");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Delete this cosmetic item?")) return;
    try {
      await api.delete(`/api/admin/cosmetics/items/${itemId}`);
      toast.success("Item deleted");
      fetchItems();
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleUpdateOrderStatus = async (status) => {
    try {
      await api.put(`/api/admin/cosmetics/orders/${selectedOrder._id}/status`, { status });
      toast.success(`Order ${status.toLowerCase()}`);
      setOrderModal(false);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update order");
    }
  };

  const itemColumns = [
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    { key: "brand", label: "Brand", render: (row) => row.brand || "-" },
    { key: "price", label: "Price", render: (row) => `₹${row.price}` },
    { key: "stockQuantity", label: "Stock" },
    {
      key: "inStock", label: "In Stock",
      render: (row) => <span style={{ color: row.inStock ? "#27ae60" : "#e74c3c", fontWeight: 600 }}>{row.inStock ? "Yes" : "No"}</span>,
    },
    {
      key: "actions", label: "Actions",
      render: (row) => (
        <div style={{ display: "flex", gap: "6px" }}>
          <button className="action-btn edit" onClick={() => { setEditing(row); setForm({ name: row.name, description: row.description || "", category: row.category, brand: row.brand || "", price: row.price, stockQuantity: row.stockQuantity }); setItemModal(true); }}><FiEdit /></button>
          <button className="action-btn" onClick={() => handleDeleteItem(row._id)} style={{ color: "#e74c3c" }}><FiTrash2 /></button>
        </div>
      ),
    },
  ];

  const orderColumns = [
    { key: "beautician", label: "Beautician", render: (row) => row.beautician?.fullName || "-" },
    { key: "items", label: "Items", render: (row) => `${row.items?.length || 0} item(s)` },
    { key: "totalAmount", label: "Total", render: (row) => `₹${row.totalAmount}` },
    {
      key: "status", label: "Status",
      render: (row) => {
        const colors = { Pending: "#f39c12", Confirmed: "#3498db", Shipped: "#9b59b6", Delivered: "#27ae60", Cancelled: "#e74c3c" };
        return <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, background: `${colors[row.status]}20`, color: colors[row.status] }}>{row.status}</span>;
      },
    },
    { key: "createdAt", label: "Date", render: (row) => formatDateTime(row.createdAt) },
    {
      key: "actions", label: "Actions",
      render: (row) => (
        <button className="action-btn edit" onClick={() => { setSelectedOrder(row); setOrderModal(true); }}><FiPackage /></button>
      ),
    },
  ];

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header">
          <h1>Cosmetic Management</h1>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant={activeTab === "items" ? "primary" : "secondary"} onClick={() => setActiveTab("items")}>Items</Button>
            <Button variant={activeTab === "orders" ? "primary" : "secondary"} onClick={() => setActiveTab("orders")}>Orders</Button>
            {activeTab === "items" && (
              <Button onClick={() => { setEditing(null); setForm({ name: "", description: "", category: "", brand: "", price: "", stockQuantity: "" }); setItemModal(true); }}><FiPlus /> Add Item</Button>
            )}
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : activeTab === "items" ? (
          <Table columns={itemColumns} data={items} emptyMessage="No cosmetic items" />
        ) : (
          <Table columns={orderColumns} data={orders} emptyMessage="No cosmetic orders" />
        )}

        {/* Item Create/Edit Modal */}
        <Modal isOpen={itemModal} onClose={() => setItemModal(false)} title={editing ? "Edit Item" : "Add Cosmetic Item"}>
          <div className="form-group">
            <label>Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px" }} />
          </div>
          <div className="form-group">
            <label>Category *</label>
            <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Hair Care, Skin Care" style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px" }} />
          </div>
          <div className="form-group">
            <label>Brand</label>
            <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px" }} />
          </div>
          <div className="form-group">
            <label>Price (₹) *</label>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px" }} />
          </div>
          <div className="form-group">
            <label>Stock Quantity</label>
            <input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px" }} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px", fontFamily: "inherit" }} />
          </div>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setItemModal(false)}>Cancel</Button>
            <Button onClick={handleSaveItem}>{editing ? "Update" : "Create"}</Button>
          </div>
        </Modal>

        {/* Order Status Modal */}
        <Modal isOpen={orderModal} onClose={() => setOrderModal(false)} title="Manage Order">
          {selectedOrder && (
            <>
              <p><strong>Beautician:</strong> {selectedOrder.beautician?.fullName}</p>
              <p><strong>Total:</strong> ₹{selectedOrder.totalAmount}</p>
              <p><strong>Items:</strong></p>
              <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                {selectedOrder.items?.map((item, i) => (
                  <li key={i}>{item.name || item.item?.name} × {item.quantity} — ₹{item.price * item.quantity}</li>
                ))}
              </ul>
              <p><strong>Current Status:</strong> {selectedOrder.status}</p>
              <div className="form-actions" style={{ flexWrap: "wrap" }}>
                <Button variant="secondary" onClick={() => setOrderModal(false)}>Close</Button>
                {selectedOrder.status === "Pending" && <Button onClick={() => handleUpdateOrderStatus("Confirmed")}>Confirm</Button>}
                {selectedOrder.status === "Confirmed" && <Button onClick={() => handleUpdateOrderStatus("Shipped")}>Mark Shipped</Button>}
                {selectedOrder.status === "Shipped" && <Button onClick={() => handleUpdateOrderStatus("Delivered")}>Mark Delivered</Button>}
                {!["Delivered", "Cancelled"].includes(selectedOrder.status) && (
                  <Button onClick={() => handleUpdateOrderStatus("Cancelled")} style={{ background: "#e74c3c" }}>Cancel Order</Button>
                )}
              </div>
            </>
          )}
        </Modal>
      </main>
    </div>
  );
};

export default CosmeticManagement;
