import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { handleImageUpload, processImage } from "../services/imagesService.js";
import { buscarSimilares } from "../services/embeddingsService.js";
import path from "path";

export async function appRoutes(fastify: FastifyInstance) {
  // Upload de imagem (assíncrono - processamento via file watcher)
  fastify.post("/upload", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await req.file();
      if (!data) return reply.code(400).send({ error: "Nenhum arquivo enviado" });

      // Salva o arquivo na pasta inbox
      const filePath = await handleImageUpload(data.filename, data.file);

      // Retorna resposta imediata
      // O processamento será feito pelo file watcher
      return reply.send({
        message: "Upload realizado com sucesso. O processamento será feito automaticamente.",
        filePath,
      });
    } catch (err: any) {
      console.error("❌ Erro em /upload:", err.message);
      return reply.code(500).send({ error: err.message });
    }
  });

  // Upload e análise síncrona (retorna diagnóstico imediatamente)
  fastify.post("/upload-and-analyze", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await req.file();
      if (!data) return reply.code(400).send({ error: "Nenhum arquivo enviado" });

      // Optional: get pacienteId from query params or headers
      const query = req.query as { pacienteId?: string };
      const pacienteId = query.pacienteId;

      // Save to inbox
      const filePath = await handleImageUpload(data.filename, data.file);

      // Process immediately (describe, embed, diagnose, save to DB)
      const processedDir = path.join(process.cwd(), "imagens-processadas");
      const result = await processImage(filePath, processedDir, pacienteId);

      // Return complete diagnosis
      return reply.send({
        success: true,
        message: "Imagem analisada com sucesso",
        data: {
          id: result.id,
          fileName: result.fileName,
          description: result.description,
          diagnostico: {
            classificacao_sugerida: result.diagnostico.classificacao_sugerida,
            confianca: result.diagnostico.confianca,
            confianca_percentual: `${(result.diagnostico.confianca * 100).toFixed(1)}%`,
            lesoes_similares: result.diagnostico.lesoes_similares,
            distribuicao: result.diagnostico.distribuicao,
            justificativa: result.diagnostico.justificativa,
          }
        }
      });
    } catch (err: any) {
      console.error("❌ Erro em /upload-and-analyze:", err.message);
      return reply.code(500).send({ error: err.message });
    }
  });

  // Buscar similares
  fastify.post("/buscar-similares", async (req, reply) => {
    const { query, k } = req.body as { query: string; k?: number };
    if (!query) return reply.code(400).send({ error: "Faltou parâmetro 'query'" });

    try {
      const results = await buscarSimilares(query, k || 5);
      return reply.send({ results });
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });
}
