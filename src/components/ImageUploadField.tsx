"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface Props {
  name: string;
  defaultValue?: string | null;
  label?: string;
}

export function ImageUploadField({ name, defaultValue, label = "图片" }: Props) {
  const [url, setUrl] = useState(defaultValue || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "上传失败");
      setUrl(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-white">{label}</span>

      {url && (
        <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-2xl border border-white/12">
          <Image src={url} alt="预览" fill className="object-cover" unoptimized />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-slate-950/40 px-4 text-sm text-white/80 transition hover:border-cyan-300/40 hover:text-white">
          {uploading ? "上传中…" : url ? "更换图片" : "选择图片"}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFile} disabled={uploading} />
        </label>
        {url && (
          <button type="button" onClick={() => setUrl("")} className="text-sm text-red-300/70 hover:text-red-300">
            移除
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <input type="text" name={name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="或直接粘贴图片 URL" className="h-10 rounded-2xl border border-white/12 bg-slate-950/40 px-3 text-sm text-white outline-none focus:border-cyan-300 placeholder:text-white/30" />
    </div>
  );
}
