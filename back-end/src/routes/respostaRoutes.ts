import { FastifyInstance } from "fastify";
import { registerSse } from "../services/sseManager.js";

export async function respostaRoutes(fastify: FastifyInstance) {
  fastify.get("/resposta/:sessionId", async (req: any, reply) => {
    const { sessionId } = req.params;
    if (!sessionId) return reply.code(400).send({ error: "sessionId obrigatório" });

    registerSse(sessionId, reply);
  });
}
