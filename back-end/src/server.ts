import Fastify from "fastify";
import multipart from "@fastify/multipart";
import fs from "fs";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";
import { buscarSimilares } from "./queries.js";
import cors from "@fastify/cors";

const pump = promisify(pipeline);
const fastify = Fastify({ logger: true });

async function start() {
    // Registro do plugin multipart
    await fastify.register(multipart, {
        limits: {
            fileSize: 10 * 1024 * 1024 // 10MB, opcional
        }
    });

    await fastify.register(cors, {
        origin: ["http://localhost:4200", "https://c7a915782d0f.ngrok-free.app"], // origens permitidas
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
        credentials: true,
    });

    // Teste
    fastify.get("/", async () => ({ status: "ok" }));

    // Upload de imagem
    fastify.post("/upload", async (req, reply) => {
        try {
            const data = await req.file(); // pega o arquivo enviado

            if (!data) return reply.code(400).send({ error: "Nenhum arquivo enviado" });

            const inboxDir = path.join(process.cwd(), "imagens-inbox");
            if (!fs.existsSync(inboxDir)) fs.mkdirSync(inboxDir, { recursive: true });

            const filePath = path.join(inboxDir, data.filename);
            await pump(data.file, fs.createWriteStream(filePath));

            return { message: "Arquivo enviado com sucesso", filePath };
        } catch (err: any) {
            return reply.code(500).send({ error: err.message });
        }
    });

    // Buscar similares
    fastify.post("/buscar-similares", async (req, reply) => {
        const { query, k, userInput } = req.body as {
            query: string;
            k?: number;
            userInput?: any;
        };

        if (!query) return reply.code(400).send({ error: "Faltou parâmetro 'query'" });

        try {
            const results = await buscarSimilares(query, k || 5);
            return reply.send({ results, userInput });
        } catch (err: any) {
            return reply.code(500).send({ error: err.message });
        }
    });

    // Inicia servidor
    const PORT = Number(process.env.PORT) || 3000;
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`✅ Fastify rodando em http://localhost:${PORT}`);
}

start().catch(err => {
    console.error(err);
    process.exit(1);
});
