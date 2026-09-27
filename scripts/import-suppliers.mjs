import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const fileArg = args.indexOf("--file");
const requestedFile = fileArg >= 0 ? args[fileArg + 1] : "research/suppliers/travel-agency-candidates.json";
const commit = args.includes("--commit") && !args.includes("--dry-run");
const skipBackup = process.env.NODE_ENV === "test" && process.env.SUPPLIER_IMPORT_SKIP_BACKUP === "1";
const sourceFile = path.resolve(root, requestedFile);
const allowedTypes = new Set(["NATIONAL", "GBA_LOCAL", "DESTINATION_DMC", "OVERSEAS_DMC"]);
const allowedSourceTypes = new Set(["REGULATOR", "GOVERNMENT", "CREDIT_SYSTEM", "OFFICIAL_WEBSITE", "OFFICIAL_ACCOUNT", "INDUSTRY_ASSOCIATION", "OTA_OFFICIAL_STORE", "OTHER"]);
const prisma = new PrismaClient();

function safeUrl(value) {
  const url = new URL(value);
  if (!new Set(["http:", "https:"]).has(url.protocol)) throw new Error(`Unsafe URL protocol for ${url.hostname || "source"}`);
  return url.toString();
}

function validateSupplier(item, index) {
  for (const key of ["brandName", "legalEntityName", "slug", "supplierType", "summary"]) {
    if (typeof item[key] !== "string" || !item[key].trim()) throw new Error(`Supplier ${index + 1}: missing ${key}`);
  }
  if (!allowedTypes.has(item.supplierType)) throw new Error(`Supplier ${index + 1}: invalid supplierType`);
  if (!Array.isArray(item.sources) || item.sources.length === 0) throw new Error(`Supplier ${index + 1}: source required`);
  if (item.website) safeUrl(item.website);
  for (const source of item.sources) {
    safeUrl(source.url);
    if (!allowedSourceTypes.has(source.type)) throw new Error(`Supplier ${index + 1}: invalid source type`);
  }
}

async function inspect(data) {
  const plan = { insert: [], update: [], skip: [], conflict: [] };
  const seenLegal = new Set();
  const seenSlugs = new Set();
  for (const [index, supplier] of data.suppliers.entries()) {
    validateSupplier(supplier, index);
    if (seenLegal.has(supplier.legalEntityName) || seenSlugs.has(supplier.slug)) {
      plan.conflict.push({ supplier, reason: "Duplicate legal entity or slug in import file" });
      continue;
    }
    seenLegal.add(supplier.legalEntityName);
    seenSlugs.add(supplier.slug);
    const matches = await prisma.travelSupplier.findMany({
      where: { OR: [{ legalEntityName: supplier.legalEntityName }, { slug: supplier.slug }] },
      select: { id: true, legalEntityName: true, slug: true },
    });
    if (matches.length > 1 || (matches[0] && matches[0].legalEntityName !== supplier.legalEntityName)) {
      plan.conflict.push({ supplier, reason: "Identity keys point to different legal entities" });
    } else if (matches[0]) {
      plan.update.push({ supplier, id: matches[0].id });
    } else {
      plan.insert.push({ supplier });
    }
  }
  return plan;
}

