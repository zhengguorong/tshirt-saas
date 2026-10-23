const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "assets",
  "favicon",
  "login",
  "platform",
  "s",
  "signup",
  "static",
  "www",
]);

export function assertShopSlug(raw: string) {
  const slug = raw.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/.test(slug) || slug.length < 3) {
    throw new Error("访问地址用 3-32 位小写字母、数字或横线，且不能以横线开头或结尾");
  }
  if (RESERVED_SLUGS.has(slug)) throw new Error("这个访问地址不可用");
  return slug;
}

export function normalizeDomain(raw: string) {
  const value = raw.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0]?.split(":")[0] ?? "";
  if (!value) return null;
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(value)) {
    throw new Error("请填写完整域名，例如 shop.example.com");
  }
  if (value === "localhost" || value.endsWith(".localhost")) throw new Error("不能绑定本机地址");
  return value;
}
