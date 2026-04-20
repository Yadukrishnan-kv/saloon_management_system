import React, { useState, useEffect, useCallback } from "react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import Table from "../../../../components/common/Table/Table";
import Button from "../../../../components/common/Button/Button";
import Modal from "../../../../components/common/Modal/Modal";
import Loading from "../../../../components/common/Loading/Loading";
import axios from "axios";
import "../../UserManagement/UserList/UserList.css";

const PromotionalBanners = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [banners, setBanners] = useState([]);
  const [staticPages, setStaticPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [formData, setFormData] = useState({ title: "", description: "", image: null, isActive: true });
  const [contentForm, setContentForm] = useState({ key: "", title: "", content: "" });

  const fetchData = useCallback(async () => {
    try {
      const [bannerRes, staticContentRes] = await Promise.all([
        axios.get(`${backendUrl}/api/banners`),
        axios.get(`${backendUrl}/api/static-content`),
      ]);
      setBanners(bannerRes.data);
      setStaticPages(staticContentRes.data);
    } catch (error) {
      toast.error("Failed to load content settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error("Title is required"); return; }
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'image' && formData[key]) {
          data.append(key, formData[key]);
        } else if (key !== 'image') {
          data.append(key, formData[key]);
        }
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      await axios.post(`${backendUrl}/api/banners`, data, config);
      toast.success("Banner created");
      setModalOpen(false);
      setFormData({ title: "", description: "", image: null, isActive: true });
      fetchData();
    } catch (err) {
      toast.error("Failed");
    }
  };

  const handleOpenContentEditor = (page) => {
    setEditingPage(page);
    setContentForm({ key: page.key, title: page.title, content: page.content || "" });
    setContentModalOpen(true);
  };

  const handleContentSave = async (e) => {
    e.preventDefault();
    if (!contentForm.key || !contentForm.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      await axios.put(`${backendUrl}/api/static-content`, contentForm);
      toast.success("Static content updated");
      setContentModalOpen(false);
      setEditingPage(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update content");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await axios.delete(`${backendUrl}/api/banners/${id}`);
      toast.success("Deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed");
    }
  };

  const bannerColumns = [
    { 
      key: "image", 
      label: "Image", 
      render: (row) => row.image ? <img src={row.image} alt={row.title} style={{ width: "80px", height: "60px", borderRadius: "8px", objectFit: "cover" }} /> : <span style={{ color: "#bdc3c7" }}>No image</span>
    },
    { key: "title", label: "Title" },
    { key: "description", label: "Description", render: (row) => row.description ? row.description.substring(0, 50) + "..." : "-" },
    { key: "isActive", label: "Active", render: (row) => row.isActive ? "Yes" : "No" },
    {
      key: "actions", label: "Actions",
      render: (row) => (
        <div className="table-actions">
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
          <div><h1>Promotional Banners</h1><p>Manage promotional content</p></div>
          <Button onClick={() => setModalOpen(true)}><FiPlus /> Add Banner</Button>
        </div>
        <div style={{ background: "#fffaf2", border: "1px solid #f3e2b5", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", color: "#7a5a12" }}>
          This screen covers promotional banners and the static content/policies requirement. Use the banner section for campaign placements and the policy cards below for pages like Privacy Policy, Terms, and Cancellation Policy.
        </div>
        {loading ? <Loading /> : (
          <>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ margin: "0 0 12px", fontSize: "18px", color: "#2d3436" }}>Banners</h2>
              <Table columns={bannerColumns} data={banners} emptyMessage="No banners yet" />
            </div>

            <div>
              <h2 style={{ margin: "0 0 12px", fontSize: "18px", color: "#2d3436" }}>Static Content & Policies</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                {staticPages.map((page) => (
                  <div key={page.key} style={{ background: "#fff", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #eef2f5" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "16px" }}>{page.title}</h3>
                        <p style={{ margin: "4px 0 0", color: "#95a5a6", fontSize: "12px" }}>{page.key}</p>
                      </div>
                      <button className="action-btn edit" onClick={() => handleOpenContentEditor(page)}><FiEdit2 /></button>
                    </div>
                    <p style={{ color: "#636e72", fontSize: "13px", margin: 0, minHeight: "72px", whiteSpace: "pre-wrap" }}>
                      {page.content || "No content added yet."}
                    </p>
                  </div>
                ))}
                {staticPages.length === 0 && <p className="no-data">No static pages configured</p>}
              </div>
            </div>
          </>
        )}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Banner">
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Title</label><input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div className="form-group"><label>Description</label><input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="form-group"><label>Banner Image</label><input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })} /></div>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit">Create Banner</Button>
            </div>
          </form>
        </Modal>
        <Modal isOpen={contentModalOpen} onClose={() => setContentModalOpen(false)} title={editingPage ? `Edit ${editingPage.title}` : "Edit Static Content"} size="large">
          <form onSubmit={handleContentSave}>
            <div className="form-group"><label>Title</label><input value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} /></div>
            <div className="form-group"><label>Content</label><textarea rows="10" value={contentForm.content} onChange={(e) => setContentForm({ ...contentForm, content: e.target.value })} style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px", fontFamily: "inherit" }} /></div>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setContentModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Content</Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default PromotionalBanners;
