import { NextResponse } from "next/server";
import { verifyOtp, type SessionKind } from "@/server/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string; purpose?: SessionKind; code?: string };
    if (body.purpose !== "consumer" && body.purpose !== "staff" && body.purpose !== "platform") {
      return NextResponse.json({ error: "登录类型无效" }, { status: 400 });
    }
    await verifyOtp(body.phone || "", body.purpose, body.code || "");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "登录失败" }, { status: 400 });
  }
}
