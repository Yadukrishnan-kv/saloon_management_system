import React from "react";
import "./BeauticianDetailsCard.css";

const BeauticianDetailsCard = ({ beautician }) => {
  if (!beautician) return null;

  const backendBaseUrl = (process.env.REACT_APP_BACKEND_IP || "").replace(/\/$/, "");
  const getDocumentUrl = (url) => {
    if (!url) return "#";
    if (/^https?:\/\//i.test(url)) return url;
    return `${backendBaseUrl}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const getDocumentName = (url, fallbackLabel) => {
    if (!url) return fallbackLabel;
    const fileName = url.split("/").pop();
    return fileName || fallbackLabel;
  };

  const documents = [
    ...(beautician.pccDocument?.documentUrl
      ? [{
          label: "PCC Document",
          url: beautician.pccDocument.documentUrl,
        }]
      : []),
    ...((beautician.documents || [])
      .filter((d) => d.documentUrl)
      .map((d, index) => ({
        label: d.documentType || `Document ${index + 1}`,
        url: d.documentUrl,
      }))),
  ];

  return (
    <div className="beautician-details-card">
      <div className="beautician-details-hero">
        <div className="beautician-avatar">{beautician.fullName?.charAt(0)?.toUpperCase() || "B"}</div>
        <div>
          <h3>{beautician.fullName}</h3>
          <p>{beautician.phoneNumber || "No phone"}</p>
        </div>
        <span className={`verification-pill ${beautician.verificationStatus?.toLowerCase() || "pending"}`}>
          {beautician.verificationStatus || "Pending"}
        </span>
      </div>

      <div className="beautician-meta-grid">
        <div className="meta-item">
          <span>Experience</span>
          <strong>{beautician.experience || 0} years</strong>
        </div>
        <div className="meta-item">
          <span>Status</span>
          <strong>{beautician.status || "Inactive"}</strong>
        </div>
        <div className="meta-item">
          <span>Rating</span>
          <strong>{beautician.rating || 0} ★</strong>
        </div>
        <div className="meta-item">
          <span>Location</span>
          <strong>{[beautician.location?.city, beautician.location?.state].filter(Boolean).join(", ") || "N/A"}</strong>
        </div>
      </div>

      <div className="details-section">
        <h4>Skills</h4>
        <div className="skills-wrap">
          {(beautician.skills || []).length > 0 ? (
            beautician.skills.map((skill) => (
              <span key={skill} className="skill-chip">{skill}</span>
            ))
          ) : (
            <span className="empty-text">No skills added</span>
          )}
        </div>
      </div>

      <div className="details-section">
        <h4>Bio</h4>
        <p className="bio-text">{beautician.bio || "No bio provided"}</p>
      </div>

      <div className="details-section">
        <h4>Qualifications</h4>
        <p className="bio-text">{beautician.qualifications || "No qualifications added"}</p>
      </div>

      <div className="details-section">
        <h4>Documents</h4>
        {documents.length > 0 ? (
          <div className="docs-list">
            {documents.map((doc, index) => {
              const documentUrl = getDocumentUrl(doc.url);
              const fileName = getDocumentName(doc.url, `${doc.label}.${doc.url?.split(".").pop() || "file"}`);

              return (
                <div key={`${doc.label}-${index}`} className="doc-item">
                  <div className="doc-copy">
                    <span className="doc-title">{doc.label}</span>
                    <span className="doc-name">{fileName}</span>
                  </div>
                  <div className="doc-actions">
                    <a href={documentUrl} target="_blank" rel="noreferrer" className="doc-link">
                      View
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="empty-text">No documents uploaded</p>
        )}
      </div>
    </div>
  );
};

export default BeauticianDetailsCard;
