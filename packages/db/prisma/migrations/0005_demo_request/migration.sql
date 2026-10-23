-- CreateTable
CREATE TABLE "demo_request" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "volume" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demo_request_created_at_idx" ON "demo_request"("created_at");

-- CreateIndex
CREATE INDEX "demo_request_phone_created_at_idx" ON "demo_request"("phone", "created_at");
