import { verifyToken } from "../utils/jwt.js";
import { createError } from "./errorHandler.js";
import { findUserById } from "../modules/auth/auth.service.js";

export async function requireAuth(req, res, next) {
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

    const user = await findUserById(payload.sub);
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

export async function requireAdmin(req, res, next) {
  try {
    await new Promise((resolve, reject) => {
      requireAuth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (req.user?.role !== "admin") {
      throw createError(403, "Admin access required");
    }

    next();
  } catch (error) {
    next(error);
  }
}
