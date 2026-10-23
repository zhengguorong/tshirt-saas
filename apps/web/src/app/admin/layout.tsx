import { AntdRoot } from "@/components/admin/antd-root";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AntdRoot>{children}</AntdRoot>;
}
