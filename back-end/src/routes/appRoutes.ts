import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";
import { handleImageUpload } from "../services/imagesService.js";
import { buscarSimilares } from "../services/embeddingsService.js";

export async function appRoutes(fastify: FastifyInstance) {
  // Upload de imagem e processamento no n8n
  fastify.post("/upload", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await req.file();
      if (!data) return reply.code(400).send({ error: "Nenhum arquivo enviado" });

      // 1. Salva o arquivo
      const filePath = await handleImageUpload(data.filename, data.file);

      // 2. Prepara o FormData
      const formData = new FormData();
      formData.append("data", fs.createReadStream(filePath));

      const n8nUrl = process.env.N8N_WEBHOOK_URL!;

      // 3. Faz POST para o n8n com axios
      const response = await axios.post(n8nUrl, formData, {
        headers: formData.getHeaders(),
        timeout: 60000, // 1 minuto
      });

      console.log("📥 Resposta do n8n:", response.data);

      // 4. Só responde pro front depois do n8n
      return reply.send({
        message: "Processamento concluído",
        result: response.data,
      });
    } catch (err: any) {
      console.error("❌ Erro em /upload:", err.response?.data || err.message);
      return reply.code(500).send({ error: err.response?.data || err.message });
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
