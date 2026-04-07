import React, { createContext, useState, useEffect } from "react";
import api from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadPermissions = async () => {
    try {
      const { data } = await api.get("/api/roles/me");
      const rolePermissions = data.permissions || [];
      setPermissions(rolePermissions);
      return rolePermissions;
    } catch (error) {
      setPermissions([]);
      return [];
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/api/auth/me");
        setUser(data.user);
        await loadPermissions();
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setUser(null);
        setPermissions([]);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    setUser(data.user);
    const rolePermissions = await loadPermissions();
    setIsAuthenticated(true);
    return { ...data, permissions: rolePermissions };
  };

  const register = async (formData) => {
    const { data } = await api.post("/api/auth/register", formData);
    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    setUser(data.user);
    const rolePermissions = await loadPermissions();
    setIsAuthenticated(true);
    return { ...data, permissions: rolePermissions };
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      // Continue logout even if API call fails
    }
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setPermissions([]);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
