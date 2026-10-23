-- AlterTable
ALTER TABLE "tenant" ADD COLUMN "custom_domain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tenant_custom_domain_key" ON "tenant"("custom_domain");
