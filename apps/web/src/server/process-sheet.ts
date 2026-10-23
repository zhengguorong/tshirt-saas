export type SheetSize = { name: string; quantity: number };

export function readSheetSizes(value: unknown): SheetSize[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { name?: unknown; quantity?: unknown };
    if (typeof row.name !== "string" || typeof row.quantity !== "number") return [];
    return [{ name: row.name, quantity: row.quantity }];
  });
}

export function readItemIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
