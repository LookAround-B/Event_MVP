/*
  Warnings:

  - A unique constraint covering the columns `[embassyId]` on the table `Horse` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eventId,categoryId,startNumber]` on the table `Registration` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "optionalPhone" TEXT,
ADD COLUMN     "socialLinks" JSONB;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "endStartTime" TEXT,
ADD COLUMN     "startEndTime" TEXT;

-- AlterTable
ALTER TABLE "Horse" ADD COLUMN     "embassyId" TEXT;

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "startNumber" INTEGER;

-- AlterTable
ALTER TABLE "Rider" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "optionalPhone" TEXT,
ADD COLUMN     "socialLinks" JSONB;

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "Club_name_idx" ON "Club"("name");

-- CreateIndex
CREATE INDEX "Club_createdAt_idx" ON "Club"("createdAt");

-- CreateIndex
CREATE INDEX "Event_startDate_endDate_idx" ON "Event"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Horse_embassyId_key" ON "Horse"("embassyId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_eventId_categoryId_startNumber_key" ON "Registration"("eventId", "categoryId", "startNumber");

-- CreateIndex
CREATE INDEX "Transaction_paymentMethod_idx" ON "Transaction"("paymentMethod");
