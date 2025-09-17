import { FastifyRequest, FastifyReply } from "fastify";
import { buscarSimilares } from "../services/embeddingsService.js";

export async function searchImages(req: FastifyRequest, reply: FastifyReply) {
  const { query, k } = req.body as { query: string; k?: number };
  if (!query) return reply.code(400).send({ error: "Faltou parâmetro 'query'" });

  try {
    const results = await buscarSimilares(query, k || 5);
    return { results };
  } catch (err: any) {
    console.error(`Erro ao fazer busca das imagens: ${err}`)
    return reply.code(500).send({ error: err.message });
  }
}
