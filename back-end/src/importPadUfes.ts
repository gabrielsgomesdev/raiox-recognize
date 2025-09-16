import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { supabase } from "./db.js";
import { embedImageDescription } from "./embeddins.js";
import crypto from "crypto";

const IMAGES_DIR = path.join(process.cwd(), "images");
const CSV_FILE = path.join(process.cwd(), "metadata.csv");

async function checkOrUpload(filePath: string, fileName: string) {
    const fileBuffer = fs.readFileSync(filePath);
    const sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    const { data: existing } = await supabase.from("lesoes").select("*").eq("sha256", sha256).single();

    if (existing) {
        console.log(`⚠ Imagem já existe: ${fileName}`);
        return existing;
    }

    const { error: uploadError } = await supabase.storage.from("lesoes").upload(fileName, fileBuffer, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("lesoes").getPublicUrl(fileName);
    if (!data?.publicUrl) throw new Error("Não foi possível obter publicUrl");

    return { url: data.publicUrl, sha256 };
}

async function popular() {
    const results: any[] = [];

    fs.createReadStream(CSV_FILE).pipe(csvParser()).on("data", (row) => results.push(row)).on("end", async () => {
        console.log(`📊 Total de registros no CSV: ${results.length}`);

        for (const row of results) {
            try {
                const fileName = row.img_id;
                const tipo = row.diagnostic;
                const descricao = row.description || tipo;
                const benigno = row.benign === "true" || row.benign === "1";

                const filePath = path.join(IMAGES_DIR, fileName);
                if (!fs.existsSync(filePath)) {
                    console.warn(`⚠ Imagem não encontrada: ${fileName}`);
                    continue;
                }

                const uploadedData = await checkOrUpload(filePath, fileName);
                const url = uploadedData.url;
                const sha256 = uploadedData.sha256;

                const embedding = await embedImageDescription(`${tipo} - ${descricao}`);

                const { data: existing } = await supabase.from("lesoes").select("*").eq("nome_arquivo", fileName).single();

                if (existing) {
                    const { error } = await supabase.from("lesoes")
                        .update({
                            url,
                            tipo,
                            benigno,
                            descricao,
                            embedding,
                            sha256,
                            classificacao: tipo === "ACK" ? "pré-neoplásico" :
                                ["BCC", "MEL", "SCC", "BOD"].includes(tipo) ? "maligno" : "benigno",
                            localizacao: row.region || null,
                            img_id: fileName,
                        }).eq("nome_arquivo", fileName);

                    if (error) console.error(`❌ Erro ao atualizar ${fileName}:`, error);
                    else console.log(`🔄 Atualizado: ${fileName}`);
                } else {
                    const { error } = await supabase.from("lesoes").insert({
                        nome_arquivo: fileName, url, tipo, benigno,
                        descricao, embedding, sha256,
                        classificacao: tipo === "ACK" ? "pré-neoplásico" : ["BCC", "MEL", "SCC", "BOD"].includes(tipo) ? "maligno" : "benigno",
                        localizacao: row.region || null,
                        img_id: fileName,
                    });

                    if (error) console.error(`❌ Erro ao inserir ${fileName}:`, error);
                    else console.log(`✅ Inserido: ${fileName}`);
                }

            } catch (err) {
                console.error("❌ Erro geral:", err);
            }
        }

        console.log("🎯 Importação finalizada!");
    });
}

popular().catch(console.error);
