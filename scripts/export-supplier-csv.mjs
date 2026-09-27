import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "research/suppliers/travel-agency-candidates.json");
const target = path.join(root, "research/suppliers/travel-agency-candidates.csv");
const data = JSON.parse(fs.readFileSync(source, "utf8"));
const formula = /^[=+\-@\t\r]/;

function safe(value) {
  const text = value == null ? "" : String(value);
  const guarded = formula.test(text) ? `'${text}` : text;
  return `"${guarded.replaceAll('"', '""')}"`;
}

const headers = ["brandName", "legalEntityName", "slug", "supplierType", "province", "city", "website", "summary", "internalScore", "services", "destinations", "licenseStatus", "riskFlags", "sourceUrls", "researchDate"];
const rows = data.suppliers.map((supplier) => [
  supplier.brandName,
  supplier.legalEntityName,
  supplier.slug,
  supplier.supplierType,
  supplier.province,
  supplier.city,
  supplier.website,
  supplier.summary,
  supplier.internalScore,
  supplier.services.join("|"),
  supplier.destinations.join("|"),
  "UNVERIFIED",
  supplier.riskFlags.join("|"),
  supplier.sources.map((sourceItem) => sourceItem.url).join("|"),
  data.researchDate,
]);

fs.writeFileSync(target, `${headers.map(safe).join(",")}\n${rows.map((row) => row.map(safe).join(",")).join("\n")}\n`);
console.log(`CSV generated: ${rows.length} candidates -> ${target}`);

