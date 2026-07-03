-- 1. Drop dependent FK constraints first
ALTER TABLE "account" DROP CONSTRAINT "account_userId_fkey";
ALTER TABLE "session" DROP CONSTRAINT "session_userId_fkey";
ALTER TABLE "product_files" DROP CONSTRAINT "product_files_productId_fkey";
ALTER TABLE "products" DROP CONSTRAINT "products_userId_fkey";

-- 2. Convert primary keys to UUID
ALTER TABLE "account" DROP CONSTRAINT "account_pkey",
  DROP COLUMN "id",
  ADD COLUMN "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD CONSTRAINT "account_pkey" PRIMARY KEY ("id");

ALTER TABLE "product_files" DROP CONSTRAINT "product_files_pkey",
  DROP COLUMN "id",
  ADD COLUMN "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD CONSTRAINT "product_files_pkey" PRIMARY KEY ("id");

ALTER TABLE "products" DROP CONSTRAINT "products_pkey",
  DROP COLUMN "id",
  ADD COLUMN "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");

ALTER TABLE "session" DROP CONSTRAINT "session_pkey",
  DROP COLUMN "id",
  ADD COLUMN "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD CONSTRAINT "session_pkey" PRIMARY KEY ("id");

ALTER TABLE "verification" DROP CONSTRAINT "verification_pkey",
  DROP COLUMN "id",
  ADD COLUMN "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD CONSTRAINT "verification_pkey" PRIMARY KEY ("id");

ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
  DROP COLUMN "id",
  ADD COLUMN "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- 3. Convert the referencing FK columns to UUID too
ALTER TABLE "account" DROP COLUMN "userId", ADD COLUMN "userId" UUID NOT NULL;
ALTER TABLE "session" DROP COLUMN "userId", ADD COLUMN "userId" UUID NOT NULL;
ALTER TABLE "product_files" DROP COLUMN "productId", ADD COLUMN "productId" UUID NOT NULL;
ALTER TABLE "products" DROP COLUMN "userId", ADD COLUMN "userId" UUID NOT NULL;

-- 4. Recreate the FK constraints
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_files" ADD CONSTRAINT "product_files_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "products" ADD CONSTRAINT "products_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Indexes
CREATE UNIQUE INDEX "products_id_key" ON "products"("id");
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");