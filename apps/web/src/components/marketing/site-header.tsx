"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

const links = [
  { href: "/#product", label: "产品功能", dropdown: true },
  { href: "/#audience", label: "适用场景", dropdown: true },
  { href: "/pricing", label: "价格方案", dropdown: false },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className={open ? "mk-header is-open" : "mk-header"}>
      <a href="#main-content" className="yf-skip-link">跳转到主要内容</a>
      <div className="mk-header-bar">
        <Link href="/" className="mk-brand">
          <span className="mk-mark" aria-hidden="true">印</span>
          印坊 <small>YINFANG</small>
        </Link>
        <nav className="mk-nav" aria-label="官网">
          {links.map((link) => (
            <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>
              {link.label}{link.dropdown && <ChevronDown aria-hidden="true" />}
            </Link>
          ))}
        </nav>
        <div className="mk-header-cta">
          <Link href="/admin/login" className="mk-login">商家登录</Link>
          <Link href="/signup" className="mk-btn">免费开店</Link>
          <button type="button" className="mk-burger" aria-expanded={open} aria-label={open ? "关闭菜单" : "打开菜单"} aria-controls="marketing-menu" onClick={() => setOpen((value) => !value)}>
            <span />
            <span />
          </button>
        </div>
      </div>
      <div className="mk-drawer" id="marketing-menu" onClick={() => setOpen(false)}>
        {links.map((link) => (
          <Link key={link.href} href={link.href}>{link.label}</Link>
        ))}
        <Link href="/admin/login">商家登录</Link>
      </div>
    </header>
  );
}
