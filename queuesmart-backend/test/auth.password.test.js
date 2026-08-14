import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import app from "../src/app.js";

test("authenticated users can change their password", async (t) => {
  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => server.close());
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    return { status: response.status, data: await response.json() };
  }

  const email = `password-${Date.now()}-${Math.random()}@example.com`;
  await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password: "oldpass1", fullName: "Password Tester" }),
  });
  const login = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "oldpass1" }),
  });
  assert.equal(login.status, 200);
  const headers = { Authorization: `Bearer ${login.data.token}` };

  const wrongCurrent = await request("/auth/change-password", {
    method: "POST",
    headers,
    body: JSON.stringify({
      currentPassword: "wrongpass",
      newPassword: "newpass1",
      confirmPassword: "newpass1",
    }),
  });
  assert.equal(wrongCurrent.status, 401);

  const changed = await request("/auth/change-password", {
    method: "POST",
    headers,
    body: JSON.stringify({
      currentPassword: "oldpass1",
      newPassword: "newpass1",
      confirmPassword: "newpass1",
    }),
  });
  assert.equal(changed.status, 200);

  const oldLogin = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "oldpass1" }),
  });
  assert.equal(oldLogin.status, 401);

  const newLogin = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "newpass1" }),
  });
  assert.equal(newLogin.status, 200);
});
