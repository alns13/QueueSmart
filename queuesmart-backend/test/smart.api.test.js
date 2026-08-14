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

    return {
      status: response.status,
      data: await response.json(),
    };
  }

  return request;
}

async function createAdminHeaders(request) {
  const login = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "admin@email.com",
      password: "admin123",
    }),
  });

  assert.equal(login.status, 200);

  return {
    Authorization: `Bearer ${login.data.token}`,
  };
}

test("smart recommendation endpoint requires authentication", async (t) => {
  const request = await startTestServer(t);

  const response = await request("/smart/recommend");

  assert.equal(response.status, 401);
});

test("smart recommendation endpoint returns a prompt when no service is selected", async (t) => {
  const request = await startTestServer(t);
  const adminHeaders = await createAdminHeaders(request);

  const response = await request("/smart/recommend", {
    headers: adminHeaders,
  });

  assert.equal(response.status, 200);
  assert.equal(response.data.selected, null);
  assert.equal(response.data.recommended, null);
  assert.match(response.data.message, /select a service/i);
});

test("smart recommendation rejects an invalid serviceId", async (t) => {
  const request = await startTestServer(t);
  const adminHeaders = await createAdminHeaders(request);

  const response = await request(
    "/smart/recommend?serviceId=abc",
    {
      headers: adminHeaders,
    }
  );

  assert.equal(response.status, 400);
  assert.equal(
    response.data.error,
    "serviceId must be a positive integer"
  );
});

test("smart recommendation returns 404 for a nonexistent service", async (t) => {
  const request = await startTestServer(t);
  const adminHeaders = await createAdminHeaders(request);

  const response = await request(
    "/smart/recommend?serviceId=999999",
    {
      headers: adminHeaders,
    }
  );

  assert.equal(response.status, 404);
  assert.equal(response.data.error, "Service not found");
});

test("smart recommendation accepts a valid selected service", async (t) => {
  const request = await startTestServer(t);
  const adminHeaders = await createAdminHeaders(request);

  const service = await request("/services", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      serviceName: `Smart API ${Date.now()}-${Math.random()}`,
      description: "Smart recommendation API test",
      expectedDuration: 5,
      priority: "low",
      laneWaitThresholdMinutes: 60,
    }),
  });

  assert.equal(service.status, 201);

  const serviceId = service.data.service.id;

  const response = await request(
    `/smart/recommend?serviceId=${serviceId}`,
    {
      headers: adminHeaders,
    }
  );

  assert.equal(response.status, 200);
  assert.equal(response.data.selected.serviceId, serviceId);
  assert.equal(typeof response.data.message, "string");
});