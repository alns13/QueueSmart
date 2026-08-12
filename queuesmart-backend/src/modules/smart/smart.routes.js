import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getRecommendation } from "./smart.controller.js";

const router = Router();

router.get("/recommend", requireAuth, getRecommendation);

export default router;
