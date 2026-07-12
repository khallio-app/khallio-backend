-- AlterTable
ALTER TABLE "business" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "socialLinks" SET DEFAULT ARRAY[]::TEXT[];
