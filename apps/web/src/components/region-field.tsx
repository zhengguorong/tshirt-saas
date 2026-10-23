"use client";

import { useMemo, useState } from "react";
import { ChevronRightIcon } from "lucide-react";
import regions from "@/data/regions.json";

const tree = regions as Record<string, Record<string, string[]>>;
const provinces = Object.keys(tree);

export function RegionField({
  province,
  city,
  district,
}: {
  province: string;
  city: string;
  district: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState({ province, city, district });
  const [step, setStep] = useState(0);
  const label = [value.province, value.city === "市辖区" ? "" : value.city, value.district].filter(Boolean).join("");
  const options = useMemo(() => {
    if (step === 0) return provinces;
    if (step === 1) return Object.keys(tree[value.province] ?? {});
    return tree[value.province]?.[value.city] ?? [];
  }, [step, value.city, value.province]);

  function choose(name: string) {
    if (step === 0) {
      setValue({ province: name, city: "", district: "" });
      setStep(1);
      return;
    }
    if (step === 1) {
      setValue({ province: value.province, city: name, district: "" });
      setStep(2);
      return;
    }
    setValue({ province: value.province, city: value.city, district: name });
    setOpen(false);
  }

  return (
    <div className="border-b">
      <button type="button" className="flex min-h-12 w-full items-center gap-3 py-3 text-left text-sm" onClick={() => { setStep(value.province ? (value.city ? 2 : 1) : 0); setOpen(true); }}>
        <span className="w-28 shrink-0">所在地区</span>
        <span className={label ? "min-w-0 flex-1 text-right" : "min-w-0 flex-1 text-right text-muted-foreground"}>{label || "请选择所在地区"}</span>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>
      <input type="hidden" name="province" value={value.province} />
      <input type="hidden" name="city" value={value.city} />
      <input type="hidden" name="district" value={value.district} />
      {open ? (
        <div className="fixed inset-y-0 left-1/2 z-40 flex w-full max-w-[430px] -translate-x-1/2 flex-col justify-end bg-black/40">
          <div className="flex max-h-[70%] min-h-80 flex-col rounded-t-2xl bg-background pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-4 py-3">
              <button type="button" className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>取消</button>
              <p className="text-sm font-medium">所在地区</p>
              <span className="w-8" />
            </div>
            <div className="flex gap-4 border-b px-4 pb-2 text-sm">
              <button type="button" className={step === 0 ? "text-primary" : "text-muted-foreground"} onClick={() => setStep(0)}>{value.province || "请选择"}</button>
              {value.province ? <button type="button" className={step === 1 ? "text-primary" : "text-muted-foreground"} onClick={() => setStep(1)}>{value.city || "请选择"}</button> : null}
              {value.city ? <button type="button" className={step === 2 ? "text-primary" : "text-muted-foreground"} onClick={() => setStep(2)}>{value.district || "请选择"}</button> : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {options.map((name) => (
                <button key={name} type="button" className="flex w-full px-4 py-3 text-left text-sm" onClick={() => choose(name)}>
                  <span className={name === [value.province, value.city, value.district][step] ? "text-primary" : ""}>{name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
