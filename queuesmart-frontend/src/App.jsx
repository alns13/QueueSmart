import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAdmin, RequireUser } from "./components/RequireAuth.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import Admindashbord from "./pages/administrator/Admin_dashboard.jsx";
import Queue_Manage from "./pages/administrator/Queue_Management.jsx";
import Server_manage from "./pages/administrator/Server_Management.jsx";
import Report from "./pages/administrator/Admin_Report.jsx";

export default function App() {
  return (
    <Routes>
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
        path="/Admin_dashboard"
        element={
          <RequireAdmin>
            <Admindashbord />
          </RequireAdmin>
        }
      />
      <Route
        path="/Queue_Management"
        element={
          <RequireAdmin>
            <Queue_Manage />
          </RequireAdmin>
        }
      />
      <Route
        path="/Server_management"
        element={
          <RequireAdmin>
            <Server_manage />
          </RequireAdmin>
        }
      />
      <Route
        path="/Admin_Report"
        element={
          <RequireAdmin>
            <Report />
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
