import chokidar from "chokidar";
import path from "path";
import fs from "fs/promises";
import * as fsSync from "fs";
import { fileToDataUrl } from "../utils/fileUtils.js";
import { describeImage } from "../services/imagesService.js";
import { embedImageDescription } from "../services/embeddingsService.js";
import { sendToN8n } from "../services/n8nService.js";
import { supabase } from "../config/supabase.js";

const WATCH_DIR = process.env.WATCH_DIR || "./imagens-inbox";
const PROCESSED_DIR = path.join(WATCH_DIR, "..", "imagens-processadas");

async function ensureProcessedDir() {
  await fs.mkdir(PROCESSED_DIR, { recursive: true });
}

const validExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]);

export async function startWatcher() {
  await ensureProcessedDir();
  console.log("👀 Monitorando:", WATCH_DIR);

  chokidar.watch(WATCH_DIR, { ignoreInitial: true, depth: 0 })
    .on("add", async (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (!validExt.has(ext)) return;

      const fileName = path.basename(filePath);
      console.log("📸 Nova imagem:", fileName);

      try {
        // 1️⃣ Gerar dataUrl e hash
        const { dataUrl, mimeType, hash } = await fileToDataUrl(filePath);

        // 2️⃣ Descrever imagem via OpenAI
        const description = await describeImage(dataUrl);

        // 3️⃣ Gerar embedding
        const embedding = await embedImageDescription(description);

        // 4️⃣ Inserir no Supabase
        const { error } = await supabase.from("imagens").insert({
          file_name: fileName,
          description,
          sha256: hash,
          embedding
        });
        if (error) console.error("❌ Erro ao inserir no Supabase:", error);

        // 5️⃣ Enviar para n8n
        await sendToN8n(filePath, description, hash);

        // 6️⃣ Mover imagem para pasta processadas
        const dest = path.join(PROCESSED_DIR, fileName);
        await fs.rename(filePath, dest);
        console.log("✅ Imagem processada:", fileName);

      } catch (err: any) {
        console.error("❌ Erro ao processar imagem:", err?.response?.data || err.message);
      }
    });
}
