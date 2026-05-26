import React, { useState, useEffect, useCallback } from "react";
import { FiEdit, FiTrash2, FiPlus, FiPackage, FiX } from "react-icons/fi";
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
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    brand: "",
    price: "",
    stockQuantity: "",
    size: "",
    type: "",
    services: [],
    cosmeticImage: null,
    cosmeticImagePreview: null,
  });

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

  const fetchServices = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/services`);
      setServices(data || []);
    } catch (error) {
      console.error("Failed to load services");
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

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({
        ...form,
        cosmeticImage: file,
        cosmeticImagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleServiceToggle = (serviceId) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((id) => id !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const handleSaveItem = async () => {
    try {
      if (!form.name || !form.price) {
        return toast.error("Name and price are required");
      }

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("brand", form.brand);
      formData.append("price", form.price);
      formData.append("stockQuantity", form.stockQuantity || 0);
      formData.append("size", form.size);
      formData.append("type", form.type);
      formData.append("services", JSON.stringify(form.services));
      if (form.cosmeticImage) {
        formData.append("image", form.cosmeticImage);
      }

      if (editing) {
        await axios.put(`${backendUrl}/api/admin/cosmetics/items/${editing._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Item updated");
      } else {
        await axios.post(`${backendUrl}/api/admin/cosmetics/items`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Item created");
      }
      setItemModal(false);
      setEditing(null);
      setForm({
        name: "",
        description: "",
        brand: "",
        price: "",
        stockQuantity: "",
        size: "",
        type: "",
        services: [],
        cosmeticImage: null,
        cosmeticImagePreview: null,
      });
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save item");
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
    { key: "brand", label: "Brand", render: (row) => row.brand || "-" },
    { key: "price", label: "Price", render: (row) => `₹${row.price}` },
    { key: "type", label: "Type", render: (row) => row.type || "-" },
    { key: "size", label: "Size", render: (row) => row.size || "-" },
    { key: "stockQuantity", label: "Stock" },
    {
      key: "inStock",
      label: "In Stock",
      render: (row) => (
        <span style={{ color: row.inStock ? "#27ae60" : "#e74c3c", fontWeight: 600 }}>
          {row.inStock ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "services",
      label: "Services",
      render: (row) => (
        <span style={{ fontSize: "12px", color: "#7f8c8d" }}>
          {row.services?.length || 0} service(s)
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            className="action-btn edit"
            onClick={() => {
              setEditing(row);
              setForm({
                name: row.name,
                description: row.description || "",
                brand: row.brand || "",
                price: row.price,
                stockQuantity: row.stockQuantity,
                size: row.size || "",
                type: row.type || "",
                services: row.services?.map((s) => (typeof s === "string" ? s : s._id)) || [],
                cosmeticImage: null,
                cosmeticImagePreview: row.cosmeticImage || null,
              });
              setItemModal(true);
            }}
          >
            <FiEdit />
          </button>
          <button
            className="action-btn"
            onClick={() => handleDeleteItem(row._id)}
            style={{ color: "#e74c3c" }}
          >
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  const orderColumns = [
    { key: "beautician", label: "Beautician", render: (row) => row.beautician?.fullName || "-" },
    { key: "items", label: "Items", render: (row) => `${row.items?.length || 0} item(s)` },
    { key: "totalAmount", label: "Total", render: (row) => `₹${row.totalAmount}` },
      {
        key: "qrCode",
        label: "QR Code",
        render: (row) => (
          row.qrCode ? (
            <img src={row.qrCode} alt="QR Code" className="w-16 h-16" style={{ width: 64, height: 64, objectFit: "contain", border: "1px solid #eee", borderRadius: 8, background: "#fff" }} />
          ) : (
            <span className="text-gray-500">N/A</span>
          )
        ),
      },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const colors = {
          Pending: "#f39c12",
          Confirmed: "#3498db",
          Shipped: "#9b59b6",
          Delivered: "#27ae60",
          Cancelled: "#e74c3c",
        };
        return (
          <span
            style={{
              padding: "3px 10px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 600,
              background: `${colors[row.status]}20`,
              color: colors[row.status],
            }}
          >
            {row.status}
          </span>
        );
      },
    },
    { key: "createdAt", label: "Date", render: (row) => formatDateTime(row.createdAt) },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button
          className="action-btn edit"
          onClick={() => {
            setSelectedOrder(row);
            setOrderModal(true);
          }}
        >
          <FiPackage />
        </button>
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
            <Button
              variant={activeTab === "items" ? "primary" : "secondary"}
              onClick={() => setActiveTab("items")}
            >
              Items
            </Button>
            <Button
              variant={activeTab === "orders" ? "primary" : "secondary"}
              onClick={() => setActiveTab("orders")}
            >
              Orders
            </Button>
            {activeTab === "items" && (
              <Button
                onClick={() => {
                  setEditing(null);
                  setForm({
                    name: "",
                    description: "",
                    brand: "",
                    price: "",
                    stockQuantity: "",
                    size: "",
                    type: "",
                    services: [],
                    cosmeticImage: null,
                    cosmeticImagePreview: null,
                  });
                  setItemModal(true);
                }}
              >
                <FiPlus /> Add Item
              </Button>
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
        <Modal
          isOpen={itemModal}
          onClose={() => setItemModal(false)}
          title={editing ? "Edit Item" : "Add Cosmetic Item"}
        >
          <div style={modalGridStyle}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter item name"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1.5px solid #dfe6e9",
                  borderRadius: "8px",
                }}
              />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Enter brand name"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1.5px solid #dfe6e9",
                  borderRadius: "8px",
                }}
              />
            </div>
            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1.5px solid #dfe6e9",
                  borderRadius: "8px",
                }}
              />
            </div>
            <div className="form-group">
              <label>Stock Quantity</label>
              <input
                type="number"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                placeholder="0"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1.5px solid #dfe6e9",
                  borderRadius: "8px",
                }}
              />
            </div>
            <div className="form-group">
              <label>Size</label>
              <input
                type="text"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                placeholder="e.g., Small, Medium, Large, 100ml, 250ml"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1.5px solid #dfe6e9",
                  borderRadius: "8px",
                }}
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <input
                type="text"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                placeholder="e.g., Cream, Lotion, Serum, Oil, Powder"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1.5px solid #dfe6e9",
                  borderRadius: "8px",
                }}
              />
            </div>

            {/* Image Upload */}
            <div className="form-group" style={fullWidthStyle}>
              <label>Cosmetic Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1.5px solid #dfe6e9",
                  borderRadius: "8px",
                }}
              />
              {form.cosmeticImagePreview && (
                <div
                  style={{
                    marginTop: "10px",
                    position: "relative",
                    display: "inline-block",
                  }}
                >
                  <img
                    src={form.cosmeticImagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: "150px",
                      maxHeight: "150px",
                      borderRadius: "8px",
                      border: "1px solid #dfe6e9",
                    }}
                  />
                  <button
                    onClick={() =>
                      setForm({
                        ...form,
                        cosmeticImage: null,
                        cosmeticImagePreview: null,
                      })
                    }
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      background: "#e74c3c",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FiX size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Services Multi-Select */}
            <div className="form-group" style={fullWidthStyle}>
              <label style={{ fontWeight: 600, marginBottom: "10px", display: "block", color: "#2c3e50" }}>
                Related Services
              </label>
              <div
                style={{
                  border: "1.5px solid #dfe6e9",
                  borderRadius: "8px",
                  padding: "12px",
                  maxHeight: "250px",
                  overflowY: "auto",
                  backgroundColor: "#ffffff",
                }}
              >
                {services.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {services.map((service) => (
                      <div
                        key={service._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "10px 12px",
                          borderRadius: "6px",
                          backgroundColor: form.services.includes(service._id)
                            ? "#e3f2fd"
                            : "#f8f9fa",
                          border: form.services.includes(service._id)
                            ? "1px solid #3498db"
                            : "1px solid transparent",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          if (!form.services.includes(service._id)) {
                            e.currentTarget.style.backgroundColor = "#f0f0f0";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!form.services.includes(service._id)) {
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`service-${service._id}`}
                          checked={form.services.includes(service._id)}
                          onChange={() => handleServiceToggle(service._id)}
                          style={{
                            width: "18px",
                            height: "18px",
                            cursor: "pointer",
                            marginRight: "12px",
                            accentColor: "#3498db",
                            flexShrink: 0,
                          }}
                        />
                        <label
                          htmlFor={`service-${service._id}`}
                          style={{
                            cursor: "pointer",
                            margin: 0,
                            fontSize: "14px",
                            fontWeight: form.services.includes(service._id) ? 600 : 500,
                            color: form.services.includes(service._id) ? "#2c3e50" : "#34495e",
                            userSelect: "none",
                            flex: 1,
                          }}
                        >
                          {service.name}
                        </label>
                        {form.services.includes(service._id) && (
                          <span style={{ fontSize: "12px", color: "#3498db", fontWeight: 600 }}>
                            ✓
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "30px 12px",
                      color: "#95a5a6",
                      fontSize: "14px",
                    }}
                  >
                    No services available
                  </div>
                )}
              </div>
              {services.length > 0 && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#7f8c8d",
                    marginTop: "6px",
                    margin: "6px 0 0 0",
                  }}
                >
                  {form.services.length > 0
                    ? `${form.services.length} service(s) selected`
                    : "Select services (optional)"}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="form-group" style={fullWidthStyle}>
              <label>Description</label>
              <textarea
                rows="4"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Add a short cosmetic item description"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1.5px solid #dfe6e9",
                  borderRadius: "8px",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>
          </div>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setItemModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem}>{editing ? "Update" : "Create"}</Button>
          </div>
        </Modal>

        {/* Order Status Modal */}
        <Modal isOpen={orderModal} onClose={() => setOrderModal(false)} title="Manage Order">
          {selectedOrder && (
            <>
              <p>
                <strong>Beautician:</strong> {selectedOrder.beautician?.fullName}
              </p>
              <p>
                <strong>Total:</strong> ₹{selectedOrder.totalAmount}
              </p>
              <p>
                <strong>Items:</strong>
              </p>
              <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                {selectedOrder.items?.map((item, i) => (
                  <li key={i}>
                    {item.name || item.item?.name} × {item.quantity} — ₹{item.price * item.quantity}
                  </li>
                ))}
              </ul>
              <p>
                <strong>Current Status:</strong> {selectedOrder.status}
              </p>
              <div className="form-actions" style={{ flexWrap: "wrap" }}>
                <Button variant="secondary" onClick={() => setOrderModal(false)}>
                  Close
                </Button>
                {selectedOrder.status === "Pending" && (
                  <Button onClick={() => handleUpdateOrderStatus("Confirmed")}>Confirm</Button>
                )}
                {selectedOrder.status === "Confirmed" && (
                  <Button onClick={() => handleUpdateOrderStatus("Shipped")}>Mark Shipped</Button>
                )}
                {selectedOrder.status === "Shipped" && (
                  <Button onClick={() => handleUpdateOrderStatus("Delivered")}>
                    Mark Delivered
                  </Button>
                )}
                {!["Delivered", "Cancelled"].includes(selectedOrder.status) && (
                  <Button onClick={() => handleUpdateOrderStatus("Cancelled")} style={{ background: "#e74c3c" }}>
                    Cancel Order
                  </Button>
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
