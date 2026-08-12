import prisma from "../../db/prisma.js";
import { createError } from "../../middleware/errorHandler.js";

const ACTIVE_STATUSES = ["waiting", "serving"];

/** Minimum wait savings (minutes) before suggesting a different service. */
export const MIN_SAVINGS_MINUTES = 1;

/**
 * Pure recommendation logic for unit tests and the API.
 * Compares live-style wait estimates and picks a shorter alternative when useful.
 */
export function pickAlternativeRecommendation(snapshots, selectedServiceId, minSavingsMinutes = MIN_SAVINGS_MINUTES) {
  const open = snapshots.filter((item) => item.status === "open");

  if (open.length === 0) {
    return {
      selected: null,
      recommended: null,
      savingsMinutes: 0,
      message: "No open service queues are available right now.",
    };
  }

  const selectedId = selectedServiceId == null ? null : Number(selectedServiceId);
  const selected =
    selectedId == null
      ? null
      : open.find((item) => item.serviceId === selectedId) || null;

  const best = open.reduce((winner, item) => {
    if (!winner) return item;
    if (item.estimatedWaitTime < winner.estimatedWaitTime) return item;
    if (
      item.estimatedWaitTime === winner.estimatedWaitTime &&
      item.queueLength < winner.queueLength
    ) {
      return item;
    }
    return winner;
  }, null);

  if (!selected) {
    return {
      selected: null,
      recommended: best,
      savingsMinutes: 0,
      message: best
        ? `${best.serviceName} currently has the shortest wait (${best.estimatedWaitTime} min).`
        : "No recommendation available.",
    };
  }

  if (best.serviceId === selected.serviceId) {
    return {
      selected,
      recommended: null,
      savingsMinutes: 0,
      message: `${selected.serviceName} currently has the shortest estimated wait (${selected.estimatedWaitTime} min).`,
    };
  }

  const savingsMinutes = selected.estimatedWaitTime - best.estimatedWaitTime;
  if (savingsMinutes < minSavingsMinutes) {
    return {
      selected,
      recommended: null,
      savingsMinutes: 0,
      message: `${selected.serviceName} is a good choice—no meaningfully shorter open queue was found.`,
    };
  }

  return {
    selected,
    recommended: best,
    savingsMinutes,
    message: `${best.serviceName} has a shorter wait (${best.estimatedWaitTime} min vs ${selected.estimatedWaitTime} min). You could save about ${savingsMinutes} minutes.`,
  };
}

export async function buildServiceWaitSnapshots() {
  const services = await prisma.service.findMany({
    include: { queue: true },
    orderBy: { id: "asc" },
  });

  return Promise.all(
    services.map(async (service) => {
      if (!service.queue) {
        return {
          serviceId: service.id,
          serviceName: service.serviceName,
          description: service.description,
          expectedDuration: service.expectedDuration,
          status: "closed",
          queueLength: 0,
          estimatedWaitTime: 0,
        };
      }

      const queueLength =
        service.queue.status === "open"
          ? await prisma.queueEntry.count({
              where: {
                queueId: service.queue.id,
                status: { in: ACTIVE_STATUSES },
              },
            })
          : 0;

      return {
        serviceId: service.id,
        serviceName: service.serviceName,
        description: service.description,
        expectedDuration: service.expectedDuration,
        status: service.queue.status,
        queueLength,
        estimatedWaitTime: queueLength * service.expectedDuration,
      };
    })
  );
}

export async function recommendAlternativeService(selectedServiceId) {
  const snapshots = await buildServiceWaitSnapshots();

  if (selectedServiceId != null && selectedServiceId !== "") {
    const id = Number(selectedServiceId);
    if (!Number.isInteger(id) || id <= 0) {
      throw createError(400, "serviceId must be a positive integer");
    }
    const exists = snapshots.some((item) => item.serviceId === id);
    if (!exists) {
      throw createError(404, "Service not found");
    }
  }

  return pickAlternativeRecommendation(
    snapshots,
    selectedServiceId,
    MIN_SAVINGS_MINUTES
  );
}
