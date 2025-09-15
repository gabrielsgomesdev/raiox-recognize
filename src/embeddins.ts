import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedImageDescription(description: string): Promise<number[]> {
    const resp = await client.embeddings.create({
        model: "text-embedding-3-small", // pode usar o large também
        input: description,
    });

    return resp.data[0].embedding;
}