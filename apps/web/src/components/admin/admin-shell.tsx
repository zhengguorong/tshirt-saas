"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { FileTextOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, PictureOutlined, SettingOutlined, ShoppingOutlined, SkinOutlined } from "@ant-design/icons";
import { Avatar, Breadcrumb, Button, Dropdown, Layout, Menu, Space, Typography } from "antd";

const { Header, Sider, Content } = Layout;

function selectedKey(pathname: string) {
  if (pathname.startsWith("/admin/sheets")) return "/admin/sheets";
  if (pathname.startsWith("/admin/products")) return "/admin/products";
  if (pathname.startsWith("/admin/materials")) return "/admin/materials";
  if (pathname.startsWith("/admin/settings")) return "/admin/settings";
  return "/admin";
}

function crumbs(pathname: string) {
  if (pathname.startsWith("/admin/products/new")) {
    return [{ title: <Link href="/admin/products">底衫</Link> }, { title: "新建底衫" }];
  }
  if (pathname.startsWith("/admin/products/")) {
    return [{ title: <Link href="/admin/products">底衫</Link> }, { title: "编辑底衫" }];
  }
  if (pathname.startsWith("/admin/products")) return [{ title: "底衫" }];
  if (pathname.startsWith("/admin/orders/")) {
    return [{ title: <Link href="/admin">订单</Link> }, { title: "订单详情" }];
  }
  if (/^\/admin\/sheets\/[^/]+$/.test(pathname)) {
    return [{ title: <Link href="/admin/sheets">工艺单</Link> }, { title: "工艺单详情" }];
  }
  if (pathname.startsWith("/admin/sheets")) return [{ title: "工艺单" }];
  if (pathname.startsWith("/admin/materials")) return [{ title: "印花素材" }];
  if (pathname.startsWith("/admin/settings")) return [{ title: "店铺设置" }];
  return [{ title: "订单" }];
}

export function AdminShell({
  tenantName,
  slug,
  owner,
  children,
}: {
  tenantName: string;
  slug: string;
  owner: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ purpose: "staff" }),
    });
    window.location.href = "/admin/login";
  }

  const items = [
    { key: "/admin", icon: <ShoppingOutlined />, label: <Link href="/admin">订单</Link> },
    { key: "/admin/sheets", icon: <FileTextOutlined />, label: <Link href="/admin/sheets">工艺单</Link> },
    { key: "/admin/products", icon: <SkinOutlined />, label: <Link href="/admin/products">底衫</Link> },
    { key: "/admin/materials", icon: <PictureOutlined />, label: <Link href="/admin/materials">印花素材</Link> },
    ...(owner ? [{ key: "/admin/settings", icon: <SettingOutlined />, label: <Link href="/admin/settings">店铺设置</Link> }] : []),
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={220} theme="dark" collapsible collapsed={collapsed} trigger={null}>
        <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 12, height: 64, padding: "0 20px", color: "#fff" }}>
          <span style={{ display: "grid", width: 32, height: 32, placeItems: "center", borderRadius: 8, background: "#1677ff", fontWeight: 600 }}>印</span>
          {collapsed ? null : (
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 600, lineHeight: 1.3 }}>印坊</span>
              <Typography.Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }} ellipsis>{tenantName}</Typography.Text>
            </span>
          )}
        </Link>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey(pathname)]}
          items={items}
          onClick={({ key }) => router.push(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 24px", background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((value) => !value)}
          />
          <Breadcrumb items={crumbs(pathname)} style={{ flex: 1 }} />
          <Dropdown
            menu={{
              items: [
                { key: "shop", label: <a href={`/s/${slug}`} target="_blank" rel="noreferrer">查看店铺</a> },
                { type: "divider" },
                { key: "logout", icon: <LogoutOutlined />, label: "退出登录", onClick: () => void logout() },
              ],
            }}
          >
            <Space style={{ cursor: "pointer" }}>
              <Avatar style={{ background: "#1677ff" }}>{tenantName.slice(0, 1)}</Avatar>
              <span>{owner ? "店主" : "店员"}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ padding: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
