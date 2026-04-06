import React from "react";
import { FiStar, FiMapPin } from "react-icons/fi";
import "./BeauticianCard.css";

const BeauticianCard = ({ beautician, onClick }) => {
  return (
    <div className="beautician-card" onClick={() => onClick && onClick(beautician)}>
      <div className="beautician-card-avatar">
        {beautician.profileImage ? (
          <img src={beautician.profileImage} alt={beautician.fullName} />
        ) : (
          <div className="beautician-card-initials">
            {beautician.fullName?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>
      <div className="beautician-card-info">
        <h3>{beautician.fullName}</h3>
        <div className="beautician-card-rating">
          <FiStar /> <span>{beautician.rating || 0}</span>
          <span className="review-count">({beautician.totalReviews || 0} reviews)</span>
        </div>
        {beautician.location?.city && (
          <p className="beautician-card-location">
            <FiMapPin /> {beautician.location.city}
          </p>
        )}
        <div className="beautician-card-skills">
          {beautician.skills?.slice(0, 4).map((skill) => (
            <span key={skill} className="skill-tag">{skill}</span>
          ))}
          {beautician.skills?.length > 4 && (
            <span className="skill-tag skill-more">+{beautician.skills.length - 4}</span>
          )}
        </div>
      </div>
      <div className={`beautician-card-status status-${beautician.status?.toLowerCase()}`}>
        {beautician.status}
      </div>
    </div>
  );
};

export default BeauticianCard;
