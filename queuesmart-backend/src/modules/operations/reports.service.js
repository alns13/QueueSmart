import prisma from "../../db/prisma.js";

export async function getQueueUsageReport() {
  const services = await prisma.service.findMany({
    include: { queues: true },
    orderBy: { id: "asc" },
  });

  return Promise.all(
    services.map(async (service) => {
      const queueIds = service.queues.map((queue) => queue.id);

      if (!queueIds.length) {
        return {
          id: service.id,
          serviceName: service.serviceName,
          usersServed: 0,
          averageWaitTime: 0,
          totalVisits: 0,
          canceled: 0,
        };
      }

      const entries = await prisma.queueEntry.findMany({
        where: { queueId: { in: queueIds } },
      });
      const servedEntries = entries.filter((entry) => entry.status === "served");
      const canceled = entries.filter((entry) => entry.status === "canceled").length;

      const totalWaitMs = servedEntries.reduce((sum, entry) => {
        if (!entry.completedAt) return sum;
        return sum + (new Date(entry.completedAt) - new Date(entry.joinedAt));
      }, 0);

      const averageWaitTime =
        servedEntries.length > 0
          ? Math.round((totalWaitMs / servedEntries.length / 60000) * 10) / 10
          : 0;

      return {
        id: service.id,
        serviceName: service.serviceName,
        usersServed: servedEntries.length,
        averageWaitTime,
        totalVisits: entries.length,
        canceled,
      };
    })
  );
}

function protectSpreadsheetFormula(value) {
  // Spreadsheet applications can execute CSV cells that begin with formula characters.
  if (typeof value === "string" && /^[\u0000-\u0020]*[=+\-@]/.test(value)) {
    return `'${value}`;
  }

  return value;
}

export function csvCell(value) {
  if (value === null || value === undefined) return "";

  const text = String(protectSpreadsheetFormula(value));
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

export function serializeCsv(columns, rows) {
  const header = columns.map((column) => csvCell(column.label));
  const body = rows.map((row) =>
    columns.map((column) => csvCell(row[column.key]))
  );

  return `\uFEFF${[header, ...body]
    .map((cells) => cells.join(","))
    .join("\r\n")}\r\n`;
}

export function queueUsageCsv(queueUsage) {
  return serializeCsv(
    [
      { key: "serviceName", label: "Service" },
      { key: "usersServed", label: "Users Served" },
      { key: "averageWaitTime", label: "Average Wait Time (min)" },
      { key: "totalVisits", label: "Total Visits" },
      { key: "canceled", label: "Canceled" },
    ],
    queueUsage
  );
}
