/**
 * Script de Importação de Lesões
 *
 * Processa o metadata.csv e importa todas as imagens de lesões para o banco PostgreSQL
 * - Gera descrição usando OpenAI Vision
 * - Cria embeddings para busca por similaridade
 * - Insere no banco de dados
 * - Sistema de checkpoint para retomar se falhar
 * - Rate limiting para não estourar API da OpenAI
 */

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import csvParser from 'csv-parser';
import { createReadStream } from 'fs';
import dotenv from 'dotenv';
import pg from 'pg';
import OpenAI from 'openai';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Paths
  csvPath: path.join(process.cwd(), 'migrations', 'data', 'metadata.csv'),
  imagesDir: path.join(process.cwd(), 'imagens-lesoes'),
  checkpointFile: path.join(process.cwd(), 'scripts', '.import-checkpoint.json'),

  // Processing (optimized - no Vision API calls)
  batchSize: 50, // Process 50 images at a time (faster without Vision)
  delayBetweenBatches: 2000, // 2 seconds delay between batches
  maxRetries: 3,

  // OpenAI
  embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
};

// ============================================
// TYPES
// ============================================

interface MetadataRow {
  patient_id: string;
  lesion_id: string;
  diagnostic: string;
  region: string;
  img_id: string;
  age?: string;
  gender?: string;
  diameter_1?: string;
  diameter_2?: string;
  itch?: string;
  grew?: string;
  hurt?: string;
  changed?: string;
  bleed?: string;
  elevation?: string;
  biopsed?: string;
}

interface Checkpoint {
  lastProcessedIndex: number;
  totalProcessed: number;
  totalErrors: number;
  startedAt: string;
  lastUpdatedAt: string;
}

interface ProcessResult {
  success: boolean;
  index: number;
  filename: string;
  error?: string;
}

// ============================================
// DATABASE CONNECTION
// ============================================

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'raiox_recognize',
  user: process.env.DB_USER || 'raiox_user',
  password: process.env.DB_PASSWORD || 'raiox_password_dev',
  max: 10,
});

// ============================================
// OPENAI CLIENT
// ============================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// MAPPING FUNCTIONS
// ============================================

const DIAGNOSTIC_MAP: Record<string, string> = {
  'BCC': 'carcinoma_basocelular',
  'SCC': 'carcinoma_espinocelular',
  'MEL': 'melanoma_maligno',
  'NEV': 'nevo_benigno',
  'ACK': 'queratose_actinica',
  'SEK': 'queratose_seborreica',
};

const REGION_MAP: Record<string, string> = {
  'ARM': 'braco',
  'FOREARM': 'antebraco',
  'HAND': 'mao',
  'FINGER': 'dedo',
  'LEG': 'perna',
  'THIGH': 'coxa',
  'FOOT': 'pe',
  'FACE': 'rosto',
  'NOSE': 'nariz',
  'EAR': 'orelha',
  'NECK': 'pescoco',
  'SCALP': 'couro_cabeludo',
  'CHEST': 'peito',
  'BACK': 'costas',
  'ABDOMEN': 'abdomen',
};

const SEVERITY_MAP: Record<string, string> = {
  'MEL': 'grave',
  'BCC': 'moderado',
  'SCC': 'grave',
  'ACK': 'leve',
  'SEK': 'leve',
  'NEV': 'leve',
};

function mapDiagnostic(diagnostic: string): string {
  return DIAGNOSTIC_MAP[diagnostic] || 'desconhecida';
}

function mapRegion(region: string): string {
  return REGION_MAP[region] || region?.toLowerCase() || null;
}

