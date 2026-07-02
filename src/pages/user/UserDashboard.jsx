import React from "react";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import { notifications, services } from "../../data/mockData.js";

export default function UserDashboard() {
  return (
    <>
      <PageHeader title="User Dashboard" subtitle="Overview of current queue status, services, and notifications." />
      <div className="grid three">
        <StatCard label="Current Position" value="#3" note="Academic Advising" />
        <StatCard label="Estimated Wait" value="20 min" note="Updated from mock queue data" />
        <StatCard label="Notifications" value={notifications.length} note="In-app alerts" />
      </div>
      <div className="card">
        <h2>Active Services</h2>
        <div className="list">
          {services.map((service) => (
            <div className="list-row" key={service.id}>
              <div>
                <strong>{service.name}</strong>
                <p>{service.description}</p>
              </div>
              <span>{service.status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
