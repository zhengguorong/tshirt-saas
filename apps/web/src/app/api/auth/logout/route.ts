import { NextResponse } from "next/server";
import { clearSession, type SessionKind } from "@/server/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { purpose?: SessionKind };
  const purpose = body.purpose === "staff" || body.purpose === "platform" ? body.purpose : "consumer";
  await clearSession(purpose);
  return NextResponse.json({ ok: true });
}
