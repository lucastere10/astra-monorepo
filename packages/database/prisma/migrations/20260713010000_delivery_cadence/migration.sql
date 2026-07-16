-- CreateEnum
CREATE TYPE "NewsletterCadence" AS ENUM ('DAILY', 'WEEKLY');

-- AlterTable User: delivery settings
ALTER TABLE "User" ADD COLUMN "cadence" "NewsletterCadence" NOT NULL DEFAULT 'WEEKLY';
ALTER TABLE "User" ADD COLUMN "sendHour" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "User" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo';
ALTER TABLE "User" ADD COLUMN "autoSendEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "weeklySendDay" INTEGER NOT NULL DEFAULT 1;

-- AlterTable Newsletter: cadence
ALTER TABLE "Newsletter" ADD COLUMN "cadence" "NewsletterCadence" NOT NULL DEFAULT 'WEEKLY';

-- CreateIndex
CREATE INDEX "User_autoSendEnabled_idx" ON "User"("autoSendEnabled");
CREATE INDEX "Newsletter_cadence_idx" ON "Newsletter"("cadence");
