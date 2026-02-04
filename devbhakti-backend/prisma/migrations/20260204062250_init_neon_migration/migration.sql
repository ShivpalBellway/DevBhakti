/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Temple` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subdomain]` on the table `Temple` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SlabType" AS ENUM ('GLOBAL', 'TEMPLE', 'SELLER');

-- CreateEnum
CREATE TYPE "CommissionCategory" AS ENUM ('MARKETPLACE', 'POOJA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "BookingStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "BookingStatus" ADD VALUE 'PENDING';

-- DropForeignKey
ALTER TABLE "Pooja" DROP CONSTRAINT "Pooja_templeId_fkey";

-- DropForeignKey
ALTER TABLE "TempleLedger" DROP CONSTRAINT "TempleLedger_templeId_fkey";

-- DropForeignKey
ALTER TABLE "WithdrawalRequest" DROP CONSTRAINT "WithdrawalRequest_templeId_fkey";

-- DropIndex
DROP INDEX "User_phone_role_key";

-- AlterTable
ALTER TABLE "Pooja" ADD COLUMN     "isMaster" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "masterPoojaId" TEXT,
ALTER COLUMN "templeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "sellerId" TEXT;

-- AlterTable
ALTER TABLE "SubOrder" ADD COLUMN     "sellerId" TEXT;

-- AlterTable
ALTER TABLE "Temple" ADD COLUMN     "accountHolderName" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "ifscCode" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "subdomain" TEXT,
ADD COLUMN     "upiId" TEXT,
ADD COLUMN     "urlType" TEXT NOT NULL DEFAULT 'slug';

-- AlterTable
ALTER TABLE "TempleLedger" ADD COLUMN     "sellerId" TEXT,
ALTER COLUMN "templeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WithdrawalRequest" ADD COLUMN     "sellerId" TEXT,
ALTER COLUMN "templeId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAvailability" (
    "id" TEXT NOT NULL,
    "templeId" TEXT NOT NULL,
    "poojaId" TEXT,
    "date" TEXT NOT NULL,
    "maxBookings" INTEGER NOT NULL DEFAULT 20,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "fullAddress" TEXT,
    "description" TEXT,
    "image" TEXT,
    "heroImages" TEXT[],
    "category" TEXT,
    "openTime" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "productCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountHolderName" TEXT,
    "accountNumber" TEXT,
    "bankName" TEXT,
    "ifscCode" TEXT,
    "upiId" TEXT,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionSlab" (
    "id" TEXT NOT NULL,
    "minAmount" DOUBLE PRECISION NOT NULL,
    "maxAmount" DOUBLE PRECISION,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "slabType" "SlabType" NOT NULL DEFAULT 'GLOBAL',
    "category" "CommissionCategory" NOT NULL DEFAULT 'MARKETPLACE',
    "targetId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionSlab_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingAvailability_templeId_poojaId_date_key" ON "BookingAvailability"("templeId", "poojaId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_userId_key" ON "SellerProfile"("userId");

-- CreateIndex
CREATE INDEX "CommissionSlab_slabType_targetId_category_idx" ON "CommissionSlab"("slabType", "targetId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Temple_slug_key" ON "Temple"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Temple_subdomain_key" ON "Temple"("subdomain");

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAvailability" ADD CONSTRAINT "BookingAvailability_poojaId_fkey" FOREIGN KEY ("poojaId") REFERENCES "Pooja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAvailability" ADD CONSTRAINT "BookingAvailability_templeId_fkey" FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pooja" ADD CONSTRAINT "Pooja_templeId_fkey" FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pooja" ADD CONSTRAINT "Pooja_masterPoojaId_fkey" FOREIGN KEY ("masterPoojaId") REFERENCES "Pooja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubOrder" ADD CONSTRAINT "SubOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempleLedger" ADD CONSTRAINT "TempleLedger_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempleLedger" ADD CONSTRAINT "TempleLedger_templeId_fkey" FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_templeId_fkey" FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE SET NULL ON UPDATE CASCADE;
