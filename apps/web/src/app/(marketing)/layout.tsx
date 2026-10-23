import type { Metadata } from "next";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { allowDevOtp } from "@/server/auth";
import "./marketing.css";

export const metadata: Metadata = {
  title: {
    default: "印坊 — 开一间自己的 T 恤定制店",
    template: "%s · 印坊",
  },
  description: "顾客在线选底衫、做印花、下单。商家收订单、下载生产图、打印工艺单。",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mkt">
      <SiteHeader />
      {children}
      <SiteFooter dev={allowDevOtp()} />
    </div>
  );
}
