import { recommendAlternativeService } from "./smart.service.js";

export async function getRecommendation(req, res, next) {
  try {
    const recommendation = await recommendAlternativeService(
      req.query.serviceId
    );
    res.status(200).json(recommendation);
  } catch (error) {
    next(error);
  }
}
