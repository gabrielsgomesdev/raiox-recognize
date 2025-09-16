import Fastify from "fastify";
import { buscarSimilares } from "./queries.js";

const fastify = Fastify({ logger: true });

fastify.get("/", async () => {
    return { status: "ok" };
});

fastify.post("/buscar-similares", async (request, reply) => {
    const { query, k, userInput } = request.body as {
        query: string;
        k?: number;
        userInput?: any;
    };

    if (!query) {
        return reply.code(400).send({ error: "Faltou parâmetro 'query'" });
    }

    try {
        const results = await buscarSimilares(query, k || 5);
        return reply.send({ results, userInput });
    } catch (err: any) {
        return reply.code(500).send({ error: err.message });
    }
});

const PORT = Number(process.env.PORT) || 3000;
fastify.listen({ port: PORT, host: "0.0.0.0" })
    .then(() => console.log(`✅ Fastify rodando em http://localhost:${PORT}`));
