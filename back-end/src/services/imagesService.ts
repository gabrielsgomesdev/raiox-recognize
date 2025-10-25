import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";
import { openaiClient } from "../config/openai.js";
import { embedImageDescription, analisarDiagnostico } from "./embeddingsService.js";
import pool from "../config/database.js";
import { fileToDataUrl } from "../utils/fileUtils.js";

const pump = promisify(pipeline);

export async function handleImageUpload(filename: string, fileStream: NodeJS.ReadableStream) {
  const inboxDir = path.join(process.cwd(), "imagens-inbox");
  if (!fs.existsSync(inboxDir)) fs.mkdirSync(inboxDir, { recursive: true });

  const filePath = path.join(inboxDir, filename);
  await pump(fileStream, fs.createWriteStream(filePath));

  return filePath;
}

export async function processImage(filePath: string, processedDir: string, pacienteId?: string) {
  const fileName = path.basename(filePath);
  const { dataUrl, hash } = await fileToDataUrl(filePath);

  // 1. Generate description using OpenAI Vision
  const description = await describeImage(dataUrl);

  // 2. Generate embedding from description
  const embedding = await embedImageDescription(description);

  // 3. Analyze diagnosis by comparing with lesion catalog
  const diagnostico = await analisarDiagnostico(embedding);

  // 4. Move to processed directory
  const dest = path.join(processedDir, fileName);
  await fsp.rename(filePath, dest);

  // 5. Insert into PostgreSQL with diagnosis results
  const query = `
    INSERT INTO imagens (
      paciente_id,
      file_name,
      file_path,
      sha256,
      description,
      embedding,
      classificacao_sugerida,
      confianca,
      lesoes_similares,
      processed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (sha256) DO NOTHING
    RETURNING id
  `;

  const values = [
    pacienteId || null,
    fileName,
    dest,
    hash,
    description,
    JSON.stringify(embedding),
    diagnostico.classificacao_sugerida,
    diagnostico.confianca,
    JSON.stringify(diagnostico.lesoes_similares),
  ];

  const result = await pool.query(query, values);

  console.log("✅ Imagem processada:", fileName);
  console.log(`📋 Diagnóstico: ${diagnostico.classificacao_sugerida} (${(diagnostico.confianca * 100).toFixed(1)}% confiança)`);

  return {
    id: result.rows[0]?.id,
    fileName,
    description,
    hash,
    embedding,
    diagnostico: {
      classificacao_sugerida: diagnostico.classificacao_sugerida,
      confianca: diagnostico.confianca,
      lesoes_similares: diagnostico.lesoes_similares,
      distribuicao: diagnostico.distribuicao,
      justificativa: diagnostico.justificativa,
    }
  };
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
