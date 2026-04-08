import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../../../../components/layout/Header/Header";
import Sidebar from "../../../../components/layout/Sidebar/Sidebar";
import Button from "../../../../components/common/Button/Button";
import { BEAUTICIAN_SKILLS } from "../../../../constants/constants";
import axios from "axios";

const AddBeautician = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [beauticianId, setBeauticianId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    phoneNumber: "",
    bio: "",
    qualifications: "",
    experience: 0,
    skills: [],
    location: { address: "", city: "", state: "", pincode: "" },
  });
  const [documents, setDocuments] = useState([]);
  const [documentType, setDocumentType] = useState("Identity");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("location.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({ ...prev, location: { ...prev.location, [key]: value } }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSkillToggle = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!isEdit && !formData.username.trim()) newErrors.username = "Username is required";
    if (!isEdit && !formData.email.trim()) newErrors.email = "Email is required";
    if (!isEdit && !formData.password) newErrors.password = "Password is required";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone is required";
    if (formData.skills.length === 0) newErrors.skills = "Select at least one skill";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let targetBeauticianId = beauticianId;

      if (isEdit) {
        await axios.put(`${backendUrl}/api/beauticians/${beauticianId}`, {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          bio: formData.bio,
          qualifications: formData.qualifications,
          experience: formData.experience,
          skills: formData.skills,
          location: formData.location,
        });
      } else {
        const { data } = await axios.post(`${backendUrl}/api/beauticians`, formData);
        targetBeauticianId = data?._id;
      }

      if (targetBeauticianId && documents.length > 0) {
        const payload = new FormData();
        documents.forEach((file) => payload.append("documents", file));
        payload.append("documentType", documentType);
        await axios.post(`${backendUrl}/api/beauticians/${targetBeauticianId}/documents`, payload);
      }

      toast.success(`Beautician ${isEdit ? "updated" : "created"}!`);
      setTimeout(() => navigate("/admin/beauticians"), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const loadForEdit = useCallback(async (id) => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/beauticians/${id}`);
      setFormData({
        username: data.user?.username || "",
        email: data.user?.email || "",
        password: "",
        fullName: data.fullName || "",
        phoneNumber: data.phoneNumber || "",
        bio: data.bio || "",
        qualifications: data.qualifications || "",
        experience: data.experience || 0,
        skills: data.skills || [],
        location: data.location || { address: "", city: "", state: "", pincode: "" },
      });
      setIsEdit(true);
      setBeauticianId(id);
    } catch (error) {
      toast.error("Failed to load beautician");
      navigate("/admin/beauticians");
    }
  }, [navigate]);

  useEffect(() => {
    const editId = new URLSearchParams(location.search).get("edit");
    if (editId) loadForEdit(editId);
  }, [location.search, loadForEdit]);

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="page-header"><h1>{isEdit ? "Edit Beautician" : "Add Beautician"}</h1></div>
        <div className="form-card">
          <form onSubmit={handleSubmit} noValidate>
            {!isEdit && (
              <div className="form-row">
                <div className="form-group">
                  <label>Username</label>
                  <input name="username" value={formData.username} onChange={handleChange} />
                  {errors.username && <p className="error-text">{errors.username}</p>}
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} />
                  {errors.email && <p className="error-text">{errors.email}</p>}
                </div>
              </div>
            )}

            {!isEdit && (
              <div className="form-group">
                <label>Password</label>
                <input name="password" type="password" value={formData.password} onChange={handleChange} />
                {errors.password && <p className="error-text">{errors.password}</p>}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input name="fullName" value={formData.fullName} onChange={handleChange} />
                {errors.fullName && <p className="error-text">{errors.fullName}</p>}
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                {errors.phoneNumber && <p className="error-text">{errors.phoneNumber}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Experience (years)</label>
                <input name="experience" type="number" value={formData.experience} onChange={handleChange} min="0" />
              </div>
              <div className="form-group">
                <label>Qualifications</label>
                <input name="qualifications" value={formData.qualifications} onChange={handleChange} placeholder="e.g. CIDESCO, Diploma" />
              </div>
            </div>

            <div className="form-group">
              <label>Bio</label>
              <input name="bio" value={formData.bio} onChange={handleChange} placeholder="Brief description" />
            </div>

            <div className="form-group">
              <label>Skills</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                {BEAUTICIAN_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: "1.5px solid",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 600,
                      background: formData.skills.includes(skill) ? "#6c5ce7" : "#fff",
                      color: formData.skills.includes(skill) ? "#fff" : "#6c5ce7",
                      borderColor: "#6c5ce7",
                    }}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              {errors.skills && <p className="error-text">{errors.skills}</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Document Type</label>
                <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
                  <option value="Identity">Identity</option>
                  <option value="Qualification">Qualification</option>
                  <option value="Experience">Experience</option>
                  <option value="Certificate">Certificate</option>
                </select>
              </div>
              <div className="form-group">
                <label>Upload Documents (optional)</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={(e) => setDocuments(Array.from(e.target.files || []))}
                />
              </div>
            </div>

            <h3 style={{ margin: "20px 0 12px", color: "#2d3436" }}>Location</h3>
            <div className="form-row">
              <div className="form-group"><label>Address</label><input name="location.address" value={formData.location.address} onChange={handleChange} /></div>
              <div className="form-group"><label>City</label><input name="location.city" value={formData.location.city} onChange={handleChange} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>State</label><input name="location.state" value={formData.location.state} onChange={handleChange} /></div>
              <div className="form-group"><label>Pincode</label><input name="location.pincode" value={formData.location.pincode} onChange={handleChange} /></div>
            </div>

            <div className="form-actions">
              <Button variant="secondary" onClick={() => navigate("/admin/beauticians")}>Cancel</Button>
              <Button type="submit" loading={isLoading}>{isEdit ? "Update" : "Add Beautician"}</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddBeautician;
