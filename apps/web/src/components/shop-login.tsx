"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import { OtpForm } from "@/components/otp-form";
import { Button } from "@/components/ui/button";

const LoginContext = createContext<{ openLogin: (next: string) => void } | null>(null);

export function useShopLogin() {
  const value = useContext(LoginContext);
  if (!value) throw new Error("登录需要放在店铺里");
  return value;
}

export function ShopLogin({ slug, devOtp, children }: { slug: string; devOtp: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState(`/s/${slug}`);
  const openLogin = useCallback((target: string) => {
    setNext(target);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  function finish() {
    const target = new URL(next, window.location.origin);
    const here = window.location.pathname + window.location.search;
    const there = target.pathname + target.search;
    const stay = there === here || (target.search === "" && target.pathname === window.location.pathname);
    setOpen(false);
    if (stay) router.refresh();
    else window.location.href = next;
  }

  return (
    <LoginContext.Provider value={{ openLogin }}>
      {children}
      {open ? <LoginDialog devOtp={devOtp} next={next} onClose={close} onDone={finish} /> : null}
    </LoginContext.Provider>
  );
}

export function LoginWall({ next, title }: { next: string; title: string }) {
  const { openLogin } = useShopLogin();
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    openLogin(next);
  }, [next, openLogin]);
  return (
    <div className="store-login-wall flex h-full flex-col items-center justify-center gap-3 px-8 text-center lg:mx-auto lg:my-16 lg:h-auto lg:min-h-80 lg:max-w-2xl lg:rounded-2xl lg:bg-white lg:py-12">
      <p className="text-base font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">验证手机号即可继续，不用设置密码。</p>
      <Button type="button" onClick={() => openLogin(next)}>登录</Button>
    </div>
  );
}

export function LoginButton({ next, children }: { next: string; children: React.ReactNode }) {
  const { openLogin } = useShopLogin();
  return <Button size="sm" type="button" onClick={() => openLogin(next)}>{children}</Button>;
}

export function GuardedLink({
  authed,
  href,
  className,
  children,
}: {
  authed: boolean;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { openLogin } = useShopLogin();
  if (authed) return <Link href={href} className={className}>{children}</Link>;
  return <button type="button" className={className} onClick={() => openLogin(href)}>{children}</button>;
}

function LoginDialog({
  next,
  devOtp,
  onClose,
  onDone,
}: {
  next: string;
  devOtp: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const focus = window.setTimeout(() => document.getElementById("shop-login-phone")?.focus(), 280);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focus);
    };
  }, [onClose]);

  return (
    <>
      <button type="button" aria-label="关闭" className="store-fade fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-login-title"
        className="store-login-dialog sheet-up fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[430px] flex-col gap-4 rounded-t-3xl bg-background px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-16px_40px_rgba(0,0,0,0.16)] lg:inset-y-1/2 lg:bottom-auto lg:max-w-md lg:-translate-y-1/2 lg:rounded-2xl lg:p-8 lg:shadow-[0_8px_28px_rgba(30,24,18,0.14)]"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-muted lg:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="shop-login-title" className="text-xl font-semibold tracking-tight">登录</h2>
            <p className="text-sm text-muted-foreground">验证手机号即可下单，不用设置密码。</p>
          </div>
          <button type="button" className="pressable flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground" aria-label="关闭" onClick={onClose}>
            <XIcon className="size-4" />
          </button>
        </div>
        <OtpForm purpose="consumer" next={next} devOtp={devOtp} onDone={onDone} />
      </section>
    </>
  );
}
