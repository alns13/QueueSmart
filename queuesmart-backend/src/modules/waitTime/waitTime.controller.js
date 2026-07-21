import { calculateUserWaitTime } from "./waitTime.service.js";

export function getWaitTime(req, res, next) {
  try {
    const serviceId = Number(req.params.serviceId);

    const result = calculateUserWaitTime(serviceId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}