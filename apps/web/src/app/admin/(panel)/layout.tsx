import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getStaff, isOwner } from "@/server/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  return (
    <AdminShell tenantName={staff.tenant.name} slug={staff.tenant.slug} owner={isOwner(staff.role)}>
      {children}
    </AdminShell>
  );
}
