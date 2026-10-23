import type { Metadata } from "next";
import Link from "next/link";
import { PlanGrid } from "@/components/marketing/plan-grid";
import { comparison } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "价格",
  description: "印坊起步方案免费开店。专业 ¥399/月，工坊按店铺和陪跑范围报价。",
};

export default function PricingPage() {
  return (
    <main className="mk-wrap">
      <div className="mk-page-intro">
        <p className="mk-kicker">价格</p>
        <h1>先把店开起来。<br />需要人一起看，再选后面两档。</h1>
        <p className="mk-lead">三档都能用同一套店：在线设计、下单、生产图、工艺单。差别在于有没有人陪你把第一单跑通，以及要开几家店。</p>
      </div>
      <section className="mk-section">
        <PlanGrid />
        <p className="mk-note">专业和工坊确认合作后再签约、再付款。在这个网站提交申请不会扣款。想马上试用，直接<Link href="/signup">免费开店</Link>。</p>
      </section>
      <section className="mk-section" style={{ paddingTop: 0 }}>
        <div className="mk-section-head">
          <h2>对照</h2>
        </div>
        <div className="mk-table-wrap">
          <table className="mk-table">
            <thead>
              <tr>
                <th>项目</th>
                <th>起步</th>
                <th>专业</th>
                <th>工坊</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.start}</td>
                  <td>{row.pro}</td>
                  <td>{row.workshop}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mk-closer">
        <div>
          <h2>还不确定选哪档，就先约一次演示。</h2>
          <p>说一下你的底衫和大概单量，我们按你的店来看。</p>
        </div>
        <Link href="/demo" className="mk-btn">申请演示</Link>
      </section>
    </main>
  );
}
