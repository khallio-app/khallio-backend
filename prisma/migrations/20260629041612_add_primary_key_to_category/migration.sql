/*
  Warnings:

  - The primary key for the `categories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id]` on the table `categories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "categories" DROP CONSTRAINT "categories_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "categories_id_key" ON "categories"("id");
