import { useEffect, useState } from "react";
import { apiRequest } from "@/api/client.js";

const emptyForm = { serviceName: "", description: "", expectedDuration: "", priority: "low" };

function ServerManagement() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/services")
      .then((data) => setServices(data.services))
      .catch((requestError) => setError(requestError.message));
  }, []);

  function openForm(service) {
    setEditingId(service?.id || null);
    setForm(service ? { ...service, expectedDuration: String(service.expectedDuration) } : emptyForm);
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await apiRequest(editingId ? `/services/${editingId}` : "/services", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      setServices((current) => editingId
        ? current.map((service) => service.id === editingId ? data.service : service)
        : [...current, data.service]);
      setShowModal(false);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div>
      <div className="server_header">
        <h1>Service Management</h1>
        <button className="servers_button_edit" onClick={() => openForm()}>Add Service</button>
      </div>
      {error && !showModal && <p className="error_message" role="alert">{error}</p>}
      <div className="servers_stats">
        {services.map((service) => (
          <div className="card" key={service.id}>
            <div className="servers_title">{service.serviceName}</div>
            <p className="servers_describe">{service.description}</p>
            <div className="servers_time">Expected Duration: {service.expectedDuration} min</div>
            <div className="priority">Priority Level: {service.priority}</div>
            <div className="divider"></div>
            <button className="servers_button_edit" onClick={() => openForm(service)}>Edit</button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal_overlay">
          <form className="modal_box" onSubmit={handleSubmit}>
            <h2>{editingId ? "Edit Service" : "Add Service"}</h2>
            {error && <p className="error_message" role="alert">{error}</p>}
            <input
              type="text"
              placeholder="Service Name"
              value={form.serviceName}
              maxLength={100}
              required
              onChange={(event) => setForm({ ...form, serviceName: event.target.value })}
            />
            <input
              type="text"
              placeholder="Description"
              value={form.description}
              required
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
            <input
              type="number"
              placeholder="Expected Duration (minutes)"
              value={form.expectedDuration}
              min="1"
              required
              onChange={(event) => setForm({ ...form, expectedDuration: event.target.value })}
            />
            <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <div className="modal_buttons">
              <button type="button" className="servers_button_delete" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="servers_button_edit">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ServerManagement;
