-- CreateTable
CREATE TABLE "PriceSearchRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "hotelName" TEXT NOT NULL,
    "roomType" TEXT,
    "checkInDate" DATETIME,
    "checkOutDate" DATETIME,
    "nights" INTEGER NOT NULL DEFAULT 1,
    "guestCount" INTEGER NOT NULL DEFAULT 2,
    "roomCount" INTEGER NOT NULL DEFAULT 1,
    "minTotalPrice" INTEGER,
    "resultsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriceSearchRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InquiryOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNo" TEXT NOT NULL,
    "userId" TEXT,
    "destination" TEXT NOT NULL,
    "checkInDate" DATETIME,
    "checkOutDate" DATETIME,
    "nights" INTEGER,
    "roomCount" INTEGER NOT NULL DEFAULT 1,
    "guestCount" INTEGER NOT NULL DEFAULT 2,
    "budget" TEXT,
    "hotelPreference" TEXT,
    "breakfastIncluded" BOOLEAN,
    "cancellable" BOOLEAN,
    "needInvoice" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "aiStructuredJson" TEXT,
    "aiMissingFields" TEXT,
    "aiFollowUpQuestion" TEXT,
    "aiUserExplanation" TEXT,
    "aiStaffSummary" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "source" TEXT NOT NULL DEFAULT '移动询价',
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "referrer" TEXT,
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
    CONSTRAINT "InquiryOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InquiryOrder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "AdminUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InquiryOrder" ("aiFollowUpQuestion", "aiMissingFields", "aiStaffSummary", "aiStructuredJson", "aiUserExplanation", "assignedToId", "breakfastIncluded", "budget", "cancellable", "checkInDate", "checkOutDate", "contactName", "contactPhone", "createdAt", "dealAmount", "dealAt", "dealRemark", "destination", "guestCount", "hotelPreference", "id", "ip", "lastFollowedAt", "needInvoice", "nights", "notes", "orderNo", "referrer", "roomCount", "source", "status", "updatedAt", "userAgent", "utmCampaign", "utmMedium", "utmSource") SELECT "aiFollowUpQuestion", "aiMissingFields", "aiStaffSummary", "aiStructuredJson", "aiUserExplanation", "assignedToId", "breakfastIncluded", "budget", "cancellable", "checkInDate", "checkOutDate", "contactName", "contactPhone", "createdAt", "dealAmount", "dealAt", "dealRemark", "destination", "guestCount", "hotelPreference", "id", "ip", "lastFollowedAt", "needInvoice", "nights", "notes", "orderNo", "referrer", "roomCount", "source", "status", "updatedAt", "userAgent", "utmCampaign", "utmMedium", "utmSource" FROM "InquiryOrder";
DROP TABLE "InquiryOrder";
ALTER TABLE "new_InquiryOrder" RENAME TO "InquiryOrder";
CREATE UNIQUE INDEX "InquiryOrder_orderNo_key" ON "InquiryOrder"("orderNo");
CREATE INDEX "InquiryOrder_status_createdAt_idx" ON "InquiryOrder"("status", "createdAt");
CREATE INDEX "InquiryOrder_userId_createdAt_idx" ON "InquiryOrder"("userId", "createdAt");
CREATE INDEX "InquiryOrder_destination_idx" ON "InquiryOrder"("destination");
CREATE INDEX "InquiryOrder_assignedToId_idx" ON "InquiryOrder"("assignedToId");
CREATE INDEX "InquiryOrder_contactPhone_idx" ON "InquiryOrder"("contactPhone");
CREATE INDEX "InquiryOrder_createdAt_idx" ON "InquiryOrder"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PriceSearchRecord_userId_createdAt_idx" ON "PriceSearchRecord"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PriceSearchRecord_hotelName_idx" ON "PriceSearchRecord"("hotelName");
