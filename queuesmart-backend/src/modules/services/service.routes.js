import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { createError } from "../../middleware/errorHandler.js";
import { requireFields } from "../../middleware/validate.js";
import prisma from "../../db/prisma.js";
import {
  MAX_LANES_PER_SERVICE,
  resolveCapacityAlerts,
  waitingCount,
} from "../smart/capacity.service.js";
import {
  defaultLaneCreates,
  ensureAllServiceLanes,
  ensureServiceLanes,
} from "./serviceLanes.js";

const router = Router();

function validateService(body = {}) {
  requireFields(body, [
    "serviceName",
    "description",
    "expectedDuration",
    "priority",
    "laneWaitThresholdMinutes",
  ]);

  if (typeof body.serviceName !== "string") {
    throw createError(400, "Service name must be a string");
  }
  if (typeof body.description !== "string") {
    throw createError(400, "Description must be a string");
  }
  if (typeof body.priority !== "string") {
    throw createError(400, "Priority must be a string");
  }
  if (typeof body.expectedDuration !== "number") {
    throw createError(400, "Expected duration must be a number");
  }
  if (typeof body.laneWaitThresholdMinutes !== "number") {
    throw createError(400, "Lane wait threshold must be a number");
  }

  const service = {
    serviceName: body.serviceName.trim(),
    description: body.description.trim(),
    expectedDuration: body.expectedDuration,
    priority: body.priority.toLowerCase(),
    laneWaitThresholdMinutes: body.laneWaitThresholdMinutes,
  };

  if (!service.serviceName) throw createError(400, "Service name cannot be empty");
  if (!/[A-Za-z]/.test(service.serviceName)) {
    throw createError(400, "Service name must contain at least one letter");
  }
  if (!service.description) throw createError(400, "Description cannot be empty");
  if (service.description.length > 500) {
    throw createError(400, "Description must be 500 characters or less");
  }
  if (service.serviceName.length > 100) {
    throw createError(400, "Service name must be 100 characters or less");
  }
  if (!Number.isFinite(service.expectedDuration) || service.expectedDuration <= 0) {
    throw createError(400, "Expected duration must be greater than 0");
  }
  if (
    !Number.isInteger(service.laneWaitThresholdMinutes) ||
    service.laneWaitThresholdMinutes <= 0 ||
    service.laneWaitThresholdMinutes > 24 * 60
  ) {
    throw createError(400, "Lane wait threshold must be an integer between 1 and 1440 minutes");
  }
  if (!["low", "medium", "high"].includes(service.priority)) {
    throw createError(400, "Priority must be low, medium, or high");
  }

  return service;
}

function serviceView(service) {
  const queues = service.queues || (service.queue ? [service.queue] : []);
  const openQueues = queues.filter((queue) => queue.status === "open");
  return {
    id: service.id,
    serviceName: service.serviceName,
    description: service.description,
    expectedDuration: service.expectedDuration,
    priority: service.priority,
    laneWaitThresholdMinutes: service.laneWaitThresholdMinutes,
    archived: Boolean(service.archived),
    archivedAt: service.archivedAt || null,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
    queueStatus: openQueues.length ? "open" : queues.length ? "closed" : null,
    openLaneCount: openQueues.length,
    totalLaneCount: queues.length,
    lanes: queues
      .slice()
      .sort((a, b) => a.laneNumber - b.laneNumber)
      .map((queue) => ({
        queueId: queue.id,
        laneNumber: queue.laneNumber,
        status: queue.status,
      })),
  };
}

async function activeCountsForQueues(queues) {
  let waiting = 0;
  let serving = 0;
  for (const queue of queues) {
    waiting += await waitingCount(queue.id);
    serving += await prisma.queueEntry.count({
      where: { queueId: queue.id, status: "serving" },
    });
  }
  return { waiting, serving };
}

