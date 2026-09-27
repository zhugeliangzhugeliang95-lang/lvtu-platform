-- CreateTable
CREATE TABLE "RobotLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "wechat" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "travelDate" TEXT,
    "peopleCount" INTEGER NOT NULL DEFAULT 1,
    "budget" TEXT,
    "notes" TEXT,
    "aiRequestNote" TEXT,
    "aiOpening" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RobotTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payloadJson" TEXT,
    "doneAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RobotTask_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "RobotLead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "RobotLead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RobotLead_status_createdAt_idx" ON "RobotLead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "RobotTask_status_createdAt_idx" ON "RobotTask"("status", "createdAt");

-- CreateIndex
CREATE INDEX "RobotTask_leadId_idx" ON "RobotTask"("leadId");

-- CreateIndex
CREATE INDEX "ChatLog_leadId_createdAt_idx" ON "ChatLog"("leadId", "createdAt");
