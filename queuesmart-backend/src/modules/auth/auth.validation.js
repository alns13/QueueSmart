import { createError } from "../../middleware/errorHandler.js";
import { requireFields } from "../../middleware/validate.js";

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRegisterBody(body = {}) {
  requireFields(body, ["email", "password"]);

  const email = normalizeEmail(body.email);
  const password = String(body.password);

  if (!isValidEmail(email)) {
    throw createError(400, "Invalid email address");
  }

  if (password.length < 6) {
    throw createError(400, "Password must be at least 6 characters");
  }

  return { email, password };
}

export function validateLoginBody(body = {}) {
  requireFields(body, ["email", "password"]);

  const email = normalizeEmail(body.email);
  const password = String(body.password);

  if (!isValidEmail(email)) {
    throw createError(400, "Invalid email address");
  }

  if (!password) {
    throw createError(400, "Password is required");
  }

  return { email, password };
}
