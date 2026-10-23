-- CreateTable
CREATE TABLE "process_sheet" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "color_name" TEXT NOT NULL,
    "color_hex" TEXT NOT NULL,
    "sizes" JSONB NOT NULL,
    "order_item_ids" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "process_sheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "process_sheet_code_key" ON "process_sheet"("code");

-- CreateIndex
CREATE INDEX "process_sheet_tenant_id_created_at_idx" ON "process_sheet"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "process_sheet_order_id_idx" ON "process_sheet"("order_id");

-- AddForeignKey
ALTER TABLE "process_sheet" ADD CONSTRAINT "process_sheet_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_sheet" ADD CONSTRAINT "process_sheet_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
