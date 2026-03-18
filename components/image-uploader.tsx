"use client";

/* eslint-disable @next/next/no-img-element */

import { ImagePlus } from "lucide-react";

export function ImageUploader({
  previewUrl,
  onFileChange,
}: {
  previewUrl: string | null;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center transition hover:border-teal-300 hover:bg-teal-50/30">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />

      {previewUrl ? (
        <div className="w-full space-y-4">
          <img
            src={previewUrl}
            alt="Selected upload preview"
            className="mx-auto aspect-[4/3] w-full max-w-xl rounded-[28px] object-cover"
          />
          <p className="text-sm text-slate-500">Tap to replace photo</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <ImagePlus className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-slate-950">Upload a skin or scalp photo</p>
            <p className="text-sm text-slate-500">
              Supports face, scalp, beard, hairline, and skin patches.
            </p>
          </div>
        </div>
      )}
    </label>
  );
}
