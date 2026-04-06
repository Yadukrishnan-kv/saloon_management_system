import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff } from "react-icons/fi";
import toast from "react-hot-toast";
import useAuth from "../../../hooks/useAuth";
import "./Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    else if (formData.username.trim().length < 3) newErrors.username = "Username must be at least 3 characters";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Please provide a valid email";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register(formData);
      toast.success("Registration successful!");
      navigate("/customer/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-left">
          <div className="register-branding">
            <h1>Salon<span>Pro</span></h1>
            <p>Join us for the best salon experience</p>
          </div>
        </div>

        <div className="register-right">
          <div className="register-form-wrapper">
            <h2>Create Account</h2>
            <p className="register-subtitle">Sign up as a customer</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="register-input-group">
                <label htmlFor="username">Username</label>
                <div className="register-input-wrapper">
                  <FiUser className="register-input-icon" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
                {errors.username && <p className="register-error">{errors.username}</p>}
              </div>

              <div className="register-input-group">
                <label htmlFor="email">Email</label>
                <div className="register-input-wrapper">
                  <FiMail className="register-input-icon" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                {errors.email && <p className="register-error">{errors.email}</p>}
              </div>

              <div className="register-input-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <div className="register-input-wrapper">
                  <FiPhone className="register-input-icon" />
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="text"
                    placeholder="Your phone number"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="register-input-group">
                <label htmlFor="password">Password</label>
                <div className="register-input-wrapper">
                  <FiLock className="register-input-icon" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && <p className="register-error">{errors.password}</p>}
              </div>

              <button type="submit" className="register-btn" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Sign Up"}
              </button>
            </form>

            <p className="register-login">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
