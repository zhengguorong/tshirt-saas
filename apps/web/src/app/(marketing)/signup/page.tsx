import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/signup-form";
import { allowDevOtp } from "@/server/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "免费开店" };

export default function SignupPage() {
  return (
    <main className="mk-signup">
      <Card className="w-full max-w-md bg-white">
        <CardHeader>
          <CardTitle>开通你的店</CardTitle>
          <CardDescription>
            注册后得到一间独立店铺和商家后台，系统会分配访问地址。
            <Link href="/pricing" className="mt-2 block text-foreground underline underline-offset-4">先看价格</Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm devOtp={allowDevOtp()} />
        </CardContent>
      </Card>
    </main>
  );
}
