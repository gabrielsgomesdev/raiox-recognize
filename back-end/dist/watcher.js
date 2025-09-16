import "dotenv/config";
import chokidar from "chokidar";
import * as path from "path";
import axios from "axios";
import * as fs from "fs/promises";
import FormData from "form-data";
import * as fsSync from "fs";
import { fileToDataUrl } from "./util.js";
import { describeImage } from "./vision.js";
import { supabase } from "./db.js";
import { embedImageDescription } from "./embeddins.js";
const WATCH_DIR = process.env.WATCH_DIR || "./imagens-inbox";
const N8N_URL = process.env.N8N_WEBHOOK_URL;
const SECRET = process.env.N8N_SHARED_SECRET || "";
const PROCESSED_DIR = path.join(WATCH_DIR, "..", "imagens-processadas");
await fs.mkdir(PROCESSED_DIR, { recursive: true });
const validExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]);
console.log(`👀 Monitorando: ${WATCH_DIR}`);
chokidar.watch(WATCH_DIR, { ignoreInitial: true, depth: 0 }).on("add", async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (!validExt.has(ext))
        return;
    const fileName = path.basename(filePath);
    console.log(`📸 Nova imagem: ${fileName}`);
    try {
        const { dataUrl, mimeType, hash, bytes } = await fileToDataUrl(filePath);
        const text = await describeImage({
            dataUrl,
            prompt: "Descreva objetivamente o que há na imagem, em uma frase clara e útil para um pré diagnóstico médico, detalhe as características das ou da lesão; Tenha em mente que estamos tratando apenas de tipos de câncer. (pt-BR).",
        });
        const embedding = await embedImageDescription(text);
        const { error } = await supabase.from("imagens").insert({
            file_name: fileName,
            description: text,
            sha256: hash,
            embedding,
        });
        const form = new FormData();
        form.append("data", fsSync.createReadStream(filePath), fileName);
        form.append("analyzed", JSON.stringify(text));
        form.append("description", text);
        form.append("sha256", hash);
        form.append("receivedAt", new Date().toISOString());
        const headers = { ...form.getHeaders() };
        if (SECRET)
            headers["X-Shared-Secret"] = SECRET;
        const resp = await axios.post(N8N_URL, form, { headers, timeout: 30000 });
        console.log(`✅ n8n respondeu:`, resp.status, resp.data);
        const dest = path.join(PROCESSED_DIR, fileName);
        await fs.rename(filePath, dest);
    }
    catch (err) {
        console.error("❌ Erro ao processar:", err?.response?.data || err.message);
    }
});
