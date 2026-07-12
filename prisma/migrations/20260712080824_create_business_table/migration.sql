/*
  Warnings:

  - You are about to drop the column `userId` on the `products` table. All the data in the column will be lost.
  - Added the required column `businessId` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_userId_fkey";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "userId",
ADD COLUMN     "businessId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "business" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "userId" UUID NOT NULL,
    "description" VARCHAR(400) NOT NULL,
    "bannerImg" TEXT,
    "profileImg" TEXT,
    "location" TEXT,
    "socialLinks" TEXT[],
    "followers" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_id_key" ON "business"("id");

-- AddForeignKey
ALTER TABLE "business" ADD CONSTRAINT "business_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
