import React from "react";
import PageHeader from "../components/PageHeader.jsx";
import { notifications } from "../data/mockData.js";

export default function Notifications() {
  return (
    <>
      <PageHeader title="Notifications" subtitle="In-app notifications for queue updates and status changes." />
      <section className="card">
        <div className="list">
          {notifications.map((notification) => (
            <div className="list-row" key={notification}>
              <strong>{notification}</strong>
              <span>Mock</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
