import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { prisma } from "@tshirt/db";
import { LoginWall } from "@/components/shop-login";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getConsumer } from "@/server/auth";

export default async function AddressListPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const consumer = await getConsumer();
  const next = query.next?.startsWith(`/s/${slug}`) ? query.next : "";
  if (!consumer) return <LoginWall next={`/s/${slug}/addresses${next ? `?next=${encodeURIComponent(next)}` : ""}`} title="登录后管理收货地址" />;
  const addresses = await prisma.address.findMany({ where: { consumerId: consumer.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
  const adding = `/s/${slug}/addresses/new${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col bg-[#f5f3f0] p-4 lg:h-auto lg:max-w-none lg:p-0">
      <div className="mb-5 flex items-center justify-between"><div><h1 className="text-2xl font-semibold tracking-tight">{next ? "选择收货地址" : "收货地址"}</h1><p className="mt-1 text-sm text-muted-foreground">{next ? "选择地址后返回订单确认" : "管理你的常用收货信息"}</p></div><Button className="hidden bg-neutral-950 lg:inline-flex" size="lg" nativeButton={false} render={<Link href={adding} />}>添加地址</Button></div>
      <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-visible lg:rounded-2xl lg:bg-white lg:p-2 lg:shadow-[0_8px_28px_rgba(30,24,18,0.06)]">
        {addresses.length === 0 ? (
          <Empty className="m-3 border bg-background">
            <EmptyHeader>
              <EmptyTitle>暂无地址</EmptyTitle>
              <EmptyDescription>添加一个收货地址后就可以提交订单。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-3 bg-background p-2 lg:grid-cols-2">
            {addresses.map((item) => {
              const edit = `/s/${slug}/addresses/${item.id}${next ? `?next=${encodeURIComponent(next)}` : ""}`;
              const select = next ? withAddress(next, item.id) : edit;
              return (
                <div key={item.id} className="relative rounded-xl border bg-white">
                  <Link href={select} className="flex flex-col gap-1 px-4 py-4 pr-14">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {item.isDefault ? <Badge>默认</Badge> : null}
                      <span className="truncate">{item.name}</span>
                      <span className="shrink-0">{item.phone}</span>
                    </span>
                    <span className="truncate text-sm text-muted-foreground">{item.province}{item.city}{item.district}{item.detail}</span>
                  </Link>
                  <Link href={edit} aria-label="编辑" className="absolute top-1/2 right-3 -translate-y-1/2 p-2 text-muted-foreground">
                    <PencilIcon className="size-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="shrink-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
        <Button className="w-full" size="lg" nativeButton={false} render={<Link href={adding} />}>添加地址</Button>
      </div>
    </div>
  );
}

function withAddress(next: string, addressId: string) {
  const url = new URL(next, "http://local");
  url.searchParams.set("addressId", addressId);
  return `${url.pathname}${url.search}`;
}
