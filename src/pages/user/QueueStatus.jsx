import React from "react";
import PageHeader from "../../components/PageHeader.jsx";
import { queueUsers } from "../../data/mockData.js";

export default function QueueStatus() {
  return (
    <>
      <PageHeader title="Queue Status" subtitle="Current queue position, wait time, and status updates." />
      <div className="grid two">
        <section className="card status-panel">
          <span className="status-dot" />
          <h2>Waiting</h2>
          <p>Current position: 3</p>
          <p>Estimated wait time: 20 minutes</p>
          <button>Leave Queue</button>
        </section>
        <section className="card">
          <h2>Queue Preview</h2>
          <div className="list">
            {queueUsers.map((user, index) => (
              <div className="list-row" key={user.id}>
                <strong>{index + 1}. {user.name}</strong>
                <span>{user.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
