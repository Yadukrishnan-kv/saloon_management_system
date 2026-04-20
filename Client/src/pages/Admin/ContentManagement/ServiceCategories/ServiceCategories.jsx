import React, { useState, useEffect, useCallback } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import Table from "../../../../components/common/Table/Table";
import Button from "../../../../components/common/Button/Button";
import Modal from "../../../../components/common/Modal/Modal";
import Loading from "../../../../components/common/Loading/Loading";
import axios from "axios";
import "../../UserManagement/UserList/UserList.css";

const ServiceCategories = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP || "http://localhost:5000";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", image: null });

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/categories`);
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
      const data = new FormData();
      data.append('name', formData.name);
      if (formData.image) {
        data.append('image', formData.image);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editCategory) {
        await axios.put(`${backendUrl}/api/categories/${editCategory._id}`, data, config);
        toast.success("Category updated");
      } else {
        await axios.post(`${backendUrl}/api/categories`, data, config);
        toast.success("Category created");
      }
      setModalOpen(false);
      setEditCategory(null);
      setFormData({ name: "", image: null });
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleEdit = (cat) => {
    setEditCategory(cat);
    setFormData({
      name: cat.name,
      image: null,
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setEditCategory(null);
    setFormData({ name: "", image: null });
    setModalOpen(true);
  };



  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await axios.delete(`${backendUrl}/api/categories/${id}`);
      toast.success("Deleted");
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const columns = [
    { 
      key: "image", 
      label: "Image", 
      render: (row) => row.image ? <img src={row.image} alt={row.name} style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover" }} /> : <span style={{ color: "#bdc3c7" }}>No image</span>
    },
    { key: "name", label: "Category Name" },
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
          <div><h1>Service Categories</h1><p>Manage top-level service categories</p></div>
          <Button onClick={resetForm}>
            <FiPlus /> Add Category
          </Button>
        </div>
        {loading ? <Loading /> : <Table columns={columns} data={categories} emptyMessage="No categories" />}

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editCategory ? "Edit Category" : "Add Category"}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Category Name *</label>
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter category name" />
            </div>
            <div className="form-group">
              <label>Category Image</label>
              <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })} />
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
