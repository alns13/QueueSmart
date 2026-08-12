import { Router } from "express";
import prisma from "../../db/prisma.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { createError } from "../../middleware/errorHandler.js";

export const queueRouter = Router();
export const adminQueueRouter = Router();
export const notificationRouter = Router();
export const historyRouter = Router();

const activeStatuses = ["waiting", "serving"];
const priorityWeight = { high: 3, medium: 2, low: 1 };

async function queueForService(serviceId) {
  const queue = await prisma.queue.findUnique({
    where: { serviceId: Number(serviceId) },
    include: { service: true },
  });
  if (!queue) throw createError(404, "Service queue not found");
  return queue;
}

async function orderedEntries(queueId, statuses = activeStatuses) {
  const entries = await prisma.queueEntry.findMany({
    where: { queueId, status: { in: statuses } },
    include: { user: { include: { profile: true } }, queue: { include: { service: true } } },
    orderBy: [{ position: "asc" }, { joinedAt: "asc" }, { id: "asc" }],
  });
  return entries;
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

async function addNotification(userId, type, message, tx = prisma) {
  return tx.notification.create({ data: { userId, type, message, status: "sent" } });
}

async function resequenceQueue(queueId, tx = prisma) {
  const entries = await tx.queueEntry.findMany({
    where: { queueId, status: "waiting" },
    orderBy: [{ joinedAt: "asc" }, { id: "asc" }],
  });
  entries.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority] || a.joinedAt - b.joinedAt || a.id - b.id);
  await Promise.all(entries.map((entry, index) => tx.queueEntry.update({ where: { id: entry.id }, data: { position: index + 1 } })));
}

async function queueResponse(queue) {
  const entries = await orderedEntries(queue.id);
  return {
    id: queue.id,
    serviceId: queue.serviceId,
    serviceName: queue.service.serviceName,
    status: queue.status,
    createdAt: queue.createdAt,
    entries: entries.map((entry, index) => entryView(entry, index, entries.length)),
  };
}

queueRouter.post("/:serviceId/join", requireAuth, async (req, res, next) => {
  try {
    const queue = await queueForService(req.params.serviceId);
    if (queue.status !== "open") throw createError(409, "This queue is closed");
    const priority = String(req.body?.priority || "low").toLowerCase();
    if (!(priority in priorityWeight)) throw createError(400, "Priority must be low, medium, or high");
    const active = await prisma.queueEntry.findFirst({ where: { userId: req.user.id, status: { in: activeStatuses } } });
    if (active) throw createError(409, "You are already in a queue");

    const entry = await prisma.$transaction(async (tx) => {
      const count = await tx.queueEntry.count({ where: { queueId: queue.id, status: "waiting" } });
      const created = await tx.queueEntry.create({ data: { queueId: queue.id, userId: req.user.id, position: count + 1, priority, status: "waiting" } });
      await resequenceQueue(queue.id, tx);
      await addNotification(req.user.id, "queue", `You joined the ${queue.service.serviceName} queue.`, tx);
      return created;
    });
    const entries = await orderedEntries(queue.id);
    const index = entries.findIndex((item) => item.id === entry.id);
    res.status(201).json({ entry: entryView(entries[index], index, entries.length) });
  } catch (error) { next(error); }
});

queueRouter.delete("/:serviceId/leave", requireAuth, async (req, res, next) => {
  try {
    const queue = await queueForService(req.params.serviceId);
    const entry = await prisma.queueEntry.findFirst({ where: { queueId: queue.id, userId: req.user.id, status: { in: activeStatuses } } });
    if (!entry) throw createError(404, "Active queue entry not found");
    const canceled = await prisma.$transaction(async (tx) => {
      const updated = await tx.queueEntry.update({ where: { id: entry.id }, data: { status: "canceled", completedAt: new Date() } });
      await resequenceQueue(queue.id, tx);
      await addNotification(req.user.id, "queue", `You left the ${queue.service.serviceName} queue.`, tx);
      return updated;
    });
    res.json({ entry: { ...canceled, serviceId: queue.serviceId, serviceName: queue.service.serviceName } });
  } catch (error) { next(error); }
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
  } catch (error) { next(error); }
});

