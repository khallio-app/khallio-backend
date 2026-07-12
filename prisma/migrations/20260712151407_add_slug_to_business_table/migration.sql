/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `business` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `business` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "business" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "business_slug_key" ON "business"("slug");
