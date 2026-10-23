"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/#product", label: "产品" },
  { href: "/pricing", label: "价格" },
  { href: "/demo", label: "申请演示" },
  { href: "/s/demo", label: "示例店铺" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className={open ? "mk-header is-open" : "mk-header"}>
      <div className="mk-header-bar">
        <Link href="/" className="mk-brand">
          <span className="mk-mark" aria-hidden="true">印</span>
          印坊
        </Link>
        <nav className="mk-nav" aria-label="官网">
          {links.map((link) => (
            <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mk-header-cta">
          <Link href="/admin/login" className="mk-login">商家登录</Link>
          <Link href="/signup" className="mk-btn">免费开店</Link>
          <button type="button" className="mk-burger" aria-expanded={open} aria-label={open ? "关闭菜单" : "打开菜单"} onClick={() => setOpen((value) => !value)}>
            <span />
            <span />
          </button>
        </div>
      </div>
      <div className="mk-drawer">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>{link.label}</Link>
        ))}
        <Link href="/admin/login">商家登录</Link>
      </div>
    </header>
  );
}
