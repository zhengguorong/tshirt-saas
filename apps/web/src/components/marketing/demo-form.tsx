"use client";

import Link from "next/link";
import { useActionState } from "react";
import { planChoices, roles, volumes, type PlanId } from "@/lib/marketing";
import { submitDemoRequest } from "@/server/demo";

export function DemoForm({ defaultPlan }: { defaultPlan: PlanId }) {
  const [state, action, pending] = useActionState(submitDemoRequest, null);

  if (state?.ok) {
    return (
      <div className="mk-form mk-success" role="status">
        <p className="mk-kicker">已收到</p>
        <h2>我们会用这个手机号联系你</h2>
        <p>约一个时间，用示例店或者你自己的底衫走一遍：顾客怎么设计，订单怎么变成生产图和工艺单。</p>
        <div className="mk-success-actions">
          <Link href="/s/demo" className="mk-btn">先看示例店铺</Link>
          <Link href="/signup" className="mk-btn mk-btn-ghost">也可以直接开店</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="mk-form" action={action}>
      <input className="mk-hp" name="fax" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label>
        姓名
        <input name="name" required minLength={2} maxLength={40} autoComplete="name" placeholder="怎么称呼你" />
      </label>
      <label>
        手机号
        <input name="phone" required inputMode="numeric" autoComplete="tel" pattern="1[0-9]{10}" maxLength={11} placeholder="11 位手机号" />
      </label>
      <label>
        店铺或公司
        <input name="company" required minLength={2} maxLength={80} placeholder="例如 北岛印社" />
      </label>
      <div className="mk-form-row">
        <label>
          你是
          <select name="role" required defaultValue="brand">
            {roles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label>
          大概单量
          <select name="volume" required defaultValue="preparing">
            {volumes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>
      <label>
        想看的方案
        <select name="plan" required defaultValue={defaultPlan}>
          {planChoices.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label>
        想先看什么
        <textarea name="note" maxLength={500} rows={4} placeholder="例如：想看双面印花，还有工艺单怎么打给车间。可以不填。" />
      </label>
      {state?.error ? <p className="mk-error" role="alert">{state.error}</p> : null}
      <button className="mk-btn" type="submit" disabled={pending}>{pending ? "提交中…" : "提交演示申请"}</button>
      <p className="mk-form-fine">提交后由人工联系，这个页面不扣款。</p>
    </form>
  );
}
