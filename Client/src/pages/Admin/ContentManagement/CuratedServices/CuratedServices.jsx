import React, { useEffect, useState } from 'react';
import axios from 'axios';

const backendUrl = process.env.REACT_APP_BACKEND_IP || "http://localhost:5000";
import './CuratedServices.css';
import Table from '../../../../components/common/Table/Table';

const modalGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
  alignItems: "start",
};
const fullWidthStyle = { gridColumn: "1 / -1" };
import Header from '../../../../components/layout/Header/Header';
import Sidebar from '../../../../components/layout/Sidebar/Sidebar';
import Modal from '../../../../components/common/Modal/Modal';
import Button from '../../../../components/common/Button/Button';
import Loading from '../../../../components/common/Loading/Loading';

const CuratedServices = () => {
  const [curatedServices, setCuratedServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [beauticians, setBeauticians] = useState([]);
    const [form, setForm] = useState({
      curatedServiceName: '',
      curatedServiceTitle: '',
      category: '',
      subCategory: '',
      beautician: '',
      description: '',
      pricingType: 'Fixed',
      price: '',
      duration: '',
      discount: '',
      image1: null,
      image2: null,
    });
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editService, setEditService] = useState(null);

  useEffect(() => {
    fetchCuratedServices();
    fetchCategories();
      fetchBeauticians();
    }, []);

    const fetchBeauticians = async () => {
      const res = await axios.get(`${backendUrl}/api/beauticians`);
      setBeauticians(res.data.beauticians || res.data);
    };

  const fetchCuratedServices = async () => {
    const res = await axios.get(`${backendUrl}/api/curated-services`);
    setCuratedServices(res.data.curatedServices || []);
  };

  const fetchCategories = async () => {
    const res = await axios.get(`${backendUrl}/api/categories`);
    setCategories(res.data || []);
  };

  const fetchSubCategories = async (categoryId) => {
    const res = await axios.get(`${backendUrl}/api/subcategories?category=${categoryId}`);
    setSubCategories(res.data || []);
  };

  const handleCategoryChange = (e) => {
    setForm({ ...form, category: e.target.value, subCategory: '' });
    fetchSubCategories(e.target.value);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm({ ...form, [name]: files });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key]) {
          if (key === 'image1' || key === 'image2') {
            if (form[key][0]) data.append(key, form[key][0]);
          } else {
            data.append(key, form[key]);
          }
        }
      });
    await axios.post(`${backendUrl}/api/curated-services`, data);
    setLoading(false);
    setShowForm(false);
    setModalOpen(false);
    setEditService(null);
    setForm({
      curatedServiceName: '',
      curatedServiceTitle: '',
      category: '',
      subCategory: '',
      description: '',
      pricingType: 'Fixed',
      price: '',
      duration: '',
      discount: '',
      image1: null,
      image2: null,
    });
    fetchCuratedServices();
  };

  const resetForm = () => {
    setEditService(null);
    setForm({
      curatedServiceName: '',
      curatedServiceTitle: '',
      category: '',
      subCategory: '',
      description: '',
      pricingType: 'Fixed',
      price: '',
      duration: '',
      discount: '',
      image1: null,
      image2: null,
    });
    setModalOpen(true);
  };

  const handleEdit = (service) => {
    setEditService(service);
    const categoryId = service.category?._id || '';
      setForm({
        curatedServiceName: service.curatedServiceName,
        curatedServiceTitle: service.curatedServiceTitle,
        category: categoryId,
        subCategory: service.subCategory?._id || '',
        beautician: service.beautician?._id || service.beautician || '',
        description: service.description,
        pricingType: service.pricingType,
        price: service.price,
        duration: service.duration,
        discount: service.discount,
        image1: null,
        image2: null,
      });
    if (categoryId) {
      fetchSubCategories(categoryId);
    } else {
      setSubCategories([]);
    }
    setModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditService(null);
    setShowForm(false);
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this curated service?')) return;
    try {
      await axios.delete(`${backendUrl}/api/curated-services/${id}`);
      fetchCuratedServices();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header">
          <div>
            <h1>Curated Services</h1>
            <p>Manage curated services</p>
          </div>
          <Button onClick={resetForm}>+ Add Curated Service</Button>
        </div>
        {loading ? <Loading /> : (
          <div style={{width:'100%',overflowX:'auto'}}>
            <div style={{maxHeight:'400px',overflowY:'auto',minWidth:'900px'}}>
              <Table
                columns={[
                  { key: "curatedServiceName", label: "Name" },
                  { key: "curatedServiceTitle", label: "Title" },
                  { key: "category", label: "Category", render: (row) => row.category?.name || "-" },
                  { key: "subCategory", label: "Sub Category", render: (row) => row.subCategory?.name || "-" },
                  {
                    key: "beautician",
                    label: "Beautician",
                    render: (row) => row.beautician ? `${row.beautician.fullName || "-"} (${row.beautician.phoneNumber || "-"})` : "-"
                  },
                  { key: "price", label: "Price" },
                  { key: "duration", label: "Duration" },
                  { key: "discount", label: "Discount" },
                  { key: "image1", label: "Image 1", render: (row) => row.image1 ? <img src={`${backendUrl}/uploads/${row.image1.split(/[\\/]/).pop()}`} alt="img1" width={40} /> : null },
                  { key: "image2", label: "Image 2", render: (row) => row.image2 ? <img src={`${backendUrl}/uploads/${row.image2.split(/[\\/]/).pop()}`} alt="img2" width={40} /> : null },
                  {
                    key: "actions", label: "Actions", render: (row) => (
                      <div className="table-actions">
                        <button className="action-btn edit" onClick={() => handleEdit(row)}>Edit</button>
                        <button className="action-btn danger" onClick={() => handleDelete(row._id)}>Delete</button>
                      </div>
                    )
                  },
                ]}
                data={curatedServices}
                emptyMessage="No curated services"
              />
            </div>
          </div>
        )}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editService ? "Edit Curated Service" : "Add Curated Service"} size="large">
          <form onSubmit={handleSubmit}>
            <div style={modalGridStyle}>
              <div className="form-group">
                <label>Curated Service Name</label>
                <input name="curatedServiceName" value={form.curatedServiceName} onChange={handleChange} placeholder="Curated Service Name" required />
              </div>
              <div className="form-group">
                <label>Curated Service Title</label>
                <input name="curatedServiceTitle" value={form.curatedServiceTitle} onChange={handleChange} placeholder="Curated Service Title" required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select name="category" value={form.category} onChange={handleCategoryChange} required>
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Sub Category</label>
                <select
                  name="subCategory"
                  value={form.subCategory}
                  onChange={handleChange}
                  required
                  disabled={!form.category}
                >
                  <option value="">Select Sub Category</option>
                  {subCategories.map((sub) => (
                    <option key={sub._id} value={sub._id}>{sub.name}</option>
                  ))}
                </select>
              </div>
                <div className="form-group">
                  <label>Beautician</label>
                  <select name="beautician" value={form.beautician} onChange={handleChange} required>
                    <option value="">Select Beautician</option>
                    {beauticians.map((b) => (
                      <option key={b._id} value={b._id}>{b.fullName} ({b.phoneNumber})</option>
                    ))}
                  </select>
                </div>
              <div className="form-group">
                <label>Pricing Type</label>
                <select name="pricingType" value={form.pricingType} onChange={handleChange} required>
                  <option value="Fixed">Fixed</option>
                  <option value="Hourly">Hourly</option>
                  <option value="Package">Package</option>
                </select>
              </div>
              <div className="form-group">
                <label>Price (₹)</label>
                <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} placeholder="Price (₹)" required />
              </div>
              <div className="form-group">
                <label>Duration (mins)</label>
                <input name="duration" type="number" min="1" value={form.duration} onChange={handleChange} placeholder="Duration (mins)" required />
              </div>
              <div className="form-group">
                <label>Discount (%)</label>
                <input name="discount" type="number" min="0" max="100" value={form.discount} onChange={handleChange} placeholder="Discount (%)" />
              </div>
              <div className="form-group" style={fullWidthStyle}>
                <label>Image 1</label>
                <input name="image1" type="file" accept="image/*" onChange={handleChange} />
              </div>
              <div className="form-group" style={fullWidthStyle}>
                <label>Image 2</label>
                <input name="image2" type="file" accept="image/*" onChange={handleChange} />
              </div>
              <div className="form-group" style={fullWidthStyle}>
                <label>Description</label>
                <textarea name="description" rows="4" value={form.description} onChange={handleChange} placeholder="Description" style={{ resize: "vertical" }} />
              </div>
            </div>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : (editService ? 'Update' : 'Create')}</Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default CuratedServices;
