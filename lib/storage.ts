import "server-only";

import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { getStorageBucket, shouldUseDemoData } from "@/lib/env";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

function extFromMime(mimeType: string) {
  const mapped: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };

  return mapped[mimeType] ?? "jpg";
}

function mimeFromPath(filePath: string) {
  const extension = path.extname(filePath).replace(".", "").toLowerCase();
  const mapped: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    svg: "image/svg+xml",
    heic: "image/heic",
    heif: "image/heif",
  };

  return mapped[extension] ?? "application/octet-stream";
}

function qualityScore(buffer: Buffer) {
  const size = buffer.byteLength;

  return Number(
    Math.min(0.98, Math.max(0.58, 0.58 + size / 1_200_000)).toFixed(2),
  );
}

export async function storeUploadedImage({
  userId,
  caseId,
  buffer,
  contentType,
}: {
  userId: string;
  caseId?: string;
  buffer: Buffer;
  contentType: string;
}) {
  const extension = extFromMime(contentType);
  const quality = qualityScore(buffer);

  if (shouldUseDemoData()) {
    const relativeDir = path.join("demo-uploads", userId);
    const diskDir = path.join(process.cwd(), "public", relativeDir);
    const fileName = `${Date.now()}-${randomUUID()}.${extension}`;

    await mkdir(diskDir, { recursive: true });
    await writeFile(path.join(diskDir, fileName), buffer);

    return {
      image_url: `/${relativeDir}/${fileName}`,
      image_quality_score: quality,
    };
  }

  const storagePath = `${userId}/${caseId ?? "new"}/${Date.now()}-${randomUUID()}.${extension}`;
  const client = createSupabaseServiceClient();
  const bucket = getStorageBucket();
  const { error } = await client.storage
    .from(bucket)
    .upload(storagePath, buffer, { contentType, upsert: false });

  if (error) {
    throw error;
  }

  const { data } = client.storage.from(bucket).getPublicUrl(storagePath);

  return {
    image_url: data.publicUrl,
    image_quality_score: quality,
  };
}

export async function readStoredImage(imageUrl: string) {
  if (imageUrl.startsWith("/")) {
    const filePath = path.join(process.cwd(), "public", imageUrl.slice(1));
    const buffer = await readFile(filePath);

    return { buffer, mimeType: mimeFromPath(filePath) };
  }

  const response = await fetch(imageUrl);

  if (!response.ok) {
    return null;
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    buffer,
    mimeType: response.headers.get("content-type") ?? "image/jpeg",
  };
}
