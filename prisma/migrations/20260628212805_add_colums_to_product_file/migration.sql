/*
  Warnings:

  - Added the required column `fileName` to the `product_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileSize` to the `product_files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "product_files" ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "fileSize" INTEGER NOT NULL;
