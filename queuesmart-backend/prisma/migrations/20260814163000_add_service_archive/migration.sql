-- AlterTable
ALTER TABLE "Service" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Service" ADD COLUMN "archivedAt" DATETIME;
