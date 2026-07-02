import React from "react";
import PageHeader from "../../components/PageHeader.jsx";
import { queueUsers, services } from "../../data/mockData.js";

export default function QueueManagement() {
  return (
    <>
      <PageHeader title="Queue Management" subtitle="View selected service queue and simulate admin actions." />
      <section className="card">
        <label className="select-label">
          Selected Service
          <select defaultValue="advising">
            {services.map((service) => (
              <option key={service.id} value={service.id}>{service.name}</option>
            ))}
          </select>
        </label>
        <div className="list">
          {queueUsers.map((user, index) => (
            <div className="list-row" key={user.id}>
              <div>
                <strong>{index + 1}. {user.name}</strong>
                <p>{user.status}</p>
              </div>
              <div className="row-actions">
                <button>Move Up</button>
                <button>Move Down</button>
                <button className="danger">Remove</button>
              </div>
            </div>
          ))}
        </div>
        <button>Serve Next User</button>
      </section>
    </>
  );
}
