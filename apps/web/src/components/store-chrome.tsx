"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, HouseIcon, ShirtIcon, UserRoundIcon, XIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

export type BlankProduct = { id: string; name: string; price: string; image: string | null };

export function StoreMotion({ slug, children }: { slug: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const rest = pathname.startsWith(`/s/${slug}`) ? pathname.slice(`/s/${slug}`.length) : pathname;
  const tab = rest === "" || rest === "/" || rest === "/cart" || rest === "/orders" || rest === "/account";
  const motion = rest.startsWith("/design") || rest === "/login" ? "" : tab ? "store-fade" : "page-push";
  return (
    <div key={pathname} className={cn("h-full min-h-0 overflow-y-auto", motion)}>
      {children}
    </div>
  );
}

export function StoreHeader({ slug, name }: { slug: string; name: string }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const home = pathname === `/s/${slug}` || pathname === `/s/${slug}/`;
  const title = headerTitle(pathname, Boolean(search.get("next")), name);
  return (
    <header className="grid h-12 shrink-0 grid-cols-[2.5rem_1fr_2.5rem] items-center border-b bg-background px-1">
      {home ? <span /> : (
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label="返回"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push(`/s/${slug}`);
          }}
        >
          <ChevronLeftIcon />
        </Button>
      )}
      <p className="truncate text-center text-sm font-medium">{title}</p>
      <span />
    </header>
  );
}

export function StoreTabBar({ slug, products }: { slug: string; products: BlankProduct[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const base = `/s/${slug}`;
  const visible = pathname === base || pathname === `${base}/` || pathname === `${base}/cart` || pathname === `${base}/orders` || pathname === `${base}/account`;
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  if (!visible) return null;
  const home = pathname === base || pathname === `${base}/`;
  const mine = pathname === `${base}/account`;
  return (
    <>
      {open ? <BlankSheet slug={slug} products={products} onClose={() => setOpen(false)} /> : null}
      <nav className="relative z-30 shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.05)]">
        <div className="grid h-14 grid-cols-3 items-end">
          <TabLink href={base} active={home} icon={HouseIcon} label="首页" />
          <button type="button" className="tab-ink -translate-y-2 flex flex-col items-center gap-1 text-primary" aria-expanded={open} onClick={() => setOpen(true)}>
            <span className="pressable flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              <ShirtIcon className="size-5" />
            </span>
            <span className="text-[10px] leading-none">定制</span>
          </button>
          <TabLink href={`${base}/account`} active={mine} icon={UserRoundIcon} label="我的" />
        </div>
      </nav>
    </>
  );
}

function BlankSheet({ slug, products, onClose }: { slug: string; products: BlankProduct[]; onClose: () => void }) {
  return (
    <>
      <button type="button" aria-label="关闭" className="store-fade absolute inset-0 z-40 bg-black/40" onClick={onClose} />
      <section className="sheet-up absolute inset-x-0 bottom-0 z-50 flex max-h-[70%] flex-col overflow-hidden rounded-t-2xl bg-background pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(0,0,0,0.12)]">
        <div className="flex shrink-0 items-center justify-between px-4 py-3">
          <p className="text-sm font-medium">选择要定制的底衫</p>
          <button type="button" className="pressable flex size-8 items-center justify-center rounded-full text-muted-foreground" aria-label="关闭" onClick={onClose}>
            <XIcon className="size-4" />
          </button>
        </div>
        {products.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">还没有上架的底衫</p>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {products.map((product) => (
              <Link key={product.id} href={`/s/${slug}/design/${product.id}`} className="pressable flex items-center gap-3 border-t px-4 py-2.5">
                <span className="size-16 shrink-0 overflow-hidden rounded-lg bg-[#e8e4dc]">
                  {product.image ? <img src={product.image} alt="" className="size-full object-contain p-1 drop-shadow-[0_6px_6px_rgba(40,32,24,0.2)]" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm leading-5">{product.name}</span>
                  <span className="mt-1 block text-sm font-medium tabular-nums">{product.price}</span>
                </span>
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function headerTitle(pathname: string, choosing: boolean, shopName: string) {
  if (pathname.endsWith("/addresses/new")) return "添加收货地址";
  if (/\/addresses\/[^/]+$/.test(pathname)) return "编辑收货地址";
  if (pathname.endsWith("/addresses")) return choosing ? "选择收货地址" : "收货地址";
  if (pathname.endsWith("/login")) return "登录";
  if (pathname.endsWith("/checkout")) return "订单确认";
  if (/\/products\/[^/]+$/.test(pathname)) return "商品详情";
  return shopName;
}

function TabLink({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: typeof HouseIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn("pressable tab-ink flex flex-col items-center gap-0.5 pb-1.5 text-[10px]", active ? "text-primary" : "text-muted-foreground")}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}
