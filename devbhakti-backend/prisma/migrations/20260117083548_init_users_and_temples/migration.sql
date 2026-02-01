-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DEVOTEE', 'INSTITUTION', 'SELLER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "password" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'DEVOTEE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Temple" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "fullAddress" TEXT,
    "description" TEXT NOT NULL,
    "history" TEXT,
    "image" TEXT,
    "heroImages" TEXT[],
    "gallery" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL,
    "liveStatus" BOOLEAN NOT NULL DEFAULT false,
    "openTime" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "mapUrl" TEXT,
    "viewers" TEXT,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Temple_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pooja" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "duration" TEXT NOT NULL,
    "description" TEXT[],
    "time" TEXT NOT NULL,
    "image" TEXT,
    "about" TEXT,
    "benefits" TEXT[],
    "bullets" TEXT[],
    "process" TEXT,
    "processSteps" JSONB,
    "templeId" TEXT NOT NULL,
    "templeDetails" TEXT,
    "packages" JSONB,
    "faqs" JSONB,
    "reviews" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pooja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Temple_userId_key" ON "Temple"("userId");

-- AddForeignKey
ALTER TABLE "Temple" ADD CONSTRAINT "Temple_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pooja" ADD CONSTRAINT "Pooja_templeId_fkey" FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
