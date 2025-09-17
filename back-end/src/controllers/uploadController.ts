import FormData from "form-data";
import fetch from "node-fetch";
import { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import { handleImageUpload } from "../services/imagesService.js";

export async function uploadImage(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: "Nenhum arquivo enviado" });

    // 1️⃣ Salva o arquivo localmente
    const filePath = await handleImageUpload(data.filename, data.file);
    console.log("✅ Arquivo salvo localmente:", filePath);

    // 2️⃣ Cria FormData para n8n
    const formData = new FormData();
    formData.append("data", fs.createReadStream(filePath));

    const n8nUrl = process.env.N8N_WEBHOOK_URL!;
    console.log("🔗 URL do webhook n8n:", n8nUrl);

    // 3️⃣ Chama o n8n e espera a resposta
    const response = await fetch(n8nUrl, { method: "POST", body: formData });
    console.log("📦 Response status:", response.status);

    // 4️⃣ Lê o corpo apenas uma vez
    const text = await response.text();
    let result: any;
    try {
      result = JSON.parse(text);
      console.log("📥 Resultado n8n (JSON):", result);
    } catch {
      result = text;
      console.log("📥 Resultado n8n (texto):", result);
    }

    // 5️⃣ Retorna para o frontend apenas após todo o fluxo
    return reply.code(200).send({
      message: "Processamento concluído",
      result,
    });

  } catch (err: any) {
    console.error("❌ Erro uploadImage:", err);
    return reply.code(500).send({ error: err.message });
  }
}
