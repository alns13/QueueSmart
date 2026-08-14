-- AlterTable
ALTER TABLE "Service" ADD COLUMN "laneWaitThresholdMinutes" INTEGER NOT NULL DEFAULT 60;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "serviceId" INTEGER;

PRAGMA foreign_keys=OFF;

-- Recreate Queue to drop serviceId uniqueness and add laneNumber
CREATE TABLE "new_Queue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serviceId" INTEGER NOT NULL,
    "laneNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Queue_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Queue" ("id", "serviceId", "laneNumber", "status", "createdAt")
SELECT "id", "serviceId", 1, "status", "createdAt" FROM "Queue";

DROP TABLE "Queue";
ALTER TABLE "new_Queue" RENAME TO "Queue";

CREATE UNIQUE INDEX "Queue_serviceId_laneNumber_key" ON "Queue"("serviceId", "laneNumber");
CREATE INDEX "Queue_serviceId_status_idx" ON "Queue"("serviceId", "status");

CREATE INDEX "Notification_type_serviceId_status_idx" ON "Notification"("type", "serviceId", "status");

PRAGMA foreign_keys=ON;
