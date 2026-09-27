-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "memberNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MembershipPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipId" TEXT,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'WECHAT',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" DATETIME,
    "confirmedBy" TEXT,
    CONSTRAINT "MembershipPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MembershipPayment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MembershipPayment_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "AdminUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Traveler" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "documentType" TEXT,
    "documentNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Traveler_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requirementNo" TEXT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT,
    "destination" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "partySize" INTEGER,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "wechat" TEXT,
    "content" TEXT NOT NULL,
    "detailsJson" TEXT,
    "marketReferencePrice" INTEGER,
    "estimatedMinPrice" INTEGER,
    "estimatedMaxPrice" INTEGER,
    "estimateConfidence" TEXT,
    "priceStatus" TEXT NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "assignedStaffId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Requirement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Requirement_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "AdminUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requirementId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "title" TEXT,
    "description" TEXT NOT NULL,
    "included" TEXT,
    "roomType" TEXT,
    "cancellationPolicy" TEXT,
    "expireAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Quote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketPriceSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productType" TEXT NOT NULL,
    "productId" TEXT,
    "destination" TEXT,
    "category" TEXT,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "conditions" TEXT,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "createdBy" TEXT,
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EstimateRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productType" TEXT NOT NULL,
    "destination" TEXT,
    "category" TEXT,
    "minFactor" REAL NOT NULL,
    "maxFactor" REAL NOT NULL,
    "riskBuffer" REAL NOT NULL DEFAULT 0,
    "confidence" TEXT NOT NULL DEFAULT 'MEDIUM',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" DATETIME,
    "validTo" DATETIME,
    "notes" TEXT,
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EstimateResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requirementId" TEXT,
    "inputHash" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "productId" TEXT,
    "marketReferencePrice" INTEGER,
    "estimatedMinPrice" INTEGER,
    "estimatedMaxPrice" INTEGER,
    "confidence" TEXT NOT NULL DEFAULT 'LOW',
    "priceStatus" TEXT NOT NULL DEFAULT 'UNAVAILABLE',
    "ruleId" TEXT,
    "explanation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EstimateResult_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierInquiryResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requirementId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierId" TEXT,
    "quotedPrice" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "roomType" TEXT,
    "benefits" TEXT,
    "cancellationPolicy" TEXT,
    "availability" TEXT NOT NULL,
    "notes" TEXT,
    "evidenceUrl" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceConversationId" TEXT,
    "rawResponse" TEXT,
    "parsedByAI" BOOLEAN NOT NULL DEFAULT false,
    "verifiedByHuman" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierInquiryResult_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "proofImage" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "detailsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trip_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "description" TEXT,
    "qrImage" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "orderNo" TEXT,
    "description" TEXT NOT NULL,
    "attachment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "reply" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leadId" TEXT,
    "requirementId" TEXT,
    "orderType" TEXT,
    "productId" TEXT,
    "productName" TEXT,
    "amount" INTEGER,
    "costAmount" INTEGER,
    "grossProfit" INTEGER,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "orderStatus" TEXT NOT NULL DEFAULT 'PENDING_CONFIRM',
    "serviceStaffId" TEXT,
    "travelDate" DATETIME,
    "confirmationNo" TEXT,
    "voucherUrl" TEXT,
    "supplierName" TEXT,
    "fulfillmentNote" TEXT,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_serviceStaffId_fkey" FOREIGN KEY ("serviceStaffId") REFERENCES "AdminUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("amount", "costAmount", "createdAt", "grossProfit", "id", "leadId", "orderNo", "orderStatus", "orderType", "paymentStatus", "productId", "productName", "remark", "serviceStaffId", "travelDate", "updatedAt", "userId") SELECT "amount", "costAmount", "createdAt", "grossProfit", "id", "leadId", "orderNo", "orderStatus", "orderType", "paymentStatus", "productId", "productName", "remark", "serviceStaffId", "travelDate", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
