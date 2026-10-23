import { prisma } from "@tshirt/db";
import { DemosView } from "@/components/admin/demos-view";
import { labelOf, planChoices, roles, volumes } from "@/lib/marketing";

export default async function PlatformDemosPage() {
  const rows = await prisma.demoRequest.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <DemosView
      rows={rows.map((row) => ({
        id: row.id,
        when: row.createdAt.toLocaleString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" }),
        name: row.name,
        phone: row.phone,
        company: row.company,
        role: labelOf(roles, row.role),
        volume: labelOf(volumes, row.volume),
        plan: labelOf(planChoices, row.plan),
        note: row.note,
      }))}
    />
  );
}
