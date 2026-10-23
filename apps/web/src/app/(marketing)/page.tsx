import type { Metadata } from "next";
import Link from "next/link";
import { PlanGrid } from "@/components/marketing/plan-grid";
import { EditorPreview, SheetPreview, ShopPreview } from "@/components/marketing/mocks";

export const metadata: Metadata = {
  title: { absolute: "印坊 — 开一间自己的 T 恤定制店" },
  description: "顾客选底衫、在衣服上做印花、下单。付款之后，生产图和工艺单回到商家后台。",
};

const audiences = [
  { tag: "品牌", title: "自有图案", text: "联名和自有图案放进一家店，把链接发出去就能卖。" },
  { tag: "工作室", title: "顾客来设计", text: "底衫、颜色、印区自己定。顾客设计完，订单直接进来。" },
  { tag: "印花厂", title: "单子能进车间", text: "付款后就有生产图。同一颜色的尺码数量合成一张工艺单。" },
];

const capabilities = [
  { no: "01", title: "订单", text: "待付款、待生产、待收货。发货、确认收货和关闭都在后台处理。" },
  { no: "02", title: "工艺单", text: "同一件底衫、同一个颜色合并尺码，正面背面印刷图随生产图一起生成，可以打印。" },
  { no: "03", title: "底衫", text: "样机、颜色、尺码、印区、售价和上下架。印区可以单独加印刷费。" },
  { no: "04", title: "印花素材", text: "图案按分类放进素材库，顾客设计时直接选用，也可以上传自己的图。" },
  { no: "05", title: "店铺", text: "名称、简介、联系方式、固定运费或满额包邮。需要的话填写自己的域名。" },
  { no: "06", title: "谁来管", text: "店主和店员都能登录处理订单。店铺设置只留给店主。" },
];

const steps = [
  { no: "01", title: "开通", text: "留下店名和手机号，拿到店铺地址和商家后台。" },
  { no: "02", title: "上架", text: "建一件底衫，配上颜色样机、尺码、印区和售价。" },
  { no: "03", title: "备图", text: "把常用图案放进印花素材，分好分类。" },
  { no: "04", title: "接单", text: "把链接给顾客。新订单、生产图、工艺单回到后台。" },
];

const faqs = [
  { q: "顾客怎么进店？", a: "每家店有一条自己的地址，形如 /s/店铺标识。店铺设置里可以填写独立域名，解析到本站后顾客就能用这个域名打开。" },
  { q: "印花怎么做？", a: "顾客从商品进入设计器。正面和背面分开，印区的位置和尺寸由商家标在底衫上。图案来自素材库，或由顾客上传。" },
  { q: "生产图什么时候有？", a: "订单支付之后生成，商家在后台下载。工艺单按底衫和颜色合并尺码，可以直接打印给车间。" },
  { q: "现在就要付钱吗？", a: "起步方案注册即可用，费用是 0。专业和工坊先申请演示，确认范围后再签约。这个网站不会自动扣款。" },
];

export default function HomePage() {
  return (
    <main>
      <section className="mk-wrap mk-hero">
        <div>
          <p className="mk-kicker">T 恤定制，从开店到出货</p>
          <h1>开一间自己的<br />T 恤定制店</h1>
          <p className="mk-lead">顾客打开你的店，选底衫、在衣服上做印花、下单。付款之后，生产图和工艺单回到你的后台，车间按单印刷、发货。</p>
          <div className="mk-hero-actions">
            <Link href="/signup" className="mk-btn">免费开店</Link>
            <Link href="/demo" className="mk-btn mk-btn-ghost">申请演示</Link>
          </div>
          <ul className="mk-facts">
            <li>正反两面分开设计</li>
            <li>付款后出生产图</li>
            <li>按颜色合并工艺单</li>
          </ul>
        </div>
        <div className="mk-stage">
          <ShopPreview />
          <SheetPreview />
        </div>
      </section>

      <section className="mk-wrap mk-section" style={{ paddingTop: 36 }}>
        <div className="mk-audiences">
          {audiences.map((item) => (
            <article key={item.tag}>
              <span>{item.tag}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="product" className="mk-wrap mk-section">
        <div className="mk-section-head">
          <p className="mk-kicker">产品</p>
          <h2>店、设计器、车间，是一条线</h2>
          <p className="mk-lead">顾客看到的是一家店。你收到的是能拿去印刷的图和单。</p>
        </div>
        <div className="mk-story">
          <article>
            <div className="mk-story-copy">
              <p className="mk-index">01</p>
              <h3>一家独立的店</h3>
              <p>系统分配访问地址。顾客登录、选品、加购、填地址、付款，都在这一家店里完成。要绑自己的域名，也可以在店铺设置里填写。</p>
            </div>
            <ShopPreview />
          </article>
          <article>
            <div className="mk-story-copy">
              <p className="mk-index">02</p>
              <h3>正面背面分开做</h3>
              <p>印区的位置和尺寸由你标在底衫上。顾客从素材库选图案，或上传自己的图。多印一面，可以加印刷费。</p>
            </div>
            <EditorPreview />
          </article>
          <article>
            <div className="mk-story-copy">
              <p className="mk-index">03</p>
              <h3>车间拿得到的单</h3>
              <p>支付完成后渲染生产图。同一订单里，同一件底衫、同一个颜色合成一张工艺单，尺码和数量写在一起。</p>
            </div>
            <SheetPreview />
          </article>
        </div>
      </section>

      <section className="mk-wrap mk-section" style={{ paddingTop: 0 }}>
        <div className="mk-section-head">
          <p className="mk-kicker">后台</p>
          <h2>开店之后，事情都在这几处</h2>
        </div>
        <div className="mk-capabilities">
          {capabilities.map((item) => (
            <article key={item.no}>
              <span>{item.no}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mk-wrap mk-section" style={{ paddingTop: 12 }}>
        <div className="mk-section-head">
          <p className="mk-kicker">怎么开始</p>
          <h2>四步，店就可以接单</h2>
        </div>
        <div className="mk-steps">
          {steps.map((step) => (
            <article key={step.no}>
              <strong>{step.no}</strong>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mk-wrap mk-section" id="pricing">
        <div className="mk-section-head">
          <p className="mk-kicker">价格</p>
          <h2>软件现在就能用。专业和工坊，多一个人帮你把店开好。</h2>
          <p className="mk-lead">起步方案注册即可用。专业和工坊是商务方案，提交演示后由顾问确认，网站不自动扣款。</p>
        </div>
        <PlanGrid />
        <p className="mk-note">完整对照在<Link href="/pricing">价格页</Link>。</p>
      </section>

      <section className="mk-wrap mk-section mk-faq" style={{ paddingTop: 12 }}>
        <div className="mk-section-head">
          <p className="mk-kicker">常见问题</p>
          <h2>开店前会问的几件事</h2>
        </div>
        {faqs.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <section className="mk-wrap mk-closer">
        <div>
          <h2>先开一家店，或先看一次演示。</h2>
          <p>示例店铺随时可以点开，不用注册。</p>
        </div>
        <div className="mk-closer-actions">
          <Link href="/signup" className="mk-btn">免费开店</Link>
          <Link href="/demo" className="mk-btn mk-btn-light">申请演示</Link>
          <Link href="/s/demo" className="mk-btn mk-btn-ghost" style={{ color: "#f6f1e8", borderColor: "rgba(246,241,232,.3)" }}>示例店铺</Link>
        </div>
      </section>
    </main>
  );
}
