"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@tshirt/db";
import { planChoices, roles, volumes } from "@/lib/marketing";

export type DemoState = { error?: string; ok?: boolean } | null;

function pick(value: string, allowed: readonly { id: string }[]) {
  return allowed.some((item) => item.id === value) ? value : "";
}

export async function submitDemoRequest(_prev: DemoState, formData: FormData): Promise<DemoState> {
  try {
    if (String(formData.get("fax") || "").trim()) return { ok: true };

    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const company = String(formData.get("company") || "").trim();
    const role = pick(String(formData.get("role") || ""), roles);
    const volume = pick(String(formData.get("volume") || ""), volumes);
    const plan = pick(String(formData.get("plan") || ""), planChoices);
    const note = String(formData.get("note") || "").trim().slice(0, 500);

    if (name.length < 2 || name.length > 40) throw new Error("请填写姓名，2 到 40 个字");
    if (!/^1\d{10}$/.test(phone)) throw new Error("请输入 11 位手机号");
    if (company.length < 2 || company.length > 80) throw new Error("请填写店铺或公司，2 到 80 个字");
    if (!role) throw new Error("请选择你的身份");
    if (!volume) throw new Error("请选择大概的单量");
    if (!plan) throw new Error("请选择想看的方案");

    const since = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await prisma.demoRequest.findFirst({
      where: { phone, createdAt: { gt: since } },
      select: { id: true },
    });
    if (recent) throw new Error("这个手机号一小时内已经提交过，我们会联系你");

    await prisma.demoRequest.create({ data: { name, phone, company, role, volume, plan, note } });
    revalidatePath("/platform/demos");
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "提交失败，请稍后再试" };
  }
}
