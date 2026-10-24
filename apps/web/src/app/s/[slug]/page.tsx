import Link from "next/link";
import { notFound } from "next/navigation";
import { formatYuan } from "@tshirt/design";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getShop, listProducts, mediaUrl } from "@/server/catalog";

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShop(slug);
  if (!shop) notFound();
  const products = await listProducts(shop.id, true);
  const heroImage = products[0]?.colors[0] ? mediaUrl(products[0].colors[0].frontMockupKey) : null;
  return (
    <div className="store-home mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-5 lg:px-12 lg:py-8">
      <section className="store-hero overflow-hidden rounded-[28px] lg:grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <p className="mb-4 text-xs font-medium tracking-[0.24em] text-neutral-500">{shop.name}</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-[58px]">一件白坯，<br />正反两面印刷</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-neutral-500">{shop.description || "把你的创意，穿在身上。高品质底衫，支持正反面印刷，少量也能做。"}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={products[0] ? `/s/${slug}/design/${products[0].id}` : "#products"} className="rounded-xl bg-neutral-950 px-7 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800">开始定制 <span className="ml-2">→</span></Link>
            <a href="#products" className="rounded-xl border border-neutral-400 px-7 py-3.5 text-sm font-medium text-neutral-800 transition hover:bg-white/70">浏览全部底衫</a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs text-neutral-600"><span>◈ 高品质面料</span><span>◌ 高清印花</span><span>♢ 少量也能做</span></div>
        </div>
        <div className="relative min-h-[280px] bg-[#e7e1d7] lg:min-h-[470px]">
          {heroImage ? <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-contain p-6 drop-shadow-[0_24px_24px_rgba(51,42,31,0.2)] lg:p-10" /> : <div className="h-full w-full bg-gradient-to-br from-[#ddd4c6] to-[#f2eee7]" />}
        </div>
      </section>
      <section id="products" className="flex flex-col gap-4">
        <div className="flex items-end justify-between"><div><h2 className="text-2xl font-semibold tracking-tight">精选底衫</h2><p className="mt-1 text-sm text-neutral-500">优质面料与版型，适合各种印刷工艺，让你的创意更出彩。</p></div><span className="hidden text-sm text-neutral-500 sm:block">查看全部&nbsp; →</span></div>
      {products.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>还没有上架的 T 恤</EmptyTitle>
            <EmptyDescription>店主上架底衫后，就可以在这里开始定制。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {products.map((product) => {
            const color = product.colors[0];
            return (
              <Link key={product.id} href={`/s/${slug}/products/${product.id}`} className="pressable group block h-full">
                <Card size="sm" className="h-full gap-0 overflow-hidden rounded-2xl border-0 bg-white shadow-[0_8px_28px_rgba(30,24,18,0.06)] pt-0">
                  <div className="bg-[#e8e4dc] transition group-hover:bg-[#ded8cf]">
                    {color ? (
                      <img src={mediaUrl(color.frontMockupKey)} alt="" className="aspect-square w-full object-contain p-3 drop-shadow-[0_14px_12px_rgba(40,32,24,0.2)]" />
                    ) : (
                      <div className="aspect-square" />
                    )}
                  </div>
                  <CardContent className="flex flex-1 flex-col gap-1 p-4">
                    <p className="line-clamp-2 min-h-10 text-sm leading-5">{product.name}</p>
                    <div className="mt-auto flex items-center justify-between"><p className="text-lg font-semibold tabular-nums">{formatYuan(product.priceCents)}</p><span className="text-xs text-neutral-500">去定制&nbsp; →</span></div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      </section>
    </div>
  );
}
