import { redirect } from "next/navigation";
import { formatYuan } from "@tshirt/design";
import { prisma } from "@tshirt/db";
import { CheckoutForm } from "@/components/forms";
import { LoginWall } from "@/components/shop-login";
import { getConsumer } from "@/server/auth";
import { getShop, mediaUrl } from "@/server/catalog";
import { describeCartItem, quoteCart } from "@/server/commerce";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ids?: string; addressId?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const consumer = await getConsumer();
  const requested = query.ids?.split(",").map((id) => id.trim()).filter(Boolean);
  const checkoutQuery = new URLSearchParams();
  if (requested?.length) checkoutQuery.set("ids", requested.join(","));
  const checkoutPath = `/s/${slug}/checkout${checkoutQuery.size ? `?${checkoutQuery}` : ""}`;
  if (!consumer) return <LoginWall next={checkoutPath} title="登录后继续结算" />;
  const shop = await getShop(slug);
  if (!shop) redirect("/");
  const quoted = await quoteCart(shop.id, consumer.id, requested);
  if (quoted.items.length === 0) redirect(`/s/${slug}/cart`);
  const picked = query.addressId
    ? await prisma.address.findFirst({ where: { id: query.addressId, consumerId: consumer.id } })
    : null;
  const address = picked
    ?? await prisma.address.findFirst({ where: { consumerId: consumer.id, isDefault: true } })
    ?? await prisma.address.findFirst({ where: { consumerId: consumer.id }, orderBy: { createdAt: "desc" } });
  const lines = quoted.items.map((item) => {
    const line = describeCartItem(item);
    return {
      id: line.id,
      name: line.name,
      spec: line.spec,
      quantity: line.quantity,
      image: line.imageKey ? mediaUrl(line.imageKey) : null,
      price: formatYuan(line.goodsCents),
      tags: line.tags,
    };
  });
  return (
    <CheckoutForm
      slug={slug}
      ids={lines.map((line) => line.id).join(",")}
      addressHref={`/s/${slug}/addresses?next=${encodeURIComponent(checkoutPath)}`}
      address={address ? { name: address.name, phone: address.phone, province: address.province, city: address.city, district: address.district, detail: address.detail } : null}
      lines={lines}
      summary={{
        styles: lines.length,
        quantity: lines.reduce((sum, line) => sum + line.quantity, 0),
        total: formatYuan(quoted.price.totalCents),
        base: formatYuan(quoted.price.baseCents),
        print: formatYuan(quoted.price.printCents),
        shipping: quoted.price.shippingCents === 0 ? "免邮" : formatYuan(quoted.price.shippingCents),
      }}
    />
  );
}
