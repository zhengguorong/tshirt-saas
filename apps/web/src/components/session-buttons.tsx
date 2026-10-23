"use client";

import { useState } from "react";
import { LogOutIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function PayButton({ orderId }: { orderId: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function pay() {
    setPending(true);
    const response = await fetch(`/api/orders/${orderId}/pay`, { method: "POST" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "支付失败");
      setPending(false);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" disabled={pending} onClick={() => void pay()}>{pending ? "支付中" : "模拟支付"}</Button>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
    </div>
  );
}

export function LogoutButton({ purpose, redirectTo }: { purpose: "consumer" | "staff" | "platform"; redirectTo?: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={() => {
        void fetch("/api/auth/logout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ purpose }) }).then(() => {
          window.location.href = redirectTo || (purpose === "staff" ? "/admin/login" : purpose === "platform" ? "/platform/login" : "/");
        });
      }}
    >
      <LogOutIcon data-icon="inline-start" />
      退出
    </Button>
  );
}
