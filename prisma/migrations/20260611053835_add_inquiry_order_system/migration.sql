-- CreateTable
CREATE TABLE "InquiryOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNo" TEXT NOT NULL,
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
    CONSTRAINT "InquiryOrder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "AdminUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InquiryPriceReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "hotelName" TEXT NOT NULL,
    "roomType" TEXT,
    "pricePerNight" INTEGER NOT NULL,
    "totalPrice" INTEGER,
    "breakfastIncluded" BOOLEAN NOT NULL DEFAULT false,
    "cancellable" BOOLEAN NOT NULL DEFAULT true,
    "sourceUrl" TEXT,
    "queriedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isMock" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InquiryPriceReference_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "InquiryOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InquiryOrderStatusLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InquiryOrderStatusLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "InquiryOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "InquiryOrder_orderNo_key" ON "InquiryOrder"("orderNo");

-- CreateIndex
CREATE INDEX "InquiryOrder_status_createdAt_idx" ON "InquiryOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "InquiryOrder_destination_idx" ON "InquiryOrder"("destination");

-- CreateIndex
CREATE INDEX "InquiryOrder_assignedToId_idx" ON "InquiryOrder"("assignedToId");

-- CreateIndex
CREATE INDEX "InquiryOrder_contactPhone_idx" ON "InquiryOrder"("contactPhone");

-- CreateIndex
CREATE INDEX "InquiryOrder_createdAt_idx" ON "InquiryOrder"("createdAt");

-- CreateIndex
CREATE INDEX "InquiryPriceReference_orderId_idx" ON "InquiryPriceReference"("orderId");

-- CreateIndex
CREATE INDEX "InquiryPriceReference_platform_idx" ON "InquiryPriceReference"("platform");

-- CreateIndex
CREATE INDEX "InquiryOrderStatusLog_orderId_createdAt_idx" ON "InquiryOrderStatusLog"("orderId", "createdAt");
