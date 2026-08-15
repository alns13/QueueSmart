import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAdmin, RequireUser } from "./components/RequireAuth.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import AdminDashboard from "./pages/administrator/AdminDashboard.jsx";
import QueueManagement from "./pages/administrator/QueueManagement.jsx";
import ServiceManagement from "./pages/administrator/ServiceManagement.jsx";
import AdminReport from "./pages/administrator/AdminReport.jsx";

export default function App() {
  return (
    <Routes>
      {/* Keep public URLs lowercase and hyphenated for consistency. */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/user-dashboard"
        element={
          <RequireUser>
            <UserDashboard />
          </RequireUser>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />
      <Route
        path="/queue-management"
        element={
          <RequireAdmin>
            <QueueManagement />
          </RequireAdmin>
        }
      />
      <Route
        path="/service-management"
        element={
          <RequireAdmin>
            <ServiceManagement />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin-report"
        element={
          <RequireAdmin>
            <AdminReport />
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
