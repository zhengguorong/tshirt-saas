import "./storefront.css";
import { notFound } from "next/navigation";
import { formatYuan } from "@tshirt/design";
import { ShopLogin } from "@/components/shop-login";
import { StoreFrame, StoreHeader, StoreMotion, StoreTabBar } from "@/components/store-chrome";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { allowDevOtp } from "@/server/auth";
import { getShop, listProducts, mediaUrl } from "@/server/catalog";

export default async function StoreLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShop(slug);
  if (!shop) notFound();
  if (shop.status !== "ACTIVE") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>{shop.name}</CardTitle>
            <CardDescription>店铺已暂停，暂时不能下单。</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }
  const products = await listProducts(shop.id, true);
  const blanks = products.map((product) => ({
    id: product.id,
    name: product.name,
    price: formatYuan(product.priceCents),
    image: product.colors[0] ? mediaUrl(product.colors[0].frontMockupKey) : null,
  }));
  return (
    <div className="min-h-screen bg-muted lg:bg-[#f5f3f0]">
      <StoreFrame slug={slug}>
        <ShopLogin slug={slug} devOtp={allowDevOtp()}>
          <StoreHeader slug={slug} name={shop.name} />
          <div className="min-h-0 flex-1 overflow-hidden lg:overflow-visible">
            <StoreMotion slug={slug}>{children}</StoreMotion>
          </div>
          <StoreTabBar slug={slug} products={blanks} />
        </ShopLogin>
      </StoreFrame>
    </div>
  );
}
