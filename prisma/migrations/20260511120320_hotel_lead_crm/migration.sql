-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN "description" TEXT;

-- CreateTable
CREATE TABLE "HotelLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadNo" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "checkInDate" DATETIME NOT NULL,
    "checkOutDate" DATETIME NOT NULL,
    "nights" INTEGER NOT NULL DEFAULT 1,
    "roomCount" TEXT NOT NULL,
    "guestCount" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "preferences" TEXT NOT NULL DEFAULT '[]',
    "contactType" TEXT NOT NULL,
    "contactValue" TEXT NOT NULL,
    "remark" TEXT,
    "source" TEXT NOT NULL DEFAULT '官网首页',
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "referrer" TEXT,
    "landingPage" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assignedToId" TEXT,
    "lastFollowedAt" DATETIME,
    "dealAmount" INTEGER,
    "dealRemark" TEXT,
    "dealAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HotelLead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "AdminUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HotelLeadNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HotelLeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "HotelLead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HotelLeadNote_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HotelLeadStatusLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "operatorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HotelLeadStatusLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "HotelLead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HotelLeadStatusLog_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "AdminUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "HotelLead_leadNo_key" ON "HotelLead"("leadNo");

-- CreateIndex
CREATE INDEX "HotelLead_status_createdAt_idx" ON "HotelLead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "HotelLead_destination_idx" ON "HotelLead"("destination");

-- CreateIndex
CREATE INDEX "HotelLead_assignedToId_idx" ON "HotelLead"("assignedToId");

-- CreateIndex
CREATE INDEX "HotelLead_contactValue_idx" ON "HotelLead"("contactValue");

-- CreateIndex
CREATE INDEX "HotelLead_createdAt_idx" ON "HotelLead"("createdAt");

-- CreateIndex
CREATE INDEX "HotelLeadNote_leadId_createdAt_idx" ON "HotelLeadNote"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "HotelLeadStatusLog_leadId_createdAt_idx" ON "HotelLeadStatusLog"("leadId", "createdAt");
