/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `products` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "publicId" VARCHAR(30);

-- CreateIndex
CREATE UNIQUE INDEX "products_publicId_key" ON "products"("publicId");
