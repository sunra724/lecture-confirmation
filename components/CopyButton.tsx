"use client";

import { useState } from "react";

export function CopyButton({ text, label = "복사" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      className="inline-flex items-center rounded-full border border-soilab-navy/15 px-3 py-2 text-xs font-semibold text-soilab-navy transition hover:border-soilab-navy hover:bg-soilab-paper"
      onClick={handleCopy}
      type="button"
    >
      {copied ? "복사됨" : label}
    </button>
  );
}
