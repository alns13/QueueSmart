import prisma from "../../db/prisma.js";
import { createError } from "../../middleware/errorHandler.js";

function publicProfile(profile, email) {
  return {
    id: profile.id,
    userId: profile.userId,
    email,
    fullName: profile.fullName,
    phone: profile.phone,
    preferences: profile.preferences,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export async function createProfileForUser(userId, { fullName, phone = null }) {
  return prisma.userProfile.create({
    data: {
      userId,
      fullName,
      phone,
    },
  });
}

export async function getProfileForUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    include: { profile: true },
  });

  if (!user) {
    throw createError(404, "User not found");
  }

  if (!user.profile) {
    const profile = await createProfileForUser(user.id, {
      fullName: user.email.split("@")[0],
      phone: null,
    });
    return publicProfile(profile, user.email);
  }

  return publicProfile(user.profile, user.email);
}

export async function updateProfileForUser(userId, updates) {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    include: { profile: true },
  });

  if (!user) {
    throw createError(404, "User not found");
  }

  if (!user.profile) {
    const profile = await createProfileForUser(user.id, {
      fullName: updates.fullName || user.email.split("@")[0],
      phone: updates.phone ?? null,
    });

    if (updates.preferences !== undefined || updates.fullName || updates.phone !== undefined) {
      const updated = await prisma.userProfile.update({
        where: { userId: user.id },
        data: updates,
      });
      return publicProfile(updated, user.email);
    }

    return publicProfile(profile, user.email);
  }

  const updated = await prisma.userProfile.update({
    where: { userId: user.id },
    data: updates,
  });

  return publicProfile(updated, user.email);
}
