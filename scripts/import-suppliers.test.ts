import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

const tempDirs: string[] = [];

afterEach(() => {
  for (const directory of tempDirs.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("supplier importer transaction", () => {
  it("rolls back every candidate when a later insert fails", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "traveltong-supplier-import-"));
    tempDirs.push(directory);
    const databasePath = path.join(directory, "rollback.db");
    const importPath = path.join(directory, "rollback.json");
    copyFileSync(path.resolve("prisma/dev.db"), databasePath);
    writeFileSync(importPath, JSON.stringify({
      researchDate: "2026-08-15",
      suppliers: [
        candidate("rollback-first", "回滚测试第一旅行社有限公司", ["DMC"]),
        candidate("rollback-second", "回滚测试第二旅行社有限公司", ["DMC", "DMC"]),
      ],
    }));

    const databaseUrl = `file:${databasePath}`;
    const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    const before = await prisma.travelSupplier.count();

    expect(() => execFileSync(process.execPath, [path.resolve("scripts/import-suppliers.mjs"), "--file", importPath, "--commit"], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl, NODE_ENV: "test", SUPPLIER_IMPORT_SKIP_BACKUP: "1" },
      stdio: "pipe",
    })).toThrow();

    expect(await prisma.travelSupplier.count()).toBe(before);
    expect(await prisma.travelSupplier.count({ where: { legalEntityName: { startsWith: "回滚测试" } } })).toBe(0);
    await prisma.$disconnect();
  });
});

function candidate(slug: string, legalEntityName: string, services: string[]) {
  return {
    brandName: legalEntityName,
    legalEntityName,
    slug,
    supplierType: "DESTINATION_DMC",
    province: "广东",
    city: "东莞",
    website: "https://example.com/",
    summary: "仅用于导入事务回滚测试。",
    internalScore: 1,
    services,
    destinations: ["东莞"],
    sources: [{ title: "测试来源", url: `https://example.com/${slug}`, type: "OFFICIAL_WEBSITE", fields: "legalEntityName", confidence: "LOW", summary: "测试" }],
    riskFlags: ["LICENSE_NOT_VERIFIED"],
  };
}
