import chokidar from "chokidar";
import path from "path";
import fs from "fs/promises";
import { processImage } from "../services/imagesService.js";

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
      console.log("📸 Nova imagem detectada:", fileName);

      try {
        // Process image: describe, embed, diagnose, and save to PostgreSQL
        const result = await processImage(filePath, PROCESSED_DIR);

        console.log("✅ Processamento completo!");
        console.log(`   Diagnóstico: ${result.diagnostico.classificacao_sugerida}`);
        console.log(`   Confiança: ${(result.diagnostico.confianca * 100).toFixed(1)}%`);

      } catch (err: any) {
        console.error("❌ Erro ao processar imagem:", err?.response?.data || err.message);
      }
    });
}
