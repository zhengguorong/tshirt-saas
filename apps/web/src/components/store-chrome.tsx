"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HouseIcon,
  ShirtIcon,
  ShoppingBagIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

export type BlankProduct = { id: string; name: string; price: string; image: string | null };

// Only the design workspace keeps a viewport-sized desktop shell.
export function StoreFrame({ slug, children }: { slug: string; children: React.ReactNode }) {
  const editor = usePathname().startsWith(`/s/${slug}/design/`);
  return <div className={cn("relative mx-auto flex h-dvh w-full flex-col bg-background shadow-sm", editor ? "lg:shadow-none" : "lg:h-auto lg:min-h-dvh lg:bg-white lg:shadow-none")}>{children}</div>;
}

export function StoreMotion({ slug, children }: { slug: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const rest = pathname.startsWith(`/s/${slug}`) ? pathname.slice(`/s/${slug}`.length) : pathname;
  const tab = rest === "" || rest === "/" || rest === "/cart" || rest === "/orders" || rest === "/account";
  const motion = rest.startsWith("/design") || rest === "/login" ? "" : tab ? "store-fade" : "page-push";
  const editor = rest.startsWith("/design/");
  const member = rest === "/account" || rest.startsWith("/orders") || rest.startsWith("/addresses");
  const links = [{ path: "/account", label: "账户概览" }, { path: "/orders", label: "我的订单" }, { path: "/addresses", label: "收货地址" }, { path: "/cart", label: "购物车" }];
  return (
    <div key={pathname} className={cn("h-full min-h-0 overflow-y-auto", motion, editor ? "lg:h-[calc(100dvh-4rem)]" : "store-document lg:flex lg:h-auto lg:min-h-[calc(100dvh-5.5rem)] lg:flex-col lg:overflow-visible")}>
      <div className={cn("h-full lg:h-auto", !editor && "lg:flex-1", editor && "lg:h-full", member && "lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start lg:gap-8 lg:px-8 lg:py-10")}>
        {member ? <aside className="hidden lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-1 lg:rounded-2xl lg:bg-white lg:p-4">
          <p className="px-3 py-3 text-xs text-muted-foreground">个人中心</p>
          {links.map(({ path, label }) => <Link key={path} href={`/s/${slug}${path}`} aria-current={rest.startsWith(path) ? "page" : undefined} className={cn("rounded-lg px-3 py-3 text-sm transition hover:bg-muted", rest.startsWith(path) && "bg-muted font-semibold")}>{label}</Link>)}
          <Link href={`/s/${slug}`} className="mt-4 border-t px-3 pt-5 text-sm text-muted-foreground">继续选购 →</Link>
        </aside> : null}
        <main className={cn("h-full min-w-0", !editor && "lg:h-auto")}>{children}</main>
      </div>
      {!editor ? <footer className="mx-auto hidden w-full max-w-[1600px] items-center justify-between border-t px-12 py-12 text-xs text-muted-foreground lg:flex"><span>用创意，定制你的日常。</span><div className="flex gap-6"><Link href={`/s/${slug}`}>继续选购</Link><Link href={`/s/${slug}/orders`}>查看订单</Link></div></footer> : null}
    </div>
  );
}

export function StoreHeader({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const home = pathname === `/s/${slug}` || pathname === `/s/${slug}/`;
  const title = headerTitle(pathname, Boolean(search.get("next")), name);
  const base = `/s/${slug}`;

  return (
    <>
      <header className={cn("sticky top-0 z-30 shrink-0 border-b bg-background/95 px-1 backdrop-blur lg:px-12", pathname.startsWith(`${base}/design/`) ? "lg:h-16" : "lg:h-[88px]")}>
        {/* Mobile header */}
        <div className="grid h-12 grid-cols-[2.5rem_1fr_2.5rem] items-center lg:hidden">
          {home ? (
            <span />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              aria-label="返回"
              onClick={() => {
                if (window.history.length > 1) router.back();
                else router.push(base);
              }}
            >
              <ChevronLeftIcon />
            </Button>
          )}
          <p className="truncate text-center text-sm font-medium">{title}</p>
          <span />
        </div>

        {/* Desktop header */}
        <div className="relative mx-auto hidden h-full max-w-[1504px] grid-cols-[1fr_auto_1fr] items-center gap-8 lg:grid">
          <Link href={base} className="col-start-2 row-start-1 max-w-64 truncate font-serif text-4xl font-normal tracking-[0.12em]">
            {name}
          </Link>
          <nav className="col-start-1 row-start-1 flex items-center gap-8" aria-label="店铺导航">
            <DesktopLink href={base} active={home}>
              首页
            </DesktopLink>
            <DesktopLink href={`${base}#products`} active={pathname.includes("/design") || pathname.includes("/products")}>全部底衫</DesktopLink>
            <DesktopLink href={`${base}/orders`} active={pathname.includes("/orders")}>
              我的订单
            </DesktopLink>
          </nav>
          <div className="col-start-3 row-start-1 flex items-center justify-end gap-5">
            <Link href={`${base}/account`} aria-label="账户" className="flex size-9 items-center justify-center text-neutral-900 transition hover:bg-neutral-100"><UserRoundIcon className="size-[22px]" strokeWidth={1.4} /></Link>
            <Link href={`${base}/cart`} aria-label="购物车" className="relative flex size-9 items-center justify-center rounded-full text-neutral-900 transition hover:bg-neutral-100">
              <ShoppingBagIcon className="size-[22px]" strokeWidth={1.4} />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}

function DesktopLink({
  href,
  active,
  children,
  icon: Icon,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  icon?: typeof ShoppingBagIcon;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-1.5 text-sm tracking-[0.08em] transition-colors",
        active ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {Icon ? <Icon className="size-4" /> : null}
      {children}
    </Link>
  );
}

export function StoreTabBar(props: { slug: string; products: BlankProduct[] }) {
  const pathname = usePathname();
  return <StoreTabs key={pathname} {...props} pathname={pathname} />;
}

function StoreTabs({ slug, products, pathname }: { slug: string; products: BlankProduct[]; pathname: string }) {
  const [open, setOpen] = useState(false);
  const base = `/s/${slug}`;
  const visible =
    pathname === base ||
    pathname === `${base}/` ||
    pathname === `${base}/cart` ||
    pathname === `${base}/orders` ||
    pathname === `${base}/account`;
  if (!visible) return null;
  const home = pathname === base || pathname === `${base}/`;
  const mine = pathname === `${base}/account`;
  return (
    <>
      {open ? <BlankSheet slug={slug} products={products} onClose={() => setOpen(false)} /> : null}
      <nav className="relative z-30 shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.05)] lg:hidden">
        <div className="grid h-14 grid-cols-3 items-end">
          <TabLink href={base} active={home} icon={HouseIcon} label="首页" />
          <button
            type="button"
            className="tab-ink -translate-y-2 flex flex-col items-center gap-1 text-primary"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
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
      <section className="sheet-up absolute inset-x-0 bottom-0 z-50 flex max-h-[70%] flex-col overflow-hidden rounded-t-2xl bg-background pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(0,0,0,0.12)] lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:max-h-[min(70vh,640px)] lg:w-full lg:max-w-lg lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:pb-3">
        <div className="flex shrink-0 items-center justify-between px-4 py-3">
          <p className="text-sm font-medium">选择要定制的底衫</p>
          <button
            type="button"
            className="pressable flex size-8 items-center justify-center rounded-full text-muted-foreground"
            aria-label="关闭"
            onClick={onClose}
          >
            <XIcon className="size-4" />
          </button>
        </div>
        {products.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">还没有上架的底衫</p>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/s/${slug}/design/${product.id}`}
                className="pressable flex items-center gap-3 border-t px-4 py-2.5"
              >
                <span className="size-16 shrink-0 overflow-hidden rounded-lg bg-[#e8e4dc]">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt=""
                      className="size-full object-contain p-1 drop-shadow-[0_6px_6px_rgba(40,32,24,0.2)]"
                    />
                  ) : null}
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
      className={cn(
        "pressable tab-ink flex flex-col items-center gap-0.5 pb-1.5 text-[10px]",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}
