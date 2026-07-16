-- AlterTable
ALTER TABLE "business" ALTER COLUMN "followers" DROP NOT NULL,
ALTER COLUMN "followers" SET DEFAULT 0;