queueRouter.get("/:serviceId/status", requireAuth, async (req, res, next) => {
  try {
    const queue = await queueForService(req.params.serviceId);
    const queueLength = await prisma.queueEntry.count({ where: { queueId: queue.id, status: { in: activeStatuses } } });
    res.json({ serviceId: queue.serviceId, status: queue.status, queueLength, estimatedWaitTime: queueLength * queue.service.expectedDuration });
  } catch (error) { next(error); }
});

queueRouter.get("/:serviceId/entries/me", requireAuth, async (req, res, next) => {
  try {
    const queue = await queueForService(req.params.serviceId);
    const entry = await prisma.queueEntry.findFirst({ where: { queueId: queue.id, userId: req.user.id, status: { in: activeStatuses } } });
    if (!entry) return res.json({ entry: null });
    const entries = await orderedEntries(queue.id);
    const index = entries.findIndex((item) => item.id === entry.id);
    res.json({ entry: entryView(entries[index], index, entries.length) });
  } catch (error) { next(error); }
});

queueRouter.get("/:serviceId/estimate", requireAuth, async (req, res, next) => {
  try {
    const queue = await queueForService(req.params.serviceId);
    const entries = await orderedEntries(queue.id);
    const index = entries.findIndex((item) => item.userId === req.user.id);
    res.json({ estimatedWaitTime: (index >= 0 ? index : entries.length) * queue.service.expectedDuration });
  } catch (error) { next(error); }
});

adminQueueRouter.get("/", requireAdmin, async (req, res, next) => {
  try {
    const queues = await prisma.queue.findMany({ include: { service: true }, orderBy: { id: "asc" } });
    res.json({ queues: await Promise.all(queues.map(queueResponse)) });
  } catch (error) { next(error); }
});

adminQueueRouter.get("/reports/summary", requireAdmin, async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [activeStaff, currentQueue, completedToday, services] = await Promise.all([
      prisma.user.count({ where: { role: "admin" } }),
      prisma.queueEntry.count({ where: { status: { in: activeStatuses } } }),
      prisma.queueEntry.count({ where: { status: "served", completedAt: { gte: today } } }),
      prisma.service.findMany({ include: { queue: true }, orderBy: { id: "asc" } }),
    ]);
    const serviceData = await Promise.all(services.map(async (service) => ({ service: service.serviceName, users: service.queue ? await prisma.queueEntry.count({ where: { queueId: service.queue.id, status: "served", completedAt: { gte: today } } }) : 0 })));
    res.json({ currentQueue, activeStaff, completedToday, serviceData });
  } catch (error) { next(error); }
});

adminQueueRouter.get("/reports/customers", requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 10;
    const skip = (page - 1) * limit;
    const where = { role: "user" };

    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({ where, skip, take: limit, include: { profile: true, _count: { select: { queueEntries: true } } }, orderBy: { id: "asc" } }),
      prisma.user.count({ where }),
    ]);

    const customers = users.map((user) => ({ id: user.id, name: user.profile?.fullName || user.email, email: user.email, totalVisits: user._count.queueEntries }));

    res.json({ customers, pagination: { page, limit, totalUsers, totalPages: Math.ceil(totalUsers / limit) } });
  } catch (error) { next(error); }
});

adminQueueRouter.get("/reports/customers/:userId/history", requireAdmin, async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const entries = await prisma.queueEntry.findMany({ where: { userId }, include: { queue: { include: { service: true } } }, orderBy: { joinedAt: "desc" } });

    const history = entries.map((entry) => ({ id: entry.id, service: entry.queue.service.serviceName, joinedAt: entry.joinedAt, completedAt: entry.completedAt, status: entry.status, priority: entry.priority }));

    res.json({ history });
  } catch (error) { next(error); }
});

