-- ============================================
-- RaioX Recognize - Data Transfer Script
-- ============================================
-- Description: Transfer lesoes data from Supabase (old database) to local PostgreSQL
-- Author: Claude Code
-- Date: 2025-01-25
-- ============================================

-- ============================================
-- OPTION 1: Using Foreign Data Wrapper (FDW)
-- ============================================
-- This option connects directly to Supabase and copies data
-- Requires: postgres_fdw extension and Supabase credentials

-- Uncomment and configure if you want to use FDW:
/*
-- 1. Enable FDW extension
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- 2. Create foreign server pointing to Supabase
CREATE SERVER supabase_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (
    host 'YOUR_SUPABASE_HOST.supabase.co',
    port '5432',
    dbname 'postgres'
  );

-- 3. Create user mapping with Supabase credentials
CREATE USER MAPPING FOR CURRENT_USER
  SERVER supabase_server
  OPTIONS (
    user 'postgres',
    password 'YOUR_SUPABASE_PASSWORD'
  );

-- 4. Import foreign schema (imagens table from Supabase)
IMPORT FOREIGN SCHEMA public
  LIMIT TO (imagens)
  FROM SERVER supabase_server
  INTO public;

-- 5. Transfer data from Supabase imagens to local lesoes
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
  criado_em
)
SELECT
  file_name,
  NULL as file_path, -- Adjust if your old table has this field
  sha256,
  description,
  embedding,
  'desconhecida' as classificacao, -- Default value, adjust as needed
  NULL as localizacao, -- Adjust if your old table has this field
  NULL as severidade, -- Adjust if your old table has this field
  NULL as notas,
  NOW() as criado_em
FROM imagens
WHERE embedding IS NOT NULL; -- Only transfer records with embeddings

-- 6. Cleanup: Drop foreign table and server
DROP FOREIGN TABLE IF EXISTS imagens CASCADE;
DROP USER MAPPING IF EXISTS FOR CURRENT_USER SERVER supabase_server;
DROP SERVER IF EXISTS supabase_server CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✅ Dados transferidos com sucesso via FDW!';
END $$;
*/

-- ============================================
-- OPTION 2: Using CSV Import (RECOMMENDED)
-- ============================================
-- This is the safest and most portable option
-- Steps to use this method:

-- STEP 1: Export data from Supabase
-- Run this query in Supabase SQL Editor to export data:
/*
COPY (
  SELECT
    file_name,
    sha256,
    description,
    embedding,
    created_at
  FROM imagens
  WHERE embedding IS NOT NULL
) TO STDOUT WITH CSV HEADER;
*/
-- Save the output to: migrations/data/lesoes_export.csv

-- STEP 2: Import the CSV into local database
-- Make sure the CSV file is in the correct location, then run:

-- Note: Update the path to where your CSV file is located
-- Example path: /docker-entrypoint-initdb.d/data/lesoes_export.csv

-- Create temporary table for import
CREATE TEMP TABLE IF NOT EXISTS temp_lesoes_import (
  file_name VARCHAR(255),
  sha256 VARCHAR(64),
  description TEXT,
  embedding vector(1536),
  created_at TIMESTAMP
);

-- Import CSV data (update path as needed)
-- \COPY temp_lesoes_import FROM '/path/to/lesoes_export.csv' WITH CSV HEADER;

-- Or if running from Docker volume:
-- \COPY temp_lesoes_import FROM '/docker-entrypoint-initdb.d/data/lesoes_export.csv' WITH CSV HEADER;

-- Insert from temp table to lesoes table
/*
INSERT INTO lesoes (
  file_name,
  sha256,
  description,
  embedding,
  classificacao,
  criado_em
)
SELECT
  file_name,
  sha256,
  description,
  embedding,
  'desconhecida' as classificacao, -- Update with actual classification if available
  created_at
FROM temp_lesoes_import
ON CONFLICT (sha256) DO NOTHING; -- Skip duplicates based on SHA256 hash

-- Cleanup
DROP TABLE IF EXISTS temp_lesoes_import;

DO $$
DECLARE
  imported_count INT;
BEGIN
  SELECT COUNT(*) INTO imported_count FROM lesoes;
  RAISE NOTICE '✅ Importação concluída! Total de lesões: %', imported_count;
END $$;
*/

