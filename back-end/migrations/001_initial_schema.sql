-- ============================================
-- RaioX Recognize - Initial Database Schema
-- ============================================
-- Description: Creates all tables, indexes, and functions for medical imaging analysis
-- Author: Claude Code
-- Date: 2025-01-25
-- ============================================

-- ============================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- 2.1 USUARIOS (médicos e enfermeiros)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('nurse', 'doctor', 'admin')),
  ativo BOOLEAN DEFAULT true,

  -- JWT Authentication fields
  refresh_token TEXT,
  refresh_token_expires_at TIMESTAMP,
  ultimo_login TIMESTAMP,

  -- Timestamps
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- 2.2 PACIENTES
CREATE TABLE pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) UNIQUE,
  data_nascimento DATE,
  sexo VARCHAR(1) CHECK (sexo IN ('M', 'F', 'O')),
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco TEXT,

  -- Timestamps
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- 2.3 IMAGENS (casos dos pacientes em análise)
CREATE TABLE imagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,

  -- File information
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  sha256 VARCHAR(64) UNIQUE NOT NULL,
  mime_type VARCHAR(50),

  -- AI Analysis
  descricao TEXT,
  embedding vector(1536),

  -- Diagnosis
  analisada BOOLEAN DEFAULT false,
  resultado_diagnostico TEXT,
  classificacao_sugerida VARCHAR(100),
  confianca FLOAT CHECK (confianca >= 0 AND confianca <= 1),
  lesoes_similares JSONB,

  -- Metadata
  observacoes TEXT,
  data_envio TIMESTAMP DEFAULT NOW(),

  -- Timestamps
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- 2.4 LESOES (base de conhecimento/catálogo de lesões)
CREATE TABLE lesoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- File information
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),
  sha256 VARCHAR(64) UNIQUE,

  -- AI Analysis
  description TEXT NOT NULL,
  embedding vector(1536) NOT NULL,

  -- Classification
  classificacao VARCHAR(100) NOT NULL,
  localizacao VARCHAR(50),
  severidade VARCHAR(20) CHECK (severidade IN ('leve', 'moderado', 'grave', 'critico')),

  -- Additional info
  notas TEXT,
  tags VARCHAR(50)[],

  -- Timestamps
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- 2.5 SESSOES (para controle de sessões JWT)
CREATE TABLE sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  refresh_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  revogada BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

-- 3.1 Usuarios indexes
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_role ON usuarios(role);
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);

