"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormOutlined, LogoutOutlined, ShopOutlined } from "@ant-design/icons";
import { Avatar, Button, Dropdown, Layout, Menu, Space } from "antd";

const { Header, Sider, Content } = Layout;

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ purpose: "platform" }),
    });
    window.location.href = "/platform/login";
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={220} theme="dark">
        <Link href="/platform" style={{ display: "flex", alignItems: "center", gap: 12, height: 64, padding: "0 20px", color: "#fff" }}>
          <span style={{ display: "grid", width: 32, height: 32, placeItems: "center", borderRadius: 8, background: "#1677ff", fontWeight: 600 }}>印</span>
          <span>
            <span style={{ display: "block", fontWeight: 600, lineHeight: 1.3 }}>印坊</span>
            <span style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.65)" }}>平台管理</span>
          </span>
        </Link>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname.startsWith("/platform/demos") ? "/platform/demos" : "/platform"]}
          items={[
            { key: "/platform", icon: <ShopOutlined />, label: <Link href="/platform">商家</Link> },
            { key: "/platform/demos", icon: <FormOutlined />, label: <Link href="/platform/demos">演示申请</Link> },
          ]}
          onClick={({ key }) => router.push(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 24px", background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
          <Dropdown
            menu={{
              items: [{ key: "logout", icon: <LogoutOutlined />, label: "退出登录", onClick: () => void logout() }],
            }}
          >
            <Button type="text">
              <Space>
                <Avatar style={{ background: "#1677ff" }}>平</Avatar>
                平台管理员
              </Space>
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ padding: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
