import bcrypt from "bcrypt";
import env from "../../config/env.js";
import { createError } from "../../middleware/errorHandler.js";
import { signToken } from "../../utils/jwt.js";

const users = new Map();
let nextUserId = 1;
let seedPromise;

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

export async function ensureSeedUsers() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const existing = [...users.values()].find(
        (user) => user.email === env.adminEmail
      );
      if (existing) return;

      const passwordHash = await bcrypt.hash(env.adminPassword, 10);
      const admin = {
        id: nextUserId++,
        email: env.adminEmail,
        passwordHash,
        role: "admin",
        createdAt: new Date().toISOString(),
      };
      users.set(admin.id, admin);
    })();
  }

  return seedPromise;
}

export function findUserById(id) {
  return users.get(Number(id)) || null;
}

export function findUserByEmail(email) {
  return (
    [...users.values()].find((user) => user.email === email) || null
  );
}

export async function registerUser({ email, password }) {
  await ensureSeedUsers();

  if (findUserByEmail(email)) {
    throw createError(409, "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: nextUserId++,
    email,
    passwordHash,
    role: "user",
    createdAt: new Date().toISOString(),
  };

  users.set(user.id, user);
  return publicUser(user);
}

export async function loginUser({ email, password }) {
  await ensureSeedUsers();

  const user = findUserByEmail(email);
  if (!user) {
    throw createError(401, "Invalid email or password");
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw createError(401, "Invalid email or password");
  }

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: publicUser(user),
  };
}

export function getCurrentUser(userId) {
  const user = findUserById(userId);
  if (!user) {
    throw createError(401, "User not found");
  }
  return publicUser(user);
}
