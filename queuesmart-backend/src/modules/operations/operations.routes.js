import { Router } from "express";
import prisma from "../../db/prisma.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { createError } from "../../middleware/errorHandler.js";
import {
  ACTIVE_STATUSES,
  maybeNotifyAdminsAboutCapacity,
  resolveCapacityAlerts,
} from "../smart/capacity.service.js";
import { ensureAllServiceLanes } from "../services/serviceLanes.js";
  getQueueUsageReport,
  queueUsageCsv,
} from "./reports.service.js";

export const queueRouter = Router();
export const adminQueueRouter = Router();
export const notificationRouter = Router();
export const historyRouter = Router();

const activeStatuses = ACTIVE_STATUSES;
const priorityWeight = { high: 3, medium: 2, low: 1 };

async function queueById(queueId) {
  const queue = await prisma.queue.findUnique({
    where: { id: Number(queueId) },
    include: { service: true },
  });
  if (!queue) throw createError(404, "Service queue not found");
  return queue;
}

async function serviceWithQueues(serviceId) {
  const service = await prisma.service.findUnique({
    where: { id: Number(serviceId) },
    include: { queues: { orderBy: { laneNumber: "asc" } } },
  });
  if (!service) throw createError(404, "Service not found");
  return service;
}

async function pickShortestOpenQueue(serviceId) {
  const service = await serviceWithQueues(serviceId);
  if (service.archived) throw createError(409, "This service is no longer available");
  const open = service.queues.filter((queue) => queue.status === "open");
  if (!open.length) throw createError(409, "This queue is closed");

  const ranked = await Promise.all(
    open.map(async (queue) => {
      const queueLength = await prisma.queueEntry.count({
        where: { queueId: queue.id, status: { in: activeStatuses } },
      });
      return { queue, queueLength };
    })
  );

  ranked.sort(
    (a, b) =>
      a.queueLength - b.queueLength ||
      a.queue.laneNumber - b.queue.laneNumber
  );
  return { service, queue: ranked[0].queue };
}

async function orderedEntries(queueId, statuses = activeStatuses) {
  return prisma.queueEntry.findMany({
    where: { queueId, status: { in: statuses } },
    include: { user: { include: { profile: true } }, queue: { include: { service: true } } },
    orderBy: [{ position: "asc" }, { joinedAt: "asc" }, { id: "asc" }],
  });
}

function entryView(entry, index, total) {
  const service = entry.queue.service;
  return {
    id: entry.id,
    queueId: entry.queueId,
    userId: entry.userId,
    email: entry.user.email,
    name: entry.user.profile?.fullName || entry.user.email,
    serviceId: service.id,
    serviceName: service.serviceName,
    laneNumber: entry.queue.laneNumber,
    position: index + 1,
    peopleAhead: index,
    totalQueueSize: total,
    priority: entry.priority,
    joinedAt: entry.joinedAt,
    completedAt: entry.completedAt,
    expectedDuration: service.expectedDuration,
    estimatedWaitTime: index * service.expectedDuration,
    status: entry.status,
  };
}

async function addNotification(userId, type, message, tx = prisma, serviceId = null) {
  return tx.notification.create({
    data: { userId, type, message, status: "sent", serviceId },
  });
}

async function resequenceQueue(queueId, tx = prisma) {
  const entries = await tx.queueEntry.findMany({
    where: { queueId, status: "waiting" },
    orderBy: [{ joinedAt: "asc" }, { id: "asc" }],
  });
  entries.sort(
    (a, b) =>
      priorityWeight[b.priority] - priorityWeight[a.priority] ||
      a.joinedAt - b.joinedAt ||
      a.id - b.id
  );
  await Promise.all(
    entries.map((entry, index) =>
      tx.queueEntry.update({ where: { id: entry.id }, data: { position: index + 1 } })
    )
  );
}

async function queueResponse(queue) {
  const entries = await orderedEntries(queue.id);
  return {
    id: queue.id,
    queueId: queue.id,
    serviceId: queue.serviceId,
    serviceName: queue.service.serviceName,
    laneNumber: queue.laneNumber,
    status: queue.status,
    archived: Boolean(queue.service.archived),
    laneWaitThresholdMinutes: queue.service.laneWaitThresholdMinutes,
    createdAt: queue.createdAt,
    entries: entries.map((entry, index) => entryView(entry, index, entries.length)),
  };
}

