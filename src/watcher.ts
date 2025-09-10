import "dotenv/config";
import chokidar from "chokidar";
import * as path from "path";
import axios from "axios";
import * as fs from "fs/promises";
import FormData from "form-data";
import * as fsSync from "fs";
import { fileToDataUrl } from "./util.js";
import { describeImage } from "./vision.js";

const WATCH_DIR = process.env.WATCH_DIR || "./imagens-inbox";
const N8N_URL = process.env.N8N_WEBHOOK_URL as string;
const SECRET = process.env.N8N_SHARED_SECRET || "";
const PROCESSED_DIR = path.join(WATCH_DIR, "..", "imagens-processadas");

await fs.mkdir(PROCESSED_DIR, { recursive: true });

const validExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]);

console.log(`👀 Monitorando: ${WATCH_DIR}`);

chokidar.watch(WATCH_DIR, { ignoreInitial: true, depth: 0 }).on("add", async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (!validExt.has(ext)) return;

    const fileName = path.basename(filePath);
    console.log(`📸 Nova imagem: ${fileName}`);

    try {
        const { dataUrl, mimeType, hash, bytes } = await fileToDataUrl(filePath);
        const text = await describeImage({
            dataUrl,
            prompt: "Descreva de forma concisa e útil o que há na imagem (pt-BR).",
        });

        // Payload enviado ao n8n
        // const payload = {
        //     fileName,
        //     mimeType,
        //     sizeBytes: bytes,
        //     sha256: hash,
        //     description: text,
        //     dataUrl,
        //     receivedAt: new Date().toISOString(),
        // };

        // const headers: Record<string, string> = { "Content-Type": "application/json" };
        // if (SECRET) headers["X-Shared-Secret"] = SECRET;

        // const resp = await axios.post(N8N_URL, payload, { headers, timeout: 30000 });
        // console.log(`✅ n8n respondeu:`, resp.status, resp.data);

        const form = new FormData();
        form.append("data", fsSync.createReadStream(filePath), fileName); // envia o arquivo real
        form.append("analyzed", JSON.stringify(text)); // ⚠ envia todos os dados para o chat
        form.append("description", text);
        form.append("sha256", hash);
        form.append("receivedAt", new Date().toISOString());

        const headers: Record<string, string> = { ...form.getHeaders() };
        if (SECRET) headers["X-Shared-Secret"] = SECRET;

        const resp = await axios.post(N8N_URL, form, { headers, timeout: 30000 });
        console.log(`✅ n8n respondeu:`, resp.status, resp.data);


        // mover p/ "processadas"
        const dest = path.join(PROCESSED_DIR, fileName);
        await fs.rename(filePath, dest);
    } catch (err: any) {
        console.error("❌ Erro ao processar:", err?.response?.data || err.message);
    }
});
