-- Add reminderSentAt column to Reservation table
-- This field tracks when a 24h reminder email was sent for a reservation

-- Step 1: Add column as nullable (safe - no data modification)
ALTER TABLE "Reservation" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

-- Step 2: Create index for efficient reminder job queries
CREATE INDEX "Reservation_date_status_reminderSentAt_idx" ON "Reservation"("date", "status", "reminderSentAt");
