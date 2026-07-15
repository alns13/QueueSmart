import { createError } from "./errorHandler.js";

export function validateBody(schemaFn) {
  return (req, res, next) => {
    try {
      req.body = schemaFn(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireFields(body, fields) {
  const missing = fields.filter((field) => {
    const value = body?.[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missing.length > 0) {
    throw createError(400, "Missing required fields", { missing });
  }
}
