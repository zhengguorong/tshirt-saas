import { notFound } from "next/navigation";
import { formatYuan } from "@tshirt/design";
import { ProductView } from "@/components/product-view";
import { getProduct, getShop, mediaUrl, parseDetailBlocks, parseGalleryKeys, toSurfaceId } from "@/server/catalog";

export default async function ProductPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const shop = await getShop(slug);
  if (!shop) notFound();
  const product = await getProduct(shop.id, id, true);
  if (!product) notFound();
  const printNote = product.printAreas
    .map((area) => `${toSurfaceId(area.surface) === "front" ? "正面" : "背面"} ${formatYuan(area.surchargeCents)}`)
    .join(" · ");
  return (
    <ProductView
      slug={slug}
      productId={product.id}
      name={product.name}
      price={formatYuan(product.priceCents)}
      detail={product.detail}
      printNote={printNote}
      colors={product.colors.map((color) => ({
        id: color.id,
        name: color.name,
        hex: color.hex,
        frontUrl: mediaUrl(color.frontMockupKey),
        backUrl: color.backMockupKey ? mediaUrl(color.backMockupKey) : null,
      }))}
      gallery={parseGalleryKeys(product.galleryKeys).map((key) => mediaUrl(key))}
      blocks={parseDetailBlocks(product.detailBlocks).map((block) => (
        block.type === "image" ? { ...block, content: mediaUrl(block.content) } : block
      ))}
      sizes={product.sizes.filter((size) => size.available).map((size) => ({ id: size.id, name: size.name }))}
    />
  );
}
