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
    <div className="store-home mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-5 lg:max-w-none lg:gap-0 lg:bg-white lg:px-0 lg:py-0">
      <section className="store-hero overflow-hidden rounded-[28px] lg:grid lg:min-h-[calc(100svh-88px)] lg:grid-cols-[0.9fr_1.1fr] lg:rounded-none">
        <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-[clamp(48px,6.25vw,120px)] lg:py-20">
          <p className="mb-4 text-xs font-medium tracking-[0.24em] text-neutral-500">{shop.name}</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:font-serif lg:text-[clamp(48px,4.6vw,76px)] lg:font-normal lg:leading-[1.3] lg:tracking-[0.06em]">一件白坯，<br />正反两面印刷</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-neutral-500">{shop.description || "把你的创意，穿在身上。高品质底衫，支持正反面印刷，少量也能做。"}</p>
          <div className="mt-8 flex flex-wrap gap-3 lg:mt-10 lg:gap-6">
            <Link href={products[0] ? `/s/${slug}/design/${products[0].id}` : "#products"} className="rounded-xl lg:rounded-none bg-neutral-950 px-7 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800">开始定制 <span className="ml-2">→</span></Link>
            <a href="#products" className="rounded-xl lg:rounded-none border border-neutral-400 px-7 py-3.5 text-sm font-medium text-neutral-800 transition hover:bg-white/70">浏览全部底衫</a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs text-neutral-600 lg:hidden"><span>◈ 高品质面料</span><span>◌ 高清印花</span><span>♢ 少量也能做</span></div>
        </div>
        <div className="relative min-h-[280px] bg-[#e7e1d7] lg:min-h-0">
          {heroImage ? <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-contain p-6 drop-shadow-[0_24px_24px_rgba(51,42,31,0.2)] lg:p-12" /> : <div className="h-full w-full bg-gradient-to-br from-[#ddd4c6] to-[#f2eee7]" />}
        </div>
      </section>
      <section id="products" className="store-collection flex scroll-mt-24 flex-col gap-4 lg:mx-auto lg:w-full lg:max-w-[1600px] lg:gap-24 lg:px-12 lg:pb-32 lg:pt-[104px]">
        <div className="flex items-end justify-between lg:flex-col lg:items-center lg:gap-5 lg:text-center"><div><h2 className="text-2xl font-semibold tracking-tight lg:font-normal lg:tracking-[0.16em]">精选底衫</h2><p className="mt-1 text-sm text-neutral-500">优质面料与版型，适合各种印刷工艺，让你的创意更出彩。</p></div><span className="hidden text-sm text-neutral-500 sm:block lg:hidden">共 {products.length} 款底衫</span></div>
      {products.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>还没有上架的 T 恤</EmptyTitle>
            <EmptyDescription>店主上架底衫后，就可以在这里开始定制。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-12 lg:gap-y-20">
          {products.map((product) => {
            const color = product.colors[0];
            return (
              <Link key={product.id} href={`/s/${slug}/products/${product.id}`} className="pressable group block h-full">
                <Card size="sm" className="h-full gap-0 overflow-hidden rounded-2xl border-0 bg-white shadow-[0_8px_28px_rgba(30,24,18,0.06)] pt-0 lg:rounded-none lg:shadow-none lg:ring-0">
                  <div className="bg-[#e8e4dc] transition group-hover:bg-[#ded8cf]">
                    {color ? (
                      <img src={mediaUrl(color.frontMockupKey)} alt="" className="aspect-square w-full object-contain p-3 lg:aspect-[3/4] lg:p-5 drop-shadow-[0_14px_12px_rgba(40,32,24,0.2)]" />
                    ) : (
                      <div className="aspect-square lg:aspect-[3/4]" />
                    )}
                  </div>
                  <CardContent className="flex flex-1 flex-col gap-1 p-4 lg:gap-3 lg:px-0 lg:pt-5">
                    <p className="line-clamp-2 min-h-10 text-sm leading-5 lg:min-h-0 lg:tracking-[0.08em]">{product.name}</p>
                    <div className="mt-auto flex items-center justify-between"><p className="text-lg font-semibold tabular-nums lg:text-sm lg:font-normal">{formatYuan(product.priceCents)}</p><span className="text-xs text-neutral-500">去定制&nbsp; →</span></div>
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
