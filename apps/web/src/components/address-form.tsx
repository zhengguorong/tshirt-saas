"use client";

import { useActionState } from "react";
import { deleteAddress, saveAddress } from "@/server/actions";
import { RegionField } from "@/components/region-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function AddressForm({
  slug,
  next,
  address,
  preferDefault,
}: {
  slug: string;
  next: string;
  preferDefault: boolean;
  address: { id: string; name: string; phone: string; province: string; city: string; district: string; detail: string; isDefault: boolean } | null;
}) {
  const [state, action, pending] = useActionState(saveAddress, null);
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <form action={action} className="flex min-h-0 flex-1 flex-col">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="id" value={address?.id ?? ""} />
        <div className="flex flex-col px-4">
          <label className="flex min-h-12 items-center gap-3 border-b text-sm">
            <span className="w-28 shrink-0">收货姓名</span>
            <input name="name" defaultValue={address?.name ?? ""} maxLength={25} placeholder="请输入收货姓名" className="min-w-0 flex-1 bg-transparent text-right outline-none placeholder:text-muted-foreground" />
          </label>
          <label className="flex min-h-12 items-center gap-3 border-b text-sm">
            <span className="w-28 shrink-0">联系方式</span>
            <input name="phone" defaultValue={address?.phone ?? ""} inputMode="numeric" maxLength={11} placeholder="请输入联系方式" className="min-w-0 flex-1 bg-transparent text-right outline-none placeholder:text-muted-foreground" />
          </label>
          <RegionField province={address?.province ?? ""} city={address?.city ?? ""} district={address?.district ?? ""} />
          <label className="flex items-start gap-3 border-b py-3 text-sm">
            <span className="w-28 shrink-0 pt-1">详细地址</span>
            <textarea name="detail" defaultValue={address?.detail ?? ""} maxLength={50} rows={3} placeholder="请输入详细地址" className="min-h-16 min-w-0 flex-1 resize-none bg-transparent text-right outline-none placeholder:text-muted-foreground" />
          </label>
          <label className="flex min-h-12 items-center justify-between gap-3 text-sm">
            <span>是否设为默认地址</span>
            <Switch name="isDefault" defaultChecked={address ? address.isDefault : preferDefault} />
          </label>
        </div>
        {state?.error ? <div className="px-4"><Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert></div> : null}
        <div className="mt-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button type="submit" className="w-full" size="lg" disabled={pending}>{pending ? "保存中" : "保存"}</Button>
        </div>
      </form>
      {address ? (
        <form action={deleteAddress} className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="id" value={address.id} />
          <Button type="submit" variant="outline" className="w-full">删除</Button>
        </form>
      ) : null}
    </div>
  );
}
