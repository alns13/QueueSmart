import { useEffect, useState } from "react";
import { apiRequest } from "@/api/client.js";

const emptyForm = { serviceName: "", description: "", expectedDuration: "", priority: "low" };

function ServerManagement() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [retiringService, setRetiringService] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    apiRequest("/services")
      .then((data) => setServices(data.services))
      .catch((requestError) => setError(requestError.message));
  }, []);

  const activeServices = services.filter((service) => !service.archived);
  const retiredServices = services.filter((service) => service.archived);

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
        body: JSON.stringify({ ...form, expectedDuration: Number(form.expectedDuration) }),
      });
      setServices((current) => editingId
        ? current.map((service) => service.id === editingId ? data.service : service)
        : [...current, data.service]);
      setShowModal(false);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function closeQueue(service) {
    setError("");
    setNotice("");
    try {
      await apiRequest(`/admin/queues/${service.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "closed" }),
      });
      setServices((current) => current.map((item) => (
        item.id === service.id ? { ...item, queueStatus: "closed" } : item
      )));
      setNotice(`${service.serviceName} is now closed. People already in line will still be served.`);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }

  async function confirmRetire() {
    if (!retiringService) return;
    setError("");
    setNotice("");
    try {
      const data = await apiRequest(`/services/${retiringService.id}/retire`, { method: "POST" });
      setServices((current) => current.map((service) => (
        service.id === data.service.id ? data.service : service
      )));
      setNotice(`${data.service.serviceName} was retired. History for this service is preserved.`);
      setRetiringService(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="admin-theme">
      <div className="server_header">
        <h1>Service Management</h1>
        <button className="servers_button_edit" onClick={() => openForm()}>Add Service</button>
      </div>
      {error && !showModal && <p className="error_message" role="alert">{error}</p>}
      {notice && <p className="success_message" aria-live="polite">{notice}</p>}
      <div className="servers_stats">
        {activeServices.map((service) => (
          <div className="card" key={service.id}>
            <div className="servers_title">{service.serviceName}</div>
            <p className="servers_describe">{service.description}</p>
            <div className="servers_time">Expected Duration: {service.expectedDuration} min</div>
            <div className="priority">Priority Level: {service.priority}</div>
            <div className="priority">Queue: {service.queueStatus === "open" ? "Open" : "Closed"}</div>
            <div className="divider"></div>
            <button className="servers_button_edit" onClick={() => openForm(service)}>Edit</button>
            {service.queueStatus === "open" && (
              <button className="servers_button_pause" onClick={() => closeQueue(service)}>Close Queue</button>
            )}
            <button className="servers_button_delete" onClick={() => { setRetiringService(service); setError(""); }}>Retire</button>
          </div>
        ))}
      </div>

      {retiredServices.length > 0 && (
        <div className="retired_section">
          <h2>Retired services</h2>
          <p className="servers_describe">Hidden from users. Visit history and reports are kept.</p>
          <div className="servers_stats">
            {retiredServices.map((service) => (
              <div className="card retired_card" key={service.id}>
                <div className="servers_title">{service.serviceName}</div>
                <p className="servers_describe">{service.description}</p>
                <div className="priority">Retired</div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <button type="button" className="servers_button_delete" onClick={() => {setShowModal(false) ; setError("");}}>Cancel</button>

              <button type="submit" className="servers_button_edit">Save</button>
            </div>
          </form>
        </div>
      )}

      {retiringService && (
        <div className="modal_overlay">
          <div className="modal_box">
            <h2>Retire {retiringService.serviceName}?</h2>
            <p>This hides the service from users but keeps all visit history. The queue must already be closed, and nobody can still be waiting or being served.</p>
            {error && <p className="error_message" role="alert">{error}</p>}
            <div className="modal_buttons">
              <button type="button" className="servers_button_delete" onClick={() => { setRetiringService(null); setError(""); }}>Cancel</button>
              {retiringService.queueStatus === "open" && (
                <button type="button" className="servers_button_pause" onClick={async () => {
                  const closed = await closeQueue(retiringService);
                  if (closed) {
                    setRetiringService((current) => current ? { ...current, queueStatus: "closed" } : current);
                  }
                }}>Close Queue</button>
              )}
              <button type="button" className="servers_button_edit" onClick={confirmRetire}>Retire Service</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServerManagement;
