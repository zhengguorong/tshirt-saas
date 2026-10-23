import { AddressForm } from "@/components/address-form";
import { LoginWall } from "@/components/shop-login";
import { getConsumer } from "@/server/auth";
import { prisma } from "@tshirt/db";

export default async function NewAddressPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const next = query.next?.startsWith(`/s/${slug}`) ? query.next : "";
  const consumer = await getConsumer();
  if (!consumer) return <LoginWall next={`/s/${slug}/addresses/new${next ? `?next=${encodeURIComponent(next)}` : ""}`} title="登录后添加收货地址" />;
  const count = await prisma.address.count({ where: { consumerId: consumer.id } });
  return <AddressForm slug={slug} next={next} address={null} preferDefault={count === 0} />;
}
