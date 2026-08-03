-- QueueEntry records are retained as persistent queue history.
DROP INDEX IF EXISTS "QueueEntry_queueId_userId_key";

CREATE UNIQUE INDEX "Service_serviceName_key" ON "Service"("serviceName");

ALTER TABLE "QueueEntry" ADD COLUMN "completedAt" DATETIME;

CREATE INDEX "QueueEntry_queueId_status_position_idx"
ON "QueueEntry"("queueId", "status", "position");

CREATE INDEX "QueueEntry_userId_status_idx"
ON "QueueEntry"("userId", "status");

CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'system',
    "message" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'sent',
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_status_check" CHECK ("status" IN ('sent', 'viewed')),
    CONSTRAINT "Notification_message_length_check" CHECK (length("message") BETWEEN 1 AND 500)
);

CREATE INDEX "Notification_userId_timestamp_idx"
ON "Notification"("userId", "timestamp");
