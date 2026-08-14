import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { getCapacityAlerts, getRecommendation } from "./smart.controller.js";

const router = Router();

router.get("/recommend", requireAuth, getRecommendation);
router.get("/capacity-alerts", requireAdmin, getCapacityAlerts);

export default router;
