import { Router } from "express";
import { getWaitTime } from "./waitTime.controller.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

router.get("/:serviceId", requireAuth, getWaitTime);

export default router;