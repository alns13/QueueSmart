import assert from "node:assert/strict";
import test from "node:test";
import {
  MIN_SAVINGS_MINUTES,
  pickAlternativeRecommendation,
} from "../src/modules/smart/smart.service.js";

const snapshots = [
  {
    serviceId: 1,
    serviceName: "Admissions",
    description: "Enrollment help",
    expectedDuration: 10,
    status: "open",
    queueLength: 4,
    estimatedWaitTime: 40,
  },
  {
    serviceId: 2,
    serviceName: "Financial Aid",
    description: "FAFSA help",
    expectedDuration: 15,
    status: "open",
    queueLength: 1,
    estimatedWaitTime: 15,
  },
  {
    serviceId: 3,
    serviceName: "Closed Office",
    description: "Not open",
    expectedDuration: 5,
    status: "closed",
    queueLength: 0,
    estimatedWaitTime: 0,
  },
];

test("recommends the open service with the shortest wait", () => {
  const result = pickAlternativeRecommendation(snapshots, 1);

  assert.equal(result.selected.serviceId, 1);
  assert.equal(result.recommended.serviceId, 2);
  assert.equal(result.savingsMinutes, 25);
  assert.match(result.message, /Financial Aid/);
});

test("does not recommend when selected service is already the shortest", () => {
  const result = pickAlternativeRecommendation(snapshots, 2);

  assert.equal(result.selected.serviceId, 2);
  assert.equal(result.recommended, null);
  assert.equal(result.savingsMinutes, 0);
  assert.match(result.message, /shortest estimated wait/i);
});

test("never recommends a closed queue", () => {
  const result = pickAlternativeRecommendation(snapshots, 1);
  assert.notEqual(result.recommended?.serviceId, 3);
});

test("returns overall best when no serviceId is provided", () => {
  const result = pickAlternativeRecommendation(snapshots, null);
  assert.equal(result.selected, null);
  assert.equal(result.recommended.serviceId, 2);
});

test("respects minimum savings threshold", () => {
  const near = [
    {
      serviceId: 1,
      serviceName: "A",
      expectedDuration: 10,
      status: "open",
      queueLength: 2,
      estimatedWaitTime: 20,
    },
    {
      serviceId: 2,
      serviceName: "B",
      expectedDuration: 10,
      status: "open",
      queueLength: 2,
      estimatedWaitTime: 20,
    },
  ];

  const result = pickAlternativeRecommendation(near, 1, MIN_SAVINGS_MINUTES);
  assert.equal(result.recommended, null);
});

test("handles no open queues", () => {
  const closedOnly = snapshots.map((item) => ({ ...item, status: "closed" }));
  const result = pickAlternativeRecommendation(closedOnly, 1);
  assert.equal(result.recommended, null);
  assert.match(result.message, /No open service queues/i);
});

test("breaks equal wait-time ties by choosing the shorter queue", () => {
  const tied = [
    {
      serviceId: 1,
      serviceName: "Service A",
      expectedDuration: 10,
      status: "open",
      queueLength: 3,
      estimatedWaitTime: 20,
    },
    {
      serviceId: 2,
      serviceName: "Service B",
      expectedDuration: 20,
      status: "open",
      queueLength: 1,
      estimatedWaitTime: 20,
    },
  ];

  const result = pickAlternativeRecommendation(tied, null);

  assert.equal(result.selected, null);
  assert.equal(result.recommended.serviceId, 2);
  assert.equal(result.recommended.queueLength, 1);
});
