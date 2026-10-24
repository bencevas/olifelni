"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { resizeForUpload } from "@/lib/client-resize";

export type UploadedImage = { key: string; width: number; height: number; url: string };

/**
 * Photo management for the listing form.
 *
 * Ordering uses explicit arrow buttons rather than drag-and-drop: the owner works on a
 * phone, where dragging inside a scrolling form is unreliable. The first photo is the
 * cover and is labelled as such, because that is the only ordering decision that matters.
 */
export function PhotoUploader({
  value,
  onChange,
  hint,
}: {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setBusy(true);
    setError(null);

    try {
      const files = Array.from(fileList);
      const form = new FormData();
      form.set("hint", hint);

      for (const [i, file] of files.entries()) {
        setProgress(`Kép előkészítése ${i + 1}/${files.length}…`);
        form.append("files", await resizeForUpload(file));
      }

      setProgress("Feltöltés…");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "A feltöltés nem sikerült.");

      onChange([
        ...value,
        ...data.images.map((i: { key: string; width: number; height: number }) => ({
          ...i,
          url: `/uploads/${i.key}`,
        })),
      ]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setProgress("");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-lg bg-ink px-5 py-3 font-bold text-white disabled:opacity-60"
        >
          {busy ? progress || "Feltöltés…" : "+ Fényképek hozzáadása"}
        </button>
        <span className="text-sm text-ink-soft">
          {value.length > 0 ? `${value.length} kép` : "Még nincs kép"}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-brand/10 px-3 py-2 text-sm font-semibold text-brand">
          {error}
        </p>
      )}

      {value.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.map((img, i) => (
            <li key={img.key} className="relative">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-rule bg-sheet">
                <Image src={img.url} alt="" fill sizes="200px" className="object-cover" />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-brand px-1.5 py-0.5 text-[11px] font-bold text-white">
                    Borítókép
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <IconButton label="Balra" disabled={i === 0} onClick={() => move(i, i - 1)}>←</IconButton>
                  <IconButton label="Jobbra" disabled={i === value.length - 1} onClick={() => move(i, i + 1)}>→</IconButton>
                </div>
                <IconButton
                  label="Kép törlése"
                  danger
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                >
                  ✕
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[13px] text-ink-soft">
        Az első kép lesz a borítókép. A nyilakkal átrendezheted őket. A nagy fényképeket a
        böngésző automatikusan kicsinyíti, így mobilnetről is gyors a feltöltés.
      </p>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded border text-sm font-bold disabled:opacity-30 ${
        danger ? "border-brand text-brand hover:bg-brand/10" : "border-rule hover:bg-sheet"
      }`}
    >
      {children}
    </button>
  );
}
