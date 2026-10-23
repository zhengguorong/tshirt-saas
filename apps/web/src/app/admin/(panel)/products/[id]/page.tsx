import { notFound, redirect } from "next/navigation";
import { formatYuan } from "@tshirt/design";
import { ProductEditor } from "@/components/admin/product-editor";
import { getStaff, isOwner } from "@/server/auth";
import { getProduct, toSurfaceId } from "@/server/catalog";

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaff();
  if (!staff) return null;
  if (!isOwner(staff.role)) redirect("/admin/products");
  const { id } = await params;
  const product = await getProduct(staff.tenantId, id, false);
  if (!product) notFound();
  const front = product.printAreas.find((area) => area.surface === "FRONT");
  const back = product.printAreas.find((area) => area.surface === "BACK");
  return (
    <ProductEditor
      product={{
        id: product.id,
        name: product.name,
        detail: product.detail,
        priceYuan: (product.priceCents / 100).toFixed(2),
        publish: product.status === "ON",
        frontSurchargeYuan: ((front?.surchargeCents ?? 0) / 100).toFixed(2),
        backSurchargeYuan: ((back?.surchargeCents ?? 0) / 100).toFixed(2),
        summary: `当前售价 ${formatYuan(product.priceCents)} · 印刷面 ${product.printAreas.map((area) => (toSurfaceId(area.surface) === "front" ? "正面" : "背面")).join("、")}`,
        colors: product.colors.map((color) => ({ name: color.name, hex: color.hex })),
        sizes: product.sizes.map((size) => ({ id: size.id, name: size.name, available: size.available })),
      }}
    />
  );
}
