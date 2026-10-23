import { LoginWall } from "@/components/shop-login";

export default async function LoginPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ next?: string }> }) {
  const { slug } = await params;
  const query = await searchParams;
  const next = query.next && query.next.startsWith(`/s/${slug}`) ? query.next : `/s/${slug}`;
  return <LoginWall next={next} title="登录后即可结算" />;
}
