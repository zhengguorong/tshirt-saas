-- AlterTable
ALTER TABLE "product" ADD COLUMN "detail_blocks" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "product" ADD COLUMN "gallery_keys" JSONB NOT NULL DEFAULT '[]';
