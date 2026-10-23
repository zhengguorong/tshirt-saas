import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();
const configured = process.env.STORAGE_DIR || "data/uploads";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const storage = path.isAbsolute(configured) ? configured : path.resolve(repoRoot, configured);

const frontArea = { x: 178 / 750, y: 134 / 750, w: 395 / 750, h: 520 / 750, exportWidth: 2000, exportHeight: 2400 };

async function main() {
  const admin = await prisma.platformAdmin.upsert({
    where: { phone: "13800000000" },
    update: { name: "平台管理员" },
    create: { phone: "13800000000", name: "平台管理员" },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: { name: "示例工作室", status: "ACTIVE", flatShippingCents: 800, shippingType: "FLAT" },
    create: {
      slug: "demo",
      name: "示例工作室",
      description: "一件白坯，正反两面印刷。",
      contact: "13800000001",
      flatShippingCents: 800,
    },
  });

  await prisma.staff.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: "13800000001" } },
    update: { role: "OWNER", status: "ACTIVE", name: "店主" },
    create: { tenantId: tenant.id, phone: "13800000001", name: "店主", role: "OWNER" },
  });
  await prisma.staff.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: "13800000003" } },
    update: { role: "STAFF", status: "ACTIVE", name: "店员" },
    create: { tenantId: tenant.id, phone: "13800000003", name: "店员", role: "STAFF" },
  });

  const other = await prisma.tenant.upsert({
    where: { slug: "other" },
    update: {},
    create: { slug: "other", name: "另一家店", flatShippingCents: 0 },
  });
  await prisma.staff.upsert({
    where: { tenantId_phone: { tenantId: other.id, phone: "13800000004" } },
    update: {},
    create: { tenantId: other.id, phone: "13800000004", name: "其他店主", role: "OWNER" },
  });

  const existing = await prisma.product.findFirst({ where: { tenantId: tenant.id, name: "白坯短袖" } });
  if (!existing) {
    const product = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: "白坯短袖",
        detail: "180g 棉，正面印刷区不加价，背面加价 20 元。",
        priceCents: 7900,
        status: "ON",
        colors: {
          create: [
            { tenantId: tenant.id, name: "白色", hex: "#F7F7F5", frontMockupKey: "mockup/F7F7F5/front.png", backMockupKey: "mockup/F7F7F5/back.png", sort: 0 },
            { tenantId: tenant.id, name: "黑色", hex: "#1A1A1A", frontMockupKey: "mockup/1A1A1A/front.png", backMockupKey: "mockup/1A1A1A/back.png", sort: 1 },
          ],
        },
        sizes: {
          create: ["S", "M", "L", "XL"].map((name, sort) => ({ tenantId: tenant.id, name, sort })),
        },
        printAreas: {
          create: [
            { tenantId: tenant.id, surface: "FRONT", ...frontArea, surchargeCents: 0 },
            { tenantId: tenant.id, surface: "BACK", ...frontArea, surchargeCents: 2000 },
          ],
        },
      },
    });
    const category = await prisma.materialCategory.create({ data: { tenantId: tenant.id, name: "基础图形", sort: 0 } });
    const objectKey = `tenants/${tenant.id}/materials/badge.svg`;
    await mkdir(path.join(storage, path.dirname(objectKey)), { recursive: true });
    await writeFile(
      path.join(storage, objectKey),
      `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><circle cx="256" cy="256" r="190" fill="#b8431f"/><text x="256" y="276" text-anchor="middle" font-size="92" fill="#fffdf8" font-family="sans-serif">印</text></svg>`,
    );
    await prisma.asset.create({
      data: {
        tenantId: tenant.id,
        source: "MATERIAL",
        name: "圆章",
        objectKey,
        width: 512,
        height: 512,
        categoryId: category.id,
      },
    });
    console.log("seeded product", product.id);
  }

  console.log("ready", { admin: admin.phone, shop: tenant.slug, other: other.slug });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
