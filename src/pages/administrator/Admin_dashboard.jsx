import React, { useState } from "react";
import "./Admin_dashboard.css";

import AdminReport from "./Admin_Report.jsx";
import QueueManagement from "./Queue_Management.jsx";
import ServerManagement from "./Server_Management.jsx";

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("Dashboard");

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2 >QueueSmart</h2>
          <p>hardcoded data now</p>
        </div>

        <ul className="admin-nav">
          <li
            className={activePage === "Dashboard" ? "active" : ""}
            onClick={() => setActivePage("Dashboard")}
          >
            <span>▦  </span>
            Dashboard
          </li>

          <li
            className={activePage === "Queue Management" ? "active" : ""}
            onClick={() => setActivePage("Queue Management")}
          >
            <span>☷  </span>
            Queue Management
          </li>

          <li
            className={activePage === "Service Management" ? "active" : ""}
            onClick={() => setActivePage("Service Management")}
          >
            <span>⚙  </span>
            Service Management
          </li>

          <li
            className={activePage === "Admin Report" ? "active" : ""}
            onClick={() => setActivePage("Admin Report")}
          >
            <span>▥  </span>
            Admin Report
          </li>
        </ul>
      </aside>

      <main className="admin-content">
        {activePage === "Dashboard" && (
        <div>
            <div className="Welcome">
                <h1 className="dashboard_header">Admin Dashboard</h1>
                <p>Welcome back, administrator!</p>
            </div>
            <div className="stats">
                <div className="card">
                    <div className="title">Current Queue</div>
                    <div className="number">4</div>
                    <div className="remark">Customers currently waiting</div>
                </div>
                <div className="card">
                    <div className="title">Active Staff</div>
                    <div className="number">3</div>
                    <div className="remark">Total number of active staff</div>
                </div>
                <div className="card">
                    <div className="title">Completed Today</div>
                    <div className="number">23</div>
                    <div className="remark">Number of customers served today</div>
                </div>
                
            </div>
        </div>
        )}

        {activePage === "Queue Management" && <QueueManagement />}
        {activePage === "Service Management" && <ServerManagement />}
        {activePage === "Admin Report" && <AdminReport />}
      </main>
    </div>
  );
}