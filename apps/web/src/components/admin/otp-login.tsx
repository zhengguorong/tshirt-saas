"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Card, Form, Input, Space, Typography } from "antd";

export function OtpLogin({
  purpose,
  next,
  title,
  description,
  devOtp,
  signup,
}: {
  purpose: "staff" | "platform";
  next: string;
  title: string;
  description: string;
  devOtp: boolean;
  signup?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [sending, setSending] = useState(false);

  async function send(phone: string) {
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

  async function verify(values: { phone: string; code: string }) {
    setPending(true);
    setMessage("");
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: values.phone, purpose, code: values.code }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(data.error || "登录失败");
      setPending(false);
      return;
    }
    window.location.href = next;
  }

  return (
    <div style={{ display: "grid", minHeight: "100vh", placeItems: "center", background: "#f5f5f5", padding: 24 }}>
      <Card style={{ width: 400 }} styles={{ body: { padding: 32 } }}>
        <Space orientation="vertical" size={4} style={{ marginBottom: 24 }}>
          <Typography.Title level={3} style={{ margin: 0 }}>{title}</Typography.Title>
          <Typography.Text type="secondary">{description}</Typography.Text>
        </Space>
        <Form layout="vertical" requiredMark={false} initialValues={{ code: devOtp ? "000000" : "" }} onFinish={(values) => void verify(values)}>
          <Form.Item label="手机号" name="phone" rules={[{ required: true, pattern: /^1\d{10}$/, message: "请输入 11 位手机号" }]}>
            <Input size="large" inputMode="numeric" autoComplete="tel" placeholder="11 位手机号" />
          </Form.Item>
          <Form.Item label="验证码" required>
            <Space.Compact style={{ width: "100%" }}>
              <Form.Item name="code" noStyle rules={[{ required: true, message: "请输入验证码" }]}>
                <Input size="large" inputMode="numeric" autoComplete="one-time-code" />
              </Form.Item>
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => (
                  <Button size="large" loading={sending} onClick={() => void send(String(getFieldValue("phone") || ""))}>获取验证码</Button>
                )}
              </Form.Item>
            </Space.Compact>
          </Form.Item>
          {devOtp ? <Typography.Paragraph type="secondary">开发环境验证码固定为 000000。</Typography.Paragraph> : null}
          {message ? <Alert type={message.includes("已发送") ? "success" : "error"} title={message} style={{ marginBottom: 16 }} /> : null}
          <Button type="primary" htmlType="submit" size="large" block loading={pending}>登录</Button>
          {signup ? (
            <Typography.Paragraph style={{ margin: "16px 0 0" }}>
              还没有店？<Link href="/signup">免费开店</Link>
            </Typography.Paragraph>
          ) : null}
        </Form>
      </Card>
    </div>
  );
}
