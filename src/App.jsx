import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import BlankPage from "./pages/BlankPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/blank" element={<BlankPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
