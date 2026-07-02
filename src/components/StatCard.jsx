import React from "react";

export default function StatCard({ label, value, note }) {
  return (
    <article className="card stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}
