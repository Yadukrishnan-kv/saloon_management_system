import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import Loading from "../../../components/common/Loading/Loading";
import api from "../../../utils/api";
import { formatCurrency } from "../../../utils/helpers";
import "./BrowseServices.css";

const BrowseServices = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servRes, catRes] = await Promise.all([
          api.get("/api/services"),
          api.get("/api/categories"),
        ]);
        setServices(servRes.data);
        setCategories(catRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = services.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || (s.category?._id || s.category) === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header"><h1>Browse Services</h1><p>Discover our beauty services</p></div>
        <div className="filters-row">
          <div className="search-box">
            <FiSearch />
            <input placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        {loading ? <Loading /> : (
          <div className="services-grid">
            {filtered.map((s) => (
              <div key={s._id} className="service-card" onClick={() => navigate(`/customer/book?service=${s._id}`)}>
                {s.image && <img src={s.image} alt={s.name} className="service-img" />}
                <div className="service-info">
                  <h3>{s.name}</h3>
                  <p className="service-desc">{s.description}</p>
                  <div className="service-meta">
                    <span className="service-price">
                      {s.discount > 0 && <span className="original-price">{formatCurrency(s.price)}</span>}
                      {formatCurrency(s.price * (1 - (s.discount || 0) / 100))}
                    </span>
                    <span className="service-duration">{s.duration} mins</span>
                  </div>
                  {s.discount > 0 && <span className="discount-tag">{s.discount}% OFF</span>}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="no-data">No services found</p>}
          </div>
        )}
      </main>
    </div>
  );
};

export default BrowseServices;
