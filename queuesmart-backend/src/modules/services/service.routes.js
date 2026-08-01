import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { createError } from "../../middleware/errorHandler.js";
import { requireFields } from "../../middleware/validate.js";
import prisma from "../../db/prisma.js";


const router = Router();
// ponytail: In-memory assignment data; replace with database storage when persistence is required.


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

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { id: "asc" },
    });

    res.json({ services });
  } catch (error) {
    next(error);
  }
});



router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const service = await prisma.service.create({
      data: validateService(req.body),
    });

    res.status(201).json({ service });
  } catch (error) {
    next(error);
  }
});

router.patch("/:serviceId", requireAdmin, async (req, res, next) => {
  try {
    const serviceId = Number(req.params.serviceId);

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: validateService(req.body),
    });

    res.json({ service });
  } catch (error) {
    next(error);
  }
});

router.delete("/:serviceId", requireAdmin, async (req, res, next) => {
  try {
    const serviceId = Number(req.params.serviceId);

    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      throw createError(400, "Invalid service ID");
    }

    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!existingService) {
      throw createError(404, "Service not found");
    }

    await prisma.service.delete({
      where: { id: serviceId },
    });

    res.status(200).json({
      message: "Service deleted successfully",
      service: existingService,
    });
  } catch (error) {
    next(error);
  }
});


export default router;