function handleUniqueNameError(error) {
  if (error?.code === "P2002") {
    throw createError(409, "A service with this name already exists");
  }
  throw error;
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    if (req.user.role === "admin") {
      await ensureAllServiceLanes();
    }
    const isAdmin = req.user.role === "admin";
    const services = await prisma.service.findMany({
      where: isAdmin
        ? {}
        : { archived: false, queues: { some: { status: "open" } } },
      include: { queues: { orderBy: { laneNumber: "asc" } } },
      orderBy: { id: "asc" },
    });

    res.json({ services: services.map(serviceView) });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const data = validateService(req.body);
    const service = await prisma.service.create({
      data: {
        ...data,
        queues: {
          create: defaultLaneCreates(),
        },
      },
      include: {
        queues: { orderBy: { laneNumber: "asc" } },
      },
    });

    res.status(201).json({ service: serviceView(service) });
  } catch (error) {
    try {
      handleUniqueNameError(error);
    } catch (mapped) {
      next(mapped);
    }
  }
});

router.patch("/:serviceId", requireAdmin, async (req, res, next) => {
  try {
    const serviceId = Number(req.params.serviceId);
    const existing = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { queues: true },
    });
    if (!existing) throw createError(404, "Service not found");
    if (existing.archived) {
      throw createError(409, "Retired services cannot be edited");
    }

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: validateService(req.body),
      include: { queues: { orderBy: { laneNumber: "asc" } } },
    });

    res.json({ service: serviceView(service) });
  } catch (error) {
    try {
      handleUniqueNameError(error);
    } catch (mapped) {
      next(mapped);
    }
  }
});

router.post("/:serviceId/lanes", requireAdmin, async (req, res, next) => {
  try {
    const serviceId = Number(req.params.serviceId);
    await ensureServiceLanes(serviceId);
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { queues: { orderBy: { laneNumber: "asc" } } },
    });
    if (!service) throw createError(404, "Service not found");
    if (service.archived) throw createError(409, "Retired services cannot open new lanes");

    const closed = service.queues.find((queue) => queue.status === "closed");
    if (closed) {
      const queue = await prisma.queue.update({
        where: { id: closed.id },
        data: { status: "open" },
        include: { service: true },
      });
      await resolveCapacityAlerts(serviceId);
      return res.json({
        queue: {
          id: queue.id,
          serviceId: queue.serviceId,
          serviceName: queue.service.serviceName,
          laneNumber: queue.laneNumber,
          status: queue.status,
        },
        reopened: true,
      });
    }

    throw createError(
      409,
      `This service already has all ${MAX_LANES_PER_SERVICE} lanes open`
    );
  } catch (error) {
    next(error);
  }
});

router.post("/:serviceId/retire", requireAdmin, async (req, res, next) => {
  try {
    const serviceId = Number(req.params.serviceId);
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { queues: true },
    });
    if (!service) throw createError(404, "Service not found");
    if (service.archived) {
      throw createError(409, "This service is already retired");
    }

    const openQueues = service.queues.filter((queue) => queue.status === "open");
    const counts = await activeCountsForQueues(service.queues);
    if (openQueues.length > 0) {
      throw createError(
        409,
        "Close all lanes first to stop new users from joining. People already in line will still be served.",
        { code: "QUEUE_OPEN", ...counts }
      );
    }

    if (counts.waiting + counts.serving > 0) {
      throw createError(
        409,
        `This service still has ${counts.waiting} waiting and ${counts.serving} being served across its lanes. Finish serving everyone before retiring the service.`,
        { code: "QUEUE_NOT_EMPTY", ...counts }
      );
    }

    const retired = await prisma.$transaction(async (tx) => {
      await tx.queue.updateMany({
        where: { serviceId },
        data: { status: "closed" },
      });
      return tx.service.update({
        where: { id: serviceId },
        data: {
          archived: true,
          archivedAt: new Date(),
        },
        include: { queues: { orderBy: { laneNumber: "asc" } } },
      });
    });

    await resolveCapacityAlerts(serviceId);
    res.json({ service: serviceView(retired) });
  } catch (error) {
    next(error);
  }
});

export default router;
