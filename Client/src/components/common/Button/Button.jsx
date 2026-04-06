import React from "react";
import "./Button.css";

const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  fullWidth = false,
  className = "",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? "btn-full" : ""} ${className}`}
      aria-busy={loading}
    >
      {loading ? <span className="btn-spinner"></span> : children}
    </button>
  );
};

export default Button;
