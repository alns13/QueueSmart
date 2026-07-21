import { useEffect, useState } from "react";
import { apiRequest } from "@/api/client.js";

function QueueManagement() {
  const [queues, setQueues] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [notice, setNotice] = useState("");

  async function loadQueues() {
    try {
      const data = await apiRequest("/admin/queues");
      setQueues(data.queues);
      setSelectedServiceId((current) => current || data.queues[0]?.serviceId || null);
    } catch (error) {
      setNotice(error.message);
    }
  }

  useEffect(() => { loadQueues(); }, []);
  const selectedQueue = queues.find((queue) => queue.serviceId === selectedServiceId);
  const entries = selectedQueue?.entries || [];

  async function runAction(path, options, success) {
    try {
      await apiRequest(path, options);
      setNotice(success);
      await loadQueues();
    } catch (error) {
      setNotice(error.message);
    }
  }

  return (
    <div>
      <h1 className="queue_header">Queue Management</h1>
      <div>
        {queues.map((queue) => <button key={queue.serviceId} className={selectedServiceId === queue.serviceId ? "queue_button active" : "queue_button"} onClick={() => setSelectedServiceId(queue.serviceId)}>{queue.serviceName}</button>)}
      </div>
      {notice && <p className="error_message" aria-live="polite">{notice}</p>}
      <div className="serving_card">
        <div><span className="serving_customer">Customer: {entries[0]?.email || "No customer"}</span><span className="serving">Next in line</span><p className="serving_service">Service: {selectedQueue?.serviceName || "None"}</p><p>Priority: {entries[0]?.priority || "N/A"}</p></div>
        <button className="call_next_button" disabled={!selectedQueue} onClick={() => runAction(`/admin/queues/${selectedServiceId}/serve-next`, { method: "POST" }, "Next user is now being served.")}>Call Next</button>
      </div>
      <div className="queue_card">
        <h3>{selectedQueue?.serviceName || "Service"} Queue</h3>
        {entries.map((entry, index) => (
          <div className="queue_item" key={entry.id}>
            <div className="queue_info"><div><span className="queue_position">#{index + 1}</span><span className="queue_name">{entry.email}</span></div><span className="queue_priority">{entry.priority}</span></div>
            <div className="queue_timebutton"><p>Estimated Wait Time: {entry.estimatedWaitTime} min</p><div>
              <button className="queue_managebutton" onClick={() => runAction(`/admin/queues/${selectedServiceId}/entries/${entry.id}/move`, { method: "PATCH", body: JSON.stringify({ direction: -1 }) }, "User moved up.")}>Move Up</button>
              <button className="queue_managebutton" onClick={() => runAction(`/admin/queues/${selectedServiceId}/entries/${entry.id}/move`, { method: "PATCH", body: JSON.stringify({ direction: 1 }) }, "User moved down.")}>Move Down</button>
              <button className="queue_managebutton" onClick={() => runAction(`/admin/queues/${selectedServiceId}/entries/${entry.id}`, { method: "DELETE" }, "User removed.")}>Remove</button>
            </div></div>
          </div>
        ))}
        {!entries.length && <p>No users waiting.</p>}
      </div>
    </div>
  );
}

export default QueueManagement;
