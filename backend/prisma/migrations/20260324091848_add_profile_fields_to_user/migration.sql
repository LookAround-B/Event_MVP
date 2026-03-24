/*
  Warnings:

  - A unique constraint covering the columns `[embassyId]` on the table `Horse` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - The required column `eId` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

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
ALTER TABLE "Rider" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "optionalPhone" TEXT,
ADD COLUMN     "socialLinks" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dob" TIMESTAMP(3),
ADD COLUMN     "eId" TEXT,
ADD COLUMN     "efiRiderId" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "optionalPhone" TEXT;

-- Populate eId for existing users
UPDATE "User" SET "eId" = 'EIRSD' || LPAD(CAST((SELECT COUNT(*) FROM "User" u2 WHERE u2."createdAt" <= "User"."createdAt") AS TEXT), 5, '0') WHERE "eId" IS NULL;

-- Make eId required
ALTER TABLE "User" ALTER COLUMN "eId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Horse_embassyId_key" ON "Horse"("embassyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_eId_key" ON "User"("eId");
