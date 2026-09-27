-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionKey" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "profileJson" TEXT NOT NULL DEFAULT '{}',
    "summary" TEXT,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "highValue" BOOLEAN NOT NULL DEFAULT false,
    "handoffReason" TEXT,
    "assignedAdminId" TEXT,
    "humanTakeoverAt" DATETIME,
    "lastMessageAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "AIChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "modelName" TEXT,
    "taskType" TEXT,
    "sourceIdsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AIModelCall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT,
    "taskType" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "errorCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIModelCall_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "AIHandoff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "customerName" TEXT,
    "contact" TEXT,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedAdminId" TEXT,
    "handledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIHandoff_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AIKnowledgeDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "city" TEXT,
    "content" TEXT NOT NULL,
    "keywordsJson" TEXT NOT NULL DEFAULT '[]',
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "embeddingRef" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "AIConversation_sessionKey_key" ON "AIConversation"("sessionKey");
CREATE INDEX "AIConversation_status_lastMessageAt_idx" ON "AIConversation"("status", "lastMessageAt");
CREATE INDEX "AIConversation_highValue_lastMessageAt_idx" ON "AIConversation"("highValue", "lastMessageAt");
CREATE INDEX "AIConversation_userId_lastMessageAt_idx" ON "AIConversation"("userId", "lastMessageAt");
CREATE INDEX "AIChatMessage_conversationId_createdAt_idx" ON "AIChatMessage"("conversationId", "createdAt");
CREATE INDEX "AIModelCall_taskType_createdAt_idx" ON "AIModelCall"("taskType", "createdAt");
CREATE INDEX "AIModelCall_conversationId_createdAt_idx" ON "AIModelCall"("conversationId", "createdAt");
CREATE INDEX "AIHandoff_status_createdAt_idx" ON "AIHandoff"("status", "createdAt");
CREATE INDEX "AIHandoff_conversationId_createdAt_idx" ON "AIHandoff"("conversationId", "createdAt");
CREATE INDEX "AIKnowledgeDocument_category_enabled_idx" ON "AIKnowledgeDocument"("category", "enabled");
CREATE INDEX "AIKnowledgeDocument_city_enabled_idx" ON "AIKnowledgeDocument"("city", "enabled");

