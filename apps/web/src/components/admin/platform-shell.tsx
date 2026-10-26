"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FormOutlined, LogoutOutlined, MenuUnfoldOutlined, ShopOutlined } from "@ant-design/icons";
import { Avatar, Button, Drawer, Dropdown, Grid, Layout, Menu, Space } from "antd";

const { Header, Sider, Content } = Layout;

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const mobile = screens.lg === false;
  const navigation = (theme: "light" | "dark") => (
    <Menu theme={theme} mode="inline" selectedKeys={[pathname.startsWith("/platform/demos") ? "/platform/demos" : "/platform"]}
      items={[
        { key: "/platform", icon: <ShopOutlined />, label: <Link href="/platform">商家</Link> },
        { key: "/platform/demos", icon: <FormOutlined />, label: <Link href="/platform/demos">演示申请</Link> },
      ]}
      onClick={() => setDrawerOpen(false)}
    />
  );

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ purpose: "platform" }),
    });
    window.location.href = "/platform/login";
  }

  return (
    <Layout className="platform-layout">
      <Sider className="platform-sider" width={220} theme="dark">
        <Link href="/platform" style={{ display: "flex", alignItems: "center", gap: 12, height: 64, padding: "0 20px", color: "#fff" }}>
          <span style={{ display: "grid", width: 32, height: 32, placeItems: "center", borderRadius: 8, background: "#1677ff", fontWeight: 600 }}>印</span>
          <span>
            <span style={{ display: "block", fontWeight: 600, lineHeight: 1.3 }}>印坊</span>
            <span style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.65)" }}>平台管理</span>
          </span>
        </Link>
        {navigation("dark")}
      </Sider>
      <Drawer title="印坊 · 平台管理" placement="left" size={250} open={mobile && drawerOpen} onClose={() => setDrawerOpen(false)} styles={{ body: { padding: "12px 0" } }}>
        {navigation("light")}
      </Drawer>
      <Layout className="platform-main">
        <Header className="platform-header">
          {mobile && <Button type="text" aria-label="打开平台导航" icon={<MenuUnfoldOutlined />} onClick={() => setDrawerOpen(true)} />}
          <span className="platform-page-title">{pathname.startsWith("/platform/demos") ? "演示申请" : "商家管理"}</span>
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [{ key: "logout", icon: <LogoutOutlined />, label: "退出登录", onClick: () => void logout() }],
            }}
          >
            <Button type="text" aria-label="平台账号菜单" className="platform-user">
              <Space>
                <Avatar style={{ background: "#1677ff" }}>平</Avatar>
                <span className="platform-user-label">平台管理员</span>
              </Space>
            </Button>
          </Dropdown>
        </Header>
        <Content className="platform-content">{children}</Content>
      </Layout>
    </Layout>
  );
}
