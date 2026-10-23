import type { SurfaceId } from "@tshirt/design";

export type PrintArea = {
  surface: SurfaceId;
  x: number;
  y: number;
  w: number;
  h: number;
  exportWidth: number;
  exportHeight: number;
  surchargeCents: number;
};

export type LibraryItem = {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
};

export type EditorProps = {
  slug: string;
  loggedIn: boolean;
  initialSizeId?: string;
  initialColorId?: string;
  product: {
    id: string;
    name: string;
    priceCents: number;
    colors: Array<{ id: string; name: string; hex: string; frontUrl: string; backUrl: string | null }>;
    sizes: Array<{ id: string; name: string }>;
    areas: PrintArea[];
  };
  materials: LibraryItem[];
};
