import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";
import { openaiClient } from "../config/openai.js";
import { embedImageDescription } from "./embeddingsService.js";
import { supabase } from "../config/supabase.js";
import { fileToDataUrl } from "../utils/fileUtils.js";

const pump = promisify(pipeline);

export async function handleImageUpload(filename: string, fileStream: NodeJS.ReadableStream) {
  const inboxDir = path.join(process.cwd(), "imagens-inbox");
  if (!fs.existsSync(inboxDir)) fs.mkdirSync(inboxDir, { recursive: true });

  const filePath = path.join(inboxDir, filename);
  await pump(fileStream, fs.createWriteStream(filePath));

  return filePath;
}

export async function processImage(filePath: string, processedDir: string) {
  const fileName = path.basename(filePath);
  const { dataUrl, hash } = await fileToDataUrl(filePath);

  const description = await describeImage(dataUrl);
  const embedding = await embedImageDescription(description);

  await supabase.from("imagens").insert({
    file_name: fileName,
    description,
    sha256: hash,
    embedding,
  });

  // Mover
  const dest = path.join(processedDir, fileName);
  await fsp.rename(filePath, dest);

  console.log("✅ Imagem processada:", fileName);

  return { fileName, description, hash, embedding };
}


export async function describeImage(dataUrl: string): Promise<string> {
  const prompt = "Descreva objetivamente a lesão médica na imagem, em uma frase clara, detalhando características importantes.";

  const completion = await openaiClient.chat.completions.create({
    model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text" as const, text: prompt },
          { type: "image_url" as const, image_url: { url: dataUrl } }
        ]
      }
    ],
    max_tokens: 300
  });

  return completion.choices?.[0]?.message?.content?.trim() || "";
}
