import { formatYuan } from "@tshirt/design";
import { ProductsView } from "@/components/admin/products-view";
import { getStaff, isOwner } from "@/server/auth";
import { listProducts, mediaUrl } from "@/server/catalog";

export default async function ProductsPage() {
  const staff = await getStaff();
  if (!staff) return null;
  const products = await listProducts(staff.tenantId, false);
  return (
    <ProductsView
      owner={isOwner(staff.role)}
      slug={staff.tenant.slug}
      products={products.map((product) => ({
        id: product.id,
        name: product.name,
        image: product.colors[0] ? mediaUrl(product.colors[0].frontMockupKey) : null,
        colors: product.colors.map((color) => color.name).join("、"),
        sizes: product.sizes.filter((size) => size.available).map((size) => size.name).join("、"),
        status: product.status,
        price: formatYuan(product.priceCents),
      }))}
    />
  );
}
