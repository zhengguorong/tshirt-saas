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
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 lg:px-8 lg:py-8">
      {shop.description ? (
        <div className="rounded-2xl bg-muted/70 px-4 py-4 lg:px-8 lg:py-8">
          <p className="hidden text-xl font-semibold tracking-tight lg:block">{shop.name}</p>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground lg:mt-2">{shop.description}</p>
        </div>
      ) : (
        <div className="hidden rounded-2xl bg-muted/70 px-8 py-8 lg:block">
          <p className="text-xl font-semibold tracking-tight">{shop.name}</p>
        </div>
      )}
      <p id="products" className="text-base font-medium">精选底衫</p>
      {products.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>还没有上架的 T 恤</EmptyTitle>
            <EmptyDescription>店主上架底衫后，就可以在这里开始定制。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {products.map((product) => {
            const color = product.colors[0];
            return (
              <Link key={product.id} href={`/s/${slug}/products/${product.id}`} className="pressable block h-full">
                <Card size="sm" className="h-full gap-2 pt-0">
                  <div className="bg-[#e8e4dc]">
                    {color ? (
                      <img src={mediaUrl(color.frontMockupKey)} alt="" className="aspect-square w-full object-contain p-3 drop-shadow-[0_14px_12px_rgba(40,32,24,0.2)]" />
                    ) : (
                      <div className="aspect-square" />
                    )}
                  </div>
                  <CardContent className="flex flex-1 flex-col gap-1">
                    <p className="line-clamp-2 min-h-10 text-sm leading-5">{product.name}</p>
                    <p className="mt-auto text-sm font-medium tabular-nums">{formatYuan(product.priceCents)}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
