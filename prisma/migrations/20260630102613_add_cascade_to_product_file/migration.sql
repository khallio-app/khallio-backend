-- DropForeignKey
ALTER TABLE "product_files" DROP CONSTRAINT "product_files_productId_fkey";

-- AlterTable
ALTER TABLE "product_files" ADD CONSTRAINT "product_files_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "products" ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "product_files" ADD CONSTRAINT "product_files_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
