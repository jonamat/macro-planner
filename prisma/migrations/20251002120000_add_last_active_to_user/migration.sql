-- Add lastActiveAt column to track user activity and support pruning inactive accounts
ALTER TABLE "User" ADD COLUMN "lastActiveAt" DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing records
UPDATE "User" SET "lastActiveAt" = COALESCE("lastActiveAt", CURRENT_TIMESTAMP);
