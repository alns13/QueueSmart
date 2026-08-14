import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import app from "../src/app.js";

async function startTestServer(t) {
  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => server.close());
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    return { status: response.status, data: await response.json() };
  }

  return request;
}

async function createUserHeaders(request) {
  const email = `retire-${Date.now()}-${Math.random()}@example.com`;
  await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password: "test123", fullName: "Retire Tester" }),
  });
  const login = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "test123" }),
  });
  assert.equal(login.status, 200);
  return { Authorization: `Bearer ${login.data.token}` };
}

async function createAdminHeaders(request) {
  const login = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@email.com", password: "admin123" }),
  });
  assert.equal(login.status, 200);
  return { Authorization: `Bearer ${login.data.token}` };
}

test("users only see open services and cannot join retired ones", async (t) => {
  const request = await startTestServer(t);
  const adminHeaders = await createAdminHeaders(request);
  const userHeaders = await createUserHeaders(request);

  const created = await request("/services", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      serviceName: `Retire Visible ${Date.now()}-${Math.random()}`,
      description: "Retire visibility test",
      expectedDuration: 8,
      priority: "low",
    }),
  });
  assert.equal(created.status, 201);
  const serviceId = created.data.service.id;

  const close = await request(`/admin/queues/${serviceId}/status`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({ status: "closed" }),
  });
  assert.equal(close.status, 200);

  const userListClosed = await request("/services", { headers: userHeaders });
  assert.equal(userListClosed.status, 200);
  assert.equal(userListClosed.data.services.some((service) => service.id === serviceId), false);

  const adminList = await request("/services", { headers: adminHeaders });
  assert.equal(adminList.data.services.some((service) => service.id === serviceId), true);

  const retired = await request(`/services/${serviceId}/retire`, { method: "POST", headers: adminHeaders });
  assert.equal(retired.status, 200);
  assert.equal(retired.data.service.archived, true);

  const blockedJoin = await request(`/queues/${serviceId}/join`, {
    method: "POST",
    headers: userHeaders,
    body: "{}",
  });
  assert.equal(blockedJoin.status, 409);
  assert.equal(blockedJoin.data.error, "This service is no longer available");
});

test("retire requires a closed empty queue and preserves history", async (t) => {
  const request = await startTestServer(t);
  const adminHeaders = await createAdminHeaders(request);
  const userHeaders = await createUserHeaders(request);

  const created = await request("/services", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      serviceName: `Retire Flow ${Date.now()}-${Math.random()}`,
      description: "Retire safeguard test",
      expectedDuration: 6,
      priority: "medium",
    }),
  });
  assert.equal(created.status, 201);
  const serviceId = created.data.service.id;

  const openRetire = await request(`/services/${serviceId}/retire`, { method: "POST", headers: adminHeaders });
  assert.equal(openRetire.status, 409);
  assert.equal(openRetire.data.details.code, "QUEUE_OPEN");

  const joined = await request(`/queues/${serviceId}/join`, { method: "POST", headers: userHeaders, body: "{}" });
  assert.equal(joined.status, 201);

  await request(`/admin/queues/${serviceId}/status`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({ status: "closed" }),
  });

  const busyRetire = await request(`/services/${serviceId}/retire`, { method: "POST", headers: adminHeaders });
  assert.equal(busyRetire.status, 409);
  assert.equal(busyRetire.data.details.code, "QUEUE_NOT_EMPTY");
  assert.equal(busyRetire.data.details.waiting, 1);

  const notifications = await request("/notifications", { headers: userHeaders });
  assert.ok(notifications.data.notifications.some((item) => item.message.includes("queue is closing")));

  await request(`/admin/queues/${serviceId}/serve-next`, { method: "POST", headers: adminHeaders });
  await request(`/admin/queues/${serviceId}/complete-current`, { method: "POST", headers: adminHeaders });

  const historyBefore = await request("/history/me", { headers: userHeaders });
  assert.equal(historyBefore.data.history[0].outcome, "Served");
  const serviceName = historyBefore.data.history[0].serviceName;

  const retired = await request(`/services/${serviceId}/retire`, { method: "POST", headers: adminHeaders });
  assert.equal(retired.status, 200);
  assert.equal(retired.data.service.archived, true);

  const historyAfter = await request("/history/me", { headers: userHeaders });
  assert.equal(historyAfter.data.history[0].serviceName, serviceName);
  assert.equal(historyAfter.data.history[0].outcome, "Served");

  const reopen = await request(`/admin/queues/${serviceId}/status`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({ status: "open" }),
  });
  assert.equal(reopen.status, 409);
});
