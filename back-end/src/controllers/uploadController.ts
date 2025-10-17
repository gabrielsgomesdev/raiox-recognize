import { FastifyReply, FastifyRequest } from "fastify";
import { analyzeImageWithOpenAI, CasoSimilar, fetchSimilarCasesLocal, normalizeConfidenceData, runAIAgent } from "../services/analiseService.js";

export async function uploadImage(req: FastifyRequest, reply: FastifyReply) {
  try {
    const file = await req.file();

    if (!file) return reply.code(400).send({ error: "Campo base64 é obrigatório" });

    const chunks: Buffer[] = [];
    for await (const chunk of file.file) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    const base64 = `data:${file.mimetype};base64,${buffer.toString('base64')}`;
    const analise = await analyzeImageWithOpenAI(base64, file.filename);
    const similares = await fetchSimilarCasesLocal({ query: analise, k: 5, userInput: analise });

    const similarCasesSummary: CasoSimilar[] = similares
      .map((r) => ({
        id: r.id,
        description: r.description,
        classificacao: r.classificacao,
        localizacao: r.localizacao,
        similarity: r.similarity,
      }));

    let relatorio = await runAIAgent(analise, similarCasesSummary);
    relatorio = normalizeConfidenceData(relatorio);

    return reply.code(200).send({ message: "Análise concluída", result: relatorio });
  } catch (err: any) {
    console.error("❌ Erro uploadImage:", err);
    return reply.code(500).send({ error: err.message });
  }
}
