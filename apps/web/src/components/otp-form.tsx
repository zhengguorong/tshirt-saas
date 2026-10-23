"use client";

import { useState } from "react";
import type { SessionKind } from "@/server/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function OtpForm({ purpose, next, devOtp, onDone }: { purpose: SessionKind; next: string; devOtp: boolean; onDone?: () => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(devOtp ? "000000" : "");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [sending, setSending] = useState(false);

  async function send() {
    setMessage("");
    setSending(true);
    const response = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, purpose }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setMessage(data.error || data.message || "验证码已发送");
    setSending(false);
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, purpose, code }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(data.error || "登录失败");
      setPending(false);
      return;
    }
    if (onDone) onDone();
    else window.location.href = next;
  }

  return (
    <form onSubmit={verify}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="shop-login-phone">手机号</FieldLabel>
          <Input id="shop-login-phone" className="h-11" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="numeric" autoComplete="tel" placeholder="11 位手机号" />
        </Field>
        <Field>
          <FieldLabel htmlFor="shop-login-code">验证码</FieldLabel>
          <div className="flex gap-2">
            <Input id="shop-login-code" className="h-11" value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="6 位验证码" />
            <Button type="button" variant="outline" className="h-11 shrink-0" disabled={sending} onClick={() => void send()}>{sending ? "发送中" : "获取验证码"}</Button>
          </div>
          {devOtp ? <FieldDescription>开发环境验证码固定为 000000。</FieldDescription> : null}
        </Field>
        {message ? <Alert><AlertDescription>{message}</AlertDescription></Alert> : null}
        <Button type="submit" className="pressable h-11 w-full" disabled={pending}>{pending ? "登录中" : "登录"}</Button>
      </FieldGroup>
    </form>
  );
}
