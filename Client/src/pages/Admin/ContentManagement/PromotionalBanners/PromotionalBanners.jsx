import React, { useState, useEffect, useCallback } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import Button from "../../../../components/common/Button/Button";
import Modal from "../../../../components/common/Modal/Modal";
import Loading from "../../../../components/common/Loading/Loading";
import api from "../../../../utils/api";
import "../../UserManagement/UserList/UserList.css";

const PromotionalBanners = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", image: "", link: "", isActive: true });

  const fetchBanners = useCallback(async () => {
    try {
      const { data } = await api.get("/api/banners");
      setBanners(data);
    } catch (error) {
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error("Title is required"); return; }
    try {
      await api.post("/api/banners", formData);
      toast.success("Banner created");
      setModalOpen(false);
      setFormData({ title: "", description: "", image: "", link: "", isActive: true });
      fetchBanners();
    } catch (err) {
      toast.error("Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await api.delete(`/api/banners/${id}`);
      toast.success("Deleted");
      fetchBanners();
    } catch (err) {
      toast.error("Failed");
    }
  };

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header">
          <div><h1>Promotional Banners</h1><p>Manage promotional content</p></div>
          <Button onClick={() => setModalOpen(true)}><FiPlus /> Add Banner</Button>
        </div>
        {loading ? <Loading /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {banners.map((b) => (
              <div key={b._id} style={{ background: "#fff", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                {b.image && <img src={b.image} alt={b.title} style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px", marginBottom: "12px" }} />}
                <h3 style={{ margin: "0 0 4px", fontSize: "16px" }}>{b.title}</h3>
                <p style={{ color: "#636e72", fontSize: "13px", margin: "0 0 12px" }}>{b.description}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className={`user-status ${b.isActive ? "active" : "inactive"}`}>{b.isActive ? "Active" : "Inactive"}</span>
                  <button className="action-btn danger" onClick={() => handleDelete(b._id)}><FiTrash2 /></button>
                </div>
              </div>
            ))}
            {banners.length === 0 && <p className="no-data">No banners yet</p>}
          </div>
        )}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Banner">
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Title</label><input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div className="form-group"><label>Description</label><input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="form-group"><label>Image URL</label><input value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} /></div>
            <div className="form-group"><label>Link</label><input value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} /></div>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit">Create Banner</Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default PromotionalBanners;
