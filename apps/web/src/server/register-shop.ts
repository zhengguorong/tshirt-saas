// Kept out of auth.ts. That module is imported by server actions, and a new export there
// is dropped from the route bundle.
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { prisma } from "@tshirt/db";
import { allowDevOtp, assertPhone } from "./auth";
import { assertShopSlug } from "./tenant";

async function assertStaffOtp(phone: string, code: string) {
  if (allowDevOtp() && code === "000000") return;
  const codeHash = createHash("sha256").update(`${code}:${process.env.SESSION_SECRET}`).digest("hex");
  const row = await prisma.verificationCode.findFirst({
    where: { phone, purpose: "staff", codeHash, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!row) throw new Error("验证码错误或已过期");
}

async function signInStaff(staff: { id: string; tenantId: string; role: string }) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("SESSION_SECRET 未配置");
  const maxAge = 60 * 60 * 24 * 7;
  const token = await new SignJWT({ kind: "staff", staffId: staff.id, tenantId: staff.tenantId, role: staff.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(new TextEncoder().encode(secret));
  const jar = await cookies();
  jar.set("staff_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function registerShop(input: { phone: string; code: string; name: string; owner: string; slug: string }) {
  assertPhone(input.phone);
  await assertStaffOtp(input.phone, input.code);
  const slug = assertShopSlug(input.slug);
  const name = input.name.trim();
  const owner = input.owner.trim();
  if (!name || name.length > 40) throw new Error("请填写 40 字以内的店铺名");
  if (!owner || owner.length > 20) throw new Error("请填写 20 字以内的姓名");
  const existing = await prisma.staff.findFirst({ where: { phone: input.phone } });
  if (existing) throw new Error("这个手机号已经开过店，请直接登录");
  const taken = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
  if (taken) throw new Error("这个访问地址已被使用");
  const tenant = await prisma.tenant.create({
    data: { slug, name, staff: { create: { phone: input.phone, name: owner, role: "OWNER" } } },
    include: { staff: true },
  });
  const staff = tenant.staff[0];
  if (!staff) throw new Error("开店失败");
  await signInStaff(staff);
  return { slug: tenant.slug };
}
