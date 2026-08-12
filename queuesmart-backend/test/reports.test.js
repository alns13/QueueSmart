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

    const contentType = response.headers.get("content-type") || "";

    return {
      status: response.status,
      data: contentType.includes("application/json")
        ? await response.json()
        : await response.text(),
      headers: response.headers,
    };
  }

  return request;
}

test("admin reporting endpoints return customer, service, and queue usage data", async (t) => {
  const request = await startTestServer(t);

  const adminLogin = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "admin@email.com",
      password: "admin123",
    }),
  });

  assert.equal(adminLogin.status, 200);

  const adminHeaders = {
    Authorization: `Bearer ${adminLogin.data.token}`,
  };

  const serviceName = `Report Service ${Date.now()}-${Math.random()}`;

  const createdService = await request("/services", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      serviceName,
      description: "Reporting integration test service",
      expectedDuration: 10,
      priority: "low",
    }),
  });

  assert.equal(createdService.status, 201);

  const serviceId = createdService.data.service.id;

  const email = `report-user-${Date.now()}-${Math.random()}@example.com`;
  const password = "test123";

  const registration = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      fullName: "Report Test User",
    }),
  });

  assert.equal(registration.status, 201);

  const userLogin = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  assert.equal(userLogin.status, 200);

  const userHeaders = {
    Authorization: `Bearer ${userLogin.data.token}`,
  };

  const joined = await request(`/queues/${serviceId}/join`, {
    method: "POST",
    headers: userHeaders,
    body: "{}",
  });

  assert.equal(joined.status, 201);

  const served = await request(
    `/admin/queues/${serviceId}/serve-next`,
    {
      method: "POST",
      headers: adminHeaders,
    }
  );

  assert.equal(served.status, 200);

  const completed = await request(
    `/admin/queues/${serviceId}/complete-current`,
    {
      method: "POST",
      headers: adminHeaders,
    }
  );

  assert.equal(completed.status, 200);

  const firstCustomerPage = await request(
    "/admin/queues/reports/customers",
    {
      headers: adminHeaders,
    }
  );
  
  assert.equal(firstCustomerPage.status, 200);
  
  const lastPage = firstCustomerPage.data.pagination.totalPages;
  
  const customers = await request(
    `/admin/queues/reports/customers?page=${lastPage}`,
    {
      headers: adminHeaders,
    }
  );
  
  assert.equal(customers.status, 200);
  
  const customer = customers.data.customers.find(
    (item) => item.email === email
  );
  
  assert.ok(customer);
  assert.equal(customer.name, "Report Test User");
  assert.ok(customer.totalVisits >= 1);

  const history = await request(
    `/admin/queues/reports/customers/${customer.id}/history`,
    {
      headers: adminHeaders,
    }
  );

  assert.equal(history.status, 200);

  const historyEntry = history.data.history.find(
    (entry) => entry.service === serviceName
  );

  assert.ok(historyEntry);
  assert.equal(historyEntry.status, "served");

  const services = await request(
    "/admin/queues/reports/services",
    {
      headers: adminHeaders,
    }
  );

  assert.equal(services.status, 200);

  const serviceReport = services.data.serviceActivity.find(
    (item) => item.id === serviceId
  );

  assert.ok(serviceReport);
  assert.equal(serviceReport.serviceName, serviceName);
  assert.ok(serviceReport.served >= 1);

  const queueUsage = await request(
    "/admin/queues/reports/queue-usage",
    {
      headers: adminHeaders,
    }
  );

  assert.equal(queueUsage.status, 200);

  const usage = queueUsage.data.queueUsage.find(
    (item) => item.id === serviceId
  );

  assert.ok(usage);
  assert.equal(usage.serviceName, serviceName);
  assert.ok(usage.usersServed >= 1);
  assert.ok(usage.totalVisits >= 1);
  assert.ok(usage.averageWaitTime >= 0);

  const summary = await request(
    "/admin/queues/reports/summary",
    {
      headers: adminHeaders,
    }
  );

  assert.equal(summary.status, 200);
  assert.ok(summary.data.completedToday >= 1);

  const csvExport = await request(
    "/admin/queues/reports/queue-usage.csv",
    {
      headers: adminHeaders,
    }
  );

  assert.equal(csvExport.status, 200);
  assert.match(csvExport.headers.get("content-type"), /^text\/csv/);
  assert.match(
    csvExport.headers.get("content-disposition"),
    /^attachment; filename="queuesmart-queue-usage-\d{4}-\d{2}-\d{2}\.csv"$/
  );
  assert.equal(csvExport.headers.get("cache-control"), "private, no-store");
  assert.equal(
    csvExport.headers.get("access-control-expose-headers"),
    "Content-Disposition"
  );
  assert.match(
    csvExport.data,
    /^Service,Users Served,Average Wait Time \(min\),Total Visits,Canceled/
  );
  assert.ok(csvExport.data.includes(serviceName));
});

test("regular user cannot access reporting endpoints", async (t) => {
    const request = await startTestServer(t);
  
    const email = `report-denied-${Date.now()}-${Math.random()}@example.com`;
    const password = "test123";
  
    const registration = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        fullName: "Report Denied User",
      }),
    });
  
    assert.equal(registration.status, 201);
  
    const login = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  
    assert.equal(login.status, 200);
  
    const userHeaders = {
      Authorization: `Bearer ${login.data.token}`,
    };
  
    const endpoints = [
      "/admin/queues/reports/summary",
      "/admin/queues/reports/customers",
      "/admin/queues/reports/services",
      "/admin/queues/reports/queue-usage",
      "/admin/queues/reports/queue-usage.csv",
    ];
  
    for (const endpoint of endpoints) {
      const response = await request(endpoint, {
        headers: userHeaders,
      });
  
      assert.equal(response.status, 403);
    }
  });
