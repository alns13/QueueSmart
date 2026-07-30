import bcrypt from "bcrypt";
import env from "../../config/env.js";
import prisma from "../../db/prisma.js";
import { createError } from "../../middleware/errorHandler.js";
import { signToken } from "../../utils/jwt.js";

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

export async function ensureSeedUsers() {
  const existing = await prisma.user.findUnique({
    where: { email: env.adminEmail },
  });

  if (existing) return existing;

  const passwordHash = await bcrypt.hash(env.adminPassword, 10);
  return prisma.user.create({
    data: {
      email: env.adminEmail,
      passwordHash,
      role: "admin",
    },
  });
}

export async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id: Number(id) },
  });
}

export async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function registerUser({ email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw createError(409, "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "user",
    },
  });

  return publicUser(user);
}

export async function loginUser({ email, password }) {
  const user = await findUserByEmail(email);
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

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw createError(401, "User not found");
  }
  return publicUser(user);
}
