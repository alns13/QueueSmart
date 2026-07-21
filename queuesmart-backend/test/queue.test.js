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

test("unauthenticated user cannot join a queue", async (t) => {
  const request = await startTestServer(t);

  const response = await request("/queues/1/join", {
    method: "POST",
    body: "{}",
  });

  assert.equal(response.status, 401);
});

async function createUserHeaders(request) {
    const email = `queue-test-${Date.now()}-${Math.random()}@example.com`;
    const password = "test123";
  
    await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  
    const login = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  
    assert.equal(login.status, 200);
  
    return {
      Authorization: `Bearer ${login.data.token}`,
    };
  }

  test("joining a nonexistent service returns 404", async (t) => {
    const request = await startTestServer(t);
    const userHeaders = await createUserHeaders(request);
  
    const response = await request("/queues/9999/join", {
      method: "POST",
      headers: userHeaders,
      body: "{}",
    });
  
    assert.equal(response.status, 404);
  });

  test("user cannot join more than one queue", async (t) => {
    const request = await startTestServer(t);
    const userHeaders = await createUserHeaders(request);
  
    const firstJoin = await request("/queues/1/join", {
      method: "POST",
      headers: userHeaders,
      body: "{}",
    });
  
    assert.equal(firstJoin.status, 201);
  
    const secondJoin = await request("/queues/2/join", {
      method: "POST",
      headers: userHeaders,
      body: "{}",
    });
  
    assert.equal(secondJoin.status, 409);
    assert.equal(secondJoin.data.error, "You are already in a queue");
  
    // Cleanup so this test does not leave an active queue entry behind.
    await request("/queues/1/leave", {
      method: "DELETE",
      headers: userHeaders,
    });
  });

  test("regular user cannot access admin queue routes", async (t) => {
    const request = await startTestServer(t);
    const userHeaders = await createUserHeaders(request);
  
    const response = await request("/admin/queues", {
      headers: userHeaders,
    });
  
    assert.equal(response.status, 403);
  });

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

  test("admin cannot serve an empty queue", async (t) => {
    const request = await startTestServer(t);
    const adminHeaders = await createAdminHeaders(request);
  
    const response = await request("/admin/queues/3/serve-next", {
      method: "POST",
      headers: adminHeaders,
    });
  
    assert.equal(response.status, 404);
    assert.equal(response.data.error, "No users are waiting");
  });