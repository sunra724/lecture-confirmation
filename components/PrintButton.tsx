"use client";

export function PrintButton() {
  return (
    <button
      className="rounded-full bg-soilab-navy px-5 py-3 text-sm font-semibold text-white"
      onClick={() => window.print()}
      type="button"
    >
      PDF로 저장 / 인쇄
    </button>
  );
}
