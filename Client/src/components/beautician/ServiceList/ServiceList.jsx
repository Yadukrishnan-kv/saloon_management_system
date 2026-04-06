import React from "react";
import "./ServiceList.css";
import { formatCurrency } from "../../../utils/helpers";

const ServiceList = ({ services, onSelect, selectedIds = [] }) => {
  return (
    <div className="service-list">
      {services.map((service) => (
        <div
          key={service._id}
          className={`service-item ${selectedIds.includes(service._id) ? "selected" : ""}`}
          onClick={() => onSelect && onSelect(service)}
        >
          {service.image && (
            <img src={service.image} alt={service.name} className="service-item-img" />
          )}
          <div className="service-item-info">
            <h4>{service.name}</h4>
            <p className="service-item-duration">{service.duration} mins</p>
            {service.description && (
              <p className="service-item-desc">{service.description}</p>
            )}
          </div>
          <div className="service-item-price">
            {service.discount > 0 && (
              <span className="service-original-price">{formatCurrency(service.price)}</span>
            )}
            <span className="service-final-price">
              {formatCurrency(service.price - (service.price * (service.discount || 0)) / 100)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceList;
