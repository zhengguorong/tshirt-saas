import Link from "next/link";
import { redirect } from "next/navigation";
import { formatYuan } from "@tshirt/design";
import { CartSheet } from "@/components/cart-sheet";
import { LoginWall } from "@/components/shop-login";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getConsumer } from "@/server/auth";
import { getShop, mediaUrl } from "@/server/catalog";
import { describeCartItem, getCart } from "@/server/commerce";

export default async function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const consumer = await getConsumer();
  if (!consumer) return <LoginWall next={`/s/${slug}/cart`} title="登录后查看购物车" />;
  const shop = await getShop(slug);
  if (!shop) redirect("/");
  const items = await getCart(shop.id, consumer.id);
  if (items.length === 0) {
    return (
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3 bg-[#f5f3f0] p-4 lg:h-auto lg:min-h-[calc(100svh-200px)] lg:max-w-[1600px] lg:bg-white lg:px-12 lg:py-24">
        <Empty className="rounded-2xl border-0 bg-white shadow-[0_8px_28px_rgba(30,24,18,0.06)] lg:rounded-none lg:shadow-none">
          <EmptyHeader>
            <EmptyTitle>购物车是空的</EmptyTitle>
            <EmptyDescription>选一件底衫，加上图案后再来结算。</EmptyDescription>
            <Link href={`/s/${slug}#products`} className="hidden text-sm underline underline-offset-4 lg:block">浏览底衫 →</Link>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }
  return (
    <CartSheet
      slug={slug}
      shipping={{ type: shop.shippingType, flatCents: shop.flatShippingCents, thresholdCents: shop.freeShippingThresholdCents }}
      lines={items.map((item) => {
        const line = describeCartItem(item);
        return {
          id: line.id,
          name: line.name,
          spec: line.spec,
          quantity: line.quantity,
          goodsCents: line.goodsCents,
          tags: line.tags,
          image: line.imageKey ? mediaUrl(line.imageKey) : null,
          price: formatYuan(line.goodsCents),
        };
      })}
    />
  );
}