-- 3.2 Pacientes indexes
CREATE INDEX idx_pacientes_cpf ON pacientes(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_pacientes_nome ON pacientes(nome);

-- 3.3 Imagens indexes
CREATE INDEX idx_imagens_paciente ON imagens(paciente_id);
CREATE INDEX idx_imagens_usuario ON imagens(usuario_id);
CREATE INDEX idx_imagens_sha256 ON imagens(sha256);
CREATE INDEX idx_imagens_analisada ON imagens(analisada);
CREATE INDEX idx_imagens_data_envio ON imagens(data_envio DESC);

-- 3.4 Lesoes indexes
CREATE INDEX idx_lesoes_sha256 ON lesoes(sha256) WHERE sha256 IS NOT NULL;
CREATE INDEX idx_lesoes_classificacao ON lesoes(classificacao);
CREATE INDEX idx_lesoes_localizacao ON lesoes(localizacao);
CREATE INDEX idx_lesoes_severidade ON lesoes(severidade);

-- 3.5 Sessoes indexes
CREATE INDEX idx_sessoes_usuario ON sessoes(usuario_id);
CREATE INDEX idx_sessoes_refresh_token ON sessoes(refresh_token);
CREATE INDEX idx_sessoes_expires_at ON sessoes(expires_at);

-- 3.6 Vector similarity indexes (HNSW for fast similarity search)
CREATE INDEX idx_imagens_embedding ON imagens USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

CREATE INDEX idx_lesoes_embedding ON lesoes USING hnsw (embedding vector_cosine_ops);

-- ============================================
-- 4. CREATE FUNCTIONS
-- ============================================

-- 4.1 Function to update atualizado_em timestamp
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2 Function to search similar lesoes
CREATE OR REPLACE FUNCTION match_lesoes(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  classificacao_filter varchar DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  file_name varchar,
  description text,
  classificacao varchar,
  localizacao varchar,
  severidade varchar,
  similarity float
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.file_name,
    l.description,
    l.classificacao,
    l.localizacao,
    l.severidade,
    1 - (l.embedding <=> query_embedding) as similarity
  FROM lesoes l
  WHERE (classificacao_filter IS NULL OR l.classificacao = classificacao_filter)
  ORDER BY l.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4.3 Function to search similar imagens
CREATE OR REPLACE FUNCTION match_imagens(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  paciente_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  file_name varchar,
  descricao text,
  paciente_id uuid,
  paciente_nome varchar,
  resultado_diagnostico text,
  classificacao_sugerida varchar,
  similarity float
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.file_name,
    i.descricao,
    i.paciente_id,
    p.nome as paciente_nome,
    i.resultado_diagnostico,
    i.classificacao_sugerida,
    1 - (i.embedding <=> query_embedding) as similarity
  FROM imagens i
  LEFT JOIN pacientes p ON i.paciente_id = p.id
  WHERE i.embedding IS NOT NULL
    AND (paciente_filter IS NULL OR i.paciente_id = paciente_filter)
  ORDER BY i.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4.4 Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessoes
  WHERE expires_at < NOW()
     OR revogada = true;
END;
$$ LANGUAGE plpgsql;

-- 4.5 Function to revoke all user sessions
CREATE OR REPLACE FUNCTION revoke_user_sessions(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE sessoes
  SET revogada = true
  WHERE usuario_id = user_id
    AND revogada = false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. CREATE TRIGGERS
-- ============================================

CREATE TRIGGER trigger_usuarios_atualizado_em
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trigger_pacientes_atualizado_em
BEFORE UPDATE ON pacientes
FOR EACH ROW
EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trigger_imagens_atualizado_em
BEFORE UPDATE ON imagens
FOR EACH ROW
EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trigger_lesoes_atualizado_em
BEFORE UPDATE ON lesoes
FOR EACH ROW
EXECUTE FUNCTION update_atualizado_em();

-- ============================================
-- 6. CREATE VIEWS
-- ============================================

CREATE OR REPLACE VIEW vw_imagens_completas AS
SELECT
  i.id,
  i.file_name,
  i.file_path,
  i.sha256,
  i.descricao,
  i.analisada,
  i.resultado_diagnostico,
  i.classificacao_sugerida,
  i.confianca,
  i.data_envio,
  i.criado_em,
  p.id as paciente_id,
  p.nome as paciente_nome,
  p.cpf as paciente_cpf,
  p.data_nascimento as paciente_data_nascimento,
  u.id as usuario_id,
  u.nome as usuario_nome,
  u.email as usuario_email,
  u.role as usuario_role
FROM imagens i
LEFT JOIN pacientes p ON i.paciente_id = p.id
LEFT JOIN usuarios u ON i.usuario_id = u.id;

CREATE OR REPLACE VIEW vw_estatisticas AS
SELECT
  (SELECT COUNT(*) FROM usuarios WHERE ativo = true) as usuarios_ativos,
  (SELECT COUNT(*) FROM pacientes) as total_pacientes,
  (SELECT COUNT(*) FROM imagens) as total_imagens,
  (SELECT COUNT(*) FROM imagens WHERE analisada = true) as imagens_analisadas,
  (SELECT COUNT(*) FROM imagens WHERE analisada = false) as imagens_pendentes,
  (SELECT COUNT(*) FROM lesoes) as total_lesoes,
  (SELECT COUNT(DISTINCT classificacao) FROM lesoes) as tipos_lesoes;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Schema inicial criado com sucesso!';
  RAISE NOTICE '📊 Tabelas: usuarios, pacientes, imagens, lesoes, sessoes';
  RAISE NOTICE '🔍 Índices vetoriais HNSW criados';
  RAISE NOTICE '🔑 Sistema JWT pronto';
END $$;
