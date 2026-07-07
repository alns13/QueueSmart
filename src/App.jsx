import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import Admindashbord from "./pages/administrator/Admin_dashboard.jsx";
import Queue_Manage from "./pages/administrator/Queue_Management.jsx";
import Server_manage from "./pages/administrator/Server_Management.jsx"
import Report from "./pages/administrator/Admin_Report.jsx"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/user-dashboard" element={<UserDashboard />} />
      <Route path="/Admin_dashboard" element={<Admindashbord />}/>
      <Route path="/Queue_Management" element={<Queue_Manage />}/>
      <Route path="/Server_management" element={<Server_manage />}/>
      <Route path="/Admin_Report" element={<Report />}/>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
