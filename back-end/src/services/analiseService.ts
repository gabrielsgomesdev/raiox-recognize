import { OpenAI } from "openai";
import { buscarSimilares } from "../services/embeddingsService.js";

export interface CasoSimilar {
    id: number;
    description: string;
    classificacao: string;
    localizacao: string;
    similarity: number;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** Normaliza campos de confiança e probabilidade em porcentagem */
export function normalizeConfidenceData(data: any) {
    const toPercentage = (value: any) => {
        if (typeof value !== "number" || isNaN(value)) return null;
        const v = Math.min(Math.max(value, 0), 1);
        return +(v * 100).toFixed(2);
    };

    if (data?.analiseIA) {
        const ia = data.analiseIA;

        // Normaliza os campos numéricos
        if (ia.probabilidadeMalignidade !== undefined)
            ia.probabilidadeMalignidade = toPercentage(ia.probabilidadeMalignidade);

        if (ia.confiancaClassificacao !== undefined)
            ia.confiancaClassificacao = toPercentage(ia.confiancaClassificacao);

        // Compatibilidade com versões antigas
        if (ia.probabilidade !== undefined && ia.probabilidadeMalignidade === undefined)
            ia.probabilidadeMalignidade = toPercentage(ia.probabilidade);

        if (ia.confiancaModelo !== undefined && ia.confiancaClassificacao === undefined)
            ia.confiancaClassificacao = toPercentage(ia.confiancaModelo);

        // Define nível textual de confiança
        const conf = ia.confiancaClassificacao ?? 0;
        ia.nivelConfianca = conf >= 85 ? "Alta" : conf >= 60 ? "Média" : "Baixa";
    }

    return data;
}

// 🔹 Remove blocos ```json ... ```
function stripCodeFences(s: string) {
    return s.replace(/```json\s*/g, "").replace(/```/g, "").trim();
}

function detectarMimeType(base64: string): string {
    if (base64.startsWith("/9j/")) return "image/jpeg"; // JPG
    if (base64.startsWith("iVBOR")) return "image/png"; // PNG
    if (base64.startsWith("R0lGOD")) return "image/gif"; // GIF
    if (base64.startsWith("UklGR")) return "image/webp"; // WEBP
    return "image/jpeg"; // padrão seguro
}

/**
 * Analisa uma imagem (em base64) usando o GPT-4o-mini.
 * Compatível tanto com execução no Node quanto no n8n.
 */
export async function analyzeImageWithOpenAI(
    base64: string,
    description?: string
): Promise<any> {
    const mimeType = detectarMimeType(base64);
    const contextText = description ?? '{{ $json["body"]["analyzed"] }}';

    const prompt = `
Você é um especialista em dermatologia e análise de imagens de pele.

Descrição da imagem: "${contextText}"

Instruções:
1. Analise visualmente a imagem fornecida.
2. Forneça as informações solicitadas sem emitir diagnósticos definitivos.
3. Responda **estritamente em JSON**.
4. "probabilidade" e "confiancaModelo" devem ser valores decimais entre 0 e 1.

Formato de saída:
{
  "analiseIA": {
    "tipo_lesao": string,
    "descricao": string,
    "classificacao": string,
    "localizacao": string,
    "observacao": string,
    "probabilidadeMalignidade": number,
    "confiancaClassificacao": number,
    "confiancaModelo": number
  },
  "paciente": {
    "nome": string | null,
    "idade": number | null,
    "sexo": string | null,
    "dataCadastro": string | null
  },
  "imagem": {
    "url": string | null,
    "dataEnvio": string | null
  },
  "dataAnalise": string,
  "modeloIA": {
    "versao": "gpt-4o-mini",
    "fonte": "OpenAI API",
    "tempoProcessamento": string
  }
}`;

    const start = Date.now();

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: prompt },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analise esta imagem:" },
                        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
                    ],
                },
            ],
            max_tokens: 1000,
        });

        const text = response?.choices?.[0]?.message?.content ?? "";
        const cleaned = stripCodeFences(text);
        const parsed = JSON.parse(cleaned);
        const end = Date.now();

        if (parsed.modeloIA)
            parsed.modeloIA.tempoProcessamento = `${((end - start) / 1000).toFixed(2)}s`;

        return parsed;
    } catch (err: any) {
        console.error("❌ Erro ao analisar imagem:", err.message);
        return { error: true, message: err.message };
    }
}

/**
 * Busca casos similares usando a função local `buscarSimilares`
 * em vez de fazer uma chamada HTTP.
 */
export async function fetchSimilarCasesLocal(payload: any): Promise<any[]> {
    try {
        const query = payload.query ?? payload;
        const k = payload.k || 5;

        console.log("🔍 Buscando casos similares localmente...");
        const results = await buscarSimilares(query, k);
        console.log(`✅ ${results?.length ?? 0} casos similares encontrados`);

        return results;
    } catch (err: any) {
        console.error("❌ Erro ao buscar casos similares localmente:", err.message);
        return [];
    }
}

/**
 * Executa o agente que gera o relatório final com base na análise e nos casos similares.
 */
export async function runAIAgent(analise: any, similares: CasoSimilar[]): Promise<any> {
    const similaresText = JSON.stringify(similares.slice(0, 5), null, 2);

    const prompt = `
Você é um especialista em dermatologia e oncologia cutânea.

Analise os dados do paciente e os casos similares (somente como referência).

### Tipos de lesão
- MEL: Melanoma (maligno)
- SCC: Carcinoma Espinocelular (maligno)
- BOD: Doença de Bowen (maligno)
- BCC: Carcinoma Basocelular (maligno)
- ACK: Ceratose Actínica (pré-neoplásica)
- NEV: Nevo (benigno)
- SEK: Ceratose Seborreica (benigno)

### Dados da lesão do paciente
${JSON.stringify(analise, null, 2)}

### Casos similares (referência)
${similaresText}

Retorne **apenas em JSON** no formato abaixo:

atenção: "probabilidade" e "confiancaModelo" devem ser valores decimais entre 0 e 1.

{
  "paciente": {
    "nome": string | null,
    "idade": number | null,
    "sexo": string | null,
    "dataCadastro": string | null
  },
  "historicoClinico": {
    "historicoFamiliar": string | null,
    "sintomas": string | null,
    "observacoes": string | null
  },
  "analiseIA": {
    "tipoLesao": string,
    "descricao": string,
    "probabilidadeMalignidade": number, // Chance de malignidade (0–1)
    "confiancaClassificacao": number    // Certeza da IA sobre a classificação (0–1)
    "confiancaModelo": number,
    "classificacaoRisco": string,
    "status": string
  },
  "recomendacoes": string[],
  "imagem": {
    "url": string | null,
    "dataEnvio": string | null
  },
  "dataAnalise": string,
  "modeloIA": {
    "versao": "gpt-4o-mini",
    "fonte": "OpenAI API",
    "tempoProcessamento": string
  }
}`;

    const start = Date.now();
    try {
        const resp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Responda apenas JSON" },
                { role: "user", content: prompt },
            ],
            max_tokens: 1200,
        });

        const text = resp?.choices?.[0]?.message?.content ?? "";
        const cleaned = stripCodeFences(text);
        const parsed = JSON.parse(cleaned);
        const end = Date.now();

        // Adiciona tempo de processamento real
        if (parsed.modeloIA)
            parsed.modeloIA.tempoProcessamento = `${((end - start) / 1000).toFixed(2)}s`;

        return parsed;
    } catch (err: any) {
        console.error("❌ Erro ao executar agente IA:", err.message);
        return { error: true, message: err.message };
    }
}
