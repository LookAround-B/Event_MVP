-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "isScheduled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startPosition" INTEGER;
