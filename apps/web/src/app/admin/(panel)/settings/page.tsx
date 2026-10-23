import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ShopSettingsForm } from "@/components/shop-settings-form";
import { getStaff, isOwner } from "@/server/auth";

export default async function SettingsPage() {
  const staff = await getStaff();
  if (!staff) return null;
  if (!isOwner(staff.role)) redirect("/admin");
  const shop = staff.tenant;
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return (
    <ShopSettingsForm
      key={`${shop.name}:${shop.customDomain ?? ""}:${shop.shippingType}`}
      shopUrl={`${proto}://${host}/s/${shop.slug}`}
      name={shop.name}
      description={shop.description}
      contact={shop.contact}
      customDomain={shop.customDomain ?? ""}
      shippingType={shop.shippingType}
      flatYuan={(shop.flatShippingCents / 100).toFixed(2)}
      thresholdYuan={((shop.freeShippingThresholdCents ?? 0) / 100).toFixed(2)}
    />
  );
}
