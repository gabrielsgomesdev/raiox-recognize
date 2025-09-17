import * as fs from "fs/promises";
import * as crypto from "crypto";
import mime from "mime-types";
let sharp: typeof import("sharp") | null = null;

try {
  sharp = (await import("sharp")).default;
} catch { }

export interface FileToDataUrlResult {
  dataUrl: string;
  mimeType: string;
  hash: string;
  bytes: number;
}

export async function fileToDataUrl(filePath: string): Promise<FileToDataUrlResult> {
  const buf = await fs.readFile(filePath);
  const hash = crypto.createHash("sha256").update(buf).digest("hex");
  let mimeType = mime.lookup(filePath) || "application/octet-stream";
  let output = buf;

  if (sharp && mimeType.startsWith("image/")) {
    const fmt = mimeType === "image/png" ? "png" : "jpeg";
    const pipeline = sharp(buf).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true });
    output = fmt === "png" ? await pipeline.png({ compressionLevel: 9 }).toBuffer() : await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    mimeType = fmt === "png" ? "image/png" : "image/jpeg";
  }

  const base64 = output.toString("base64");
  return { dataUrl: `data:${mimeType};base64,${base64}`, mimeType, hash, bytes: output.length };
}
