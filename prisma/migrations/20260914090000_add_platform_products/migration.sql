-- Product/departure separation for scalable travel products.
ALTER TABLE "Hotel" ADD COLUMN "purchaseMode" TEXT NOT NULL DEFAULT 'REQUEST_QUOTE';
ALTER TABLE "RoutePackage" ADD COLUMN "purchaseMode" TEXT NOT NULL DEFAULT 'REQUEST_QUOTE';
CREATE TABLE "TourProduct" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "departureCity" TEXT,
  "days" INTEGER NOT NULL,
  "tourType" TEXT NOT NULL,
  "audience" TEXT,
  "summary" TEXT,
  "coverImage" TEXT,
  "tags" TEXT,
  "purchaseMode" TEXT NOT NULL DEFAULT 'REQUEST_QUOTE',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "recommended" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "TourProduct_slug_key" ON "TourProduct"("slug");
CREATE TABLE "TourDeparture" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "departureDate" DATETIME NOT NULL,
  "adultPrice" INTEGER NOT NULL,
  "childPrice" INTEGER,
  "singleRoomDiff" INTEGER,
  "capacity" INTEGER,
  "booked" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'PENDING_CONFIRMATION',
  "cutoffAt" DATETIME,
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "TourDeparture_productId_fkey" FOREIGN KEY ("productId") REFERENCES "TourProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "TourDeparture_productId_departureDate_idx" ON "TourDeparture"("productId", "departureDate");
CREATE TABLE "TourItineraryDay" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "day" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "city" TEXT,
  "attractions" TEXT,
  "transport" TEXT,
  "meals" TEXT,
  "hotel" TEXT,
  "detail" TEXT,
  CONSTRAINT "TourItineraryDay_productId_fkey" FOREIGN KEY ("productId") REFERENCES "TourProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TourItineraryDay_productId_day_key" ON "TourItineraryDay"("productId", "day");
CREATE TABLE "ActivityProduct" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "location" TEXT,
  "category" TEXT,
  "coverImage" TEXT,
  "summary" TEXT,
  "price" INTEGER,
  "priceState" TEXT NOT NULL DEFAULT 'PENDING_CONFIRMATION',
  "purchaseMode" TEXT NOT NULL DEFAULT 'REQUEST_QUOTE',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "supplierId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "ActivityProduct_slug_key" ON "ActivityProduct"("slug");
CREATE TABLE "PackageProduct" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "hotelName" TEXT,
  "coverImage" TEXT,
  "benefits" TEXT,
  "price" INTEGER,
  "priceState" TEXT NOT NULL DEFAULT 'PENDING_CONFIRMATION',
  "purchaseMode" TEXT NOT NULL DEFAULT 'REQUEST_QUOTE',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "PackageProduct_slug_key" ON "PackageProduct"("slug");
