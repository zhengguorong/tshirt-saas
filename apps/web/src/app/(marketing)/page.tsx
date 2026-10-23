import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Box, Check, CheckCircle2, ClipboardList, Layers3, Palette, ShieldCheck, Store } from "lucide-react";
import { PlanGrid } from "@/components/marketing/plan-grid";
import { DesignScreen, OrderScreen, ProductScene, ProductionScreen, StoreScreen } from "@/components/marketing/product-preview";

export const metadata: Metadata = {
  title: { absolute: "印坊 — 服装定制商家的经营管理系统" },
  description: "为服装定制商家打造的 SaaS。独立店铺、在线设计、订单管理、生产图与工艺单，一套系统连接从在线定制到生产交付的完整流程。",
};

const workflow = [
  { icon: Store, title: "独立店铺", text: "快速开通专属店铺" },
  { icon: Palette, title: "在线设计", text: "顾客自主设计下单" },
  { icon: ClipboardList, title: "订单管理", text: "订单、工艺单高效协同" },
  { icon: Box, title: "生产交付", text: "生成生产图，按单交付" },
];
const features = [
  { icon: Store, title: "独立店铺，快速上线", text: "配置底衫、颜色、尺码与售价，用专属店铺地址开展定制生意。", href: "/s/demo", label: "体验示例店铺", screen: StoreScreen },
  { icon: Palette, title: "在线设计，轻松下单", text: "图案选择、图片上传、正反面设计，让顾客把想法直接变成订单。", href: "/demo", label: "了解设计功能", screen: DesignScreen },
  { icon: ClipboardList, title: "订单与生产，高效协同", text: "支付后生成生产图，尺码数量合并到工艺单，减少反复沟通。", href: "/demo", label: "了解订单管理", screen: OrderScreen },
];
const audiences = [
  { icon: Store, tag: "独立品牌", title: "用自己的品牌，开展定制生意。", text: "管理自有商品与印花素材，分享专属店铺链接，让选品、定制与下单在一处完成。", points: ["专属店铺地址", "自有商品与素材库", "固定运费或满额包邮"] },
  { icon: Palette, tag: "设计工作室", title: "把设计沟通，变成在线创作。", text: "由你配置底衫与可定制区域，顾客直接选择图案或上传图片，设计与订单一起交付。", points: ["正反两面独立设计", "商家自定义印区", "顾客图片上传"] },
  { icon: Layers3, tag: "印花工厂", title: "让订单信息，顺畅进入车间。", text: "统一查看订单、下载生产图、打印工艺单，把尺码数量和印花要求清楚交给生产人员。", points: ["订单状态管理", "按颜色合并工艺单", "生产图下载与打印"] },
];
const steps = [
  { title: "注册店铺", text: "填写店名与手机号，获得店铺地址和商家后台。" },
  { title: "配置商品", text: "设置底衫、颜色、尺码、印区与售价。" },
  { title: "上传素材", text: "把常用图案整理进素材库，供顾客选择。" },
  { title: "分享接单", text: "分享店铺链接，开始接收设计与订单。" },
];
const faqs = [
  { q: "印坊适合哪些商家？", a: "印坊面向开展服装定制业务的独立品牌、设计工作室和印花工厂。你可以配置自己的底衫与印花素材，顾客在线设计下单，商家在后台管理订单和生产资料。" },
  { q: "没有技术基础，也能自己开店吗？", a: "可以。用店名和手机号注册后即可获得店铺地址和商家后台，无需自行开发网站。配置底衫、素材与运费后，就可以把链接分享给顾客。" },
  { q: "顾客下单后，怎么安排生产？", a: "订单支付后生成生产图，商家可以在后台下载。同一订单内，相同底衫和颜色的尺码数量合并到工艺单，可以直接打印给车间。" },
  { q: "免费方案能用哪些功能？会自动扣款吗？", a: "起步方案包含一家店铺、在线设计、印花素材、订单、生产图与工艺单。专业和工坊方案增加上线协助等服务，先确认服务范围再签约，网站不会自动扣款。" },
];

