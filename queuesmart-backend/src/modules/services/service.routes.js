import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { createError } from "../../middleware/errorHandler.js";
import { requireFields } from "../../middleware/validate.js";
import prisma from "../../db/prisma.js";

const router = Router();

function validateService(body = {}) {
  requireFields(body, ["serviceName", "description", "expectedDuration", "priority"]);

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

  const service = {
    serviceName: body.serviceName.trim(),
    description: body.description.trim(),
    expectedDuration: body.expectedDuration,
    priority: body.priority.toLowerCase(),
  };

  if (!service.serviceName) {
    throw createError(400, "Service name cannot be empty");
  }

  if (!/[A-Za-z]/.test(service.serviceName)) {
    throw createError(
      400,
      "Service name must contain at least one letter"
    );
  }

  if (!service.description) {
    throw createError(400, "Description cannot be empty");
  }

  if (service.description.length > 500) {
    throw createError(
      400,
      "Description must be 500 characters or less"
    );
  }

  if (service.serviceName.length > 100) throw createError(400, "Service name must be 100 characters or less");
  if (!Number.isFinite(service.expectedDuration) || service.expectedDuration <= 0) throw createError(400, "Expected duration must be greater than 0");
  if (!["low", "medium", "high"].includes(service.priority)) throw createError(400, "Priority must be low, medium, or high");

  return service;
}

function serviceView(service) {
  return {
    id: service.id,
    serviceName: service.serviceName,
    description: service.description,
    expectedDuration: service.expectedDuration,
    priority: service.priority,
    archived: Boolean(service.archived),
    archivedAt: service.archivedAt || null,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
    queueStatus: service.queue?.status || null,
  };
}

async function activeCounts(queueId) {
  if (!queueId) return { waiting: 0, serving: 0 };
  const [waiting, serving] = await Promise.all([
    prisma.queueEntry.count({ where: { queueId, status: "waiting" } }),
    prisma.queueEntry.count({ where: { queueId, status: "serving" } }),
  ]);
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
    const isAdmin = req.user.role === "admin";
    const services = await prisma.service.findMany({
      where: isAdmin
        ? {}
        : { archived: false, queue: { status: "open" } },
      include: { queue: true },
      orderBy: { id: "asc" },
    });

    res.json({ services: services.map(serviceView) });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const service = await prisma.service.create({
      data: {
        ...validateService(req.body),
        queue: {
          create: {
            status: "open",
          },
        },
      },
      include: {
        queue: true,
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
      include: { queue: true },
    });
    if (!existing) throw createError(404, "Service not found");
    if (existing.archived) {
      throw createError(409, "Retired services cannot be edited");
    }

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: validateService(req.body),
      include: { queue: true },
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

router.post("/:serviceId/retire", requireAdmin, async (req, res, next) => {
  try {
    const serviceId = Number(req.params.serviceId);
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { queue: true },
    });
    if (!service) throw createError(404, "Service not found");
    if (service.archived) {
      throw createError(409, "This service is already retired");
    }

    const counts = await activeCounts(service.queue?.id);
    if (service.queue?.status === "open") {
      throw createError(
        409,
        "Close this queue first to stop new users from joining. People already in line will still be served.",
        { code: "QUEUE_OPEN", ...counts }
      );
    }

    if (counts.waiting + counts.serving > 0) {
      throw createError(
        409,
        `This queue still has ${counts.waiting} waiting and ${counts.serving} being served. Finish serving everyone before retiring the service.`,
        { code: "QUEUE_NOT_EMPTY", ...counts }
      );
    }

    const retired = await prisma.service.update({
      where: { id: serviceId },
      data: {
        archived: true,
        archivedAt: new Date(),
        queue: service.queue
          ? { update: { status: "closed" } }
          : undefined,
      },
      include: { queue: true },
    });

    res.json({ service: serviceView(retired) });
  } catch (error) {
    next(error);
  }
});

export default router;
