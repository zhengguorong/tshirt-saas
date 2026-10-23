export const roles = [
  { id: "brand", label: "品牌" },
  { id: "studio", label: "设计工作室" },
  { id: "factory", label: "印花工厂" },
  { id: "other", label: "其他" },
] as const;

export const volumes = [
  { id: "preparing", label: "还在筹备" },
  { id: "small", label: "每月 100 单以内" },
  { id: "mid", label: "每月 100–1000 单" },
  { id: "large", label: "每月 1000 单以上" },
] as const;

export const planChoices = [
  { id: "start", label: "起步" },
  { id: "pro", label: "专业" },
  { id: "workshop", label: "工坊" },
  { id: "unsure", label: "还没定" },
] as const;

export type PlanId = (typeof planChoices)[number]["id"];

export function labelOf(list: readonly { id: string; label: string }[], id: string) {
  return list.find((item) => item.id === id)?.label ?? id;
}

export const plans = [
  {
    id: "start" as const,
    name: "起步",
    price: "0",
    period: "免费开店",
    note: "自己注册，马上拿到店铺地址。",
    audience: "先把第一家店开起来",
    features: [
      "1 家店铺，系统分配访问地址",
      "底衫、颜色、尺码、印区和售价",
      "顾客在线设计，正面背面分开",
      "印花素材库",
      "订单、生产图、可打印工艺单",
      "固定运费或满额包邮",
    ],
    cta: "免费开店",
    href: "/signup",
    featured: false,
  },
  {
    id: "pro" as const,
    name: "专业",
    price: "399",
    period: "/ 月",
    note: "年付 ¥3,990，按 10 个月计。",
    audience: "店已经有顾客，想有人帮你对一遍",
    features: [
      "起步方案里的全部能力",
      "一次远程演示，用你的底衫走通一单",
      "协助核对印区、运费和独立域名",
      "上线后工作日回复",
      "按你的店铺整理一份开店清单",
    ],
    cta: "申请这个方案",
    href: "/demo?plan=pro",
    featured: true,
  },
  {
    id: "workshop" as const,
    name: "工坊",
    price: "面议",
    period: "",
    note: "按店铺数量和陪跑范围报价。",
    audience: "工厂、多品牌，需要一起把流程跑顺",
    features: [
      "多家店铺，开通和停用由平台协助",
      "上线陪跑：底衫、印区、素材、试单",
      "生产和发货流程对着车间过一遍",
      "按单量和店铺数报价",
      "专人对接",
    ],
    cta: "约一次演示",
    href: "/demo?plan=workshop",
    featured: false,
  },
];

export const comparison = [
  { name: "店铺数量", start: "1 家", pro: "1 家", workshop: "多家" },
  { name: "开通方式", start: "自己注册", pro: "自己注册，顾问协助配置", workshop: "顾问开通" },
  { name: "在线设计、下单、生产图、工艺单", start: "包含", pro: "包含", workshop: "包含" },
  { name: "独立域名", start: "可自行填写", pro: "协助绑定", workshop: "协助绑定" },
  { name: "运费规则", start: "固定运费或满额包邮", pro: "一起核对", workshop: "一起核对" },
  { name: "上线陪跑", start: "示例店铺和后台", pro: "一次远程演示", workshop: "底衫、印区、试单一起做" },
  { name: "售后", start: "自行查阅", pro: "工作日回复", workshop: "专人对接" },
  { name: "费用", start: "¥0", pro: "¥399 / 月，或 ¥3,990 / 年", workshop: "面议" },
];
