import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../../../components/layout/Header/Header";
import Sidebar from "../../../components/layout/Sidebar/Sidebar";
import ServiceList from "../../../components/beautician/ServiceList/ServiceList";
import Button from "../../../components/common/Button/Button";
import Loading from "../../../components/common/Loading/Loading";
import axios from "axios";
import { formatCurrency } from "../../../utils/helpers";
import "./BookService.css";

const BookService = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [address, setAddress] = useState({ street: "", city: "", state: "", pincode: "" });
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/services`);
        setServices(data);
        const preselect = searchParams.get("service");
        if (preselect) setSelectedServices([preselect]);
      } catch (error) {
        toast.error("Failed to load services");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [searchParams]);

  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectedTotal = selectedServices.reduce((sum, id) => {
    const svc = services.find((s) => s._id === id);
    if (!svc) return sum;
    return sum + svc.price * (1 - (svc.discount || 0) / 100);
  }, 0);

  const totalDuration = selectedServices.reduce((sum, id) => {
    const svc = services.find((s) => s._id === id);
    return sum + (svc?.duration || 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedServices.length === 0) { toast.error("Select at least one service"); return; }
    if (!bookingDate) { toast.error("Select a date"); return; }
    if (!startTime || !endTime) { toast.error("Select time slot"); return; }

    setSubmitting(true);
    try {
      await axios.post(`${backendUrl}/api/bookings`, {
        services: selectedServices,
        bookingDate,
        timeSlot: { startTime, endTime },
        address,
        notes,
      });
      toast.success("Booking created successfully!");
      setTimeout(() => navigate("/customer/bookings"), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading text="Loading services..." />;

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header"><h1>Book a Service</h1><p>Select services and schedule your appointment</p></div>
        <div className="booking-layout">
          <div className="booking-services">
            <h2>Select Services</h2>
            <ServiceList
              services={services}
              selectedServices={selectedServices}
              onToggleService={toggleService}
            />
          </div>
          <div className="booking-summary">
            <div className="summary-card">
              <h2>Booking Summary</h2>
              <div className="summary-items">
                {selectedServices.map((id) => {
                  const svc = services.find((s) => s._id === id);
                  return svc ? (
                    <div key={id} className="summary-item">
                      <span>{svc.name}</span>
                      <span>{formatCurrency(svc.price * (1 - (svc.discount || 0) / 100))}</span>
                    </div>
                  ) : null;
                })}
              </div>
              {selectedServices.length > 0 && (
                <div className="summary-total">
                  <span>Total ({totalDuration} mins)</span>
                  <span>{formatCurrency(selectedTotal)}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="booking-form">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time</label>
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input placeholder="Street" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <input placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <input placeholder="Pincode" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes (optional)</label>
                  <textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: "100%", padding: "10px", border: "1.5px solid #dfe6e9", borderRadius: "8px", fontFamily: "inherit" }} />
                </div>
                <Button type="submit" loading={submitting} style={{ width: "100%" }}>
                  Book Now - {formatCurrency(selectedTotal)}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookService;
