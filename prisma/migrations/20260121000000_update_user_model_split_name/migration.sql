-- AlterTable: Update User model to split name into firstName and lastName
-- Strategy: Add new columns, migrate data, remove old column

-- Step 1: Add new columns (nullable first to allow for data migration)
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN "company" TEXT;
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- Step 2: Migrate existing data
-- Split the "name" field: first word = firstName, rest = lastName
-- If name has only one word, use it for both firstName and lastName
UPDATE "User"
SET
  "firstName" = CASE
    WHEN POSITION(' ' IN name) > 0
    THEN SUBSTRING(name FROM 1 FOR POSITION(' ' IN name) - 1)
    ELSE name
  END,
  "lastName" = CASE
    WHEN POSITION(' ' IN name) > 0
    THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
    ELSE name
  END;

-- Step 3: Make firstName and lastName required (NOT NULL)
ALTER TABLE "User" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "lastName" SET NOT NULL;

-- Step 4: Drop the old "name" column
ALTER TABLE "User" DROP COLUMN "name";
