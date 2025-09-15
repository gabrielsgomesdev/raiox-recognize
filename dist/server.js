// src/server.ts
import Fastify from "fastify";
import { buscarSimilares } from "./queries.js";
const fastify = Fastify({ logger: true });
fastify.get("/", async () => {
    return { status: "ok" };
});
fastify.post("/buscar-similares", async (request, reply) => {
    const { query, k } = request.body;
    if (!query) {
        return reply.code(400).send({ error: "Faltou parâmetro 'query'" });
    }
    try {
        const queryStr = typeof query === "string" ? query : JSON.stringify(query);
        const results = await buscarSimilares(queryStr, k || 5);
        return { results };
    }
    catch (err) {
        console.log('request.body: ', request.body);
        console.log('err.body: ', request.body);
        return reply.code(500).send({ error: err.message });
    }
});
const PORT = Number(process.env.PORT) || 3000;
fastify.listen({ port: PORT, host: "0.0.0.0" })
    .then(() => console.log(`✅ Fastify rodando em http://localhost:${PORT}`));
