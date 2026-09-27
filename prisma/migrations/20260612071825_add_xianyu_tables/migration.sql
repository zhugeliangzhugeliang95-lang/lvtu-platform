-- CreateTable
CREATE TABLE "XianYuTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inquiryId" TEXT NOT NULL,
    "hotelName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "roomType" TEXT,
    "checkInDate" TEXT NOT NULL,
    "checkOutDate" TEXT NOT NULL,
    "nights" INTEGER NOT NULL,
    "guestCount" INTEGER NOT NULL DEFAULT 2,
    "roomCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "aiSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "XianYuTask_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "InquiryOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "XianYuMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "sellerName" TEXT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replied" BOOLEAN NOT NULL DEFAULT false,
    "replyText" TEXT,
    "repliedAt" DATETIME,
    CONSTRAINT "XianYuMessage_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "XianYuTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "XianYuQuote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "sellerName" TEXT,
    "pricePerNight" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "breakfastIncluded" BOOLEAN NOT NULL DEFAULT false,
    "cancellable" BOOLEAN NOT NULL DEFAULT true,
    "extraServices" TEXT,
    "rawReply" TEXT NOT NULL,
    "aiParsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "XianYuQuote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "XianYuTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "XianYuTask_status_createdAt_idx" ON "XianYuTask"("status", "createdAt");

-- CreateIndex
CREATE INDEX "XianYuTask_inquiryId_idx" ON "XianYuTask"("inquiryId");

-- CreateIndex
CREATE INDEX "XianYuMessage_taskId_idx" ON "XianYuMessage"("taskId");

-- CreateIndex
CREATE INDEX "XianYuQuote_taskId_idx" ON "XianYuQuote"("taskId");
