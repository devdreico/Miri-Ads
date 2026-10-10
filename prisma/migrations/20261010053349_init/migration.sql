-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'CITY_ADMIN', 'MIRI_CENTRAL', 'CREW');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('ESSENTIAL', 'PRO', 'GROWTH');

-- CreateEnum
CREATE TYPE "Cadence" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MERCADOPAGO', 'DEMO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DeliverableType" AS ENUM ('CALENDAR', 'STATIC_IMAGE', 'COPY', 'MOTION_VIDEO', 'VIDEO_AD', 'PAID_MEDIA_REPORT');

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DELIVERED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PointStatus" AS ENUM ('PROPOSED', 'ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "ZoneStatus" AS ENUM ('PROPOSED', 'ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "CyclePhase" AS ENUM ('SALES', 'PRINTING', 'DISTRIBUTION', 'DEPLOYMENT', 'CLOSING');

-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('PLANNED', 'DISTRIBUTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "StopKind" AS ENUM ('FLYER', 'PASTE', 'STICKER', 'HANDBILL');

-- CreateEnum
CREATE TYPE "StopStatus" AS ENUM ('PENDING', 'DONE', 'MISSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EvidenceKind" AS ENUM ('PHOTO', 'VIDEO', 'CHECKLIST');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CrewStatus" AS ENUM ('AVAILABLE', 'ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Lima',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "tier" "PlanTier" NOT NULL,
    "cadence" "Cadence" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "planSnapshot" JSONB NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT,
    "clientCompany" TEXT,
    "mpPreferenceId" TEXT,
    "mpPaymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "externalId" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT,
    "clientId" TEXT,
    "cityId" TEXT,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deliverable" (
    "id" TEXT NOT NULL,
    "type" "DeliverableType" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'PENDING',
    "dueAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "assetUrl" TEXT,
    "content" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "campaignId" TEXT NOT NULL,

    CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaticPoint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "partnerName" TEXT,
    "surface" TEXT,
    "status" "PointStatus" NOT NULL DEFAULT 'PROPOSED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cityId" TEXT NOT NULL,

    CONSTRAINT "StaticPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllowedZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "polygon" JSONB NOT NULL,
    "status" "ZoneStatus" NOT NULL DEFAULT 'PROPOSED',
    "notes" TEXT,
    "cityId" TEXT NOT NULL,

    CONSTRAINT "AllowedZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchCycle" (
    "id" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "weekEnd" DATE NOT NULL,
    "phase" "CyclePhase" NOT NULL DEFAULT 'SALES',
    "printDate" DATE,
    "distributeDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cityId" TEXT NOT NULL,

    CONSTRAINT "BatchCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE,
    "status" "RouteStatus" NOT NULL DEFAULT 'PLANNED',
    "distanceM" INTEGER,
    "estimatedQty" INTEGER,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cycleId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "crewId" TEXT,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteStop" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "kind" "StopKind" NOT NULL DEFAULT 'FLYER',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "StopStatus" NOT NULL DEFAULT 'PENDING',
    "checkNote" TEXT,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "routeId" TEXT NOT NULL,

    CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "kind" "EvidenceKind" NOT NULL DEFAULT 'PHOTO',
    "fileUrl" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "metadata" JSONB,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "accuracyM" DOUBLE PRECISION,
    "capturedAt" TIMESTAMP(3),
    "status" "EvidenceStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaderId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "stopId" TEXT,
    "staticPointId" TEXT,
    "campaignId" TEXT,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewProfile" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "status" "CrewStatus" NOT NULL DEFAULT 'AVAILABLE',
    "bio" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "routesCompleted" INTEGER NOT NULL DEFAULT 0,
    "stopsCompleted" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,

    CONSTRAINT "CrewProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewScore" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "crewId" TEXT NOT NULL,
    "awardedById" TEXT,

    CONSTRAINT "CrewScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'un',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "cityId" TEXT NOT NULL,

    CONSTRAINT "SupplyItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyAssignment" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "returned" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cycleId" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,

    CONSTRAINT "SupplyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "City_adminId_key" ON "City"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_reference_key" ON "Order"("reference");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_orderId_key" ON "Campaign"("orderId");

-- CreateIndex
CREATE INDEX "Campaign_clientId_idx" ON "Campaign"("clientId");

-- CreateIndex
CREATE INDEX "Deliverable_campaignId_idx" ON "Deliverable"("campaignId");

-- CreateIndex
CREATE INDEX "StaticPoint_cityId_idx" ON "StaticPoint"("cityId");

-- CreateIndex
CREATE INDEX "AllowedZone_cityId_idx" ON "AllowedZone"("cityId");

-- CreateIndex
CREATE INDEX "BatchCycle_cityId_idx" ON "BatchCycle"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "BatchCycle_cityId_weekStart_key" ON "BatchCycle"("cityId", "weekStart");

-- CreateIndex
CREATE INDEX "Route_cycleId_idx" ON "Route"("cycleId");

-- CreateIndex
CREATE INDEX "Route_crewId_idx" ON "Route"("crewId");

-- CreateIndex
CREATE INDEX "RouteStop_routeId_idx" ON "RouteStop"("routeId");

-- CreateIndex
CREATE INDEX "Evidence_status_idx" ON "Evidence"("status");

-- CreateIndex
CREATE INDEX "Evidence_stopId_idx" ON "Evidence"("stopId");

-- CreateIndex
CREATE UNIQUE INDEX "CrewProfile_handle_key" ON "CrewProfile"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "CrewProfile_userId_key" ON "CrewProfile"("userId");

-- CreateIndex
CREATE INDEX "CrewProfile_cityId_idx" ON "CrewProfile"("cityId");

-- CreateIndex
CREATE INDEX "CrewScore_crewId_idx" ON "CrewScore"("crewId");

-- CreateIndex
CREATE INDEX "SupplyItem_cityId_idx" ON "SupplyItem"("cityId");

-- CreateIndex
CREATE INDEX "SupplyAssignment_cycleId_idx" ON "SupplyAssignment"("cycleId");

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaticPoint" ADD CONSTRAINT "StaticPoint_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllowedZone" ADD CONSTRAINT "AllowedZone_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchCycle" ADD CONSTRAINT "BatchCycle_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "BatchCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "CrewProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "RouteStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_staticPointId_fkey" FOREIGN KEY ("staticPointId") REFERENCES "StaticPoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewProfile" ADD CONSTRAINT "CrewProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewProfile" ADD CONSTRAINT "CrewProfile_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewScore" ADD CONSTRAINT "CrewScore_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "CrewProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewScore" ADD CONSTRAINT "CrewScore_awardedById_fkey" FOREIGN KEY ("awardedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyItem" ADD CONSTRAINT "SupplyItem_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyAssignment" ADD CONSTRAINT "SupplyAssignment_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "BatchCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyAssignment" ADD CONSTRAINT "SupplyAssignment_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "CrewProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyAssignment" ADD CONSTRAINT "SupplyAssignment_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "SupplyItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
