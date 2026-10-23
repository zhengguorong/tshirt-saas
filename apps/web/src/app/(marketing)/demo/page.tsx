import type { Metadata } from "next";
import { DemoForm } from "@/components/marketing/demo-form";
import { planChoices, type PlanId } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "申请演示",
  description: "留下联系方式，约一次印坊演示：上架底衫、顾客设计、下单，再到生产图和工艺单。",
};

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const query = await searchParams;
  const requested = query.plan ?? "unsure";
  const defaultPlan: PlanId = planChoices.some((item) => item.id === requested) ? (requested as PlanId) : "unsure";

  return (
    <main className="mk-wrap mk-demo">
      <div>
        <p className="mk-kicker">申请演示</p>
        <h1>约一次，按你的店走一遍。</h1>
        <p className="mk-lead">告诉我们你是谁、大概的单量、想看哪一档。演示不在这个页面扣款。</p>
        <ol>
          <li>打开一家店，看顾客怎么选底衫。</li>
          <li>在设计器里放一张印花，正面背面分开。</li>
          <li>走完下单和付款。</li>
          <li>在后台打开生产图和工艺单。</li>
        </ol>
      </div>
      <DemoForm defaultPlan={defaultPlan} />
    </main>
  );
}
