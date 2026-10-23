import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@tshirt/db";

const APP_HOSTS = new Set(["localhost", "127.0.0.1"]);

export async function proxy(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0]?.toLowerCase() ?? "";
  const configured = (process.env.APP_HOST || "").toLowerCase();
  if (!host || APP_HOSTS.has(host) || host.endsWith(".local") || (configured && host === configured)) {
    return NextResponse.next();
  }

  const path = request.nextUrl.pathname;
  if (
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path.startsWith("/admin") ||
    path.startsWith("/platform") ||
    path.startsWith("/signup")
  ) {
    return NextResponse.next();
  }

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { customDomain: host, status: "ACTIVE" },
      select: { slug: true },
    });
    if (!tenant) return NextResponse.next();
    if (path === `/s/${tenant.slug}` || path.startsWith(`/s/${tenant.slug}/`)) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = path === "/" ? `/s/${tenant.slug}` : `/s/${tenant.slug}${path}`;
    return NextResponse.rewrite(url);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico)$).*)"],
};
