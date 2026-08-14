import prisma from "../../db/prisma.js";

export const MAX_LANES_PER_SERVICE = 3;
export const ACTIVE_STATUSES = ["waiting", "serving"];

export function lastPersonWaitMinutes(waitingCount, expectedDuration) {
  return Math.max(0, Number(waitingCount) || 0) * (Number(expectedDuration) || 0);
}

export async function waitingCount(queueId, tx = prisma) {
  return tx.queueEntry.count({ where: { queueId, status: "waiting" } });
}

export async function activeCount(queueId, tx = prisma) {
  return tx.queueEntry.count({
    where: { queueId, status: { in: ACTIVE_STATUSES } },
  });
}

export async function laneSnapshot(queue, expectedDuration, tx = prisma) {
  const waiting = await waitingCount(queue.id, tx);
  const active = await activeCount(queue.id, tx);
  return {
    queueId: queue.id,
    serviceId: queue.serviceId,
    laneNumber: queue.laneNumber,
    status: queue.status,
    waiting,
    queueLength: active,
    estimatedWaitTime: active * expectedDuration,
    lastPersonWaitMinutes: lastPersonWaitMinutes(waiting, expectedDuration),
  };
}

/**
 * Suggest opening/reopening a lane when every open lane's last-person wait
 * is at or above the service threshold (or there are no open lanes with capacity).
 */
export async function evaluateCapacity(serviceId) {
  const service = await prisma.service.findUnique({
    where: { id: Number(serviceId) },
    include: { queues: { orderBy: { laneNumber: "asc" } } },
  });
  if (!service || service.archived) return null;

  const openLanes = service.queues.filter((queue) => queue.status === "open");
  const closedLanes = service.queues.filter((queue) => queue.status === "closed");
  const snapshots = await Promise.all(
    openLanes.map((queue) => laneSnapshot(queue, service.expectedDuration))
  );

  const worstOpenWait = snapshots.length
    ? Math.max(...snapshots.map((item) => item.lastPersonWaitMinutes))
    : 0;
  const bestOpenWait = snapshots.length
    ? Math.min(...snapshots.map((item) => item.lastPersonWaitMinutes))
    : Number.POSITIVE_INFINITY;

  const threshold = service.laneWaitThresholdMinutes;
  const overloaded = snapshots.length > 0 && bestOpenWait >= threshold;
  const canReopen = closedLanes.length > 0;
  const canOpenNew = service.queues.length < MAX_LANES_PER_SERVICE;

  if (!overloaded) {
    return {
      serviceId: service.id,
      serviceName: service.serviceName,
      thresholdMinutes: threshold,
      bestOpenWaitMinutes: snapshots.length ? bestOpenWait : 0,
      worstOpenWaitMinutes: worstOpenWait,
      openLaneCount: openLanes.length,
      totalLaneCount: service.queues.length,
      needsCapacity: false,
      action: null,
      reopenQueueId: null,
      nextLaneNumber: null,
      message: null,
    };
  }

  if (canReopen) {
    const reopen = closedLanes[0];
    return {
      serviceId: service.id,
      serviceName: service.serviceName,
      thresholdMinutes: threshold,
      bestOpenWaitMinutes: bestOpenWait,
      worstOpenWaitMinutes: worstOpenWait,
      openLaneCount: openLanes.length,
      totalLaneCount: service.queues.length,
      needsCapacity: true,
      action: "reopen",
      reopenQueueId: reopen.id,
      nextLaneNumber: null,
      message: `${service.serviceName} wait is about ${bestOpenWait} minutes (threshold ${threshold}). Reopen Lane ${reopen.laneNumber} so customers can split across windows.`,
    };
  }

  if (canOpenNew) {
    const nextLaneNumber = service.queues.length + 1;
    return {
      serviceId: service.id,
      serviceName: service.serviceName,
      thresholdMinutes: threshold,
      bestOpenWaitMinutes: bestOpenWait,
      worstOpenWaitMinutes: worstOpenWait,
      openLaneCount: openLanes.length,
      totalLaneCount: service.queues.length,
      needsCapacity: true,
      action: "open",
      reopenQueueId: null,
      nextLaneNumber,
      message: `${service.serviceName} wait is about ${bestOpenWait} minutes (threshold ${threshold}). Open Lane ${nextLaneNumber} so a second window can serve this service.`,
    };
  }

  return {
    serviceId: service.id,
    serviceName: service.serviceName,
    thresholdMinutes: threshold,
    bestOpenWaitMinutes: bestOpenWait,
    worstOpenWaitMinutes: worstOpenWait,
    openLaneCount: openLanes.length,
    totalLaneCount: service.queues.length,
    needsCapacity: true,
    action: "at_capacity",
    reopenQueueId: null,
    nextLaneNumber: null,
    message: `${service.serviceName} wait is about ${bestOpenWait} minutes and already has the maximum of ${MAX_LANES_PER_SERVICE} lanes. Add staff or keep serving the existing windows.`,
  };
}

export async function maybeNotifyAdminsAboutCapacity(serviceId) {
  const evaluation = await evaluateCapacity(serviceId);
  if (!evaluation?.needsCapacity || evaluation.action === "at_capacity") {
    return evaluation;
  }

  const existing = await prisma.notification.findFirst({
    where: {
      type: "capacity",
      serviceId: evaluation.serviceId,
      status: "sent",
    },
  });
  if (existing) return evaluation;

  const admins = await prisma.user.findMany({ where: { role: "admin" } });
  await Promise.all(
    admins.map((admin) =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          type: "capacity",
          serviceId: evaluation.serviceId,
          message: evaluation.message,
          status: "sent",
        },
      })
    )
  );

  return evaluation;
}

export async function resolveCapacityAlerts(serviceId) {
  await prisma.notification.updateMany({
    where: {
      type: "capacity",
      serviceId: Number(serviceId),
      status: "sent",
    },
    data: { status: "viewed" },
  });
}

export async function listCapacityAlerts() {
  const services = await prisma.service.findMany({
    where: { archived: false },
    orderBy: { id: "asc" },
  });
  const alerts = [];
  for (const service of services) {
    const evaluation = await evaluateCapacity(service.id);
    if (evaluation?.needsCapacity && evaluation.action !== "at_capacity") {
      alerts.push(evaluation);
    }
  }
  return alerts;
}
