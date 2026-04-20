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

const SubCategories = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [subCategories, setSubCategories] = useState([]);
  const [parentCategories, setParentCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", parentCategory: "", image: null });

  const fetchData = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/categories`);
      const tops = data.filter((c) => !c.parentCategory);
      const subs = data.filter((c) => c.parentCategory);
      setParentCategories(tops);
      setSubCategories(subs);
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error("Name is required"); return; }
    if (!formData.parentCategory) { toast.error("Parent category is required"); return; }
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('parentCategory', formData.parentCategory);
      if (formData.image) {
        data.append('image', formData.image);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editItem) {
        await axios.put(`${backendUrl}/api/categories/${editItem._id}`, data, config);
        toast.success("Sub category updated");
      } else {
        await axios.post(`${backendUrl}/api/categories`, data, config);
        toast.success("Sub category created");
      }
      setModalOpen(false);
      setEditItem(null);
      setFormData({ name: "", parentCategory: "", image: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleEdit = (cat) => {
    setEditItem(cat);
    setFormData({
      name: cat.name,
      parentCategory: cat.parentCategory?._id || cat.parentCategory || "",
      image: null,
    });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditItem(null);
    setFormData({ name: "", parentCategory: "", image: null });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this sub category?")) return;
    try {
      await axios.delete(`${backendUrl}/api/categories/${id}`);
      toast.success("Deleted");
      fetchData();
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
    { key: "name", label: "Sub Category Name" },
    { key: "parentCategory", label: "Parent Category", render: (row) => row.parentCategory?.name || "-" },
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
          <div>
            <h1>Sub Categories</h1>
            <p>Manage sub categories under each parent category</p>
          </div>
          <Button onClick={openCreate}>
            <FiPlus /> Add Sub Category
          </Button>
        </div>

        {loading ? <Loading /> : <Table columns={columns} data={subCategories} emptyMessage="No sub categories found" />}

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit Sub Category" : "Add Sub Category"}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Parent Category *</label>
              <select
                value={formData.parentCategory}
                onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                required
              >
                <option value="">Select Parent Category</option>
                {parentCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Sub Category Name *</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter sub category name"
              />
            </div>
            <div className="form-group">
              <label>Sub Category Image</label>
              <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })} />
            </div>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit">{editItem ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default SubCategories;
