"use client";

import dynamic from "next/dynamic";
import type { EditorProps } from "./editor-canvas";

const EditorCanvas = dynamic(() => import("./editor-canvas"), { ssr: false });

export function EditorShell(props: EditorProps) {
  return <EditorCanvas {...props} />;
}