adminQueueRouter.get("/reports/services", requireAdmin, async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({ include: { queue: true }, orderBy: { id: "asc" } });

    const serviceActivity = await Promise.all(services.map(async (service) => {
      const queueId = service.queue?.id;
      const [waiting, serving, served] = queueId ? await Promise.all([
        prisma.queueEntry.count({ where: { queueId, status: "waiting" } }),
        prisma.queueEntry.count({ where: { queueId, status: "serving" } }),
        prisma.queueEntry.count({ where: { queueId, status: "served" } }),
      ]) : [0, 0, 0];

      return { id: service.id, serviceName: service.serviceName, description: service.description, expectedDuration: service.expectedDuration, priority: service.priority, queueStatus: service.queue?.status || "N/A", waiting, serving, served };
    }));

    res.json({ serviceActivity });
  } catch (error) { next(error); }
});

adminQueueRouter.get("/reports/queue-usage", requireAdmin, async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({ include: { queue: true }, orderBy: { id: "asc" } });

    const queueUsage = await Promise.all(services.map(async (service) => {
      if (!service.queue) return { id: service.id, serviceName: service.serviceName, usersServed: 0, averageWaitTime: 0, totalVisits: 0, canceled: 0 };

      const entries = await prisma.queueEntry.findMany({ where: { queueId: service.queue.id } });
      const servedEntries = entries.filter((entry) => entry.status === "served");
      const canceled = entries.filter((entry) => entry.status === "canceled").length;

      const totalWaitMs = servedEntries.reduce((sum, entry) => {
        if (!entry.completedAt) return sum;
        return sum + (new Date(entry.completedAt) - new Date(entry.joinedAt));
      }, 0);

      const averageWaitTime = servedEntries.length > 0 ? Math.round(totalWaitMs / servedEntries.length / 60000 * 10) / 10 : 0;

      return { id: service.id, serviceName: service.serviceName, usersServed: servedEntries.length, averageWaitTime, totalVisits: entries.length, canceled };
    }));

    res.json({ queueUsage });
  } catch (error) { next(error); }
});

adminQueueRouter.get("/:serviceId", requireAdmin, async (req, res, next) => {
  try { res.json({ queue: await queueResponse(await queueForService(req.params.serviceId)) }); }
  catch (error) { next(error); }
});

adminQueueRouter.patch("/:serviceId/status", requireAdmin, async (req, res, next) => {
  try {
    const status = String(req.body?.status || "").toLowerCase();
    if (!["open", "closed"].includes(status)) throw createError(400, "Status must be open or closed");
    const queue = await queueForService(req.params.serviceId);
    const updated = await prisma.queue.update({ where: { id: queue.id }, data: { status }, include: { service: true } });
    res.json({ queue: await queueResponse(updated) });
  } catch (error) { next(error); }
});

adminQueueRouter.post("/:serviceId/serve-next", requireAdmin, async (req, res, next) => {
  try {
    const queue = await queueForService(req.params.serviceId);
    const waiting = await orderedEntries(queue.id, ["waiting"]);
    if (!waiting.length) throw createError(404, "No users are waiting");
    await prisma.$transaction(async (tx) => {
      await tx.queueEntry.updateMany({ where: { queueId: queue.id, status: "serving" }, data: { status: "served", completedAt: new Date() } });
      await tx.queueEntry.update({ where: { id: waiting[0].id }, data: { status: "serving", position: 1 } });
      await addNotification(waiting[0].userId, "status", `You are now being served by ${queue.service.serviceName}.`, tx);
      await resequenceQueue(queue.id, tx);
    });
    res.json({ served: entryView(waiting[0], 0, waiting.length), message: "Next user is now being served" });
  } catch (error) { next(error); }
});

adminQueueRouter.post("/:serviceId/complete-current", requireAdmin, async (req, res, next) => {
  try {
    const queue = await queueForService(req.params.serviceId);
    const entry = await prisma.queueEntry.findFirst({ where: { queueId: queue.id, status: "serving" } });
    if (!entry) throw createError(404, "No customer is currently being served");
    const completed = await prisma.$transaction(async (tx) => {
      const result = await tx.queueEntry.update({ where: { id: entry.id }, data: { status: "served", completedAt: new Date() } });
      await addNotification(entry.userId, "status", `Your ${queue.service.serviceName} service is complete.`, tx);
      return result;
    });
    res.json({ completed });
  } catch (error) { next(error); }
});

