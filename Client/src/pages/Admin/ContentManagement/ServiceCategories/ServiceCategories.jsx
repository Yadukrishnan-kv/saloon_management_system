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
import "../../UserManagement/UserList/UserList.css";

const ServiceCategories = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", sortOrder: 0 });

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get("/api/categories");
      setCategories(data);
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error("Name is required"); return; }
    try {
      if (editCategory) {
        await api.put(`/api/categories/${editCategory._id}`, formData);
        toast.success("Category updated");
      } else {
        await api.post("/api/categories", formData);
        toast.success("Category created");
      }
      setModalOpen(false);
      setEditCategory(null);
      setFormData({ name: "", description: "", sortOrder: 0 });
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleEdit = (cat) => {
    setEditCategory(cat);
    setFormData({ name: cat.name, description: cat.description || "", sortOrder: cat.sortOrder || 0 });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await api.delete(`/api/categories/${id}`);
      toast.success("Deleted");
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
    { key: "isActive", label: "Active", render: (row) => row.isActive ? "Yes" : "No" },
    { key: "sortOrder", label: "Order" },
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
          <div><h1>Service Categories</h1><p>Manage service categories</p></div>
          <Button onClick={() => { setEditCategory(null); setFormData({ name: "", description: "", sortOrder: 0 }); setModalOpen(true); }}>
            <FiPlus /> Add Category
          </Button>
        </div>
        {loading ? <Loading /> : <Table columns={columns} data={categories} emptyMessage="No categories" />}

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editCategory ? "Edit Category" : "Add Category"}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Category Name</label>
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Sort Order</label>
              <input type="number" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit">{editCategory ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default ServiceCategories;
