import { recommendAlternativeService } from "./smart.service.js";
import { listCapacityAlerts } from "./capacity.service.js";

export async function getRecommendation(req, res, next) {
  try {
    const recommendation = await recommendAlternativeService(
      req.query.serviceId,
      req.query.queueId
    );
    res.status(200).json(recommendation);
  } catch (error) {
    next(error);
  }
}

export async function getCapacityAlerts(req, res, next) {
  try {
    const alerts = await listCapacityAlerts();
    res.status(200).json({ alerts });
  } catch (error) {
    next(error);
  }
}
