import { notFound } from "next/navigation";
import { prisma } from "@tshirt/db";
import { AddressForm } from "@/components/address-form";
import { LoginWall } from "@/components/shop-login";
import { getConsumer } from "@/server/auth";

export default async function EditAddressPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { slug, id } = await params;
  const query = await searchParams;
  const next = query.next?.startsWith(`/s/${slug}`) ? query.next : "";
  const consumer = await getConsumer();
  if (!consumer) return <LoginWall next={`/s/${slug}/addresses/${id}${next ? `?next=${encodeURIComponent(next)}` : ""}`} title="登录后编辑收货地址" />;
  const address = await prisma.address.findFirst({ where: { id, consumerId: consumer.id } });
  if (!address) notFound();
  return <AddressForm slug={slug} next={next} preferDefault={false} address={address} />;
}
