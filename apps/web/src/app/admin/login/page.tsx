import { OtpLogin } from "@/components/admin/otp-login";
import { allowDevOtp } from "@/server/auth";

export default function AdminLoginPage() {
  return (
    <OtpLogin
      purpose="staff"
      next="/admin"
      title="商家后台"
      description="使用店主或店员手机号登录。"
      devOtp={allowDevOtp()}
      signup
    />
  );
}