function nestedData(supplier, researchDate) {
  const sourceByUrl = new Map(supplier.sources.map((source) => [source.url, source]));
  const primarySource = supplier.sources[0]?.url;
  return {
    brandName: supplier.brandName.trim(),
    legalEntityName: supplier.legalEntityName.trim(),
    slug: supplier.slug,
    supplierType: supplier.supplierType,
    status: "RESEARCHED",
    summary: supplier.summary,
    province: supplier.province || null,
    city: supplier.city || null,
    website: supplier.website ? safeUrl(supplier.website) : null,
    internalScore: Math.max(0, Math.min(100, Number(supplier.internalScore) || 0)),
    isVerified: false,
    isPublic: false,
    publicContentReady: false,
    lastReviewedAt: new Date(researchDate),
    brands: { create: [{ name: supplier.brandName, relationship: "OPERATED_BY", sourceUrl: primarySource }] },
    licenses: { create: [{ licenseType: "旅行社业务经营许可证", legalEntityName: supplier.legalEntityName, status: "UNVERIFIED", evidenceUrl: null, needsManualReview: true }] },
    services: { create: supplier.services.map((code) => ({ code, name: code, sourceUrl: primarySource, verified: false })) },
    destinations: { create: supplier.destinations.map((name) => ({ name, sourceUrl: primarySource, verified: false })) },
    sources: { create: [...sourceByUrl.values()].map((source) => ({ title: source.title, url: safeUrl(source.url), sourceType: source.type, fields: source.fields, queriedAt: new Date(researchDate), confidence: source.confidence, summary: source.summary, manualReviewed: false })) },
    risks: { create: supplier.riskFlags.map((code) => ({ code, label: code, severity: code.includes("LICENSE") ? "HIGH" : "MEDIUM", detail: "导入候选数据，等待人工核验" })) },
    publications: { create: [{ status: "DRAFT", publicSummary: null }] },
  };
}

async function upsertSupplier(tx, entry, researchDate) {
  const supplier = entry.supplier;
  const data = nestedData(supplier, researchDate);
  if (!entry.id) return tx.travelSupplier.create({ data });
  const { brands, licenses, services, destinations, sources, risks, publications, ...core } = data;
  void licenses;
  void publications;
  await tx.travelSupplier.update({ where: { id: entry.id }, data: core });
  await tx.supplierBrand.upsert({ where: { supplierId_name: { supplierId: entry.id, name: supplier.brandName } }, update: { sourceUrl: supplier.sources[0]?.url }, create: { supplierId: entry.id, ...brands.create[0] } });
  for (const service of services.create) await tx.supplierService.upsert({ where: { supplierId_code: { supplierId: entry.id, code: service.code } }, update: { name: service.name, sourceUrl: service.sourceUrl }, create: { supplierId: entry.id, ...service } });
  for (const destination of destinations.create) await tx.supplierDestination.upsert({ where: { supplierId_name: { supplierId: entry.id, name: destination.name } }, update: { sourceUrl: destination.sourceUrl }, create: { supplierId: entry.id, ...destination } });
  for (const source of sources.create) await tx.supplierSource.upsert({ where: { supplierId_url_fields: { supplierId: entry.id, url: source.url, fields: source.fields } }, update: { queriedAt: source.queriedAt, confidence: source.confidence, summary: source.summary }, create: { supplierId: entry.id, ...source } });
  for (const risk of risks.create) await tx.supplierRiskFlag.upsert({ where: { supplierId_code: { supplierId: entry.id, code: risk.code } }, update: { detail: risk.detail }, create: { supplierId: entry.id, ...risk } });
}

async function main() {
  const data = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
  if (!Array.isArray(data.suppliers)) throw new Error("Import file must contain suppliers[]");
  const plan = await inspect(data);
  console.log(JSON.stringify({ mode: commit ? "commit" : "dry-run", file: path.relative(root, sourceFile), insert: plan.insert.length, update: plan.update.length, skip: plan.skip.length, conflict: plan.conflict.length }, null, 2));
  if (plan.conflict.length) {
    for (const item of plan.conflict) console.error(`Conflict: ${item.supplier.legalEntityName} - ${item.reason}`);
    if (commit) throw new Error("Conflicts must be resolved before commit");
  }
  if (!commit) return;
  const backupDir = path.join(root, "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
  const databasePath = databaseUrl.startsWith("file:") ? path.resolve(root, "prisma", databaseUrl.slice(5)) : null;
  if (!skipBackup && databasePath && fs.existsSync(databasePath)) fs.copyFileSync(databasePath, path.join(backupDir, `dev-before-supplier-import-${Date.now()}.db`));
  await prisma.$transaction(async (tx) => {
    for (const item of [...plan.insert, ...plan.update]) await upsertSupplier(tx, item, data.researchDate);
  }, { timeout: 60000 });
  console.log(`Committed ${plan.insert.length} new and ${plan.update.length} existing candidates. All remain non-public and unverified.`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
