import { openaiClient } from "../config/openai.js";
import { supabase } from "../config/supabase.js";

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

export async function buscarSimilares(query: any, k = 5) {

  let queryString: string;
  if (typeof query === "string") {
    queryString = query;
  } else {
    queryString = Object.entries(query)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  }

  const embedding = await embedImageDescription(queryString);

  const { data, error } = await supabase.rpc("match_images", {
    query_embedding: embedding,
    match_count: k,
  });

  if (error) throw error;
  return data;
}