-- ============================================
-- OPTION 3: Manual Insert Template
-- ============================================
-- If you have a small dataset, you can manually insert records:

/*
INSERT INTO lesoes (file_name, sha256, description, embedding, classificacao, localizacao, severidade, notas)
VALUES
  (
    'melanoma_001.jpg',
    'abc123def456...',
    'Lesão pigmentada irregular com bordas assimétricas...',
    '[0.123, 0.456, ...]'::vector(1536),
    'melanoma_maligno',
    'braco',
    'grave',
    'Caso confirmado por biópsia'
  ),
  (
    'carcinoma_002.jpg',
    'def789ghi012...',
    'Lesão com superfície ulcerada e bordas elevadas...',
    '[0.789, 0.012, ...]'::vector(1536),
    'carcinoma_basocelular',
    'rosto',
    'moderado',
    NULL
  );
-- Add more records as needed
*/

-- ============================================
-- HELPER FUNCTIONS FOR DATA MIGRATION
-- ============================================

-- Function to count records by source
CREATE OR REPLACE FUNCTION count_lesoes_stats()
RETURNS TABLE (
  total_lesoes BIGINT,
  com_embedding BIGINT,
  sem_embedding BIGINT,
  classificacoes_unicas BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_lesoes,
    COUNT(embedding) as com_embedding,
    COUNT(*) - COUNT(embedding) as sem_embedding,
    COUNT(DISTINCT classificacao) as classificacoes_unicas
  FROM lesoes;
END;
$$ LANGUAGE plpgsql;

-- Function to update classificacao in batch
CREATE OR REPLACE FUNCTION update_lesoes_classificacao(
  old_value VARCHAR,
  new_value VARCHAR
)
RETURNS INT AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE lesoes
  SET classificacao = new_value
  WHERE classificacao = old_value;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RAISE NOTICE 'Atualizadas % lesões de "%" para "%"', updated_count, old_value, new_value;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- POST-MIGRATION VALIDATION
-- ============================================

-- Query to validate imported data
/*
SELECT
  count_lesoes_stats();

-- Check for missing embeddings
SELECT COUNT(*) as sem_embedding
FROM lesoes
WHERE embedding IS NULL;

-- Check classification distribution
SELECT
  classificacao,
  COUNT(*) as quantidade,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM lesoes), 2) as percentual
FROM lesoes
GROUP BY classificacao
ORDER BY quantidade DESC;

-- Verify vector dimensions
SELECT
  file_name,
  vector_dims(embedding) as dimensoes
FROM lesoes
WHERE embedding IS NOT NULL
LIMIT 10;
*/

-- ============================================
-- NOTES
-- ============================================

/*
INSTRUÇÕES DE USO:

1. EXPORT FROM SUPABASE:
   - Acesse Supabase SQL Editor
   - Execute o comando COPY listado acima
   - Salve o resultado em: migrations/data/lesoes_export.csv

2. PREPARE CSV FILE:
   - Coloque o arquivo CSV em: back-end/migrations/data/
   - Ou dentro do volume Docker: /docker-entrypoint-initdb.d/data/

3. IMPORT TO LOCAL DATABASE:
   - Descomente a seção "OPTION 2" acima
   - Ajuste o caminho do arquivo CSV
   - Execute esta migration

4. VALIDATION:
   - Execute as queries de validação no final
   - Verifique se todos os embeddings foram importados
   - Confirme que as dimensões dos vetores estão corretas (1536)

5. UPDATE CLASSIFICATIONS:
   - Se necessário, use a função update_lesoes_classificacao()
   - Exemplo: SELECT update_lesoes_classificacao('desconhecida', 'melanoma_maligno');

TROUBLESHOOTING:

- Se encontrar erro "vector dimension mismatch":
  Verifique se o embedding tem exatamente 1536 dimensões

- Se encontrar erro "duplicate key value violates unique constraint":
  Use ON CONFLICT DO NOTHING ou DO UPDATE para resolver duplicatas

- Se os embeddings não forem importados:
  Verifique se o tipo vector(1536) está correto no CSV
*/

DO $$
BEGIN
  RAISE NOTICE '📋 Script de transferência de dados preparado';
  RAISE NOTICE '📝 Leia as instruções no início deste arquivo';
  RAISE NOTICE '🔧 Escolha uma das 3 opções de importação';
  RAISE NOTICE '✅ Após importar, execute as queries de validação';
END $$;
