import type { Metadata } from "next";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { allowDevOtp } from "@/server/auth";
import "./marketing.css";

export const metadata: Metadata = {
  title: {
    default: "印坊 — 服装定制商家的经营管理系统",
    template: "%s · 印坊",
  },
  description: "为服装定制商家打造的 SaaS。独立店铺、在线设计、订单管理与生产交付，一套系统全部打通。",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mkt">
      <SiteHeader />
      <div id="main-content" tabIndex={-1}>{children}</div>
      <SiteFooter dev={allowDevOtp()} />
    </div>
  );
}
