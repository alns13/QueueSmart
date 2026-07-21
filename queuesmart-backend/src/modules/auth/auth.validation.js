import { createError } from "../../middleware/errorHandler.js";
import { requireFields } from "../../middleware/validate.js";
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 72;

function requireString(value, fieldName) {
  if (typeof value !== "string") {
    throw createError(400, `${fieldName} must be a string`);
  }
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRegisterBody(body = {}) {
  requireFields(body, ["email", "password"]);
  requireString(body.email, "Email");
  requireString(body.password, "Password");

  const email = normalizeEmail(body.email);
  if (email.length > MAX_EMAIL_LENGTH) {
    throw createError(
      400,
      `Email must be ${MAX_EMAIL_LENGTH} characters or less`
    );
  }
  const password = body.password;
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw createError(
      400,
      `Password must be ${MAX_PASSWORD_LENGTH} characters or less`
    );
  }

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
  requireString(body.email, "Email");
  requireString(body.password, "Password");

  const email = normalizeEmail(body.email);
  if (email.length > MAX_EMAIL_LENGTH) {
    throw createError(
      400,
      `Email must be ${MAX_EMAIL_LENGTH} characters or less`
    );
  }
  const password = body.password;
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw createError(
      400,
      `Password must be ${MAX_PASSWORD_LENGTH} characters or less`
    );
  }

  if (!isValidEmail(email)) {
    throw createError(400, "Invalid email address");
  }

  if (!password) {
    throw createError(400, "Password is required");
  }

  return { email, password };
}
