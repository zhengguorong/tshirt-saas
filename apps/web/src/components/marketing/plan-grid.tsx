import Link from "next/link";
import { plans } from "@/lib/marketing";

export function PlanGrid() {
  return (
    <div className="mk-plans">
      {plans.map((plan) => (
        <article key={plan.id} className={plan.featured ? "mk-plan is-featured" : "mk-plan"}>
          {plan.featured ? <p className="mk-plan-flag">多数店从这里开始问</p> : <p className="mk-plan-flag is-empty" aria-hidden="true">占位</p>}
          <p className="mk-plan-audience">{plan.audience}</p>
          <h3>{plan.name}</h3>
          <p className="mk-price">
            {plan.price === "面议" ? <span className="mk-price-num">面议</span> : <><span className="mk-price-yen">¥</span><span className="mk-price-num">{plan.price}</span></>}
            {plan.period ? <span className="mk-price-period">{plan.period}</span> : null}
          </p>
          <p className="mk-plan-note">{plan.note}</p>
          <ul>
            {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
          <Link href={plan.href} className={plan.featured ? "mk-btn" : "mk-btn mk-btn-ink"}>{plan.cta}</Link>
        </article>
      ))}
    </div>
  );
}
