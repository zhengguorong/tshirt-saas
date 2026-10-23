import { OtpLogin } from "@/components/admin/otp-login";
import { allowDevOtp } from "@/server/auth";

export default function PlatformLoginPage() {
  return (
    <OtpLogin
      purpose="platform"
      next="/platform"
      title="平台后台"
      description="开通和管理商家店铺。"
      devOtp={allowDevOtp()}
    />
  );
}