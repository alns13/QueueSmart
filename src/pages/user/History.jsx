import React from "react";
import PageHeader from "../../components/PageHeader.jsx";
import { historyItems } from "../../data/mockData.js";

export default function History() {
  return (
    <>
      <PageHeader title="History" subtitle="Past queues joined, dates, service names, and outcomes." />
      <section className="card">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Service</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {historyItems.map((item) => (
              <tr key={item.id}>
                <td>{item.date}</td>
                <td>{item.service}</td>
                <td>{item.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
