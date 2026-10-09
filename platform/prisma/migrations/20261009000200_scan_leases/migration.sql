ALTER TABLE "Scan" ADD COLUMN "leaseOwner" TEXT, ADD COLUMN "leaseExpiresAt" TIMESTAMP(3), ADD COLUMN "leaseEpoch" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "Scan_status_leaseExpiresAt_idx" ON "Scan"("status","leaseExpiresAt");
