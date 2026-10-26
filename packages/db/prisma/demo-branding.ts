import type { Prisma, PrismaClient } from "@prisma/client";

// Both keys are retained here because local demos used the original catalog
// paths before the content-addressed Render fixtures were introduced.
const replacements = [
  {
    keys: ["demo-catalog/4a555e4c71424c12a6d62e40cc0e18ce8b2150d8c4ae76f30c6914e1f2d23b5e.jpg", "catalog/details/b8301d7d9da01d2d.jpg"],
    text: "圆领套头卫衣，多色可选。可选尺码：S、M、L、XL、2XL、3XL。支持正反面印刷，实际可选颜色、尺码和印刷加价以商品选项为准。",
  },
  {
    keys: ["demo-catalog/8c4d8c2d3f14130c7584750cd40f21064eb5013fd66de47a80fcaa94998bb690.jpg", "catalog/details/d8bd4f690160a23a.jpg"],
    text: "童装圆领套头卫衣。可选尺码：110、120、130、140、150。支持正反面印刷，实际可选颜色、尺码和印刷加价以商品选项为准。",
  },
  {
    keys: ["demo-catalog/ed6f24774ef9a589ceeac17f0a872418d217f45cb92612569927fa20a3b53b40.jpg", "catalog/details/161d3735527c4c75.jpg"],
    text: "圆领摇粒绒卫衣，男女同款。面料成分：65%聚酯纤维、35%棉；克重350g。可选尺码：S、M、L、XL、2XL、3XL。实际可选颜色和尺码以商品选项为准。",
  },
];

export const brandedDemoImageKeys = new Set(replacements.flatMap((item) => item.keys));

export function cleanDemoDetails(value: Prisma.JsonValue): Prisma.InputJsonValue | undefined {
  if (!Array.isArray(value)) return;
  let changed = false;
  const blocks = value.map((block) => {
    if (!block || typeof block !== "object" || Array.isArray(block) || block.type !== "image" || typeof block.content !== "string") return block;
    const replacement = replacements.find((item) => item.keys.includes(block.content as string));
    if (!replacement) return block;
    changed = true;
    return { type: "text", content: replacement.text };
  });
  return changed ? blocks as Prisma.InputJsonValue : undefined;
}

export async function cleanImportedDemoBranding(prisma: PrismaClient, tenantId: string) {
  const products = await prisma.product.findMany({ where: { tenantId }, select: { id: true, detailBlocks: true, galleryKeys: true } });
  let count = 0;
  for (const product of products) {
    const detailBlocks = cleanDemoDetails(product.detailBlocks);
    const galleryKeys = Array.isArray(product.galleryKeys) && product.galleryKeys.some((key) => typeof key === "string" && brandedDemoImageKeys.has(key))
      ? product.galleryKeys.filter((key) => typeof key !== "string" || !brandedDemoImageKeys.has(key)) as Prisma.InputJsonValue
      : undefined;
    if (!detailBlocks && !galleryKeys) continue;
    // Compare the original JSON so an operator's simultaneous edit is preserved.
    const result = await prisma.product.updateMany({
      where: { id: product.id, tenantId, detailBlocks: { equals: product.detailBlocks as Prisma.InputJsonValue }, galleryKeys: { equals: product.galleryKeys as Prisma.InputJsonValue } },
      data: { ...(detailBlocks ? { detailBlocks } : {}), ...(galleryKeys ? { galleryKeys } : {}) },
    });
    count += result.count;
  }
  if (count) console.log("demo branding cleaned", { tenantId, products: count });
}
