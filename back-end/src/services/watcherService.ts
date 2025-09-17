// watcherService.ts
import chokidar from "chokidar";
import path from "path";
import { processImage } from "./imagesService.js";
import fs from "fs";

export function watchFolder(WATCH_DIR: string) {
  const PROCESSED_DIR = path.join(WATCH_DIR, "..", "imagens-processadas");

  chokidar.watch(WATCH_DIR, { ignoreInitial: true, depth: 0 })
    .on("add", async (filePath) => {
      console.log("📸 Nova imagem detectada:", filePath);

      try {
        // Espera 500ms para garantir que a escrita terminou
        await waitForFile(filePath);

        await processImage(filePath, PROCESSED_DIR);
      } catch (err) {
        console.error("❌ Erro no watcher:", err);
      }
    });

  console.log("👀 Monitorando pasta:", WATCH_DIR);
}

// Função auxiliar: espera o arquivo existir e não estar sendo escrito
function waitForFile(filePath: string, timeout = 1000) {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (fs.existsSync(filePath)) {
        try {
          fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
          clearInterval(interval);
          resolve();
        } catch {
          // ainda sendo escrito, espera
        }
      }
      if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(new Error("Timeout ao esperar o arquivo estar pronto"));
      }
    }, 100);
  });
}
