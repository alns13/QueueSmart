import {
  getProfileForUser,
  updateProfileForUser,
} from "./profile.service.js";
import { validateUpdateProfileBody } from "./profile.validation.js";

export async function getMyProfile(req, res, next) {
  try {
    const profile = await getProfileForUser(req.user.id);
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfile(req, res, next) {
  try {
    const updates = validateUpdateProfileBody(req.body);
    const profile = await updateProfileForUser(req.user.id, updates);
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}
