import OpenAI from "openai";

export interface DescribeImageParams {
    dataUrl: string;
    prompt?: string;
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function describeImage({
    dataUrl,
    prompt = "Descreva objetivamente o que há na imagem, em uma frase clara e útil para um pré diagnóstico médico, detalhe as características das ou da lesão; Tenha em mente que estamos tratando apenas de tipos de câncer.",
}: DescribeImageParams): Promise<string> {
    const model = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";

    const completion = await client.chat.completions.create({
        model,
        messages: [
            {
                role: "user",
                content: [
                    { type: "text" as const, text: prompt },
                    { type: "image_url" as const, image_url: { url: dataUrl } },
                ],
            },
        ],
        max_tokens: 300,
    });

    const msg = completion.choices?.[0]?.message?.content?.trim();
    return msg || "";
}