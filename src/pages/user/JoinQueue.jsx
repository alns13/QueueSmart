import React from "react";
import PageHeader from "../../components/PageHeader.jsx";
import { services } from "../../data/mockData.js";

export default function JoinQueue() {
  return (
    <>
      <PageHeader title="Join Queue" subtitle="Select a service and preview estimated wait time." />
      <div className="grid three">
        {services.map((service) => (
          <article className="card service-card" key={service.id}>
            <h2>{service.name}</h2>
            <p>{service.description}</p>
            <strong>{service.queueLength * service.duration} min estimated wait</strong>
            <button disabled={service.status === "Closed"}>
              {service.status === "Closed" ? "Queue Closed" : "Join Queue"}
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
