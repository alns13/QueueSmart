import { useState } from "react";

const initialQueueData = {
  "General Inquiry": [
    { name: "Alex", priority: "medium", waitTime: "5 min" },
    { name: "Emily", priority: "low", waitTime: "8 min" },
    { name: "Ben", priority: "hight", waitTime: "12 min" },
  ],
  "Service Request": [
    { name: "Amy", priority: "low", waitTime: "10 min" },
    { name: "Kevin", priority: "hight", waitTime: "15 min" },
  ],
  "Technical Support": [
    { name: "Zoe", priority: "medium", waitTime: "3 min" },
  ],
};

function QueueManagement() {
  const [selectedService, setSelectedService] = useState("General Inquiry");
  const [queueData, setQueueData] = useState(initialQueueData);
  const [serving, setServing] = useState(null);
  const [notice, setNotice] = useState("");
  const currentQueue = queueData[selectedService];

  function updateQueue(nextQueue) {
    setQueueData((current) => ({ ...current, [selectedService]: nextQueue }));
  }

  function callNext() {
    const [next, ...rest] = currentQueue;
    setServing(next || null);
    updateQueue(rest);
    setNotice(next ? `Status change: ${next.name} is now being served.` : "Queue update: No users are waiting.");
  }

  function removeUser(index) {
    const removed = currentQueue[index];
    updateQueue(currentQueue.filter((_, itemIndex) => itemIndex !== index));
    setNotice(`Queue update: ${removed.name} was removed from the ${selectedService} queue.`);
  }

  function moveUser(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= currentQueue.length) return;
    const nextQueue = [...currentQueue];
    [nextQueue[index], nextQueue[target]] = [nextQueue[target], nextQueue[index]];
    updateQueue(nextQueue);
  }

  return (
    <div>
      <div>
        <h1 className="queue_header">Queue Management</h1>
      </div>
      <div>
        {Object.keys(queueData).map((service) => (
          <button
            key={service}
            className={selectedService === service ? "queue_button active" : "queue_button"}
            onClick={() => {
              setSelectedService(service);
              setServing(null);
            }}
          >
            {service}
          </button>
        ))}
      </div>

      {notice && <p className="error_message" aria-live="polite">{notice}</p>}

      <div className="serving_card">
        <div>
          <span className="serving_customer">Customer: {serving?.name || currentQueue[0]?.name || "No customer"}</span>
          <span className="serving">{serving ? "Serving..." : "Next in line"}</span>
          <p className="serving_service">Service: {selectedService}</p>
          <p>Priority: {serving?.priority || currentQueue[0]?.priority || "N/A"}</p>
        </div>

        <button className="call_next_button" onClick={callNext}>Call Next</button>
      </div>

      <div className="queue_card">
        <h3>{selectedService} Queue</h3>
        {currentQueue.map((customer, index) => (
          <div className="queue_item" key={`${customer.name}-${index}`}>
            <div className="queue_info">
              <div>
                <span className="queue_position">#{index + 1}</span>
                <span className="queue_name">{customer.name}</span>
              </div>
              <span className="queue_priority">{customer.priority}</span>
            </div>
            <div className="queue_timebutton">
              <p>Estimated Wait Time: {customer.waitTime}</p>
              <div>
                <button className="queue_managebutton" onClick={() => moveUser(index, -1)}>Move Up</button>
                <button className="queue_managebutton" onClick={() => moveUser(index, 1)}>Move Down</button>
                <button className="queue_managebutton" onClick={() => removeUser(index)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
        {!currentQueue.length && <p>No users waiting.</p>}
      </div>
    </div>
  );
}

export default QueueManagement;
