"use client";

import { Upload, X } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type MultiFileUploadZoneProps = {
  label: string;
  required?: boolean;
  accept: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function MultiFileUploadZone({
  label,
  required = false,
  accept,
  files,
  onFilesChange
}: MultiFileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function appendFiles(nextFiles: FileList | null) {
    if (!nextFiles?.length) return;
    const validFiles: File[] = [];
    for (const nextFile of Array.from(nextFiles)) {
      if (nextFile.size > MAX_FILE_SIZE) {
        window.alert(`${nextFile.name} 파일은 10MB 이하여야 합니다.`);
        continue;
      }
      validFiles.push(nextFile);
    }
    onFilesChange([...files, ...validFiles]);
  }

  function removeAt(index: number) {
    onFilesChange(files.filter((_, currentIndex) => currentIndex !== index));
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
        multiple
        onChange={(event) => appendFiles(event.target.files)}
        ref={inputRef}
        type="file"
      />
      <button
        className={cn(
          "flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition",
          files.length
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
            <div className="text-sm font-semibold text-slate-800">
              {files.length ? `${files.length}개 파일 선택됨` : "드래그하거나 클릭해서 업로드"}
            </div>
            <div className="mt-1 text-xs text-slate-500">JPG, PNG, PDF / 최대 10MB / 여러 파일 가능</div>
          </div>
        </div>
      </button>
      {files.length ? (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3" key={`${file.name}-${index}`}>
              <div>
                <div className="text-sm font-semibold text-slate-800">{file.name}</div>
                <div className="mt-1 text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
              </div>
              <button
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-50"
                onClick={() => removeAt(index)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
