import React from "react";
import PageHeader from "../../components/PageHeader.jsx";

export default function ServiceManagement() {
  function handleSubmit(event) {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
    }
  }

  return (
    <>
      <PageHeader title="Service Management" subtitle="Create or edit services with required fields and length limits." />
      <form className="card form-card" onSubmit={handleSubmit}>
        <label>
          Service Name
          <input type="text" maxLength="100" required />
        </label>
        <label>
          Description
          <textarea required />
        </label>
        <label>
          Expected Duration (minutes)
          <input type="number" min="1" required />
        </label>
        <label>
          Priority Level
          <select required defaultValue="medium">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <button type="submit">Save Service</button>
      </form>
    </>
  );
}
