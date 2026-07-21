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
  await request("/auth/register", { method: "POST", body: JSON.stringify({ email, password: "test123" }) });
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

  const notifications = await request("/notifications", { headers: userHeaders });
  const history = await request("/history/me", { headers: userHeaders });
  assert.ok(notifications.data.notifications.length >= 2);
  assert.equal(history.data.history[0].outcome, "Served");

  const createdService = await request("/services", { method: "POST", headers: adminHeaders, body: JSON.stringify({ serviceName: "Testing", description: "Integration test service", expectedDuration: 12, priority: "medium" }) });
  assert.equal(createdService.status, 201);
  const updatedService = await request(`/services/${createdService.data.service.id}`, { method: "PATCH", headers: adminHeaders, body: JSON.stringify({ serviceName: "Updated Testing", description: "Updated integration service", expectedDuration: 18, priority: "high" }) });
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
