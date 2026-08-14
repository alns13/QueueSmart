import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/api/client.js";

function queueIdOf(queue) {
  return queue.queueId || queue.id;
}

function waitingCount(queue) {
  return (queue.entries || []).filter((entry) => entry.status === "waiting").length;
}

function servingCount(queue) {
  return (queue.entries || []).filter((entry) => entry.status === "serving").length;
}

function groupQueuesByService(queues) {
  const groups = new Map();
  for (const queue of queues) {
    const key = queue.serviceId;
    if (!groups.has(key)) {
      groups.set(key, {
        serviceId: queue.serviceId,
        serviceName: queue.serviceName,
        lanes: [],
      });
    }
    groups.get(key).lanes.push(queue);
  }
  for (const group of groups.values()) {
    group.lanes.sort((a, b) => (a.laneNumber || 1) - (b.laneNumber || 1));
  }
  return [...groups.values()];
}

function QueueManagement() {
  const [queues, setQueues] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState(null);
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const [notice, setNotice] = useState("");

  async function loadQueues() {
    try {
      const data = await apiRequest("/admin/queues");
      const visible = data.queues.filter((queue) => !queue.archived);
      setQueues(visible);

      setSelectedQueueId((current) => {
        if (visible.some((queue) => queueIdOf(queue) === current)) return current;
        return visible[0] ? queueIdOf(visible[0]) : null;
      });

      setExpandedServiceId((current) => {
        if (current && visible.some((queue) => queue.serviceId === current)) return current;
        return visible[0]?.serviceId || null;
      });
    } catch (error) {
      setNotice(error.message);
    }
  }

  useEffect(() => {
    loadQueues();
  }, []);

  const serviceGroups = useMemo(() => groupQueuesByService(queues), [queues]);

  const selectedQueue = queues.find((queue) => queueIdOf(queue) === selectedQueueId);
  const selectedId = selectedQueue ? queueIdOf(selectedQueue) : null;
  const entries = selectedQueue?.entries || [];
  const servingEntry = entries.find((entry) => entry.status === "serving");
  const waitingEntries = entries.filter((entry) => entry.status === "waiting");

  function selectLane(queue) {
    const id = queueIdOf(queue);
    setSelectedQueueId(id);
    setExpandedServiceId(queue.serviceId);
  }

  function toggleService(serviceId) {
    setExpandedServiceId((current) => (current === serviceId ? null : serviceId));
  }

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
    <div className="admin-theme">
      <h1 className="queue_header">Queue Management</h1>
      <p className="servers_describe">
        Expand a service to choose a lane. Each service has three lanes — Lane 1 starts open; open
        or close the others here when you need more capacity.
      </p>

      {notice && (
        <p className="error_message" aria-live="polite">
          {notice}
        </p>
      )}

      <div className="queue_accordion">
        {serviceGroups.map((group) => {
          const isExpanded = expandedServiceId === group.serviceId;
          const openLanes = group.lanes.filter((lane) => lane.status === "open").length;
          const totalWaiting = group.lanes.reduce((sum, lane) => sum + waitingCount(lane), 0);
          const totalServing = group.lanes.reduce((sum, lane) => sum + servingCount(lane), 0);

          return (
            <div
              className={`queue_accordion_item${isExpanded ? " expanded" : ""}`}
              key={group.serviceId}
            >
              <button
                type="button"
                className="queue_accordion_header"
                aria-expanded={isExpanded}
                onClick={() => toggleService(group.serviceId)}
              >
                <span className="queue_accordion_chevron" aria-hidden="true">
                  {isExpanded ? "▾" : "▸"}
                </span>
                <span className="queue_accordion_title">{group.serviceName}</span>
                <span className="queue_accordion_meta">
                  {openLanes} open · {totalWaiting} waiting
                  {totalServing > 0 ? ` · ${totalServing} serving` : ""}
                </span>
              </button>

              {isExpanded && (
                <div className="queue_accordion_lanes">
                  {group.lanes.map((lane) => {
                    const id = queueIdOf(lane);
                    const isSelected = selectedId === id;
                    const waiting = waitingCount(lane);
                    return (
                      <button
                        type="button"
                        key={id}
                        className={`queue_lane_row${isSelected ? " active" : ""}${
                          lane.status === "closed" ? " closed" : ""
                        }`}
                        onClick={() => selectLane(lane)}
                      >
                        <span className="queue_lane_label">Lane {lane.laneNumber || 1}</span>
                        <span className="queue_lane_status">{lane.status}</span>
                        <span className="queue_lane_waiting">{waiting} waiting</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {!serviceGroups.length && <p>No active services available.</p>}
      </div>

      {selectedQueue && (
        <>
          <div className="my-4 flex items-center gap-3">
            <strong>
              {selectedQueue.serviceName} Lane {selectedQueue.laneNumber || 1} · status:{" "}
              {selectedQueue.status}
            </strong>
            <button
              className="queue_managebutton"
              onClick={() =>
                runAction(
                  `/admin/queues/${selectedId}/status`,
                  {
                    method: "PATCH",
                    body: JSON.stringify({
                      status: selectedQueue.status === "open" ? "closed" : "open",
                    }),
                  },
                  `Lane ${selectedQueue.status === "open" ? "closed" : "opened"}. ${
                    selectedQueue.status === "open"
                      ? "People already in line will still be served."
                      : ""
                  }`.trim()
                )
              }
            >
              {selectedQueue.status === "open" ? "Close Lane" : "Open Lane"}
            </button>
          </div>

          <div className="serving_card">
            <div>
              <span className="serving_customer">
                Customer:{" "}
                {servingEntry?.name ||
                  servingEntry?.email ||
                  "No customer currently being served"}
              </span>
              <span className="serving">Currently Serving</span>
              <p className="serving_service">
                Service: {selectedQueue.serviceName} · Lane {selectedQueue.laneNumber || 1}
              </p>
              <p>Priority: {servingEntry?.priority || "N/A"}</p>
            </div>
            <div className="serving_actions">
              <button
                className="call_next_button"
                disabled={!waitingEntries.length}
                onClick={() =>
                  runAction(
                    `/admin/queues/${selectedId}/serve-next`,
                    { method: "POST" },
                    "Next user is now being served."
                  )
                }
              >
                Call Next
              </button>
              <button
                className="call_next_button"
                disabled={!servingEntry}
                onClick={() =>
                  runAction(
                    `/admin/queues/${selectedId}/complete-current`,
                    { method: "POST" },
                    "Current service completed."
                  )
                }
              >
                Complete Service
              </button>
            </div>
          </div>

          <div className="queue_card">
            <h3>
              {selectedQueue.serviceName} Lane {selectedQueue.laneNumber || 1} Queue
            </h3>
            {waitingEntries.map((entry, index) => (
              <div className="queue_item" key={entry.id}>
                <div className="queue_info">
                  <div>
                    <span className="queue_position">#{index + 1}</span>
                    <span className="queue_name">{entry.name || entry.email}</span>
                  </div>
                  <span className="queue_priority">{entry.priority}</span>
                </div>
                <div className="queue_timebutton">
                  <p>Estimated Wait Time: {entry.estimatedWaitTime} min</p>
                  <div>
                    <button
                      className="queue_managebutton"
                      onClick={() =>
                        runAction(
                          `/admin/queues/${selectedId}/entries/${entry.id}/move`,
                          { method: "PATCH", body: JSON.stringify({ direction: -1 }) },
                          "User moved up."
                        )
                      }
                    >
                      Move Up
                    </button>
                    <button
                      className="queue_managebutton"
                      onClick={() =>
                        runAction(
                          `/admin/queues/${selectedId}/entries/${entry.id}/move`,
                          { method: "PATCH", body: JSON.stringify({ direction: 1 }) },
                          "User moved down."
                        )
                      }
                    >
                      Move Down
                    </button>
                    <button
                      className="queue_managebutton"
                      onClick={() =>
                        runAction(
                          `/admin/queues/${selectedId}/entries/${entry.id}`,
                          { method: "DELETE" },
                          "User removed."
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!waitingEntries.length && <p>No users waiting.</p>}
          </div>
        </>
      )}
    </div>
  );
}

export default QueueManagement;
