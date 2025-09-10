import * as fs from "fs/promises";
import * as crypto from "crypto";
import mime from "mime-types";

let sharp: typeof import("sharp") | null = null;
try {
    sharp = (await import("sharp")).default;
} catch {
    /* sharp opcional */
}

export interface FileToDataUrlOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
}

export interface FileToDataUrlResult {
    dataUrl: string;
    mimeType: string;
    hash: string;
    bytes: number;
}

/**
 * Lê arquivo de imagem, opcionalmente reduz, e devolve dataURL + metadados
 */
export async function fileToDataUrl(
    filePath: string,
    { maxWidth = 1600, maxHeight = 1600, quality = 82 }: FileToDataUrlOptions = {}
): Promise<FileToDataUrlResult> {
    const buf = await fs.readFile(filePath);
    const hash = crypto.createHash("sha256").update(buf).digest("hex");
    let mimeType = mime.lookup(filePath) || "application/octet-stream";

    let output = buf;
    if (sharp && mimeType.startsWith("image/")) {
        const fmt = mimeType === "image/png" ? "png" : "jpeg";
        const pipeline = sharp(buf)
            .rotate()
            .resize({ width: maxWidth, height: maxHeight, fit: "inside", withoutEnlargement: true });

        output =
            fmt === "png"
                ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
                : await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();

        mimeType = fmt === "png" ? "image/png" : "image/jpeg";
    }

    const base64 = output.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;
    return { dataUrl, mimeType, hash, bytes: output.length };
}
