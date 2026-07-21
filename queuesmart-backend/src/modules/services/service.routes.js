import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { createError } from "../../middleware/errorHandler.js";
import { requireFields } from "../../middleware/validate.js";

const router = Router();
// ponytail: In-memory assignment data; replace with database storage when persistence is required.
let nextId = 4;
const services = [
  { id: 1, serviceName: "General Inquiry", description: "General consultation and inquiries", expectedDuration: 15, priority: "low" },
  { id: 2, serviceName: "Service Request", description: "Assistance with various service requests", expectedDuration: 20, priority: "medium" },
  { id: 3, serviceName: "Technical Support", description: "Technical support and consultation", expectedDuration: 10, priority: "high" },
];

function validateService(body = {}) {
  requireFields(body, ["serviceName", "description", "expectedDuration", "priority"]);
  const service = {
    serviceName: String(body.serviceName).trim(),
    description: String(body.description).trim(),
    expectedDuration: Number(body.expectedDuration),
    priority: String(body.priority).toLowerCase(),
  };

  if (service.serviceName.length > 100) throw createError(400, "Service name must be 100 characters or less");
  if (!Number.isFinite(service.expectedDuration) || service.expectedDuration <= 0) throw createError(400, "Expected duration must be greater than 0");
  if (!["low", "medium", "high"].includes(service.priority)) throw createError(400, "Priority must be low, medium, or high");
  return service;
}

router.get("/", requireAuth, (req, res) => res.json({ services }));

router.post("/", requireAdmin, (req, res, next) => {
  try {
    const service = { id: nextId++, ...validateService(req.body) };
    services.push(service);
    res.status(201).json({ service });
  } catch (error) {
    next(error);
  }
});

router.patch("/:serviceId", requireAdmin, (req, res, next) => {
  try {
    const service = services.find((item) => item.id === Number(req.params.serviceId));
    if (!service) throw createError(404, "Service not found");
    Object.assign(service, validateService(req.body));
    res.json({ service });
  } catch (error) {
    next(error);
  }
});

export { services };
export default router;
