-- CreateTable
CREATE TABLE "TravelSupplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandName" TEXT NOT NULL,
    "legalEntityName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "supplierType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESEARCHED',
    "summary" TEXT,
    "province" TEXT,
    "city" TEXT,
    "address" TEXT,
    "website" TEXT,
    "officialAccount" TEXT,
    "creditCode" TEXT,
    "internalScore" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "publicContentReady" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "publishedAt" DATETIME,
    "lastReviewedAt" DATETIME,
    "nextFollowUpAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupplierBrand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'OPERATED_BY',
    "sourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierBrand_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TravelSupplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierLicense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "legalEntityName" TEXT NOT NULL,
    "businessScope" TEXT,
    "issuingAuthority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "verificationSource" TEXT,
    "verifiedAt" DATETIME,
    "validFrom" DATETIME,
    "validUntil" DATETIME,
    "evidenceUrl" TEXT,
    "verifiedBy" TEXT,
    "needsManualReview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupplierLicense_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TravelSupplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierService_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TravelSupplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierDestination" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT,
    "region" TEXT,
    "sourceUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierDestination_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TravelSupplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "contactType" TEXT NOT NULL,
    "label" TEXT,
    "value" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "verifiedAt" DATETIME,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierContact_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TravelSupplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "fields" TEXT NOT NULL,
    "queriedAt" DATETIME NOT NULL,
    "confidence" TEXT NOT NULL,
    "summary" TEXT,
    "isAccessible" BOOLEAN NOT NULL DEFAULT true,
    "manualReviewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierSource_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TravelSupplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "finding" TEXT,
    "sourceUrl" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierVerification_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TravelSupplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierRiskFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "detail" TEXT,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierRiskFlag_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TravelSupplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "contactMethod" TEXT NOT NULL,
    "contactedAt" DATETIME NOT NULL,
    "contactPerson" TEXT,
    "channel" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "nextStep" TEXT,
    "followUpAt" DATETIME,
    "internalNote" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierInteraction_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TravelSupplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierContract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "contractNumber" TEXT,
    "validFrom" DATETIME,
    "validUntil" DATETIME,
    "inquiryConsent" BOOLEAN NOT NULL DEFAULT false,
    "consentChannel" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupplierContract_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TravelSupplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierPublication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publicSummary" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "publishedAt" DATETIME,
    "unpublishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupplierPublication_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TravelSupplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "actorAdminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fieldName" TEXT,
    "beforeValue" TEXT,
    "afterValue" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierAuditLog_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TravelSupplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierInquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requirementJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "idempotencyKey" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupplierInquiryRecipient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inquiryId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "consentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierInquiryRecipient_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "SupplierInquiry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupplierInquiryRecipient_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TravelSupplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierInquiryMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierInquiryMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "SupplierInquiryRecipient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientId" TEXT NOT NULL,
    "rawSummary" TEXT NOT NULL,
    "receivedAt" DATETIME NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierResponse_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "SupplierInquiryRecipient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierQuoteCandidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "responseId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "amount" INTEGER,
    "priceText" TEXT,
    "terms" TEXT,
    "isReviewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierQuoteCandidate_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "SupplierResponse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TravelSupplier_legalEntityName_key" ON "TravelSupplier"("legalEntityName");

-- CreateIndex
CREATE UNIQUE INDEX "TravelSupplier_slug_key" ON "TravelSupplier"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TravelSupplier_creditCode_key" ON "TravelSupplier"("creditCode");

-- CreateIndex
CREATE INDEX "TravelSupplier_status_isVerified_isPublic_idx" ON "TravelSupplier"("status", "isVerified", "isPublic");

-- CreateIndex
CREATE INDEX "TravelSupplier_supplierType_province_city_idx" ON "TravelSupplier"("supplierType", "province", "city");

-- CreateIndex
CREATE INDEX "TravelSupplier_internalScore_idx" ON "TravelSupplier"("internalScore");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierBrand_supplierId_name_key" ON "SupplierBrand"("supplierId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierLicense_licenseNumber_key" ON "SupplierLicense"("licenseNumber");

-- CreateIndex
CREATE INDEX "SupplierLicense_supplierId_status_idx" ON "SupplierLicense"("supplierId", "status");

-- CreateIndex
CREATE INDEX "SupplierService_code_verified_idx" ON "SupplierService"("code", "verified");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierService_supplierId_code_key" ON "SupplierService"("supplierId", "code");

-- CreateIndex
CREATE INDEX "SupplierDestination_name_verified_idx" ON "SupplierDestination"("name", "verified");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierDestination_supplierId_name_key" ON "SupplierDestination"("supplierId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierContact_supplierId_contactType_value_key" ON "SupplierContact"("supplierId", "contactType", "value");

-- CreateIndex
CREATE INDEX "SupplierSource_supplierId_confidence_idx" ON "SupplierSource"("supplierId", "confidence");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierSource_supplierId_url_fields_key" ON "SupplierSource"("supplierId", "url", "fields");

-- CreateIndex
CREATE INDEX "SupplierVerification_supplierId_status_idx" ON "SupplierVerification"("supplierId", "status");

-- CreateIndex
CREATE INDEX "SupplierRiskFlag_code_resolvedAt_idx" ON "SupplierRiskFlag"("code", "resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierRiskFlag_supplierId_code_key" ON "SupplierRiskFlag"("supplierId", "code");

-- CreateIndex
CREATE INDEX "SupplierInteraction_supplierId_contactedAt_idx" ON "SupplierInteraction"("supplierId", "contactedAt");

-- CreateIndex
CREATE INDEX "SupplierInteraction_followUpAt_idx" ON "SupplierInteraction"("followUpAt");

-- CreateIndex
CREATE INDEX "SupplierContract_supplierId_status_idx" ON "SupplierContract"("supplierId", "status");

-- CreateIndex
CREATE INDEX "SupplierPublication_supplierId_status_idx" ON "SupplierPublication"("supplierId", "status");

-- CreateIndex
CREATE INDEX "SupplierAuditLog_supplierId_createdAt_idx" ON "SupplierAuditLog"("supplierId", "createdAt");

-- CreateIndex
CREATE INDEX "SupplierAuditLog_actorAdminId_createdAt_idx" ON "SupplierAuditLog"("actorAdminId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInquiry_idempotencyKey_key" ON "SupplierInquiry"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInquiryRecipient_inquiryId_supplierId_key" ON "SupplierInquiryRecipient"("inquiryId", "supplierId");

-- CreateIndex
CREATE INDEX "SupplierInquiryMessage_recipientId_createdAt_idx" ON "SupplierInquiryMessage"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "SupplierQuoteCandidate_responseId_isReviewed_idx" ON "SupplierQuoteCandidate"("responseId", "isReviewed");