export default function HomePage() {
  return (
    <main>
      <div className="saas-hero-bg"><section className="mk-wrap saas-hero"><div className="saas-hero-copy"><p className="saas-eyebrow"><span />服装定制商家的经营管理系统</p><h1>从在线定制，<br />到生产交付。<br /><span>一套系统，全部打通。</span></h1><p className="saas-hero-description">店铺、设计器、订单与工艺单，协同运转。<br />让顾客轻松定制，让商家从容经营。</p><div className="saas-actions"><Link href="/signup" className="mk-btn">免费开通店铺 <ArrowUpRight size={18} /></Link><Link href="/demo" className="mk-btn mk-btn-ghost">预约产品演示</Link></div><div className="saas-hero-facts"><span><Check size={13} />免费方案即可起步</span><span><Check size={13} />无需开发</span><span><Check size={13} />独立店铺地址</span></div></div><ProductScene /></section>
        <div className="mk-wrap saas-workflow">{workflow.map(({ icon: Icon, title, text }, i) => <div className="saas-workflow-item" key={title}><span className="saas-flow-icon"><Icon /></span><div><h2>{title}</h2><p>{text}</p></div>{i < workflow.length - 1 && <ArrowRight className="saas-flow-arrow" />}</div>)}</div>
      </div>

      <section id="product" className="saas-feature-section"><div className="mk-wrap"><div className="saas-centered"><p className="mk-kicker">围绕真实业务设计 / PRODUCT</p><h2>顾客用得顺，商家管得清。</h2><p>从店铺经营到生产交付，连接服装定制的每个关键环节。</p></div><div className="saas-feature-grid">{features.map(({ icon: Icon, screen: Screen, ...feature }) => <article key={feature.title} className="saas-feature"><div className="saas-feature-preview"><Screen /></div><div className="saas-feature-copy"><h3><Icon />{feature.title}</h3><p>{feature.text}</p><Link href={feature.href}>{feature.label}<ArrowRight size={14} /></Link></div></article>)}</div>
        <div className="saas-production-story"><div><p className="mk-kicker">从订单到车间，一路衔接</p><h2>接到订单之后，<br />生产所需的信息也准备好了。</h2><p>不用再从聊天记录里找图案、对尺码。支付完成后生成生产图，同款同色的尺码数量合并成工艺单，让车间拿到清楚的制作依据。</p><ul><li><CheckCircle2 />正反面生产图，按设计生成</li><li><CheckCircle2 />同款同色，合并尺码与数量</li><li><CheckCircle2 />下载生产图，打印工艺单</li></ul><Link href="/demo" className="saas-inline-link">预约演示，走通一笔订单<ArrowRight size={16} /></Link></div><div className="saas-production-visual"><div className="saas-visual-grid" /><ProductionScreen /><span><ShieldCheck />设计、订单、生产资料，一处管理</span></div></div>
      </div></section>

      <section id="audience" className="mk-wrap mk-section"><div className="saas-section-heading"><div><p className="mk-kicker">适用场景 / WHO IT’S FOR</p><h2>不同的定制生意，<br />同样清晰的经营流程。</h2></div><Link href="/demo" className="saas-inline-link">聊聊你的业务<ArrowUpRight size={16} /></Link></div><div className="saas-audiences">{audiences.map(({ icon: Icon, ...item }) => <article key={item.tag}><div className="saas-audience-label"><span><Icon /></span>{item.tag}</div><h3>{item.title}</h3><p>{item.text}</p><ul>{item.points.map(point => <li key={point}><Check />{point}</li>)}</ul></article>)}</div></section>

      <section className="saas-start-section"><div className="mk-wrap mk-section"><div className="saas-centered"><p className="mk-kicker">简单配置，开始经营 / GET STARTED</p><h2>从开店到接单，四步开始。</h2><p>把流程交给系统，把时间留给你的生意。</p></div><div className="saas-steps">{steps.map((step, i) => <article key={step.title}><div><span>0{i + 1}</span>{i < steps.length - 1 && <ArrowRight />}</div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div><div className="saas-start-action"><Link href="/signup" className="mk-btn">免费开通我的店铺<ArrowUpRight size={17} /></Link><span>无需开发，自助注册即可开始</span></div></div></section>

      <section id="pricing" className="mk-wrap mk-section"><div className="saas-centered"><p className="mk-kicker">清晰的方案，合适的支持 / PRICING</p><h2>按你的经营阶段，选择合适的支持。</h2><p>先用免费方案把店开起来，需要上线协助时，再选择更多支持。</p></div><PlanGrid /><p className="saas-pricing-note">专业与工坊方案确认服务后签约，不自动扣款。<Link href="/pricing">查看完整方案对比<ArrowRight size={13} /></Link></p></section>

      <section className="mk-wrap mk-section saas-faq-layout"><div><p className="mk-kicker">常见问题 / FAQ</p><h2>开店前，<br />你可能还想了解。</h2><Link href="/demo" className="saas-inline-link">预约一次产品演示<ArrowUpRight size={16} /></Link></div><div className="mk-faq">{faqs.map(item => <details key={item.q}><summary>{item.q}<span aria-hidden="true">+</span></summary><p>{item.a}</p></details>)}</div></section>

      <section className="mk-wrap saas-final"><span className="saas-final-orbit" aria-hidden="true" /><div><p>让定制生意，更有条理。</p><h2>从一间店开始，<br />把经营的每一步连接起来。</h2><span>在线设计、订单管理、生产交付，一套系统协同完成。</span></div><div className="saas-final-actions"><Link href="/signup" className="mk-btn mk-btn-light">免费开通店铺<ArrowUpRight size={17} /></Link><Link href="/demo" className="saas-final-demo">预约产品演示<ArrowRight size={16} /></Link></div></section>
    </main>
  );
}
