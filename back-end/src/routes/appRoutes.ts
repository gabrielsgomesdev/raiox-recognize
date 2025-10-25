import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { handleImageUpload } from "../services/imagesService.js";
import { buscarSimilares } from "../services/embeddingsService.js";

export async function appRoutes(fastify: FastifyInstance) {
  // Upload de imagem
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
