import bcrypt from "bcrypt";
import env from "../../config/env.js";
import prisma from "../../db/prisma.js";
import { createError } from "../../middleware/errorHandler.js";
import { signToken } from "../../utils/jwt.js";

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

let seedPromise;

export async function ensureSeedUsers() {
  if (seedPromise) return seedPromise;
  seedPromise = seedDatabase();
  return seedPromise;
}

async function seedDatabase() {
  const passwordHash = await bcrypt.hash(env.adminPassword, 10);
  let admin = await prisma.user.upsert({
    where: { email: env.adminEmail },
    update: {},
    create: { email: env.adminEmail, passwordHash, role: "admin" },
    include: { profile: true },
  });
  if (!admin.profile) {
    await prisma.userProfile.upsert({
      where: { userId: admin.id },
      update: {},
      create: { userId: admin.id, fullName: "QueueSmart Admin" },
    });
    admin = await findUserById(admin.id);
  }

  const defaults = [
    { serviceName: "General Inquiry", description: "General consultation and inquiries", expectedDuration: 15, priority: "low" },
    { serviceName: "Service Request", description: "Assistance with various service requests", expectedDuration: 20, priority: "medium" },
    { serviceName: "Technical Support", description: "Technical support and consultation", expectedDuration: 10, priority: "high" },
  ];
  for (const service of defaults) {
    await prisma.service.upsert({
      where: { serviceName: service.serviceName },
      update: {},
      create: { ...service, queue: { create: { status: "open" } } },
    });
  }

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
  await ensureSeedUsers();
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
