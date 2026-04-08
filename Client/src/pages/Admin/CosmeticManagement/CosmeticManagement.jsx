import React, { useState, useEffect, useCallback } from "react";
import { FiEdit, FiTrash2, FiPlus, FiPackage } from "react-icons/fi";
import toast from "react-hot-toast";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Table from "../../../components/common/Table/Table";
import Modal from "../../../components/common/Modal/Modal";
import Button from "../../../components/common/Button/Button";
import Loading from "../../../components/common/Loading/Loading";
import axios from "axios";
import { formatDateTime } from "../../../utils/helpers";
import "../UserManagement/UserList/UserList.css";

const CosmeticManagement = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const modalGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
    alignItems: "start",
  };
  const fullWidthStyle = { gridColumn: "1 / -1" };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("items");
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemModal, setItemModal] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", category: "", subCategory: "", brand: "", price: "", stockQuantity: "" });
  const [categories, setCategories] = useState([]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/cosmetics/items`);
      setItems(data.items || []);
    } catch (error) {
      toast.error("Failed to load cosmetic items");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/categories`);
      setCategories(data);
    } catch (error) {
      // silently ignore - categories are optional
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/cosmetics/orders`);
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

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const topLevelCategories = categories.filter((c) => !c.parentCategory);
  const subCategoriesForSelected = categories.filter(
    (c) => c.parentCategory && (c.parentCategory._id || c.parentCategory) === form.category
  );

  const handleSaveItem = async () => {
    try {
      if (!form.name || !form.category || !form.price) {
        return toast.error("Name, category, and price are required");
      }
      if (editing) {
        await axios.put(`${backendUrl}/api/admin/cosmetics/items/${editing._id}`, form);
        toast.success("Item updated");
      } else {
        await axios.post(`${backendUrl}/api/admin/cosmetics/items`, form);
        toast.success("Item created");
      }
      setItemModal(false);
      setEditing(null);
      setForm({ name: "", description: "", category: "", subCategory: "", brand: "", price: "", stockQuantity: "" });
      fetchItems();
    } catch (error) {
      toast.error("Failed to save item");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Delete this cosmetic item?")) return;
    try {
      await axios.delete(`${backendUrl}/api/admin/cosmetics/items/${itemId}`);
      toast.success("Item deleted");
      fetchItems();
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleUpdateOrderStatus = async (status) => {
    try {
      await axios.put(`${backendUrl}/api/admin/cosmetics/orders/${selectedOrder._id}/status`, { status });
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
          <button className="action-btn edit" onClick={() => { setEditing(row); setForm({ name: row.name, description: row.description || "", category: row.category?._id || row.category, subCategory: row.subCategory?._id || row.subCategory || "", brand: row.brand || "", price: row.price, stockQuantity: row.stockQuantity }); setItemModal(true); }}><FiEdit /></button>
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
              <Button onClick={() => { setEditing(null); setForm({ name: "", description: "", category: "", subCategory: "", brand: "", price: "", stockQuantity: "" }); setItemModal(true); }}><FiPlus /> Add Item</Button>
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
          <div style={modalGridStyle}>
            <div className="form-group">
              <label>Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter item name" style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px" }} />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Enter brand name" style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px" }} />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, subCategory: "" })} style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px" }}>
                <option value="">Select Category</option>
                {topLevelCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Sub Category</label>
              <select value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} disabled={!form.category} style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px" }}>
                <option value="">Select Sub Category (optional)</option>
                {subCategoriesForSelected.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Price (₹) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px" }} />
            </div>
            <div className="form-group">
              <label>Stock Quantity</label>
              <input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} placeholder="0" style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px" }} />
            </div>
            <div className="form-group" style={fullWidthStyle}>
              <label>Description</label>
              <textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add a short cosmetic item description" style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px", fontFamily: "inherit", resize: "vertical" }} />
            </div>
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
