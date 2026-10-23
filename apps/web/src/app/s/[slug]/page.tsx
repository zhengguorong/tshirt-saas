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
    <div className="flex flex-col gap-3 px-3 py-3">
      {shop.description ? <p className="text-sm text-muted-foreground">{shop.description}</p> : null}
      <p className="text-sm font-medium">精选底衫</p>
      {products.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>还没有上架的 T 恤</EmptyTitle>
            <EmptyDescription>店主上架底衫后，就可以在这里开始定制。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-2">
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
