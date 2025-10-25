import { openaiClient } from "../config/openai.js";
import pool from "../config/database.js";

/**
 * Generate embedding vector from text description
 */
export async function embedImageDescription(description: string): Promise<number[]> {
  const resp = await openaiClient.embeddings.create({
    model: "text-embedding-3-small",
    input: description,
  });

  const embeddingData = resp.data?.[0]?.embedding;

  if (!embeddingData) {
    throw new Error("Não foi possível gerar embedding para a descrição");
  }

  return embeddingData;
}

/**
 * Search for similar lesions in the catalog
 */
export async function buscarSimilares(query: any, k = 5) {
  let queryString: string;

  if (typeof query === "string") {
    queryString = query;
  } else {
    queryString = Object.entries(query)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  }

  // Generate embedding from query
  const embedding = await embedImageDescription(queryString);

  // Call PostgreSQL function to find similar lesions
  const result = await pool.query(
    'SELECT * FROM match_lesoes($1::vector, $2::int)',
    [JSON.stringify(embedding), k]
  );

  return result.rows;
}

/**
 * Search for similar patient images
 */
export async function buscarImagensSimilares(embedding: number[], k = 5, pacienteId?: string) {
  const result = await pool.query(
    'SELECT * FROM match_imagens($1::vector, $2::int, $3::uuid)',
    [JSON.stringify(embedding), k, pacienteId || null]
  );

  return result.rows;
}

/**
 * Analyze similarity results and suggest diagnosis
 */
export async function analisarDiagnostico(embedding: number[], topK = 5) {
  // Get top K similar lesions
  const result = await pool.query(
    'SELECT * FROM match_lesoes($1::vector, $2::int)',
    [JSON.stringify(embedding), topK]
  );

  const similares = result.rows;

  if (similares.length === 0) {
    return {
      classificacao_sugerida: 'desconhecida',
      confianca: 0,
      lesoes_similares: [],
      justificativa: 'Nenhuma lesão similar encontrada no catálogo'
    };
  }

  // Count classifications
  const classificacoes: Record<string, { count: number; avgSimilarity: number; total: number }> = {};

  similares.forEach((lesao: any) => {
    const classe = lesao.classificacao;
    const similarity = parseFloat(lesao.similarity);

    if (!classificacoes[classe]) {
      classificacoes[classe] = { count: 0, avgSimilarity: 0, total: 0 };
    }

    classificacoes[classe].count++;
    classificacoes[classe].total += similarity;
  });

  // Calculate average similarity for each classification
  Object.keys(classificacoes).forEach(classe => {
    classificacoes[classe].avgSimilarity =
      classificacoes[classe].total / classificacoes[classe].count;
  });

  // Find most common classification with highest average similarity
  let melhorClassificacao = '';
  let melhorScore = 0;

  Object.entries(classificacoes).forEach(([classe, stats]) => {
    // Score = (count / topK) * avgSimilarity
    const score = (stats.count / topK) * stats.avgSimilarity;

    if (score > melhorScore) {
      melhorScore = score;
      melhorClassificacao = classe;
    }
  });

  // Get top match similarity as confidence
  const confianca = parseFloat(similares[0].similarity);

  return {
    classificacao_sugerida: melhorClassificacao,
    confianca: confianca,
    lesoes_similares: similares.map((l: any) => ({
      id: l.id,
      file_name: l.file_name,
      description: l.description,
      classificacao: l.classificacao,
      localizacao: l.localizacao,
      severidade: l.severidade,
      similarity: parseFloat(l.similarity)
    })),
    distribuicao: Object.entries(classificacoes).map(([classe, stats]) => ({
      classificacao: classe,
      ocorrencias: stats.count,
      similaridade_media: stats.avgSimilarity
    })),
    justificativa: `Baseado em ${similares.length} lesões similares. ${classificacoes[melhorClassificacao]?.count || 0}/${topK} são ${melhorClassificacao}.`
  };
}
