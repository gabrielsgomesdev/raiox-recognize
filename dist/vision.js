import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
/**
 * Retorna texto descrevendo a imagem.
 * Aceita dataURL (data:image/...;base64,XXX)
 */
export async function describeImage({ dataUrl, prompt = "Descreva objetivamente o que há na imagem, em uma frase clara e útil para um pré diagnóstico médico, detalhe as características das ou da lesão; Tenha em mente que estamos tratando apenas de tipos de câncer.", }) {
    const model = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
    const completion = await client.chat.completions.create({
        model,
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: dataUrl } },
                ],
            },
        ],
        max_tokens: 300,
    });
    const msg = completion.choices?.[0]?.message?.content?.trim();
    return msg || "";
}
