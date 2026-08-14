import prisma from "../../db/prisma.js";
import { createError } from "../../middleware/errorHandler.js";
import {
  ACTIVE_STATUSES,
  laneSnapshot,
  maybeNotifyAdminsAboutCapacity,
} from "./capacity.service.js";

/** Minimum wait savings (minutes) before suggesting a different lane. */
export const MIN_SAVINGS_MINUTES = 1;

/**
 * Pure recommendation logic: only compares open lanes within one service.
 */
export function pickLaneRecommendation(laneSnapshots, selectedQueueId, minSavingsMinutes = MIN_SAVINGS_MINUTES) {
  const open = laneSnapshots.filter((item) => item.status === "open");

  if (open.length === 0) {
    return {
      selected: null,
      recommended: null,
      savingsMinutes: 0,
      message: "No open lanes are available for this service right now.",
    };
  }

  const selectedId = selectedQueueId == null ? null : Number(selectedQueueId);
  const selected =
    selectedId == null
      ? null
      : open.find((item) => item.queueId === selectedId) || null;

  const best = open.reduce((winner, item) => {
    if (!winner) return item;
    if (item.estimatedWaitTime < winner.estimatedWaitTime) return item;
    if (
      item.estimatedWaitTime === winner.estimatedWaitTime &&
      item.queueLength < winner.queueLength
    ) {
      return item;
    }
    if (
      item.estimatedWaitTime === winner.estimatedWaitTime &&
      item.queueLength === winner.queueLength &&
      item.laneNumber < winner.laneNumber
    ) {
      return item;
    }
    return winner;
  }, null);

  if (!selected) {
    return {
      selected: null,
      recommended: open.length > 1 ? best : null,
      savingsMinutes: 0,
      message: best
        ? open.length > 1
          ? `${best.serviceName} Lane ${best.laneNumber} currently has the shortest wait (${best.estimatedWaitTime} min).`
          : `${best.serviceName} currently has an estimated wait of ${best.estimatedWaitTime} min.`
        : "No recommendation available.",
    };
  }

  if (best.queueId === selected.queueId) {
    return {
      selected,
      recommended: null,
      savingsMinutes: 0,
      message: `${selected.serviceName} Lane ${selected.laneNumber} currently has the shortest estimated wait (${selected.estimatedWaitTime} min).`,
    };
  }

  const savingsMinutes = selected.estimatedWaitTime - best.estimatedWaitTime;
  if (savingsMinutes < minSavingsMinutes) {
    return {
      selected,
      recommended: null,
      savingsMinutes: 0,
      message: `${selected.serviceName} Lane ${selected.laneNumber} is a good choice—no meaningfully shorter open lane was found.`,
    };
  }

  return {
    selected,
    recommended: best,
    savingsMinutes,
    message: `${best.serviceName} Lane ${best.laneNumber} has a shorter wait (${best.estimatedWaitTime} min vs ${selected.estimatedWaitTime} min). You could save about ${savingsMinutes} minutes.`,
  };
}

export async function buildLaneSnapshotsForService(serviceId) {
  const service = await prisma.service.findUnique({
    where: { id: Number(serviceId) },
    include: { queues: { orderBy: { laneNumber: "asc" } } },
  });
  if (!service || service.archived) {
    throw createError(404, "Service not found");
  }

  return Promise.all(
    service.queues.map(async (queue) => {
      const snap = await laneSnapshot(queue, service.expectedDuration);
      return {
        ...snap,
        serviceName: service.serviceName,
        description: service.description,
        expectedDuration: service.expectedDuration,
      };
    })
  );
}

export async function recommendAlternativeService(selectedServiceId, selectedQueueId) {
  if (selectedServiceId == null || selectedServiceId === "") {
    return {
      selected: null,
      recommended: null,
      savingsMinutes: 0,
      message: "Select a service to see lane recommendations for that service.",
    };
  }

  const id = Number(selectedServiceId);
  if (!Number.isInteger(id) || id <= 0) {
    throw createError(400, "serviceId must be a positive integer");
  }

  const snapshots = await buildLaneSnapshotsForService(id);
  let queueId = selectedQueueId == null || selectedQueueId === ""
    ? null
    : Number(selectedQueueId);

  if (queueId == null) {
    const open = snapshots.filter((item) => item.status === "open");
    queueId = open.sort(
      (a, b) => a.estimatedWaitTime - b.estimatedWaitTime || a.laneNumber - b.laneNumber
    )[0]?.queueId ?? snapshots[0]?.queueId ?? null;
  }

  return pickLaneRecommendation(snapshots, queueId, MIN_SAVINGS_MINUTES);
}

/** Called after joins so admins are alerted when a service crosses its threshold. */
export async function afterQueueChange(serviceId) {
  await maybeNotifyAdminsAboutCapacity(serviceId);
}
