import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { createError } from "../../middleware/errorHandler.js";
import { services } from "../services/service.routes.js";

export const queueRouter = Router();
export const adminQueueRouter = Router();
export const notificationRouter = Router();
export const historyRouter = Router();

// ponytail: In-memory assignment state; replace this module with database repositories in Assignment 4.
const entries = [];
const notifications = [];
const history = [];
let nextEntryId = 1;
let nextNotificationId = 1;
let nextHistoryId = 1;
const priorityWeight = { high: 3, medium: 2, low: 1 };

function serviceById(id) {
  const service = services.find((item) => item.id === Number(id));
  if (!service) throw createError(404, "Service not found");
  return service;
}

function queueFor(serviceId) {
  return entries
    .filter((entry) => entry.serviceId === Number(serviceId))
    .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority] || a.joinedAt.localeCompare(b.joinedAt));
}

function queueEntry(entry) {
  const service = serviceById(entry.serviceId);
  const queue = queueFor(entry.serviceId);
  const position = queue.findIndex((item) => item.id === entry.id) + 1;
  return {
    ...entry,
    serviceName: service.serviceName,
    position,
    peopleAhead: Math.max(position - 1, 0),
    totalQueueSize: queue.length,
    expectedDuration: service.expectedDuration,
    estimatedWaitTime: Math.max(position - 1, 0) * service.expectedDuration,
    status: position <= 2 ? "almost ready" : "waiting",
  };
}

function addNotification(userId, type, message) {
  const notification = { id: nextNotificationId++, userId, type, message, read: false, createdAt: new Date().toISOString() };
  notifications.unshift(notification);
  return notification;
}

function queueResponse(service) {
  return { serviceId: service.id, serviceName: service.serviceName, entries: queueFor(service.id).map(queueEntry) };
}

queueRouter.post("/:serviceId/join", requireAuth, (req, res, next) => {
  try {
    const service = serviceById(req.params.serviceId);
    if (entries.some((entry) => entry.userId === req.user.id)) throw createError(409, "You are already in a queue");
    const priority = String(req.body?.priority || "low").toLowerCase();
    if (!priorityWeight[priority]) throw createError(400, "Priority must be low, medium, or high");
    const joinedAt = new Date().toISOString();
    const record = { id: nextHistoryId++, userId: req.user.id, serviceId: service.id, serviceName: service.serviceName, joinedAt, outcome: "Waiting" };
    history.unshift(record);
    const entry = { id: nextEntryId++, userId: req.user.id, email: req.user.email, serviceId: service.id, priority, joinedAt, historyId: record.id };
    entries.push(entry);
    const result = queueEntry(entry);
    addNotification(req.user.id, "queue", `You joined the ${service.serviceName} queue.`);
    if (result.position <= 2) addNotification(req.user.id, "status", `You are almost ready for ${service.serviceName}.`);
    res.status(201).json({ entry: result });
  } catch (error) {
    next(error);
  }
});

queueRouter.delete("/:serviceId/leave", requireAuth, (req, res, next) => {
  try {
    const index = entries.findIndex((entry) => entry.userId === req.user.id && entry.serviceId === Number(req.params.serviceId));
    if (index < 0) throw createError(404, "Active queue entry not found");
    const [entry] = entries.splice(index, 1);
    const record = history.find((item) => item.id === entry.historyId);
    Object.assign(record, { outcome: "Left Queue", completedAt: new Date().toISOString() });
    addNotification(req.user.id, "queue", `You left the ${serviceById(entry.serviceId).serviceName} queue.`);
    res.json({ entry: queueEntry({ ...entry }) });
  } catch (error) {
    next(error);
  }
});

queueRouter.get("/me/active", requireAuth, (req, res) => {
  const entry = entries.find((item) => item.userId === req.user.id);
  res.json({ entry: entry ? queueEntry(entry) : null });
});

queueRouter.get("/:serviceId/status", requireAuth, (req, res, next) => {
  try {
    const service = serviceById(req.params.serviceId);
    const queue = queueFor(service.id);
    res.json({ serviceId: service.id, queueLength: queue.length, estimatedWaitTime: queue.length * service.expectedDuration });
  } catch (error) {
    next(error);
  }
});

queueRouter.get("/:serviceId/entries/me", requireAuth, (req, res) => {
  const entry = entries.find((item) => item.userId === req.user.id && item.serviceId === Number(req.params.serviceId));
  res.json({ entry: entry ? queueEntry(entry) : null });
});

