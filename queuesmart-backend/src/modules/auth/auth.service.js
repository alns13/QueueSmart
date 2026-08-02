import bcrypt from "bcrypt";
import env from "../../config/env.js";
import prisma from "../../db/prisma.js";
import { createError } from "../../middleware/errorHandler.js";
import { signToken } from "../../utils/jwt.js";
import { createProfileForUser } from "../profile/profile.service.js";

function publicUser(user, profile = null) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    ...(profile
      ? {
          fullName: profile.fullName,
          phone: profile.phone,
        }
      : {}),
  };
}

export async function ensureSeedUsers() {
  const existing = await prisma.user.findUnique({
    where: { email: env.adminEmail },
    include: { profile: true },
  });

  if (existing) {
    if (!existing.profile) {
      await createProfileForUser(existing.id, {
        fullName: "QueueSmart Admin",
        phone: null,
      });
    }
    return existing;
  }

  const passwordHash = await bcrypt.hash(env.adminPassword, 10);
  const admin = await prisma.user.create({
    data: {
      email: env.adminEmail,
      passwordHash,
      role: "admin",
      profile: {
        create: {
          fullName: "QueueSmart Admin",
        },
      },
    },
    include: { profile: true },
  });

  return admin;
}

export async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id: Number(id) },
    include: { profile: true },
  });
}

export async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });
}

export async function registerUser({ email, password, fullName, phone = null }) {
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
      profile: {
        create: {
          fullName,
          phone,
        },
      },
    },
    include: { profile: true },
  });

  return publicUser(user, user.profile);
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
    user: publicUser(user, user.profile),
  };
}

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw createError(401, "User not found");
  }
  return publicUser(user, user.profile);
}
