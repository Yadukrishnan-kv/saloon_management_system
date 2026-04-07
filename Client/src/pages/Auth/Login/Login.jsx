import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import toast from "react-hot-toast";
import useAuth from "../../../hooks/useAuth";
import logo from "../../../Assets/logo.svg";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Please provide a valid email";
    if (!formData.password) newErrors.password = "Password is required";
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
      const data = await login(formData.email, formData.password);
      toast.success("Login successful!");
      const role = data.user.role;
      if (data.permissions?.includes("Dashboard")) navigate("/dashboard");
      else if (role === "SuperAdmin" || role === "Admin") navigate("/dashboard");
      else if (role === "Customer") navigate("/customer/dashboard");
      else if (role === "Beautician") navigate("/beautician/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="login-branding">
            <img src={logo} alt="Sidi logo" className="login-brand-logo" />
            <p>Smart salon administration, beautifully simplified</p>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-wrapper">
            <h2>Welcome Back</h2>
            <p className="login-subtitle">Sign in to your account</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="login-input-group">
                <label htmlFor="email">Email</label>
                <div className="login-input-wrapper">
                  <FiMail className="login-input-icon" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && <p className="login-error">{errors.email}</p>}
              </div>

              <div className="login-input-group">
                <label htmlFor="password">Password</label>
                <div className="login-input-wrapper">
                  <FiLock className="login-input-icon" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && <p className="login-error">{errors.password}</p>}
              </div>

              <div className="login-options">
                <Link to="/forgot-password" className="forgot-link">
                  Forgot Password?
                </Link>
              </div>

              <button type="submit" className="login-btn" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
