import React, { useState, useEffect, useCallback } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import Table from "../../../../components/common/Table/Table";
import Button from "../../../../components/common/Button/Button";
import Modal from "../../../../components/common/Modal/Modal";
import Loading from "../../../../components/common/Loading/Loading";
import api from "../../../../utils/api";
import { formatCurrency } from "../../../../utils/helpers";
import "../../UserManagement/UserList/UserList.css";

const PricingConfig = () => {
  const modalGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
    alignItems: "start",
  };
  const fullWidthStyle = { gridColumn: "1 / -1" };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editService, setEditService] = useState(null);
  const [formData, setFormData] = useState({
    name: "", description: "", category: "", subCategory: "", price: "", pricingType: "Fixed", duration: "", discount: 0,
  });

  // Derived: top-level categories and sub-categories filtered by selected category
  const topLevelCategories = categories.filter((c) => !c.parentCategory);
  const subCategoriesForSelected = categories.filter(
    (c) => c.parentCategory && (c.parentCategory._id || c.parentCategory) === formData.category
  );

  const fetchData = useCallback(async () => {
    try {
      const [servRes, catRes] = await Promise.all([
        api.get("/api/services"),
        api.get("/api/categories"),
      ]);
      setServices(servRes.data);
      setCategories(catRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.price || !formData.duration) {
      toast.error("Fill all required fields");
      return;
    }
    try {
      if (editService) {
        await api.put(`/api/services/${editService._id}`, formData);
        toast.success("Service updated");
      } else {
        await api.post("/api/services", formData);
        toast.success("Service created");
      }
      setModalOpen(false);
      setEditService(null);
      setFormData({ name: "", description: "", category: "", subCategory: "", price: "", pricingType: "Fixed", duration: "", discount: 0 });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleEdit = (svc) => {
    setEditService(svc);
    setFormData({
      name: svc.name, description: svc.description || "",
      category: svc.category?._id || svc.category,
      subCategory: svc.subCategory?._id || svc.subCategory || "",
      price: svc.price, pricingType: svc.pricingType, duration: svc.duration, discount: svc.discount || 0,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try {
      await api.delete(`/api/services/${id}`);
      toast.success("Deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed");
    }
  };

  const columns = [
    { key: "name", label: "Service Name" },
    { key: "category", label: "Category", render: (row) => row.category?.name || "-" },
    { key: "price", label: "Price", render: (row) => formatCurrency(row.price) },
    { key: "pricingType", label: "Type" },
    { key: "duration", label: "Duration", render: (row) => `${row.duration} mins` },
    { key: "discount", label: "Discount", render: (row) => `${row.discount || 0}%` },
    {
      key: "actions", label: "Actions",
      render: (row) => (
        <div className="table-actions">
          <button className="action-btn edit" onClick={() => handleEdit(row)}><FiEdit2 /></button>
          <button className="action-btn danger" onClick={() => handleDelete(row._id)}><FiTrash2 /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header">
          <div><h1>Services & Pricing</h1><p>Manage services and pricing</p></div>
          <Button onClick={() => { setEditService(null); setFormData({ name: "", description: "", category: "", subCategory: "", price: "", pricingType: "Fixed", duration: "", discount: 0 }); setModalOpen(true); }}>
            <FiPlus /> Add Service
          </Button>
        </div>
        <div style={{ background: "#f8fcf9", border: "1px solid #dbeee0", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", color: "#315c45" }}>
          This page implements pricing model configuration. Admins can define fixed, hourly, or package pricing, set durations, and apply service-level discounts.
        </div>
        {loading ? <Loading /> : <Table columns={columns} data={services} emptyMessage="No services" />}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editService ? "Edit Service" : "Add Service"} size="large">
          <form onSubmit={handleSubmit}>
            <div style={modalGridStyle}>
              <div className="form-group">
                <label>Service Name</label>
                <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter service name" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: "" })}>
                  <option value="">Select Category</option>
                  {topLevelCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Sub Category</label>
                <select value={formData.subCategory} onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })} disabled={!formData.category}>
                  <option value="">Select Sub Category (optional)</option>
                  {subCategoriesForSelected.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Pricing Type</label>
                <select value={formData.pricingType} onChange={(e) => setFormData({ ...formData, pricingType: e.target.value })}>
                  <option value="Fixed">Fixed</option>
                  <option value="Hourly">Hourly</option>
                  <option value="Package">Package</option>
                </select>
              </div>
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Duration (mins)</label>
                <input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="60" />
              </div>
              <div className="form-group">
                <label>Discount (%)</label>
                <input type="number" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} min="0" max="100" placeholder="0" />
              </div>
              <div className="form-group" style={fullWidthStyle}>
                <label>Description</label>
                <textarea rows="4" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Add a short service description" style={{ resize: "vertical" }} />
              </div>
            </div>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit">{editService ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default PricingConfig;
