"use client";

import { Upload, X } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type FileUploadZoneProps = {
  label: string;
  required?: boolean;
  accept: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function FileUploadZone({ label, required = false, accept, file, onFileSelect }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function validateFile(nextFile: File | null) {
    if (!nextFile) {
      onFileSelect(null);
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE) {
      window.alert("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    onFileSelect(nextFile);
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-800">
        <span>{label}</span>
        {required ? <span className="text-rose-500">*</span> : null}
      </div>
      <input
        accept={accept}
        className="hidden"
        onChange={(event) => validateFile(event.target.files?.[0] ?? null)}
        ref={inputRef}
        type="file"
      />
      <button
        className={cn(
          "flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition",
          file
            ? "border-soilab-navy bg-soilab-paper/40"
            : "border-dashed border-slate-300 bg-white hover:border-soilab-navy hover:bg-soilab-paper/20"
        )}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-2 text-soilab-navy shadow-sm">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">{file ? file.name : "드래그하거나 클릭해서 업로드"}</div>
            <div className="mt-1 text-xs text-slate-500">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "JPG, PNG, PDF / 최대 10MB"}</div>
          </div>
        </div>
        {file ? (
          <span
            className="rounded-full p-2 text-slate-400 hover:bg-white"
            onClick={(event) => {
              event.stopPropagation();
              onFileSelect(null);
            }}
            role="button"
          >
            <X className="h-4 w-4" />
          </span>
        ) : null}
      </button>
    </div>
  );
}
