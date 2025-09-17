import Fastify from "fastify";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import { appRoutes } from "./index.js";
import { respostaRoutes } from "./routes/respostaRoutes.js";

const fastify = Fastify({ logger: true });

async function startServer() {
  // Registrar CORS
  await fastify.register(cors, {
    origin: ["http://localhost:4200"], // Adicione seu frontend ngrok se quiser
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  });

  // Registrar multipart para upload de arquivos
  await fastify.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // até 10 MB
  });

  // Registrar rotas da aplicação
  await appRoutes(fastify);

  await respostaRoutes(fastify);

  // Rota raiz
  fastify.get("/", async () => ({ status: "ok" }));

  const PORT = Number(process.env.PORT) || 3000;
  await fastify.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`✅ Fastify rodando em http://localhost:${PORT}`);
}

startServer().catch(err => {
  console.error(err);
  process.exit(1);
});