function mapSeverity(diagnostic: string): string {
  return SEVERITY_MAP[diagnostic] || null;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateSHA256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// ============================================
// CHECKPOINT MANAGEMENT
// ============================================

async function loadCheckpoint(): Promise<Checkpoint | null> {
  try {
    if (fs.existsSync(CONFIG.checkpointFile)) {
      const data = await fsPromises.readFile(CONFIG.checkpointFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('❌ Erro ao carregar checkpoint:', error);
  }
  return null;
}

async function saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
  try {
    await fsPromises.writeFile(
      CONFIG.checkpointFile,
      JSON.stringify(checkpoint, null, 2),
      'utf-8'
    );
  } catch (error) {
    console.error('❌ Erro ao salvar checkpoint:', error);
  }
}

// ============================================
// DESCRIPTION GENERATION FROM METADATA
// ============================================

function generateDescriptionFromMetadata(metadata: MetadataRow): string {
  const parts: string[] = [];

  // Diagnosis and location
  const diagnosticName = DIAGNOSTIC_MAP[metadata.diagnostic] || metadata.diagnostic;
  parts.push(`Lesão classificada como ${diagnosticName}`);

  if (metadata.region) {
    const location = mapRegion(metadata.region);
    parts.push(`localizada na região: ${location}`);
  }

  // Size
  if (metadata.diameter_1 || metadata.diameter_2) {
    const d1 = metadata.diameter_1 ? `${metadata.diameter_1}mm` : '';
    const d2 = metadata.diameter_2 ? ` x ${metadata.diameter_2}mm` : '';
    parts.push(`Dimensões: ${d1}${d2}`);
  }

  // Symptoms
  const symptoms: string[] = [];
  if (metadata.itch === 'True') symptoms.push('coceira');
  if (metadata.grew === 'True') symptoms.push('crescimento');
  if (metadata.hurt === 'True') symptoms.push('dor');
  if (metadata.bleed === 'True') symptoms.push('sangramento');
  if (metadata.changed === 'True') symptoms.push('mudança recente');
  if (metadata.elevation === 'True') symptoms.push('elevação');

  if (symptoms.length > 0) {
    parts.push(`Sintomas: ${symptoms.join(', ')}`);
  }

  // Patient demographics
  const demographics: string[] = [];
  if (metadata.age) demographics.push(`Idade: ${metadata.age} anos`);
  if (metadata.gender) demographics.push(`Gênero: ${metadata.gender}`);

  if (demographics.length > 0) {
    parts.push(demographics.join(', '));
  }

  // Biopsy
  if (metadata.biopsed === 'True') {
    parts.push('Lesão com biópsia realizada');
  }

  return parts.join('. ') + '.';
}

async function generateEmbedding(text: string, retries = 0): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: CONFIG.embeddingModel,
      input: text,
    });

    return response.data[0]?.embedding || [];
  } catch (error: any) {
    if (retries < CONFIG.maxRetries && error?.status !== 400) {
      console.log(`   ⚠️ Retry ${retries + 1}/${CONFIG.maxRetries} para embedding...`);
      await sleep(2000 * (retries + 1));
      return generateEmbedding(text, retries + 1);
    }
    throw error;
  }
}

// ============================================
// DATABASE FUNCTIONS
// ============================================

async function insertLesao(
  filePath: string,
  sha256: string,
  description: string,
  embedding: number[],
  metadata: MetadataRow
): Promise<void> {
  const query = `
    INSERT INTO lesoes (
      file_name,
      file_path,
      sha256,
      description,
      embedding,
      classificacao,
      localizacao,
      severidade,
      notas,
      tags
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (sha256) DO NOTHING
  `;

  const notes = [
    metadata.patient_id ? `Patient ID: ${metadata.patient_id}` : null,
    metadata.lesion_id ? `Lesion ID: ${metadata.lesion_id}` : null,
    metadata.age ? `Age: ${metadata.age}` : null,
    metadata.gender ? `Gender: ${metadata.gender}` : null,
    metadata.biopsed === 'True' ? 'Biopsed: Yes' : null,
  ].filter(Boolean).join(' | ');

  const tags = [
    metadata.diagnostic,
    metadata.region,
    metadata.biopsed === 'True' ? 'BIOPSED' : null,
  ].filter(Boolean);

  const values = [
    metadata.img_id,
    filePath,
    sha256,
    description,
    JSON.stringify(embedding),
    mapDiagnostic(metadata.diagnostic),
    mapRegion(metadata.region),
    mapSeverity(metadata.diagnostic),
    notes || null,
    tags,
  ];

  await pool.query(query, values);
}

// ============================================
// MAIN PROCESSING FUNCTION
// ============================================

