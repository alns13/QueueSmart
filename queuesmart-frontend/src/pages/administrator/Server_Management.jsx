import { useEffect, useState } from "react";
import { apiRequest } from "@/api/client.js";

const emptyForm = {
  serviceName: "",
  description: "",
  expectedDuration: "",
  priority: "low",
  laneWaitThresholdMinutes: "60",
};

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
    setForm(
      service
        ? {
            serviceName: service.serviceName,
            description: service.description,
            expectedDuration: String(service.expectedDuration),
            priority: service.priority,
            laneWaitThresholdMinutes: String(service.laneWaitThresholdMinutes ?? 60),
          }
        : emptyForm
    );
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const payload = {
        serviceName: form.serviceName,
        description: form.description,
        expectedDuration: Number(form.expectedDuration),
        priority: form.priority,
        laneWaitThresholdMinutes: Number(form.laneWaitThresholdMinutes),
      };
      const data = await apiRequest(editingId ? `/services/${editingId}` : "/services", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setServices((current) =>
        editingId
          ? current.map((service) => (service.id === editingId ? data.service : service))
          : [...current, data.service]
      );
      setShowModal(false);
      if (!editingId) {
        setNotice(
          `${data.service.serviceName} created with Lane 1 open. Open or close extra lanes in Queue Management.`
        );
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function confirmRetire() {
    if (!retiringService) return;
    setError("");
    setNotice("");
    try {
      const data = await apiRequest(`/services/${retiringService.id}/retire`, { method: "POST" });
      setServices((current) =>
        current.map((service) => (service.id === data.service.id ? data.service : service))
      );
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
        <button className="servers_button_edit" onClick={() => openForm()}>
          Add Service
        </button>
      </div>
      <p className="servers_describe">
        Configure service details and wait thresholds here. Open and close lanes in Queue Management.
      </p>
      {error && !showModal && <p className="error_message" role="alert">{error}</p>}
      {notice && (
        <p className="success_message" aria-live="polite">
          {notice}
        </p>
      )}
      <div className="servers_stats">
        {activeServices.map((service) => (
          <div className="card" key={service.id}>
            <div className="servers_title">{service.serviceName}</div>
            <p className="servers_describe">{service.description}</p>
            <div className="servers_time">Expected Duration: {service.expectedDuration} min</div>
            <div className="priority">Priority Level: {service.priority}</div>
            <div className="priority">
              Extra-lane threshold: {service.laneWaitThresholdMinutes} min
            </div>
            <div className="priority">
              Lanes: {service.openLaneCount || 0} open / {service.totalLaneCount || 0} total · Queue:{" "}
              {service.queueStatus === "open" ? "Open" : "Closed"}
            </div>
            <div className="divider"></div>
            <button className="servers_button_edit" onClick={() => openForm(service)}>
              Edit
            </button>
            <button
              className="servers_button_delete"
              onClick={() => {
                setRetiringService(service);
                setError("");
              }}
            >
              Retire
            </button>
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
            {error && (
              <p className="error_message" role="alert">
                {error}
              </p>
            )}
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
            <input
              type="number"
              placeholder="Open extra lane when wait reaches (minutes)"
              value={form.laneWaitThresholdMinutes}
              min="1"
              max="1440"
              required
              onChange={(event) =>
                setForm({ ...form, laneWaitThresholdMinutes: event.target.value })
              }
            />
            <p className="servers_describe">
              When the last person&apos;s wait on the shortest open lane reaches this many minutes,
              admins get a notification to open another lane in Queue Management.
            </p>
            <select
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: event.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <div className="modal_buttons">
              <button
                type="button"
                className="servers_button_delete"
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
              >
                Cancel
              </button>
              <button type="submit" className="servers_button_edit">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {retiringService && (
        <div className="modal_overlay">
          <div className="modal_box">
            <h2>Retire {retiringService.serviceName}?</h2>
            <p>
              This hides the service from users but keeps all visit history. Close every lane in
              Queue Management first, and make sure nobody is still waiting or being served.
            </p>
            {error && (
              <p className="error_message" role="alert">
                {error}
              </p>
            )}
            <div className="modal_buttons">
              <button
                type="button"
                className="servers_button_delete"
                onClick={() => {
                  setRetiringService(null);
                  setError("");
                }}
              >
                Cancel
              </button>
              <button type="button" className="servers_button_edit" onClick={confirmRetire}>
                Retire Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServerManagement;
