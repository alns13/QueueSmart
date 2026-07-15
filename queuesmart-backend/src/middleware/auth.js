import { verifyToken } from "../utils/jwt.js";
import { createError } from "./errorHandler.js";
import { findUserById } from "../modules/auth/auth.service.js";

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw createError(401, "Missing or invalid authorization header");
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      throw createError(401, "Missing token");
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw createError(401, "Invalid or expired token");
    }

    const user = findUserById(payload.sub);
    if (!user) {
      throw createError(401, "User not found");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (req.user?.role !== "admin") {
      return next(createError(403, "Admin access required"));
    }
    return next();
  });
}
