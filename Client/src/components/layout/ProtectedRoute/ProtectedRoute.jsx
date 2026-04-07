import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import Loading from "../../common/Loading/Loading";

const ProtectedRoute = ({ children, roles, permission }) => {
  const { user, loading, isAuthenticated, permissions } = useAuth();

  if (loading) return <Loading />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (permission && !permissions.includes(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
