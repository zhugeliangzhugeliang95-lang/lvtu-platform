import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function ensureSqliteDatabase() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.VERCEL ? "file:/tmp/zhixingyoulv.db" : "file:./dev.db";
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl?.startsWith("file:")) return;

  const filePath = databaseUrl.replace(/^file:/, "");
  if (!filePath.startsWith("/tmp/")) return;
  if (fs.existsSync(filePath)) return;

  const seedPath = path.join(process.cwd(), "prisma", "dev.db");
  if (!fs.existsSync(seedPath)) return;

  fs.copyFileSync(seedPath, filePath);
}

ensureSqliteDatabase();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