queueRouter.post("/:serviceId/join", requireAuth, async (req, res, next) => {
  try {
    const serviceId = Number(req.params.serviceId);
    const requestedQueueId = req.body?.queueId != null ? Number(req.body.queueId) : null;

    let queue;
    let service;
    if (requestedQueueId) {
      queue = await queueById(requestedQueueId);
      service = queue.service;
      if (queue.serviceId !== serviceId) {
        throw createError(400, "queueId does not belong to this service");
      }
      if (service.archived) throw createError(409, "This service is no longer available");
      if (queue.status !== "open") throw createError(409, "This queue is closed");
    } else {
      ({ service, queue } = await pickShortestOpenQueue(serviceId));
    }

    const priority = String(req.body?.priority || "low").toLowerCase();
    if (!(priority in priorityWeight)) throw createError(400, "Priority must be low, medium, or high");
    const active = await prisma.queueEntry.findFirst({
      where: { userId: req.user.id, status: { in: activeStatuses } },
    });
    if (active) throw createError(409, "You are already in a queue");

    const entry = await prisma.$transaction(async (tx) => {
      const count = await tx.queueEntry.count({
        where: { queueId: queue.id, status: "waiting" },
      });
      const created = await tx.queueEntry.create({
        data: {
          queueId: queue.id,
          userId: req.user.id,
          position: count + 1,
          priority,
          status: "waiting",
        },
      });
      await resequenceQueue(queue.id, tx);
      await addNotification(
        req.user.id,
        "queue",
        `You joined the ${service.serviceName} Lane ${queue.laneNumber} queue.`,
        tx,
        service.id
      );
      return created;
    });

    await maybeNotifyAdminsAboutCapacity(service.id);

    const entries = await orderedEntries(queue.id);
    const index = entries.findIndex((item) => item.id === entry.id);
    res.status(201).json({ entry: entryView(entries[index], index, entries.length) });
  } catch (error) {
    next(error);
  }
});

queueRouter.delete("/:serviceId/leave", requireAuth, async (req, res, next) => {
  try {
    const service = await serviceWithQueues(req.params.serviceId);
    const queueIds = service.queues.map((queue) => queue.id);
    const entry = await prisma.queueEntry.findFirst({
      where: {
        userId: req.user.id,
        queueId: { in: queueIds },
        status: { in: activeStatuses },
      },
      include: { queue: true },
    });
    if (!entry) throw createError(404, "Active queue entry not found");

    const canceled = await prisma.$transaction(async (tx) => {
      const updated = await tx.queueEntry.update({
        where: { id: entry.id },
        data: { status: "canceled", completedAt: new Date() },
      });
      await resequenceQueue(entry.queueId, tx);
      await addNotification(
        req.user.id,
        "queue",
        `You left the ${service.serviceName} Lane ${entry.queue.laneNumber} queue.`,
        tx,
        service.id
      );
      return updated;
    });

    res.json({
      entry: {
        ...canceled,
        serviceId: service.id,
        serviceName: service.serviceName,
        laneNumber: entry.queue.laneNumber,
      },
    });
  } catch (error) {
    next(error);
  }
});

queueRouter.get("/me/active", requireAuth, async (req, res, next) => {
  try {
    const entry = await prisma.queueEntry.findFirst({
      where: { userId: req.user.id, status: { in: activeStatuses } },
      include: { user: { include: { profile: true } }, queue: { include: { service: true } } },
    });
    if (!entry) return res.json({ entry: null });
    const entries = await orderedEntries(entry.queueId);
    const index = entries.findIndex((item) => item.id === entry.id);
    res.json({ entry: entryView(entries[index], index, entries.length) });
  } catch (error) {
    next(error);
  }
});

queueRouter.get("/:serviceId/status", requireAuth, async (req, res, next) => {
  try {
    const service = await serviceWithQueues(req.params.serviceId);
    const open = service.queues.filter((queue) => queue.status === "open");
    if (!open.length) {
      return res.json({
        serviceId: service.id,
        status: "closed",
        queueLength: 0,
        estimatedWaitTime: 0,
        openLaneCount: 0,
        lanes: [],
      });
    }

    const lanes = await Promise.all(
      open.map(async (queue) => {
        const queueLength = await prisma.queueEntry.count({
          where: { queueId: queue.id, status: { in: activeStatuses } },
        });
        return {
          queueId: queue.id,
          laneNumber: queue.laneNumber,
          status: queue.status,
          queueLength,
          estimatedWaitTime: queueLength * service.expectedDuration,
        };
      })
    );
    lanes.sort(
      (a, b) => a.estimatedWaitTime - b.estimatedWaitTime || a.laneNumber - b.laneNumber
    );
    const best = lanes[0];
    res.json({
      serviceId: service.id,
      status: "open",
      queueLength: best.queueLength,
      estimatedWaitTime: best.estimatedWaitTime,
      openLaneCount: open.length,
      bestQueueId: best.queueId,
      lanes,
    });
  } catch (error) {
    next(error);
  }
});

