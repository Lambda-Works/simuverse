-- AlterTable: Add missing fields to SimulatedCompany
ALTER TABLE "simulated_companies" ADD COLUMN "short_name" VARCHAR(50),
ADD COLUMN "description" TEXT,
ADD COLUMN "industry" VARCHAR(100),
ADD COLUMN "logo_url" TEXT,
ADD COLUMN "is_fictional" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "city" VARCHAR(100),
ADD COLUMN "country" VARCHAR(100),
ADD COLUMN "website" TEXT;
