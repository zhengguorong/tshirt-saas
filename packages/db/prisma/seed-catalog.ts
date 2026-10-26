import { PrismaClient, type Prisma, type ShelfStatus, type ShippingType, type StaffRole, type Surface } from "@prisma/client";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const fixtureRoot = fileURLToPath(new URL("./demo-catalog/", import.meta.url));

type Catalog = {
  slug: string;
  name: string;
  description: string;
  contact: string;
  shippingType: ShippingType;
  flatShippingCents: number;
  freeShippingThresholdCents: number | null;
  staff: { phone: string; name: string; role: StaffRole }[];
  categories: { name: string; sort: number }[];
  assets: { name: string; width: number; height: number; sort: number; status: ShelfStatus; objectKey: string; category: string | null }[];
  products: {
    name: string;
    detail: string;
    priceCents: number;
    status: ShelfStatus;
    galleryKeys: string[];
    detailBlocks: Prisma.InputJsonValue;
    colors: { name: string; hex: string; sort: number; frontMockupKey: string; backMockupKey: string | null }[];
    sizes: { name: string; available: boolean; sort: number }[];
    printAreas: { surface: Surface; x: number; y: number; w: number; h: number; exportWidth: number; exportHeight: number; surchargeCents: number }[];
  }[];
};

// Render's free instances have ephemeral storage. Restore fixture files at every
// start, independently of whether their database records already exist.
export async function seedCatalog(prisma: PrismaClient, storage: string) {
  const catalog: Catalog[] = JSON.parse(await readFile(path.join(fixtureRoot, "catalog.json"), "utf8"));
  const files = await readdir(path.join(fixtureRoot, "files"));
  for (const file of files) {
    const body = await readFile(path.join(fixtureRoot, "files", file));
    if (createHash("sha256").update(body).digest("hex") !== path.parse(file).name) {
      throw new Error(`Demo file checksum mismatch: ${file}`);
    }
  }
  await mkdir(path.join(storage, "demo-catalog"), { recursive: true });
  for (const file of files) {
    await copyFile(path.join(fixtureRoot, "files", file), path.join(storage, "demo-catalog", file));
  }

  for (const fixture of catalog) {
    const { staff, categories, assets, products, ...tenantData } = fixture;
    const restoredAssets = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.upsert({ where: { slug: fixture.slug }, update: {}, create: tenantData });
      const tenantId = tenant.id;
      for (const member of staff) {
        await tx.staff.upsert({ where: { tenantId_phone: { tenantId, phone: member.phone } }, update: {}, create: { tenantId, ...member } });
      }
      const categoryIds = new Map<string, string>();
      for (const category of categories) {
        const existing = await tx.materialCategory.findFirst({ where: { tenantId, name: category.name } });
        const row = existing ?? await tx.materialCategory.create({ data: { tenantId, ...category } });
        categoryIds.set(category.name, row.id);
      }
      for (const product of products) {
        if (await tx.product.findFirst({ where: { tenantId, name: product.name } })) continue;
        const { colors, sizes, printAreas, ...basics } = product;
        await tx.product.create({ data: {
          tenantId, ...basics,
          colors: { create: colors.map((color) => ({ tenantId, ...color })) },
          sizes: { create: sizes.map((size) => ({ tenantId, ...size })) },
          printAreas: { create: printAreas.map((area) => ({ tenantId, ...area })) },
        } });
      }
      const restore: { target: string; source: string }[] = [];
      for (const asset of assets) {
        const { category, ...data } = asset;
        const existing = await tx.asset.findFirst({ where: { tenantId, source: "MATERIAL", name: asset.name } });
        if (existing) {
          // The original seed's badge uses a tenant-specific key. Restore it
          // without changing any existing record or operator edits.
          if (existing.objectKey.endsWith("/materials/badge.svg") && asset.name === "圆章") {
            restore.push({ target: existing.objectKey, source: asset.objectKey });
          }
          continue;
        }
        await tx.asset.create({ data: { tenantId, source: "MATERIAL", ...data, categoryId: category ? categoryIds.get(category) : null } });
      }
      return restore;
    }, { timeout: 60_000 });
    for (const asset of restoredAssets) {
      const target = path.resolve(storage, asset.target);
      if (!target.startsWith(path.resolve(storage) + path.sep)) throw new Error("Invalid demo asset path");
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(path.join(storage, asset.source), target);
    }
    console.log("demo catalog ready", { shop: fixture.slug, products: products.length, materials: assets.length });
  }
}