queueRouter.get("/:serviceId/estimate", requireAuth, (req, res, next) => {
  try {
    const service = serviceById(req.params.serviceId);
    const entry = entries.find((item) => item.userId === req.user.id && item.serviceId === service.id);
    const queueLength = queueFor(service.id).length;
    res.json({ estimatedWaitTime: entry ? queueEntry(entry).estimatedWaitTime : queueLength * service.expectedDuration });
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.get("/", requireAdmin, (req, res) => res.json({ queues: services.map(queueResponse) }));

adminQueueRouter.get("/reports/summary", requireAdmin, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const completedToday = history.filter(
    (record) =>
      record.outcome === "Served" &&
      record.completedAt?.slice(0, 10) === today
  ).length;

  const serviceData = services.map((service) => ({
    service: service.serviceName,
    users: history.filter(
      (record) =>
        record.serviceId === service.id &&
        record.outcome === "Served" &&
        record.completedAt?.slice(0, 10) === today
    ).length,
  }));

  res.json({
    currentQueue: entries.length,
    activeStaff: 3,
    completedToday,
    serviceData,
  });
});

adminQueueRouter.get("/:serviceId", requireAdmin, (req, res, next) => {
  try {
    res.json({ queue: queueResponse(serviceById(req.params.serviceId)) });
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.post("/:serviceId/serve-next", requireAdmin, (req, res, next) => {
  try {
    const service = serviceById(req.params.serviceId);
    const nextEntry = queueFor(service.id)[0];
    if (!nextEntry) throw createError(404, "No users are waiting");
    entries.splice(entries.findIndex((entry) => entry.id === nextEntry.id), 1);
    const record = history.find((item) => item.id === nextEntry.historyId);
    Object.assign(record, { outcome: "Served", completedAt: new Date().toISOString() });
    addNotification(nextEntry.userId, "status", `You were served by ${service.serviceName}.`);
    const upcoming = queueFor(service.id)[0];
    if (upcoming) addNotification(upcoming.userId, "status", `You are almost ready for ${service.serviceName}.`);
    res.json({ served: { ...nextEntry, serviceName: service.serviceName }, queue: queueResponse(service) });
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.delete("/:serviceId/entries/:entryId", requireAdmin, (req, res, next) => {
  try {
    const index = entries.findIndex((entry) => entry.id === Number(req.params.entryId) && entry.serviceId === Number(req.params.serviceId));
    if (index < 0) throw createError(404, "Queue entry not found");
    const [removed] = entries.splice(index, 1);
    const record = history.find((item) => item.id === removed.historyId);
    Object.assign(record, { outcome: "Removed", completedAt: new Date().toISOString() });
    addNotification(removed.userId, "status", `You were removed from the ${serviceById(removed.serviceId).serviceName} queue.`);
    res.json({ removed });
  } catch (error) {
    next(error);
  }
});

adminQueueRouter.patch("/:serviceId/entries/:entryId/move", requireAdmin, (req, res, next) => {
  try {
    const queue = queueFor(req.params.serviceId);
    const index = queue.findIndex((entry) => entry.id === Number(req.params.entryId));
    const direction = Number(req.body?.direction);
    if (index < 0) throw createError(404, "Queue entry not found");
    if (![ -1, 1 ].includes(direction)) throw createError(400, "Direction must be -1 or 1");
    const target = index + direction;
    if (target >= 0 && target < queue.length) {
      [queue[index].joinedAt, queue[target].joinedAt] = [queue[target].joinedAt, queue[index].joinedAt];
    }
    res.json({ queue: queueResponse(serviceById(req.params.serviceId)) });
  } catch (error) {
    next(error);
  }
});

notificationRouter.get("/", requireAuth, (req, res) => res.json({ notifications: notifications.filter((item) => item.userId === req.user.id) }));
notificationRouter.get("/summary", requireAuth, (req, res) => {
  const userNotifications = notifications.filter((item) => item.userId === req.user.id);
  res.json({ notifications: userNotifications.slice(0, 5), unreadCount: userNotifications.filter((item) => !item.read).length });
});
notificationRouter.patch("/:notificationId/read", requireAuth, (req, res, next) => {
  const notification = notifications.find((item) => item.id === Number(req.params.notificationId) && item.userId === req.user.id);
  if (!notification) return next(createError(404, "Notification not found"));
  notification.read = true;
  res.json({ notification });
});
notificationRouter.patch("/read-all", requireAuth, (req, res) => {
  notifications.filter((item) => item.userId === req.user.id).forEach((item) => { item.read = true; });
  res.json({ message: "Notifications marked as read" });
});

historyRouter.get("/me", requireAuth, (req, res) => res.json({ history: history.filter((item) => item.userId === req.user.id) }));
historyRouter.get("/me/summary", requireAuth, (req, res) => {
  const records = history.filter((item) => item.userId === req.user.id);
  res.json({ total: records.length, served: records.filter((item) => item.outcome === "Served").length, left: records.filter((item) => item.outcome === "Left Queue").length });
});
