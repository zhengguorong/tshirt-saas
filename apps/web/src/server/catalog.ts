import { prisma, type Surface } from "@tshirt/db";
import { yuanToCents, type SurfaceId } from "@tshirt/design";

export const DEFAULT_PRINT_AREA = { x: 0.27, y: 0.34, w: 0.46, h: 0.36, exportWidth: 2000, exportHeight: 2400 };

export function mediaUrl(objectKey: string) {
  return `/api/media/${objectKey.split("/").map(encodeURIComponent).join("/")}`;
}

export function mockupKey(hex: string, side: "front" | "back") {
  return `mockup/${hex.replace("#", "").toUpperCase()}/${side}.svg`;
}

export function toSurfaceId(surface: Surface): SurfaceId {
  return surface === "FRONT" ? "front" : "back";
}

export type DetailBlock = { type: "text" | "image"; content: string };

export function parseDetailBlocks(value: unknown): DetailBlock[] {
  if (!Array.isArray(value)) return [];
  const blocks: DetailBlock[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const type = "type" in item ? item.type : undefined;
    const content = "content" in item && typeof item.content === "string" ? item.content.trim() : "";
    if ((type === "text" || type === "image") && content) blocks.push({ type, content });
  }
  return blocks;
}

export function parseGalleryKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export function normalizeHex(input: string) {
  const hex = input.trim().replace("#", "").toUpperCase();
  if (!/^[0-9A-F]{6}$/.test(hex)) throw new Error("颜色值需要是 6 位十六进制");
  return `#${hex}`;
}

export async function getShop(slug: string) {
  return prisma.tenant.findUnique({ where: { slug } });
}

export async function firstOnShelfProductId(tenantId: string) {
  const product = await prisma.product.findFirst({
    where: { tenantId, status: "ON" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return product?.id ?? null;
}

export async function listProducts(tenantId: string, onlyOnShelf: boolean) {
  return prisma.product.findMany({
    where: { tenantId, ...(onlyOnShelf ? { status: "ON" } : {}) },
    include: { colors: { orderBy: { sort: "asc" } }, sizes: { orderBy: { sort: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProduct(tenantId: string, productId: string, onlyOnShelf: boolean) {
  return prisma.product.findFirst({
    where: { id: productId, tenantId, ...(onlyOnShelf ? { status: "ON" } : {}) },
    include: {
      colors: { orderBy: { sort: "asc" } },
      sizes: { orderBy: { sort: "asc" } },
      printAreas: true,
    },
  });
}

export async function createProduct(input: {
  tenantId: string;
  name: string;
  detail: string;
  priceYuan: number;
  sizes: string[];
  colors: Array<{ name: string; hex: string }>;
  enableBack: boolean;
  frontSurchargeYuan: number;
  backSurchargeYuan: number;
  publish: boolean;
}) {
  if (!input.name.trim()) throw new Error("请填写底衫名称");
  if (input.colors.length === 0) throw new Error("至少需要一个颜色");
  if (input.sizes.length === 0) throw new Error("至少需要一个尺码");
  const priceCents = yuanToCents(input.priceYuan);
  if (priceCents <= 0) throw new Error("售价需要大于 0");
  return prisma.product.create({
    data: {
      tenantId: input.tenantId,
      name: input.name.trim(),
      detail: input.detail.trim(),
      priceCents,
      status: input.publish ? "ON" : "OFF",
      colors: {
        create: input.colors.map((color, sort) => {
          const hex = normalizeHex(color.hex);
          return {
            tenantId: input.tenantId,
            name: color.name.trim(),
            hex,
            frontMockupKey: mockupKey(hex, "front"),
            backMockupKey: input.enableBack ? mockupKey(hex, "back") : null,
            sort,
          };
        }),
      },
      sizes: {
        create: input.sizes.map((name, sort) => ({ tenantId: input.tenantId, name, sort })),
      },
      printAreas: {
        create: [
          { tenantId: input.tenantId, surface: "FRONT", ...DEFAULT_PRINT_AREA, surchargeCents: yuanToCents(input.frontSurchargeYuan) },
          ...(input.enableBack
            ? [{ tenantId: input.tenantId, surface: "BACK" as const, ...DEFAULT_PRINT_AREA, surchargeCents: yuanToCents(input.backSurchargeYuan) }]
            : []),
        ],
      },
    },
  });
}

export async function updateProductBasics(input: {
  tenantId: string;
  productId: string;
  name: string;
  detail: string;
  priceYuan: number;
  publish: boolean;
  frontSurchargeYuan: number;
  backSurchargeYuan: number;
}) {
  const product = await getProduct(input.tenantId, input.productId, false);
  if (!product) throw new Error("底衫不存在");
  const priceCents = yuanToCents(input.priceYuan);
  if (priceCents <= 0) throw new Error("售价需要大于 0");
  if (input.publish && (product.colors.length === 0 || product.sizes.length === 0 || product.printAreas.length === 0)) {
    throw new Error("上架前需要颜色、尺码和印刷区");
  }
  await prisma.product.update({
    where: { id: product.id },
    data: { name: input.name.trim(), detail: input.detail.trim(), priceCents, status: input.publish ? "ON" : "OFF" },
  });
  for (const area of product.printAreas) {
    const yuan = area.surface === "FRONT" ? input.frontSurchargeYuan : input.backSurchargeYuan;
    await prisma.printArea.update({ where: { id: area.id }, data: { surchargeCents: yuanToCents(yuan) } });
  }
}

export async function addColor(tenantId: string, productId: string, name: string, hexInput: string) {
  const product = await getProduct(tenantId, productId, false);
  if (!product) throw new Error("底衫不存在");
  const hex = normalizeHex(hexInput);
  const hasBack = product.printAreas.some((area) => area.surface === "BACK");
  await prisma.productColor.create({
    data: {
      tenantId,
      productId,
      name: name.trim(),
      hex,
      frontMockupKey: mockupKey(hex, "front"),
      backMockupKey: hasBack ? mockupKey(hex, "back") : null,
      sort: product.colors.length,
    },
  });
}

export async function setSizeAvailable(tenantId: string, sizeId: string, available: boolean) {
  const size = await prisma.productSize.findFirst({ where: { id: sizeId, tenantId } });
  if (!size) throw new Error("尺码不存在");
  await prisma.productSize.update({ where: { id: size.id }, data: { available } });
}