queueRouter.get("/:serviceId/entries/me", requireAuth, async (req, res, next) => {
  try {
    const service = await serviceWithQueues(req.params.serviceId);
    const entry = await prisma.queueEntry.findFirst({
      where: {
        userId: req.user.id,
        queueId: { in: service.queues.map((queue) => queue.id) },
        status: { in: activeStatuses },
      },
      include: { queue: { include: { service: true } }, user: { include: { profile: true } } },
    });
    if (!entry) return res.json({ entry: null });
    const entries = await orderedEntries(entry.queueId);
    const index = entries.findIndex((item) => item.id === entry.id);
    res.json({ entry: entryView(entries[index], index, entries.length) });
  } catch (error) {
    next(error);
  }
});

queueRouter.get("/:serviceId/estimate", requireAuth, async (req, res, next) => {
  try {
    const { queue, service } = await pickShortestOpenQueue(req.params.serviceId);
    const entries = await orderedEntries(queue.id);
    const index = entries.findIndex((item) => item.userId === req.user.id);
    res.json({
      estimatedWaitTime:
        (index >= 0 ? index : entries.length) * service.expectedDuration,
      queueId: queue.id,
      laneNumber: queue.laneNumber,
    });
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.get("/", requireAdmin, async (req, res, next) => {
  try {
    await ensureAllServiceLanes();
    const queues = await prisma.queue.findMany({
      include: { service: true },
      orderBy: [{ serviceId: "asc" }, { laneNumber: "asc" }],
    });
    res.json({ queues: await Promise.all(queues.map(queueResponse)) });
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.get("/reports/summary", requireAdmin, async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [activeStaff, currentQueue, completedToday, services] = await Promise.all([
      prisma.user.count({ where: { role: "admin" } }),
      prisma.queueEntry.count({ where: { status: { in: activeStatuses } } }),
      prisma.queueEntry.count({ where: { status: "served", completedAt: { gte: today } } }),
      prisma.service.findMany({
        include: { queues: true },
        orderBy: { id: "asc" },
      }),
    ]);
    const serviceData = await Promise.all(
      services.map(async (service) => {
        const queueIds = service.queues.map((queue) => queue.id);
        const users = queueIds.length
          ? await prisma.queueEntry.count({
              where: {
                queueId: { in: queueIds },
                status: "served",
                completedAt: { gte: today },
              },
            })
          : 0;
        return { service: service.serviceName, users };
      })
    );
    res.json({ currentQueue, activeStaff, completedToday, serviceData });
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.get("/reports/customers", requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 10;
    const skip = (page - 1) * limit;
    const where = { role: "user" };
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { profile: true, _count: { select: { queueEntries: true } } },
        orderBy: { id: "asc" },
      }),
      prisma.user.count({ where }),
    ]);
    const customers = users.map((user) => ({
      id: user.id,
      name: user.profile?.fullName || user.email,
      email: user.email,
      totalVisits: user._count.queueEntries,
    }));
    res.json({
      customers,
      pagination: { page, limit, totalUsers, totalPages: Math.ceil(totalUsers / limit) },
    });
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.get("/reports/customers/:userId/history", requireAdmin, async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const entries = await prisma.queueEntry.findMany({
      where: { userId },
      include: { queue: { include: { service: true } } },
      orderBy: { joinedAt: "desc" },
    });
    const history = entries.map((entry) => ({
      id: entry.id,
      service: entry.queue.service.serviceName,
      laneNumber: entry.queue.laneNumber,
      joinedAt: entry.joinedAt,
      completedAt: entry.completedAt,
      status: entry.status,
      priority: entry.priority,
    }));
    res.json({ history });
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.get("/reports/services", requireAdmin, async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      include: { queues: true },
      orderBy: { id: "asc" },
    });
    const serviceActivity = await Promise.all(
      services.map(async (service) => {
        const queueIds = service.queues.map((queue) => queue.id);
        const [waiting, serving, served] = queueIds.length
          ? await Promise.all([
              prisma.queueEntry.count({ where: { queueId: { in: queueIds }, status: "waiting" } }),
              prisma.queueEntry.count({ where: { queueId: { in: queueIds }, status: "serving" } }),
              prisma.queueEntry.count({ where: { queueId: { in: queueIds }, status: "served" } }),
            ])
          : [0, 0, 0];
        const openCount = service.queues.filter((queue) => queue.status === "open").length;
        return {
          id: service.id,
          serviceName: service.serviceName,
          description: service.description,
          expectedDuration: service.expectedDuration,
          priority: service.priority,
          laneWaitThresholdMinutes: service.laneWaitThresholdMinutes,
          archived: Boolean(service.archived),
          queueStatus: service.archived
            ? "retired"
            : openCount
              ? "open"
              : service.queues.length
                ? "closed"
                : "N/A",
          openLaneCount: openCount,
          totalLaneCount: service.queues.length,
          waiting,
          serving,
          served,
        };
      })
    );
    res.json({ serviceActivity });
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.get("/reports/queue-usage", requireAdmin, async (req, res, next) => {
  try {
    res.json({ queueUsage: await getQueueUsageReport() });
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.get("/reports/queue-usage.csv", requireAdmin, async (req, res, next) => {
  try {
    // Reuse the JSON report query so the dashboard and downloaded CSV stay aligned.
    const queueUsage = await getQueueUsageReport();
    const date = new Date().toISOString().slice(0, 10);

    res.set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="queuesmart-queue-usage-${date}.csv"`,
      "Cache-Control": "private, no-store",
    });
    res.send(queueUsageCsv(queueUsage));
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.get("/:queueId", requireAdmin, async (req, res, next) => {
  try {
    res.json({ queue: await queueResponse(await queueById(req.params.queueId)) });
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.patch("/:queueId/status", requireAdmin, async (req, res, next) => {
  try {
    const status = String(req.body?.status || "").toLowerCase();
    if (!["open", "closed"].includes(status)) {
      throw createError(400, "Status must be open or closed");
    }
    const queue = await queueById(req.params.queueId);
    if (queue.service.archived) {
      throw createError(409, "Retired services cannot be reopened");
    }
    const previousStatus = queue.status;
    const updated = await prisma.queue.update({
      where: { id: queue.id },
      data: { status },
      include: { service: true },
    });

    if (previousStatus === "open" && status === "closed") {
      const active = await prisma.queueEntry.findMany({
        where: { queueId: queue.id, status: { in: activeStatuses } },
      });
      await Promise.all(
        active.map((entry) =>
          addNotification(
            entry.userId,
            "status",
            `The ${queue.service.serviceName} Lane ${queue.laneNumber} queue is closing. You will still be served.`,
            prisma,
            queue.serviceId
          )
        )
      );
    }

    if (status === "open") {
      await resolveCapacityAlerts(queue.serviceId);
    }

    res.json({ queue: await queueResponse(updated) });
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.post("/:queueId/serve-next", requireAdmin, async (req, res, next) => {
  try {
    const queue = await queueById(req.params.queueId);
    const waiting = await orderedEntries(queue.id, ["waiting"]);
    if (!waiting.length) throw createError(404, "No users are waiting");
    await prisma.$transaction(async (tx) => {
      await tx.queueEntry.updateMany({
        where: { queueId: queue.id, status: "serving" },
        data: { status: "served", completedAt: new Date() },
      });
      await tx.queueEntry.update({
        where: { id: waiting[0].id },
        data: { status: "serving", position: 1 },
      });
      await addNotification(
        waiting[0].userId,
        "status",
        `You are now being served by ${queue.service.serviceName} Lane ${queue.laneNumber}.`,
        tx,
        queue.serviceId
      );
      await resequenceQueue(queue.id, tx);
    });
    res.json({
      served: entryView(waiting[0], 0, waiting.length),
      message: "Next user is now being served",
    });
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.post("/:queueId/complete-current", requireAdmin, async (req, res, next) => {
  try {
    const queue = await queueById(req.params.queueId);
    const entry = await prisma.queueEntry.findFirst({
      where: { queueId: queue.id, status: "serving" },
    });
    if (!entry) throw createError(404, "No customer is currently being served");
    const completed = await prisma.$transaction(async (tx) => {
      const result = await tx.queueEntry.update({
        where: { id: entry.id },
        data: { status: "served", completedAt: new Date() },
      });
      await addNotification(
        entry.userId,
        "status",
        `Your ${queue.service.serviceName} Lane ${queue.laneNumber} service is complete.`,
        tx,
        queue.serviceId
      );
      return result;
    });
    res.json({ completed });
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.delete("/:queueId/entries/:entryId", requireAdmin, async (req, res, next) => {
  try {
    const queue = await queueById(req.params.queueId);
    const entry = await prisma.queueEntry.findFirst({
      where: {
        id: Number(req.params.entryId),
        queueId: queue.id,
        status: { in: activeStatuses },
      },
    });
    if (!entry) throw createError(404, "Queue entry not found");
    const removed = await prisma.$transaction(async (tx) => {
      const result = await tx.queueEntry.update({
        where: { id: entry.id },
        data: { status: "canceled", completedAt: new Date() },
      });
      await resequenceQueue(queue.id, tx);
      await addNotification(
        entry.userId,
        "status",
        `You were removed from the ${queue.service.serviceName} Lane ${queue.laneNumber} queue.`,
        tx,
        queue.serviceId
      );
      return result;
    });
    res.json({ removed });
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.patch("/:queueId/entries/:entryId/move", requireAdmin, async (req, res, next) => {
  try {
    const direction = Number(req.body?.direction);
    if (![-1, 1].includes(direction)) throw createError(400, "Direction must be -1 or 1");
    const queue = await queueById(req.params.queueId);
    const entries = await orderedEntries(queue.id, ["waiting"]);
    const index = entries.findIndex((entry) => entry.id === Number(req.params.entryId));
    if (index < 0) throw createError(404, "Queue entry not found");
    const target = index + direction;
    if (target >= 0 && target < entries.length) {
      await prisma.$transaction([
        prisma.queueEntry.update({
          where: { id: entries[index].id },
          data: { position: entries[target].position },
        }),
        prisma.queueEntry.update({
          where: { id: entries[target].id },
          data: { position: entries[index].position },
        }),
      ]);
    }
    res.json({ queue: await queueResponse(queue) });
  } catch (error) {
    next(error);
  }
});

notificationRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    res.json({
      notifications: await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { timestamp: "desc" },
      }),
    });
  } catch (error) {
    next(error);
  }
});

notificationRouter.get("/summary", requireAuth, async (req, res, next) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { timestamp: "desc" },
        take: 5,
      }),
      prisma.notification.count({
        where: { userId: req.user.id, status: "sent" },
      }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
});

notificationRouter.patch("/read-all", requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, status: "sent" },
      data: { status: "viewed" },
    });
    res.json({ message: "Notifications marked as viewed" });
  } catch (error) {
    next(error);
  }
});

notificationRouter.delete("/", requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.deleteMany({ where: { userId: req.user.id } });
    res.json({ message: "Notifications cleared" });
  } catch (error) {
    next(error);
  }
});

notificationRouter.patch("/:notificationId/read", requireAuth, async (req, res, next) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: Number(req.params.notificationId), userId: req.user.id },
    });
    if (!notification) throw createError(404, "Notification not found");
    res.json({
      notification: await prisma.notification.update({
        where: { id: notification.id },
        data: { status: "viewed" },
      }),
    });
  } catch (error) {
    next(error);
  }
});

notificationRouter.delete("/:notificationId", requireAuth, async (req, res, next) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: Number(req.params.notificationId), userId: req.user.id },
    });
    if (!notification) throw createError(404, "Notification not found");
    await prisma.notification.delete({ where: { id: notification.id } });
    res.json({ message: "Notification deleted" });
  } catch (error) {
    next(error);
  }
});

function historyView(entry) {
  const outcome =
    entry.status === "served"
      ? "Served"
      : entry.status === "canceled"
        ? "Canceled"
        : entry.status === "serving"
          ? "Serving"
          : "Waiting";
  return {
    id: entry.id,
    userId: entry.userId,
    serviceId: entry.queue.service.id,
    serviceName: entry.queue.service.serviceName,
    laneNumber: entry.queue.laneNumber,
    joinedAt: entry.joinedAt,
    completedAt: entry.completedAt,
    status: entry.status,
    outcome,
  };
}

historyRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const entries = await prisma.queueEntry.findMany({
      where: { userId: req.user.id },
      include: { queue: { include: { service: true } } },
      orderBy: { joinedAt: "desc" },
    });
    res.json({ history: entries.map(historyView) });
  } catch (error) {
    next(error);
  }
});

historyRouter.get("/me/summary", requireAuth, async (req, res, next) => {
  try {
    const [total, served, canceled] = await Promise.all([
      prisma.queueEntry.count({ where: { userId: req.user.id } }),
      prisma.queueEntry.count({ where: { userId: req.user.id, status: "served" } }),
      prisma.queueEntry.count({ where: { userId: req.user.id, status: "canceled" } }),
    ]);
    res.json({ total, served, left: canceled, canceled });
  } catch (error) {
    next(error);
  }
});
