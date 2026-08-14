import prisma from "../../db/prisma.js";
import { MAX_LANES_PER_SERVICE } from "../smart/capacity.service.js";

export function defaultLaneCreates() {
  return [
    { status: "open", laneNumber: 1 },
    { status: "closed", laneNumber: 2 },
    { status: "closed", laneNumber: 3 },
  ];
}

/** Ensure every active service has lanes 1–3 (missing lanes are created closed, except lane 1 open). */
export async function ensureServiceLanes(serviceId, tx = prisma) {
  const service = await tx.service.findUnique({
    where: { id: Number(serviceId) },
    include: { queues: true },
  });
  if (!service || service.archived) return service;

  const existing = new Set(service.queues.map((queue) => queue.laneNumber));
  for (let laneNumber = 1; laneNumber <= MAX_LANES_PER_SERVICE; laneNumber += 1) {
    if (existing.has(laneNumber)) continue;
    await tx.queue.create({
      data: {
        serviceId: service.id,
        laneNumber,
        status: laneNumber === 1 ? "open" : "closed",
      },
    });
  }

  return tx.service.findUnique({
    where: { id: service.id },
    include: { queues: { orderBy: { laneNumber: "asc" } } },
  });
}

export async function ensureAllServiceLanes(tx = prisma) {
  const services = await tx.service.findMany({
    where: { archived: false },
    select: { id: true },
  });
  for (const service of services) {
    await ensureServiceLanes(service.id, tx);
  }
}
