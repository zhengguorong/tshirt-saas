"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ApartmentOutlined, ArrowUpOutlined, DownOutlined, FileTextOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, PictureOutlined, SettingOutlined, ShopOutlined, ShoppingOutlined, SkinOutlined } from "@ant-design/icons";
import { Avatar, Breadcrumb, Button, Drawer, Dropdown, Grid, Layout, Menu, Tooltip } from "antd";

const { Header, Sider, Content } = Layout;
function selectedKey(path: string) {
  return ["/admin/sheets", "/admin/products", "/admin/materials", "/admin/settings"].find(key => path.startsWith(key)) ?? "/admin";
}
function crumbs(path: string) {
  const key = selectedKey(path);
  const label = { "/admin": "订单管理", "/admin/sheets": "生产工艺单", "/admin/products": "商品管理", "/admin/materials": "印花素材", "/admin/settings": "店铺设置" }[key];
  if (path === "/admin/products/new") return [{ title: <Link href={key}>{label}</Link> }, { title: "新建底衫" }];
  if (path.startsWith("/admin/orders/")) return [{ title: <Link href="/admin">订单管理</Link> }, { title: "订单详情" }];
  if (path !== key && key !== "/admin") return [{ title: <Link href={key}>{label}</Link> }, { title: key === "/admin/products" ? "编辑底衫" : "工艺单详情" }];
  return [{ title: label }];
}
export function AdminShell({ tenantName, slug, owner, children }: { tenantName: string; slug: string; owner: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const mobile = screens.lg === false;
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ purpose: "staff" }) });
    window.location.href = "/admin/login";
  }
  const menuItems = [
    { key: "business", type: "group" as const, label: "经营管理", children: [
      { key: "/admin", icon: <ShoppingOutlined />, label: <Link href="/admin">订单管理</Link> },
      { key: "/admin/sheets", icon: <FileTextOutlined />, label: <Link href="/admin/sheets">生产工艺单</Link> },
    ] },
    { key: "catalog", type: "group" as const, label: "商品与素材", children: [
      { key: "/admin/products", icon: <SkinOutlined />, label: <Link href="/admin/products">商品管理</Link> },
      { key: "/admin/materials", icon: <PictureOutlined />, label: <Link href="/admin/materials">印花素材</Link> },
    ] },
    ...(owner ? [{ key: "shop", type: "group" as const, label: "店铺", children: [{ key: "/admin/settings", icon: <SettingOutlined />, label: <Link href="/admin/settings">店铺设置</Link> }] }] : []),
  ];
  const navigation = <Menu mode="inline" inlineCollapsed={!mobile && collapsed} selectedKeys={[selectedKey(pathname)]} items={menuItems} onClick={() => setDrawerOpen(false)} />;
  return (
    <Layout className="merchant-layout">
      <Sider className="merchant-sider" width={232} collapsedWidth={76} collapsed={collapsed} theme="light" trigger={null}>
        <Link href="/admin" className="merchant-brand"><span className="merchant-logo">印</span>{!collapsed && <span>印坊<small>商家工作台</small></span>}</Link>
        {!collapsed && <div className="merchant-shop"><Avatar shape="square" size={34} icon={<ShopOutlined />} /><div><strong title={tenantName}>{tenantName}</strong><span><i />店铺经营中</span></div></div>}
        <div className="merchant-menu">{navigation}</div>
        <div className="merchant-sider-footer">{!collapsed && <div className="merchant-help"><ApartmentOutlined /><strong>连接经营的每一步</strong><p>店铺、设计、订单与生产<br />在这里协同运转。</p><Link href={`/s/${slug}`} target="_blank">打开我的店铺 <ArrowUpOutlined /></Link></div>}<span>{collapsed ? "印坊" : "YINFANG · 商家管理系统"}</span></div>
      </Sider>
      <Drawer title="印坊 · 商家工作台" placement="left" size={250} open={mobile && drawerOpen} onClose={() => setDrawerOpen(false)} styles={{ body: { padding: "12px 0" } }}>{navigation}</Drawer>
      <Layout className="merchant-main">
        <Header className="merchant-header"><Tooltip title={mobile ? "打开导航" : collapsed ? "展开导航" : "收起导航"}><Button type="text" aria-label={mobile ? "打开导航" : collapsed ? "展开导航" : "收起导航"} icon={collapsed || mobile ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => mobile ? setDrawerOpen(true) : setCollapsed(!collapsed)} /></Tooltip><Breadcrumb items={[{ title: <span className="merchant-breadcrumb-home">工作台</span> }, ...crumbs(pathname)]} /><div className="merchant-header-actions"><Button className="merchant-visit" href={`/s/${slug}`} target="_blank" icon={<ShopOutlined />}>查看店铺 <ArrowUpOutlined rotate={45} /></Button><span className="merchant-header-divider" /><Dropdown trigger={["click"]} menu={{ items: [{ key: "shop", icon: <ShopOutlined />, label: <a href={`/s/${slug}`} target="_blank" rel="noreferrer">查看店铺</a> }, { type: "divider" }, { key: "logout", icon: <LogoutOutlined />, label: "退出登录", onClick: () => void logout() }] }}><Button type="text" className="merchant-user" aria-label="账号菜单"><Avatar size={30}>{tenantName.slice(0, 1)}</Avatar><span>{owner ? "店主" : "店员"}</span><DownOutlined /></Button></Dropdown></div></Header>
        <Content className="merchant-content"><main>{children}</main><footer className="merchant-content-footer">印坊 · 让定制生意，更有条理。</footer></Content>
      </Layout>
    </Layout>
  );
}