async function processImage(
  row: MetadataRow,
  index: number
): Promise<ProcessResult> {
  const filename = row.img_id;

  try {
    console.log(`\n[${index}] Processando: ${filename}`);

    // 1. Check if image exists
    const imagePath = path.join(CONFIG.imagesDir, filename);
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Imagem não encontrada: ${filename}`);
    }

    // 2. Read image and calculate hash
    console.log('   📁 Calculando hash da imagem...');
    const imageBuffer = await fsPromises.readFile(imagePath);
    const sha256 = calculateSHA256(imageBuffer);

    // 3. Check if already exists in database
    const existsQuery = 'SELECT id FROM lesoes WHERE sha256 = $1';
    const existsResult = await pool.query(existsQuery, [sha256]);

    if (existsResult.rows.length > 0) {
      console.log('   ⏭️  Já existe no banco (SHA256 duplicado)');
      return { success: true, index, filename };
    }

    // 4. Generate description from metadata (no OpenAI Vision needed!)
    console.log('   📝 Gerando descrição a partir do metadata...');
    const description = generateDescriptionFromMetadata(row);
    console.log(`   📄 Descrição: ${description.substring(0, 80)}...`);

    // 5. Generate embedding from description
    console.log('   🧮 Gerando embedding...');
    const embedding = await generateEmbedding(description);

    // 6. Insert into database
    console.log('   💾 Inserindo no banco...');
    await insertLesao(imagePath, sha256, description, embedding, row);

    console.log('   ✅ Sucesso!');
    return { success: true, index, filename };
  } catch (error: any) {
    console.error(`   ❌ Erro: ${error.message}`);
    return { success: false, index, filename, error: error.message };
  }
}

// ============================================
// MAIN FUNCTION
// ============================================

async function main() {
  console.log('🚀 Iniciando importação de lesões...\n');

  // Check if images directory exists
  if (!fs.existsSync(CONFIG.imagesDir)) {
    console.error(`❌ Diretório de imagens não encontrado: ${CONFIG.imagesDir}`);
    console.log('\n📁 Por favor, mova as imagens para:');
    console.log(`   ${CONFIG.imagesDir}\n`);
    process.exit(1);
  }

  // Load checkpoint
  let checkpoint = await loadCheckpoint();
  const startIndex = checkpoint?.lastProcessedIndex ?? -1;

  if (checkpoint) {
    console.log('📍 Checkpoint encontrado!');
    console.log(`   Retomando do índice: ${startIndex + 1}`);
    console.log(`   Processados até agora: ${checkpoint.totalProcessed}`);
    console.log(`   Erros até agora: ${checkpoint.totalErrors}\n`);
  } else {
    checkpoint = {
      lastProcessedIndex: -1,
      totalProcessed: 0,
      totalErrors: 0,
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  // Read CSV
  console.log('📖 Lendo CSV...');
  const rows: MetadataRow[] = [];

  await new Promise<void>((resolve, reject) => {
    createReadStream(CONFIG.csvPath)
      .pipe(csvParser())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve())
      .on('error', (error) => reject(error));
  });

  console.log(`📊 Total de registros no CSV: ${rows.length}`);
  console.log(`📋 A processar: ${rows.length - (startIndex + 1)}\n`);

  // Process in batches
  for (let i = startIndex + 1; i < rows.length; i += CONFIG.batchSize) {
    const batch = rows.slice(i, i + CONFIG.batchSize);
    const batchNumber = Math.floor(i / CONFIG.batchSize) + 1;
    const totalBatches = Math.ceil((rows.length - (startIndex + 1)) / CONFIG.batchSize);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📦 BATCH ${batchNumber}/${totalBatches}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Process batch
    const results = await Promise.allSettled(
      batch.map((row, batchIndex) => processImage(row, i + batchIndex))
    );

    // Update statistics
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const res = result.value;
        if (res.success) {
          checkpoint.totalProcessed++;
        } else {
          checkpoint.totalErrors++;
        }
        checkpoint.lastProcessedIndex = res.index;
      } else {
        checkpoint.totalErrors++;
      }
    }

    checkpoint.lastUpdatedAt = new Date().toISOString();
    await saveCheckpoint(checkpoint);

    // Progress
    const progress = ((checkpoint.lastProcessedIndex + 1) / rows.length * 100).toFixed(1);
    console.log(`\n📊 Progresso: ${progress}% (${checkpoint.lastProcessedIndex + 1}/${rows.length})`);
    console.log(`✅ Processados: ${checkpoint.totalProcessed}`);
    console.log(`❌ Erros: ${checkpoint.totalErrors}`);

    // Delay between batches (rate limiting)
    if (i + CONFIG.batchSize < rows.length) {
      console.log(`\n⏳ Aguardando ${CONFIG.delayBetweenBatches / 1000}s antes do próximo batch...`);
      await sleep(CONFIG.delayBetweenBatches);
    }
  }

  // Final statistics
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 IMPORTAÇÃO CONCLUÍDA!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Total processado: ${checkpoint.totalProcessed}`);
  console.log(`❌ Total de erros: ${checkpoint.totalErrors}`);
  console.log(`⏱️  Iniciado em: ${checkpoint.startedAt}`);
  console.log(`⏱️  Finalizado em: ${new Date().toISOString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Cleanup
  await pool.end();

  // Remove checkpoint file
  if (fs.existsSync(CONFIG.checkpointFile)) {
    await fsPromises.unlink(CONFIG.checkpointFile);
    console.log('🗑️  Checkpoint removido (importação completa)\n');
  }
}

// ============================================
// RUN
// ============================================

main().catch((error) => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
