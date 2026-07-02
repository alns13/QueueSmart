import React from "react";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import { services } from "../../data/mockData.js";

export default function AdminDashboard() {
  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Service list, queue lengths, and quick open or close actions." />
      <div className="grid three">
        <StatCard label="Services" value={services.length} note="Configured service queues" />
        <StatCard label="People Waiting" value="15" note="Across all services" />
        <StatCard label="Open Queues" value="2" note="Currently accepting users" />
      </div>
      <section className="card">
        <h2>Services</h2>
        <div className="list">
          {services.map((service) => (
            <div className="list-row" key={service.id}>
              <div>
                <strong>{service.name}</strong>
                <p>{service.queueLength} users waiting</p>
              </div>
              <button>{service.status === "Open" ? "Close Queue" : "Open Queue"}</button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
