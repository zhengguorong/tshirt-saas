import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/admin/platform-shell";
import { getPlatformAdmin } from "@/server/auth";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const admin = await getPlatformAdmin();
  if (!admin) redirect("/platform/login");
  return <PlatformShell>{children}</PlatformShell>;
}
