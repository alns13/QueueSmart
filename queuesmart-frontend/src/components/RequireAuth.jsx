import React from "react";
import { Navigate } from "react-router-dom";
import { getRole, getToken } from "@/api/auth.js";

export function RequireAuth({ children }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function RequireAdmin({ children }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }

  if (getRole() !== "admin") {
    return <Navigate to="/user-dashboard" replace />;
  }

  return children;
}

export function RequireUser({ children }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }

  if (getRole() === "admin") {
    return <Navigate to="/Admin_dashboard" replace />;
  }

  return children;
}
