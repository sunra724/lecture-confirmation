"use client";

import { useEffect, useRef, useState } from "react";

type SignaturePadProps = {
  onSave: (dataUrl: string) => void;
};

export function SignaturePad({ onSave }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.lineWidth = 2;
    context.lineCap = "round";
    context.strokeStyle = "#172033";
  }, []);

  function getPoint(event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const point = "touches" in event ? event.touches[0] : event;
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top
    };
  }

  function start(event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const point = getPoint(event);
    const context = canvasRef.current?.getContext("2d");
    if (!point || !context) return;
    context.beginPath();
    context.moveTo(point.x, point.y);
    setDrawing(true);
    setHasStroke(true);
  }

  function move(event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    const point = getPoint(event);
    const context = canvasRef.current?.getContext("2d");
    if (!point || !context) return;
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function end() {
    setDrawing(false);
  }

  function clear() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
    onSave("");
  }

  function save() {
    const dataUrl = canvasRef.current?.toDataURL("image/png") ?? "";
    onSave(dataUrl);
  }

  return (
    <div>
      <div className="mb-2">
        <div className="text-sm font-semibold text-slate-800">서명란</div>
        <div className="mt-1 text-xs text-slate-500">펜이나 마우스로 서명해주세요.</div>
      </div>
      <canvas
        className="h-[200px] w-full rounded-2xl border border-soilab-navy bg-white"
        height={200}
        onMouseDown={start}
        onMouseLeave={end}
        onMouseMove={move}
        onMouseUp={end}
        onTouchEnd={end}
        onTouchMove={move}
        onTouchStart={start}
        ref={canvasRef}
        width={640}
      />
      <div className="mt-3 flex gap-2">
        <button
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          onClick={clear}
          type="button"
        >
          서명 지우기
        </button>
        <button
          className="rounded-full bg-soilab-navy px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!hasStroke}
          onClick={save}
          type="button"
        >
          서명 완료
        </button>
      </div>
    </div>
  );
}
