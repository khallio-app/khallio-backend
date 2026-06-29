-- CreateTable
CREATE TABLE "product_files" (
    "id" UUID NOT NULL,
    "productId" UUID,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "product_files_id_key" ON "product_files"("id");

-- CreateIndex
CREATE UNIQUE INDEX "product_files_key_key" ON "product_files"("key");

-- AddForeignKey
ALTER TABLE "product_files" ADD CONSTRAINT "product_files_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
