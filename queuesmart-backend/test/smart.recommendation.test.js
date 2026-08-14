import assert from "node:assert/strict";
import test from "node:test";
import { pickLaneRecommendation } from "../src/modules/smart/smart.service.js";

const lane = (overrides) => ({
  queueId: 1,
  serviceId: 1,
  serviceName: "Technical Support",
  laneNumber: 1,
  status: "open",
  queueLength: 1,
  estimatedWaitTime: 10,
  ...overrides,
});

test("recommends the open lane with the shortest wait", () => {
  const snapshots = [
    lane({ queueId: 1, laneNumber: 1, estimatedWaitTime: 40, queueLength: 4 }),
    lane({ queueId: 2, laneNumber: 2, estimatedWaitTime: 10, queueLength: 1 }),
  ];
  const result = pickLaneRecommendation(snapshots, 1);
  assert.equal(result.recommended.queueId, 2);
  assert.equal(result.savingsMinutes, 30);
});

test("does not recommend when selected lane is already the shortest", () => {
  const snapshots = [
    lane({ queueId: 1, laneNumber: 1, estimatedWaitTime: 10, queueLength: 1 }),
    lane({ queueId: 2, laneNumber: 2, estimatedWaitTime: 40, queueLength: 4 }),
  ];
  const result = pickLaneRecommendation(snapshots, 1);
  assert.equal(result.recommended, null);
  assert.match(result.message, /shortest estimated wait/i);
});

test("never recommends a closed lane", () => {
  const snapshots = [
    lane({ queueId: 1, laneNumber: 1, estimatedWaitTime: 40, queueLength: 4 }),
    lane({
      queueId: 2,
      laneNumber: 2,
      status: "closed",
      estimatedWaitTime: 0,
      queueLength: 0,
    }),
  ];
  const result = pickLaneRecommendation(snapshots, 1);
  assert.equal(result.recommended, null);
});

test("returns overall best lane when no queueId is provided and multiple lanes exist", () => {
  const snapshots = [
    lane({ queueId: 1, laneNumber: 1, estimatedWaitTime: 40, queueLength: 4 }),
    lane({ queueId: 2, laneNumber: 2, estimatedWaitTime: 10, queueLength: 1 }),
  ];
  const result = pickLaneRecommendation(snapshots, null);
  assert.equal(result.recommended.queueId, 2);
});

test("respects minimum savings threshold", () => {
  const snapshots = [
    lane({ queueId: 1, laneNumber: 1, estimatedWaitTime: 11, queueLength: 2 }),
    lane({ queueId: 2, laneNumber: 2, estimatedWaitTime: 10, queueLength: 1 }),
  ];
  const result = pickLaneRecommendation(snapshots, 1, 5);
  assert.equal(result.recommended, null);
});

test("handles no open lanes", () => {
  const snapshots = [
    lane({ status: "closed", estimatedWaitTime: 0, queueLength: 0 }),
  ];
  const result = pickLaneRecommendation(snapshots, 1);
  assert.equal(result.recommended, null);
  assert.match(result.message, /no open lanes/i);
});

test("breaks equal wait-time ties by choosing the lower lane number", () => {
  const snapshots = [
    lane({ queueId: 2, laneNumber: 2, estimatedWaitTime: 10, queueLength: 1 }),
    lane({ queueId: 1, laneNumber: 1, estimatedWaitTime: 10, queueLength: 1 }),
  ];
  const result = pickLaneRecommendation(snapshots, null);
  assert.equal(result.recommended.queueId, 1);
});
