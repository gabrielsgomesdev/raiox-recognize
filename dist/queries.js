import { supabase } from "./db.js";
import { embedImageDescription } from "./embeddins.js";
export async function buscarSimilares(query, k = 5) {
    const embedding = await embedImageDescription(query);
    const { data, error } = await supabase.rpc("match_images", {
        query_embedding: embedding,
        match_count: k,
    });
    if (error)
        throw error;
    return data;
}
