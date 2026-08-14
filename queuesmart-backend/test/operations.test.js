import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import app from "../src/app.js";

test("user joins and admin serves a queue", async (t) => {
  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => server.close());
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    return { status: response.status, data: await response.json() };
  }

  const email = `test-${Date.now()}@example.com`;
  await request("/auth/register", { method: "POST", body: JSON.stringify({ email, password: "test123", fullName: "Ops Tester" }) });
  const userLogin = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password: "test123" }) });
  const adminLogin = await request("/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@email.com", password: "admin123" }) });
  const userHeaders = { Authorization: `Bearer ${userLogin.data.token}` };
  const adminHeaders = { Authorization: `Bearer ${adminLogin.data.token}` };

  const joined = await request("/queues/1/join", { method: "POST", headers: userHeaders, body: "{}" });
  assert.equal(joined.status, 201);
  assert.equal(joined.data.entry.position, 1);

  const queues = await request("/admin/queues", { headers: adminHeaders });
  assert.equal(queues.data.queues[0].entries.length, 1);

  const served = await request("/admin/queues/1/serve-next", { method: "POST", headers: adminHeaders });
  assert.equal(served.data.served.email, email);
  const completed = await request("/admin/queues/1/complete-current", { method: "POST", headers: adminHeaders });
  assert.equal(completed.status, 200);

  const notifications = await request("/notifications", { headers: userHeaders });
  const history = await request("/history/me", { headers: userHeaders });
  assert.ok(notifications.data.notifications.length >= 2);
  assert.equal(history.data.history[0].outcome, "Served");

  const uniqueServiceName = `Testing ${Date.now()}-${Math.random()}`;
  const createdService = await request("/services", { method: "POST", headers: adminHeaders, body: JSON.stringify({ serviceName: uniqueServiceName, description: "Integration test service", expectedDuration: 12, priority: "medium", laneWaitThresholdMinutes: 60 }) });
  assert.equal(createdService.status, 201);
  const updatedService = await request(`/services/${createdService.data.service.id}`, { method: "PATCH", headers: adminHeaders, body: JSON.stringify({ serviceName: `Updated ${uniqueServiceName}`, description: "Updated integration service", expectedDuration: 18, priority: "high", laneWaitThresholdMinutes: 45 }) });
  assert.equal(updatedService.data.service.expectedDuration, 18);

  const waitTime = await request("/waitTime/1", { headers: userHeaders });
  assert.equal(waitTime.data.estimatedWaitTime, waitTime.data.peopleAhead * waitTime.data.expectedDuration);

  await request("/queues/2/join", { method: "POST", headers: userHeaders, body: "{}" });
  const status = await request("/queues/2/status", { headers: userHeaders });
  const estimate = await request("/queues/2/estimate", { headers: userHeaders });
  assert.equal(status.data.queueLength, 1);
  assert.equal(estimate.data.estimatedWaitTime, 0);
  const left = await request("/queues/2/leave", { method: "DELETE", headers: userHeaders });
  assert.equal(left.status, 200);

  const summary = await request("/history/me/summary", { headers: userHeaders });
  assert.equal(summary.data.served, 1);
  assert.equal(summary.data.left, 1);
  const invalid = await request("/queues/1/join", { method: "POST", headers: userHeaders, body: JSON.stringify({ priority: "invalid" }) });
  assert.equal(invalid.status, 400);
});

test("queue status, notifications, and history persist in SQLite", async (t) => {
  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => server.close());
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    return { status: response.status, data: await response.json() };
  };

  const adminLogin = await request("/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@email.com", password: "admin123" }) });
  const adminHeaders = { Authorization: `Bearer ${adminLogin.data.token}` };
  const service = await request("/services", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ serviceName: `Persistence ${Date.now()}-${Math.random()}`, description: "Persistence integration test", expectedDuration: 5, priority: "low", laneWaitThresholdMinutes: 30 }),
  });
  assert.equal(service.status, 201);
  const serviceId = service.data.service.id;
  const queueId = service.data.service.lanes[0].queueId;

  const email = `persistence-${Date.now()}-${Math.random()}@example.com`;
  await request("/auth/register", { method: "POST", body: JSON.stringify({ email, password: "test123", fullName: "Persistence Tester" }) });
  const login = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password: "test123" }) });
  const userHeaders = { Authorization: `Bearer ${login.data.token}` };

  const closed = await request(`/admin/queues/${queueId}/status`, { method: "PATCH", headers: adminHeaders, body: JSON.stringify({ status: "closed" }) });
  assert.equal(closed.status, 200);
  assert.equal(closed.data.queue.status, "closed");
  const rejected = await request(`/queues/${serviceId}/join`, { method: "POST", headers: userHeaders, body: "{}" });
  assert.equal(rejected.status, 409);
  assert.equal(rejected.data.error, "This queue is closed");

  await request(`/admin/queues/${queueId}/status`, { method: "PATCH", headers: adminHeaders, body: JSON.stringify({ status: "open" }) });
  const joined = await request(`/queues/${serviceId}/join`, { method: "POST", headers: userHeaders, body: "{}" });
  assert.equal(joined.status, 201);

  const notificationList = await request("/notifications", { headers: userHeaders });
  assert.equal(notificationList.data.notifications[0].status, "sent");
  const notificationId = notificationList.data.notifications[0].id;
  const viewed = await request(`/notifications/${notificationId}/read`, { method: "PATCH", headers: userHeaders, body: "{}" });
  assert.equal(viewed.data.notification.status, "viewed");
  const summary = await request("/notifications/summary", { headers: userHeaders });
  assert.equal(summary.data.unreadCount, 0);
  const deleted = await request(`/notifications/${notificationId}`, { method: "DELETE", headers: userHeaders });
  assert.equal(deleted.status, 200);
  const afterDelete = await request("/notifications", { headers: userHeaders });
  assert.ok(!afterDelete.data.notifications.some((item) => item.id === notificationId));
  const cleared = await request("/notifications", { method: "DELETE", headers: userHeaders });
  assert.equal(cleared.status, 200);
  const afterClear = await request("/notifications", { headers: userHeaders });
  assert.equal(afterClear.data.notifications.length, 0);

  await request(`/queues/${serviceId}/leave`, { method: "DELETE", headers: userHeaders });
  const history = await request("/history/me", { headers: userHeaders });
  assert.equal(history.data.history[0].status, "canceled");
  assert.ok(history.data.history[0].completedAt);
  const historySummary = await request("/history/me/summary", { headers: userHeaders });
  assert.equal(historySummary.data.canceled, 1);

  const rejoined = await request(`/queues/${serviceId}/join`, { method: "POST", headers: userHeaders, body: "{}" });
  assert.equal(rejoined.status, 201);
});
