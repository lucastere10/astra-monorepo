-- Dual digest schedules + stable unsubscribe token

-- Add new columns (nullable first where we need backfill from legacy fields)
ALTER TABLE "User" ADD COLUMN "dailyEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "dailySendHour" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "User" ADD COLUMN "dailySendDays" INTEGER[] NOT NULL DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[];
ALTER TABLE "User" ADD COLUMN "weeklyEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "weeklySendHour" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "User" ADD COLUMN "unsubscribeToken" TEXT;

-- Migrate from exclusive cadence + sendHour
UPDATE "User"
SET
  "dailyEnabled" = (cadence = 'DAILY'),
  "weeklyEnabled" = (cadence = 'WEEKLY'),
  "dailySendHour" = "sendHour",
  "weeklySendHour" = "sendHour",
  "dailySendDays" = CASE
    WHEN cadence = 'DAILY' THEN ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[]
    ELSE ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[]
  END;

-- Backfill unique unsubscribe tokens for existing users
UPDATE "User"
SET "unsubscribeToken" = md5(random()::text || id || clock_timestamp()::text)
WHERE "unsubscribeToken" IS NULL;

ALTER TABLE "User" ALTER COLUMN "unsubscribeToken" SET NOT NULL;
CREATE UNIQUE INDEX "User_unsubscribeToken_key" ON "User"("unsubscribeToken");

-- Drop legacy exclusive-cadence columns
ALTER TABLE "User" DROP COLUMN "cadence";
ALTER TABLE "User" DROP COLUMN "sendHour";
