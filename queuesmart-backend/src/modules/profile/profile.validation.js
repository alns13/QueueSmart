import { createError } from "../../middleware/errorHandler.js";
import { requireFields } from "../../middleware/validate.js";

const MAX_FULL_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 30;
const MAX_PREFERENCES_LENGTH = 500;

function requireString(value, fieldName) {
  if (typeof value !== "string") {
    throw createError(400, `${fieldName} must be a string`);
  }
}

export function validateRegisterProfileFields(body = {}) {
  requireFields(body, ["fullName"]);
  requireString(body.fullName, "Full name");

  const fullName = body.fullName.trim();
  if (!fullName) {
    throw createError(400, "Full name is required");
  }
  if (fullName.length > MAX_FULL_NAME_LENGTH) {
    throw createError(
      400,
      `Full name must be ${MAX_FULL_NAME_LENGTH} characters or less`
    );
  }

  let phone = null;
  if (body.phone !== undefined && body.phone !== null && body.phone !== "") {
    requireString(body.phone, "Phone");
    phone = body.phone.trim();
    if (phone.length > MAX_PHONE_LENGTH) {
      throw createError(
        400,
        `Phone must be ${MAX_PHONE_LENGTH} characters or less`
      );
    }
  }

  return { fullName, phone };
}

export function validateUpdateProfileBody(body = {}) {
  if (
    body.fullName === undefined &&
    body.phone === undefined &&
    body.preferences === undefined
  ) {
    throw createError(400, "Provide at least one profile field to update");
  }

  const updates = {};

  if (body.fullName !== undefined) {
    requireString(body.fullName, "Full name");
    const fullName = body.fullName.trim();
    if (!fullName) {
      throw createError(400, "Full name is required");
    }
    if (fullName.length > MAX_FULL_NAME_LENGTH) {
      throw createError(
        400,
        `Full name must be ${MAX_FULL_NAME_LENGTH} characters or less`
      );
    }
    updates.fullName = fullName;
  }

  if (body.phone !== undefined) {
    if (body.phone === null || body.phone === "") {
      updates.phone = null;
    } else {
      requireString(body.phone, "Phone");
      const phone = body.phone.trim();
      if (phone.length > MAX_PHONE_LENGTH) {
        throw createError(
          400,
          `Phone must be ${MAX_PHONE_LENGTH} characters or less`
        );
      }
      updates.phone = phone;
    }
  }

  if (body.preferences !== undefined) {
    if (body.preferences === null || body.preferences === "") {
      updates.preferences = null;
    } else {
      requireString(body.preferences, "Preferences");
      const preferences = body.preferences.trim();
      if (preferences.length > MAX_PREFERENCES_LENGTH) {
        throw createError(
          400,
          `Preferences must be ${MAX_PREFERENCES_LENGTH} characters or less`
        );
      }
      updates.preferences = preferences;
    }
  }

  return updates;
}
