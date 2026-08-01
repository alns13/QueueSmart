import { calculateUserWaitTime } from "./waitTime.service.js";

export async function getWaitTime(req, res, next) {
  try {
    const serviceId = Number(req.params.serviceId);

    const result = await calculateUserWaitTime(serviceId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}