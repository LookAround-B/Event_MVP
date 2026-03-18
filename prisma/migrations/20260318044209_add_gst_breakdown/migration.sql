/*
  Warnings:

  - You are about to drop the column `horseid` on the `Registration` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eventId,riderId,horseId]` on the table `Registration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `horseId` to the `Registration` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Registration" DROP CONSTRAINT "Registration_horseid_fkey";

-- DropIndex
DROP INDEX "Registration_eventId_riderId_horseid_key";

-- AlterTable
ALTER TABLE "Registration" DROP COLUMN "horseid",
ADD COLUMN     "horseId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Registration_eventId_riderId_horseId_key" ON "Registration"("eventId", "riderId", "horseId");

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
