import { NextResponse } from "next/server";
import { sendOtp, type SessionKind } from "@/server/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string; purpose?: SessionKind };
    if (body.purpose !== "consumer" && body.purpose !== "staff" && body.purpose !== "platform") {
      return NextResponse.json({ error: "登录类型无效" }, { status: 400 });
    }
    await sendOtp(body.phone || "", body.purpose);
    return NextResponse.json({ message: "验证码已发送" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "发送失败" }, { status: 400 });
  }
}
