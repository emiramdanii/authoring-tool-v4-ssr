-- Sprint 8.3: Add contractId and pageMode columns to Page table
-- These columns persist style authority fields that were previously
-- lost during DB roundtrip (contractId) or only inferred (pageMode).

ALTER TABLE "Page" ADD COLUMN "contractId" TEXT;
ALTER TABLE "Page" ADD COLUMN "pageMode" TEXT;
