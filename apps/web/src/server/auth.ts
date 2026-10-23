import { createHash, randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma, type StaffRole } from "@tshirt/db";

export type SessionKind = "consumer" | "staff" | "platform";

const cookieNames: Record<SessionKind, string> = {
  consumer: "consumer_session",
  staff: "staff_session",
  platform: "platform_session",
};

const maxAge: Record<SessionKind, number> = {
  consumer: 60 * 60 * 24 * 30,
  staff: 60 * 60 * 24 * 7,
  platform: 60 * 60 * 12,
};

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) throw new Error("SESSION_SECRET 未配置");
  return new TextEncoder().encode(value);
}

export function allowDevOtp() {
  return process.env.ALLOW_DEV_OTP === "true";
}

export function assertPhone(phone: string) {
  if (!/^1\d{10}$/.test(phone)) throw new Error("请输入 11 位手机号");
}

async function writeCookie(kind: SessionKind, payload: Record<string, string>) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge[kind]}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(cookieNames[kind], token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAge[kind],
    secure: process.env.NODE_ENV === "production",
  });
}

async function readPayload(kind: SessionKind) {
  const token = (await cookies()).get(cookieNames[kind])?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

export async function clearSession(kind: SessionKind) {
  (await cookies()).delete(cookieNames[kind]);
}

export async function getConsumer() {
  const payload = await readPayload("consumer");
  if (typeof payload?.consumerId !== "string") return null;
  return prisma.consumer.findUnique({ where: { id: payload.consumerId } });
}

export async function getStaff() {
  const payload = await readPayload("staff");
  if (typeof payload?.staffId !== "string") return null;
  const staff = await prisma.staff.findUnique({ where: { id: payload.staffId }, include: { tenant: true } });
  if (!staff || staff.status !== "ACTIVE") return null;
  return staff;
}

export async function getPlatformAdmin() {
  const payload = await readPayload("platform");
  if (typeof payload?.adminId !== "string") return null;
  return prisma.platformAdmin.findUnique({ where: { id: payload.adminId } });
}

export async function sendOtp(phone: string, purpose: SessionKind) {
  assertPhone(phone);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const sent = await prisma.verificationCode.count({ where: { phone, purpose, createdAt: { gt: hourAgo } } });
  if (!allowDevOtp() && sent >= 5) throw new Error("发送次数过多，请一小时后再试");
  const code = String(randomInt(100000, 1000000));
  const codeHash = createHash("sha256").update(`${code}:${process.env.SESSION_SECRET}`).digest("hex");
  await prisma.verificationCode.create({
    data: { phone, purpose, codeHash, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
  });
  if (process.env.NODE_ENV !== "production") console.log("otp", purpose, phone, allowDevOtp() ? "000000" : code);
}

async function assertOtp(phone: string, purpose: SessionKind, code: string) {
  if (allowDevOtp() && code === "000000") return;
  const codeHash = createHash("sha256").update(`${code}:${process.env.SESSION_SECRET}`).digest("hex");
  const row = await prisma.verificationCode.findFirst({
    where: { phone, purpose, codeHash, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!row) throw new Error("验证码错误或已过期");
}

export async function verifyOtp(phone: string, purpose: SessionKind, code: string) {
  assertPhone(phone);
  await assertOtp(phone, purpose, code);

  if (purpose === "consumer") {
    const consumer = await prisma.consumer.upsert({ where: { phone }, update: {}, create: { phone } });
    await writeCookie("consumer", { kind: "consumer", consumerId: consumer.id });
    return;
  }
  if (purpose === "platform") {
    const admin = await prisma.platformAdmin.findUnique({ where: { phone } });
    if (!admin) throw new Error("没有这个平台账号");
    await writeCookie("platform", { kind: "platform", adminId: admin.id });
    return;
  }
  const matches = await prisma.staff.findMany({ where: { phone, status: "ACTIVE" } });
  if (matches.length === 0) throw new Error("没有这个商家账号");
  if (matches.length > 1) throw new Error("这个手机号属于多家店，请联系平台处理");
  const staff = matches[0];
  await writeCookie("staff", { kind: "staff", staffId: staff.id, tenantId: staff.tenantId, role: staff.role });
}

export function isOwner(role: StaffRole) {
  return role === "OWNER";
}
