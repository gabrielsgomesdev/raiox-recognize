import { FastifyReply, FastifyRequest } from "fastify";
import { handleImageUpload } from "../services/imagesService.js";

export async function uploadImage(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: "Nenhum arquivo enviado" });

    // Salva o arquivo localmente na pasta inbox
    const filePath = await handleImageUpload(data.filename, data.file);
    console.log("✅ Arquivo salvo localmente:", filePath);

    // Retorna resposta imediata
    // O processamento será feito pelo file watcher
    return reply.code(200).send({
      message: "Upload realizado com sucesso. O processamento será feito automaticamente.",
      filePath,
    });

  } catch (err: any) {
    console.error("❌ Erro uploadImage:", err);
    return reply.code(500).send({ error: err.message });
  }
}
