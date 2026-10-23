import { notFound } from "next/navigation";
import { prisma } from "@tshirt/db";
import { EditorShell } from "@/components/editor-shell";
import { getConsumer } from "@/server/auth";
import { getProduct, getShop, mediaUrl, toSurfaceId } from "@/server/catalog";

export default async function DesignPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; productId: string }>;
  searchParams: Promise<{ size?: string; color?: string }>;
}) {
  const { slug, productId } = await params;
  const query = await searchParams;
  const shop = await getShop(slug);
  if (!shop) notFound();
  const product = await getProduct(shop.id, productId, true);
  if (!product) notFound();
  const consumer = await getConsumer();
  const materials = await prisma.asset.findMany({
    where: { tenantId: shop.id, source: "MATERIAL", status: "ON" },
    orderBy: { sort: "asc" },
  });
  return (
    <EditorShell
      slug={slug}
      loggedIn={Boolean(consumer)}
      materials={materials.map((material) => ({
        id: material.id,
        name: material.name,
        url: mediaUrl(material.objectKey),
        width: material.width,
        height: material.height,
      }))}
      initialSizeId={query.size}
      initialColorId={query.color}
      product={{
        id: product.id,
        name: product.name,
        priceCents: product.priceCents,
        colors: product.colors.map((color) => ({
          id: color.id,
          name: color.name,
          hex: color.hex,
          frontUrl: mediaUrl(color.frontMockupKey),
          backUrl: color.backMockupKey ? mediaUrl(color.backMockupKey) : null,
        })),
        sizes: product.sizes.filter((size) => size.available).map((size) => ({ id: size.id, name: size.name })),
        areas: product.printAreas.map((area) => ({
          surface: toSurfaceId(area.surface),
          x: area.x,
          y: area.y,
          w: area.w,
          h: area.h,
          exportWidth: area.exportWidth,
          exportHeight: area.exportHeight,
          surchargeCents: area.surchargeCents,
        })),
      }}
    />
  );
}
