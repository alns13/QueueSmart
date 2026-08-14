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
      body: JSON.stringify({ email, password, fullName: "Queue Tester" }),
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

  test("service duration must be a number", async (t) => {
    const request = await startTestServer(t);
    const adminHeaders = await createAdminHeaders(request);

    const response = await request("/services", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        serviceName: "Strict Validation",
        description: "Rejects numeric strings",
        expectedDuration: "15",
        priority: "low",
        laneWaitThresholdMinutes: 60,
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(response.data.error, "Expected duration must be a number");
  });

  test("queue orders by priority then arrival", async (t) => {
    const request = await startTestServer(t);
    const adminHeaders = await createAdminHeaders(request);
    const service = await request("/services", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        serviceName: `Ordering ${Date.now()}`,
        description: "Queue ordering test",
        expectedDuration: 10,
        priority: "low",
        laneWaitThresholdMinutes: 60,
      }),
    });
    const queueId = service.data.service.lanes[0].queueId;

    const users = [];
    for (const priority of ["low", "high", "high"]) {
      const email = `ordering-${Date.now()}-${Math.random()}@example.com`;
      const password = "test123";
      await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, fullName: "Ordering Tester" }),
      });
      const login = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const headers = { Authorization: `Bearer ${login.data.token}` };
      await request(`/queues/${service.data.service.id}/join`, {
        method: "POST",
        headers,
        body: JSON.stringify({ priority }),
      });
      users.push({ email, headers });
    }

    const queue = await request(`/admin/queues/${queueId}`, {
      headers: adminHeaders,
    });

    assert.deepEqual(
      queue.data.queue.entries.map((entry) => entry.email),
      [users[1].email, users[2].email, users[0].email]
    );

    for (const user of users) {
      await request(`/queues/${service.data.service.id}/leave`, {
        method: "DELETE",
        headers: user.headers,
      });
    }
  });

  test("closed queue blocks joining and reopening allows it", async (t) => {
    const request = await startTestServer(t);
    const adminHeaders = await createAdminHeaders(request);
    const userHeaders = await createUserHeaders(request);

    const service = await request("/services", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        serviceName: `Lifecycle ${Date.now()}-${Math.random()}`,
        description: "Queue close and reopen test",
        expectedDuration: 10,
        priority: "low",
        laneWaitThresholdMinutes: 60,
      }),
    });

    assert.equal(service.status, 201);

    const serviceId = service.data.service.id;
    const queueId = service.data.service.lanes[0].queueId;

    const closeResponse = await request(
      `/admin/queues/${queueId}/status`,
      {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({ status: "closed" }),
      }
    );

    assert.equal(closeResponse.status, 200);
    assert.equal(closeResponse.data.queue.status, "closed");

    const blockedJoin = await request(`/queues/${serviceId}/join`, {
      method: "POST",
      headers: userHeaders,
      body: "{}",
    });

    assert.equal(blockedJoin.status, 409);
    assert.equal(blockedJoin.data.error, "This queue is closed");

    const reopenResponse = await request(
      `/admin/queues/${queueId}/status`,
      {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({ status: "open" }),
      }
    );

    assert.equal(reopenResponse.status, 200);
    assert.equal(reopenResponse.data.queue.status, "open");

    const successfulJoin = await request(`/queues/${serviceId}/join`, {
      method: "POST",
      headers: userHeaders,
      body: "{}",
    });

    assert.equal(successfulJoin.status, 201);

    await request(`/queues/${serviceId}/leave`, {
      method: "DELETE",
      headers: userHeaders,
    });
  });

  test("admin can move and remove queue entries", async (t) => {
    const request = await startTestServer(t);
    const adminHeaders = await createAdminHeaders(request);

    const service = await request("/services", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        serviceName: `Move Remove ${Date.now()}-${Math.random()}`,
        description: "Queue move and remove test",
        expectedDuration: 10,
        priority: "low",
        laneWaitThresholdMinutes: 60,
      }),
    });

    assert.equal(service.status, 201);

    const serviceId = service.data.service.id;
    const queueId = service.data.service.lanes[0].queueId;
    const users = [];

    for (let index = 0; index < 3; index += 1) {
      const email = `move-remove-${Date.now()}-${index}-${Math.random()}@example.com`;
      const password = "test123";

      const registration = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          fullName: `Move Tester ${index + 1}`,
        }),
      });

      assert.equal(registration.status, 201);

      const login = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      assert.equal(login.status, 200);

      const headers = {
        Authorization: `Bearer ${login.data.token}`,
      };

      const joined = await request(`/queues/${serviceId}/join`, {
        method: "POST",
        headers,
        body: "{}",
      });

      assert.equal(joined.status, 201);
      users.push({ email, headers });
    }

    const initialQueue = await request(`/admin/queues/${queueId}`, {
      headers: adminHeaders,
    });

    assert.equal(initialQueue.status, 200);
    assert.deepEqual(
      initialQueue.data.queue.entries.map((entry) => entry.email),
      users.map((user) => user.email)
    );

    const thirdEntry = initialQueue.data.queue.entries.find(
      (entry) => entry.email === users[2].email
    );

    const moved = await request(
      `/admin/queues/${queueId}/entries/${thirdEntry.id}/move`,
      {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({ direction: -1 }),
      }
    );

    assert.equal(moved.status, 200);
    assert.deepEqual(
      moved.data.queue.entries.map((entry) => entry.email),
      [users[0].email, users[2].email, users[1].email]
    );

    const removed = await request(
      `/admin/queues/${queueId}/entries/${thirdEntry.id}`,
      {
        method: "DELETE",
        headers: adminHeaders,
      }
    );

    assert.equal(removed.status, 200);
    assert.equal(removed.data.removed.status, "canceled");

    const remainingQueue = await request(`/admin/queues/${queueId}`, {
      headers: adminHeaders,
    });

    assert.deepEqual(
      remainingQueue.data.queue.entries.map((entry) => entry.email),
      [users[0].email, users[1].email]
    );

    assert.deepEqual(
      remainingQueue.data.queue.entries.map((entry) => entry.position),
      [1, 2]
    );

    const removedUserHistory = await request("/history/me", {
      headers: users[2].headers,
    });

    assert.equal(removedUserHistory.status, 200);
    assert.equal(removedUserHistory.data.history[0].status, "canceled");

    for (const user of [users[0], users[1]]) {
      await request(`/queues/${serviceId}/leave`, {
        method: "DELETE",
        headers: user.headers,
      });
    }
  });