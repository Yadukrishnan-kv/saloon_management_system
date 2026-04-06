import React from "react";
import "./Card.css";

const Card = ({ title, value, icon, color = "#6c5ce7", subtitle, onClick, className = "" }) => {
  return (
    <div className={`stat-card ${className}`} onClick={onClick} style={{ borderLeftColor: color }}>
      <div className="stat-card-content">
        <p className="stat-card-title">{title}</p>
        <h3 className="stat-card-value">{value}</h3>
        {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
      </div>
      {icon && (
        <div className="stat-card-icon" style={{ background: `${color}15`, color }}>
          {icon}
        </div>
      )}
    </div>
  );
};

export default Card;
