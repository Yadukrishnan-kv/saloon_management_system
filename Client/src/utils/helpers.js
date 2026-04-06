export const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount || 0);
};

export const getStatusColor = (status) => {
  const colors = {
    Requested: "#f39c12",
    Assigned: "#3498db",
    Accepted: "#2ecc71",
    InProgress: "#9b59b6",
    Completed: "#27ae60",
    Cancelled: "#e74c3c",
    Rejected: "#c0392b",
    Active: "#27ae60",
    Inactive: "#95a5a6",
    Suspended: "#e74c3c",
    Pending: "#f39c12",
    Approved: "#27ae60",
    Open: "#f39c12",
    Resolved: "#27ae60",
    Closed: "#95a5a6",
  };
  return colors[status] || "#95a5a6";
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

export const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
