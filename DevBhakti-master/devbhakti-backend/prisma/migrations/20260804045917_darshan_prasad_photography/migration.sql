/*
  Warnings:

  - The `documentUrl` column on the `Mandal` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PrasadStatus" AS ENUM ('NOT_APPLICABLE', 'PREPARING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED');

-- CreateEnum
CREATE TYPE "PrasadType" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "DarshanTicketStatus" AS ENUM ('PENDING', 'CONFIRMED', 'USED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "CommissionCategory" ADD VALUE 'DARSHAN';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LedgerType" ADD VALUE 'PHOTOGRAPHY_EARNING';
ALTER TYPE "LedgerType" ADD VALUE 'DARSHAN_EARNING';

-- DropForeignKey
ALTER TABLE "PoojaBooking" DROP CONSTRAINT "PoojaBooking_userId_fkey";

-- AlterTable
ALTER TABLE "Mandal" DROP COLUMN "documentUrl",
ADD COLUMN     "documentUrl" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Pooja" ADD COLUMN     "hasPrasad" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prasadType" "PrasadType" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "PoojaBooking" ADD COLUMN     "awbCode" TEXT,
ADD COLUMN     "courierName" TEXT,
ADD COLUMN     "isPrasadRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "prasadAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "prasadCity" TEXT,
ADD COLUMN     "prasadPincode" TEXT,
ADD COLUMN     "prasadQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "prasadState" TEXT,
ADD COLUMN     "prasadStatus" "PrasadStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
ADD COLUMN     "prasadStreet" TEXT,
ADD COLUMN     "shiprocketOrderId" TEXT,
ADD COLUMN     "trackingUrl" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Temple" ADD COLUMN     "allowedPhotoAreas" JSONB,
ADD COLUMN     "darshanPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "isDarshanActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "photographyEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "photographyRules" JSONB,
ADD COLUMN     "prasadPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "showWebsite" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PhotographyPackage" (
    "id" TEXT NOT NULL,
    "templeId" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" JSONB,

    CONSTRAINT "PhotographyPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotographySlot" (
    "id" TEXT NOT NULL,
    "templeId" TEXT NOT NULL,
    "slotName" TEXT NOT NULL,
    "maxBookingsPerDay" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotographySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotographyBooking" (
    "id" TEXT NOT NULL,
    "displayId" TEXT NOT NULL,
    "userId" TEXT,
    "templeId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "selectedArea" TEXT NOT NULL,
    "bookingDate" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "packagePrice" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotographyBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DarshanSlot" (
    "id" TEXT NOT NULL,
    "templeId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 500,
    "bookedCount" INTEGER NOT NULL DEFAULT 0,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DarshanSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DarshanTicket" (
    "id" TEXT NOT NULL,
    "displayId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "templeId" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "visitorPhone" TEXT NOT NULL,
    "visitorEmail" TEXT,
    "visitorCount" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netEarning" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "DarshanTicketStatus" NOT NULL DEFAULT 'PENDING',
    "qrToken" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3),
    "scannedBy" TEXT,
    "paymentMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DarshanTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhotographyBooking_displayId_key" ON "PhotographyBooking"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "DarshanSlot_templeId_date_startTime_key" ON "DarshanSlot"("templeId", "date", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "DarshanTicket_displayId_key" ON "DarshanTicket"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "DarshanTicket_qrToken_key" ON "DarshanTicket"("qrToken");

-- AddForeignKey
ALTER TABLE "PoojaBooking" ADD CONSTRAINT "PoojaBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotographyPackage" ADD CONSTRAINT "PhotographyPackage_templeId_fkey" FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotographySlot" ADD CONSTRAINT "PhotographySlot_templeId_fkey" FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotographyBooking" ADD CONSTRAINT "PhotographyBooking_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PhotographyPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotographyBooking" ADD CONSTRAINT "PhotographyBooking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "PhotographySlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotographyBooking" ADD CONSTRAINT "PhotographyBooking_templeId_fkey" FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotographyBooking" ADD CONSTRAINT "PhotographyBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DarshanSlot" ADD CONSTRAINT "DarshanSlot_templeId_fkey" FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DarshanTicket" ADD CONSTRAINT "DarshanTicket_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "DarshanSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DarshanTicket" ADD CONSTRAINT "DarshanTicket_templeId_fkey" FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DarshanTicket" ADD CONSTRAINT "DarshanTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
