import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CuratedServices.css';
import Header from '../../../../components/layout/Header/Header';
import Sidebar from '../../../../components/layout/Sidebar/Sidebar';
import Modal from '../../../../components/common/Modal/Modal';
import Button from '../../../../components/common/Button/Button';
import Loading from '../../../../components/common/Loading/Loading';

const CuratedServices = () => {
  const [curatedServices, setCuratedServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
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
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editService, setEditService] = useState(null);

  useEffect(() => {
    fetchCuratedServices();
    fetchCategories();
  }, []);

  const fetchCuratedServices = async () => {
    const res = await axios.get('/api/curated-services');
    setCuratedServices(res.data.curatedServices || []);
  };

  const fetchCategories = async () => {
    const res = await axios.get('/api/categories');
    setCategories(res.data || []);
  };

  const fetchSubCategories = async (categoryId) => {
    const res = await axios.get('/api/subcategories?category=' + categoryId);
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
    await axios.post('/api/curated-services', data);
    setLoading(false);
    setShowForm(false);
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
    setForm({
      curatedServiceName: service.curatedServiceName,
      curatedServiceTitle: service.curatedServiceTitle,
      category: service.category?._id || '',
      subCategory: service.subCategory?._id || '',
      description: service.description,
      pricingType: service.pricingType,
      price: service.price,
      duration: service.duration,
      discount: service.discount,
      image1: null,
      image2: null,
    });
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
      await axios.delete(`/api/curated-services/${id}`);
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
          <table className="curated-services-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Category</th>
                <th>Sub Category</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Discount</th>
                <th>Image 1</th>
                <th>Image 2</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {curatedServices.map((cs) => (
                <tr key={cs._id}>
                  <td>{cs.curatedServiceName}</td>
                  <td>{cs.curatedServiceTitle}</td>
                  <td>{cs.category?.name}</td>
                  <td>{cs.subCategory?.name}</td>
                  <td>{cs.price}</td>
                  <td>{cs.duration}</td>
                  <td>{cs.discount}</td>
                  <td>{cs.image1 && <img src={`/${cs.image1}`} alt="img1" width={40} />}</td>
                  <td>{cs.image2 && <img src={`/${cs.image2}`} alt="img2" width={40} />}</td>
                  <td>
                    <Button variant="secondary" onClick={() => handleEdit(cs)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(cs._id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editService ? "Edit Curated Service" : "Add Curated Service"}>
          <form className="curated-service-form" onSubmit={handleSubmit}>
            <input name="curatedServiceName" value={form.curatedServiceName} onChange={handleChange} placeholder="Curated Service Name" required />
            <input name="curatedServiceTitle" value={form.curatedServiceTitle} onChange={handleChange} placeholder="Curated Service Title" required />
            <select name="category" value={form.category} onChange={handleCategoryChange} required>
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <select name="subCategory" value={form.subCategory} onChange={handleChange} required>
              <option value="">Select Sub Category</option>
              {subCategories.map((sub) => (
                <option key={sub._id} value={sub._id}>{sub.name}</option>
              ))}
            </select>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" />
            <select name="pricingType" value={form.pricingType} onChange={handleChange} required>
              <option value="Fixed">Fixed</option>
              <option value="Hourly">Hourly</option>
              <option value="Package">Package</option>
            </select>
            <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} placeholder="Price (₹)" required />
            <input name="duration" type="number" min="1" value={form.duration} onChange={handleChange} placeholder="Duration (mins)" required />
            <input name="discount" type="number" min="0" max="100" value={form.discount} onChange={handleChange} placeholder="Discount (%)" />
            <label>Image 1: <input name="image1" type="file" accept="image/*" onChange={handleChange} /></label>
            <label>Image 2: <input name="image2" type="file" accept="image/*" onChange={handleChange} /></label>
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
