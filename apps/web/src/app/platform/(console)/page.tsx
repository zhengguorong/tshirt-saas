import { prisma } from "@tshirt/db";
import { PlatformView } from "@/components/admin/platform-view";

export default async function PlatformPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true, products: true } } },
  });
  return (
    <PlatformView
      tenants={tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.customDomain,
        products: tenant._count.products,
        orders: tenant._count.orders,
        active: tenant.status === "ACTIVE",
      }))}
    />
  );
}
