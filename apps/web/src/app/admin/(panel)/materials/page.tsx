import { prisma } from "@tshirt/db";
import { MaterialsView } from "@/components/admin/materials-view";
import { getStaff, isOwner } from "@/server/auth";
import { mediaUrl } from "@/server/catalog";

export default async function MaterialsPage() {
  const staff = await getStaff();
  if (!staff) return null;
  const materials = await prisma.asset.findMany({
    where: { tenantId: staff.tenantId, source: "MATERIAL" },
    orderBy: { createdAt: "desc" },
  });
  return (
    <MaterialsView
      owner={isOwner(staff.role)}
      slug={staff.tenant.slug}
      materials={materials.map((material) => ({ id: material.id, name: material.name, image: mediaUrl(material.objectKey) }))}
    />
  );
}
