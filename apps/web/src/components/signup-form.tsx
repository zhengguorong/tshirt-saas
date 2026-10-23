"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SignupForm({ devOtp }: { devOtp: boolean }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [owner, setOwner] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(devOtp ? "000000" : "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function send() {
    setMessage("");
    setError("");
    const response = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, purpose: "staff" }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) setError(data.error || "验证码发送失败");
    else setMessage(data.message || "验证码已发送");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, code, name, owner, slug }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "开店失败");
      setPending(false);
      return;
    }
    window.location.href = "/admin/settings";
  }

  return (
    <form onSubmit={submit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="shop-name">店铺名称</FieldLabel>
          <Input id="shop-name" value={name} onChange={(event) => setName(event.target.value)} required placeholder="例如 南风印社" />
        </Field>
        <Field>
          <FieldLabel htmlFor="shop-slug">访问地址</FieldLabel>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm text-muted-foreground">/s/</span>
            <Input
              id="shop-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value.toLowerCase())}
              required
              placeholder="nanfeng"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          <FieldDescription>3 到 32 位小写字母、数字或横线。创建后不能修改。</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="owner">你的姓名</FieldLabel>
          <Input id="owner" value={owner} onChange={(event) => setOwner(event.target.value)} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="phone">手机号</FieldLabel>
          <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="numeric" autoComplete="tel" placeholder="11 位手机号" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="code">验证码</FieldLabel>
          <div className="flex gap-2">
            <Input id="code" value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" required />
            <Button type="button" variant="outline" onClick={() => void send()}>获取验证码</Button>
          </div>
          {devOtp ? <FieldDescription>开发环境验证码固定为 000000。</FieldDescription> : null}
        </Field>
        {message ? (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" disabled={pending}>{pending ? "开通中" : "开通我的店"}</Button>
        <p className="text-sm text-muted-foreground">
          已经有店？<Link href="/admin/login" className="text-foreground underline underline-offset-4">登录商家后台</Link>
        </p>
      </FieldGroup>
    </form>
  );
}