CREATE INDEX "Order_orderStatus_createdAt_idx" ON "Order"("orderStatus", "createdAt");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "nickname" TEXT,
    "avatar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" DATETIME,
    "passwordHash" TEXT NOT NULL,
    "serviceNotifications" BOOLEAN NOT NULL DEFAULT true,
    "marketingNotifications" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatar", "createdAt", "email", "id", "lastLoginAt", "mobile", "nickname", "passwordHash", "status", "updatedAt") SELECT "avatar", "createdAt", "email", "id", "lastLoginAt", "mobile", "nickname", "passwordHash", "status", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Membership_memberNo_key" ON "Membership"("memberNo");

-- CreateIndex
CREATE INDEX "Membership_userId_status_expiresAt_idx" ON "Membership"("userId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "Membership_phone_idx" ON "Membership"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPayment_paymentNo_key" ON "MembershipPayment"("paymentNo");

-- CreateIndex
CREATE INDEX "MembershipPayment_userId_createdAt_idx" ON "MembershipPayment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MembershipPayment_status_createdAt_idx" ON "MembershipPayment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Traveler_userId_createdAt_idx" ON "Traveler"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Requirement_requirementNo_key" ON "Requirement"("requirementNo");

-- CreateIndex
CREATE INDEX "Requirement_userId_createdAt_idx" ON "Requirement"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Requirement_status_createdAt_idx" ON "Requirement"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Requirement_assignedStaffId_status_idx" ON "Requirement"("assignedStaffId", "status");

-- CreateIndex
CREATE INDEX "Quote_requirementId_createdAt_idx" ON "Quote"("requirementId", "createdAt");

-- CreateIndex
CREATE INDEX "Quote_status_createdAt_idx" ON "Quote"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MarketPriceSnapshot_productType_productId_capturedAt_idx" ON "MarketPriceSnapshot"("productType", "productId", "capturedAt");

-- CreateIndex
CREATE INDEX "MarketPriceSnapshot_productType_destination_capturedAt_idx" ON "MarketPriceSnapshot"("productType", "destination", "capturedAt");

-- CreateIndex
CREATE INDEX "MarketPriceSnapshot_expiresAt_idx" ON "MarketPriceSnapshot"("expiresAt");

-- CreateIndex
CREATE INDEX "EstimateRule_productType_active_idx" ON "EstimateRule"("productType", "active");

-- CreateIndex
CREATE INDEX "EstimateRule_destination_category_idx" ON "EstimateRule"("destination", "category");

-- CreateIndex
CREATE UNIQUE INDEX "EstimateResult_inputHash_key" ON "EstimateResult"("inputHash");

-- CreateIndex
CREATE INDEX "EstimateResult_requirementId_createdAt_idx" ON "EstimateResult"("requirementId", "createdAt");

-- CreateIndex
CREATE INDEX "EstimateResult_productType_productId_idx" ON "EstimateResult"("productType", "productId");

-- CreateIndex
CREATE INDEX "SupplierInquiryResult_requirementId_createdAt_idx" ON "SupplierInquiryResult"("requirementId", "createdAt");

-- CreateIndex
CREATE INDEX "SupplierInquiryResult_source_createdAt_idx" ON "SupplierInquiryResult"("source", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_orderId_createdAt_idx" ON "Payment"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Trip_userId_status_startDate_idx" ON "Trip"("userId", "status", "startDate");

-- CreateIndex
CREATE INDEX "Trip_orderId_idx" ON "Trip"("orderId");

-- CreateIndex
CREATE INDEX "CustomerService_isActive_isPrimary_idx" ON "CustomerService"("isActive", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNo_key" ON "SupportTicket"("ticketNo");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_createdAt_idx" ON "SupportTicket"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityProduct_status_category_idx" ON "ActivityProduct"("status", "category");

-- CreateIndex
CREATE INDEX "TourProduct_status_destination_idx" ON "TourProduct"("status", "destination");