adminQueueRouter.delete("/:serviceId/entries/:entryId", requireAdmin, async (req, res, next) => {
  try {
    const queue = await queueForService(req.params.serviceId);
    const entry = await prisma.queueEntry.findFirst({ where: { id: Number(req.params.entryId), queueId: queue.id, status: { in: activeStatuses } } });
    if (!entry) throw createError(404, "Queue entry not found");
    const removed = await prisma.$transaction(async (tx) => {
      const result = await tx.queueEntry.update({ where: { id: entry.id }, data: { status: "canceled", completedAt: new Date() } });
      await resequenceQueue(queue.id, tx);
      await addNotification(entry.userId, "status", `You were removed from the ${queue.service.serviceName} queue.`, tx);
      return result;
    });
    res.json({ removed });
  } catch (error) { next(error); }
});

adminQueueRouter.patch("/:serviceId/entries/:entryId/move", requireAdmin, async (req, res, next) => {
  try {
    const direction = Number(req.body?.direction);
    if (![-1, 1].includes(direction)) throw createError(400, "Direction must be -1 or 1");
    const queue = await queueForService(req.params.serviceId);
    const entries = await orderedEntries(queue.id, ["waiting"]);
    const index = entries.findIndex((entry) => entry.id === Number(req.params.entryId));
    if (index < 0) throw createError(404, "Queue entry not found");
    const target = index + direction;
    if (target >= 0 && target < entries.length) await prisma.$transaction([
      prisma.queueEntry.update({ where: { id: entries[index].id }, data: { position: entries[target].position } }),
      prisma.queueEntry.update({ where: { id: entries[target].id }, data: { position: entries[index].position } }),
    ]);
    res.json({ queue: await queueResponse(queue) });
  } catch (error) { next(error); }
});

notificationRouter.get("/", requireAuth, async (req, res, next) => {
  try { res.json({ notifications: await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { timestamp: "desc" } }) }); }
  catch (error) { next(error); }
});
notificationRouter.get("/summary", requireAuth, async (req, res, next) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { timestamp: "desc" }, take: 5 }),
      prisma.notification.count({ where: { userId: req.user.id, status: "sent" } }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (error) { next(error); }
});
notificationRouter.patch("/read-all", requireAuth, async (req, res, next) => {
  try { await prisma.notification.updateMany({ where: { userId: req.user.id, status: "sent" }, data: { status: "viewed" } }); res.json({ message: "Notifications marked as viewed" }); }
  catch (error) { next(error); }
});
notificationRouter.patch("/:notificationId/read", requireAuth, async (req, res, next) => {
  try {
    const notification = await prisma.notification.findFirst({ where: { id: Number(req.params.notificationId), userId: req.user.id } });
    if (!notification) throw createError(404, "Notification not found");
    res.json({ notification: await prisma.notification.update({ where: { id: notification.id }, data: { status: "viewed" } }) });
  } catch (error) { next(error); }
});

function historyView(entry) {
  const outcome = entry.status === "served" ? "Served" : entry.status === "canceled" ? "Canceled" : entry.status === "serving" ? "Serving" : "Waiting";
  return { id: entry.id, userId: entry.userId, serviceId: entry.queue.service.id, serviceName: entry.queue.service.serviceName, joinedAt: entry.joinedAt, completedAt: entry.completedAt, status: entry.status, outcome };
}
historyRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const entries = await prisma.queueEntry.findMany({ where: { userId: req.user.id }, include: { queue: { include: { service: true } } }, orderBy: { joinedAt: "desc" } });
    res.json({ history: entries.map(historyView) });
  } catch (error) { next(error); }
});
historyRouter.get("/me/summary", requireAuth, async (req, res, next) => {
  try {
    const [total, served, canceled] = await Promise.all([
      prisma.queueEntry.count({ where: { userId: req.user.id } }),
      prisma.queueEntry.count({ where: { userId: req.user.id, status: "served" } }),
      prisma.queueEntry.count({ where: { userId: req.user.id, status: "canceled" } }),
    ]);
    res.json({ total, served, left: canceled, canceled });
  } catch (error) { next(error); }
});
