import prisma from "../../db/prisma.js";

export function calculateWaitTime(peopleAhead, expectedDuration) {
  if (!Number.isInteger(peopleAhead) || peopleAhead < 0) {
    throw new Error("peopleAhead must be a non-negative integer");
  }

  if (
    typeof expectedDuration !== "number" ||
    !Number.isFinite(expectedDuration) ||
    expectedDuration <= 0
  ) {
    throw new Error("expectedDuration must be greater than 0");
  }

  return peopleAhead * expectedDuration;
}

export async function calculateUserWaitTime(serviceId) {
  const service = await prisma.service.findUnique({
    where: {
      id: Number(serviceId),
    },
  });

  if (!service) {
    throw new Error("Service not found");
  }

  // Temporary mock queue data
  const position = 3;
  const peopleAhead = 4;
  const totalQueueSize = 8;
  const status = "waiting";

  const expectedDuration = service.expectedDuration;

  return {
    serviceId: service.id,
    serviceName: service.serviceName,
    position,
    peopleAhead,
    totalQueueSize,
    expectedDuration,
    estimatedWaitTime: calculateWaitTime(
      peopleAhead,
      expectedDuration
    ),
    status,
  };
}