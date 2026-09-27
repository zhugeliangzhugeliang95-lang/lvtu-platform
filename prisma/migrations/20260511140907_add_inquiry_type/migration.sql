-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HotelLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadNo" TEXT NOT NULL,
    "inquiryType" TEXT NOT NULL DEFAULT 'HOTEL',
    "destination" TEXT NOT NULL,
    "timeframe" TEXT,
    "checkInDate" DATETIME,
    "checkOutDate" DATETIME,
    "nights" INTEGER,
    "roomCount" TEXT,
    "guestCount" TEXT NOT NULL,
    "budget" TEXT,
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
INSERT INTO "new_HotelLead" ("assignedToId", "budget", "checkInDate", "checkOutDate", "contactType", "contactValue", "createdAt", "dealAmount", "dealAt", "dealRemark", "destination", "guestCount", "id", "ip", "landingPage", "lastFollowedAt", "leadNo", "nights", "preferences", "referrer", "remark", "roomCount", "source", "status", "updatedAt", "userAgent", "utmCampaign", "utmMedium", "utmSource") SELECT "assignedToId", "budget", "checkInDate", "checkOutDate", "contactType", "contactValue", "createdAt", "dealAmount", "dealAt", "dealRemark", "destination", "guestCount", "id", "ip", "landingPage", "lastFollowedAt", "leadNo", "nights", "preferences", "referrer", "remark", "roomCount", "source", "status", "updatedAt", "userAgent", "utmCampaign", "utmMedium", "utmSource" FROM "HotelLead";
DROP TABLE "HotelLead";
ALTER TABLE "new_HotelLead" RENAME TO "HotelLead";
CREATE UNIQUE INDEX "HotelLead_leadNo_key" ON "HotelLead"("leadNo");
CREATE INDEX "HotelLead_status_createdAt_idx" ON "HotelLead"("status", "createdAt");
CREATE INDEX "HotelLead_destination_idx" ON "HotelLead"("destination");
CREATE INDEX "HotelLead_assignedToId_idx" ON "HotelLead"("assignedToId");
CREATE INDEX "HotelLead_contactValue_idx" ON "HotelLead"("contactValue");
CREATE INDEX "HotelLead_createdAt_idx" ON "HotelLead"("createdAt");
CREATE INDEX "HotelLead_inquiryType_createdAt_idx" ON "HotelLead"("inquiryType", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
