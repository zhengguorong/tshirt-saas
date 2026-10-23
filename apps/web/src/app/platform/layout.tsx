import { AntdRoot } from "@/components/admin/antd-root";

export default function PlatformRootLayout({ children }: { children: React.ReactNode }) {
  return <AntdRoot>{children}</AntdRoot>;
}
