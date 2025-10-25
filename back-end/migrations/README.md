# Database Migrations

Este diretório contém todos os scripts SQL para criação e manutenção do banco de dados PostgreSQL do RaioX Recognize.

## 📋 Ordem de Execução

As migrations são executadas automaticamente em ordem alfabética quando o container PostgreSQL é iniciado pela primeira vez:

1. **001_initial_schema.sql** - Cria todas as tabelas, índices, funções e triggers
2. **002_transfer_lesoes_data.sql** - Scripts para transferir dados da base antiga (Supabase)
3. **003_seed_initial_data.sql** - Insere dados iniciais (usuário admin, etc)

## 🚀 Como Usar

### Primeira Vez (Setup Inicial)

```bash
# 1. Copie o arquivo de exemplo de variáveis de ambiente
cp .env.example .env

# 2. Edite o .env com suas configurações
nano .env

# 3. Inicie o PostgreSQL via Docker
docker-compose up -d postgres

# 4. Aguarde o banco inicializar (migrations serão executadas automaticamente)
docker-compose logs -f postgres

# Você verá mensagens como:
# ✅ Schema inicial criado com sucesso!
# ✅ Dados iniciais inseridos com sucesso!
```

### Verificar Status do Banco

```bash
# Conectar ao PostgreSQL
docker exec -it raiox-postgres psql -U raiox_user -d raiox_recognize

# Dentro do psql:
\dt                    # Listar tabelas
\df                    # Listar funções
\dv                    # Listar views
\q                     # Sair
```

### Executar Queries Manualmente

```bash
# Executar arquivo SQL
docker exec -i raiox-postgres psql -U raiox_user -d raiox_recognize < seu_script.sql

# Executar query direta
docker exec raiox-postgres psql -U raiox_user -d raiox_recognize -c "SELECT COUNT(*) FROM usuarios;"
```

## 📦 Estrutura do Banco de Dados

### Tabelas Principais

- **usuarios** - Médicos e enfermeiros que usam o sistema
- **pacientes** - Pacientes com imagens analisadas
- **imagens** - Imagens de pacientes para análise
- **lesoes** - Catálogo de lesões conhecidas (base de conhecimento)
- **sessoes** - Controle de sessões JWT

### Índices Vetoriais

O banco usa **pgvector** com índices HNSW para busca rápida de similaridade:

- `idx_imagens_embedding` - Busca de imagens similares
- `idx_lesoes_embedding` - Busca de lesões similares

### Funções Principais

- `match_lesoes(embedding, count, filter)` - Busca lesões similares
- `match_imagens(embedding, count, paciente)` - Busca imagens similares
- `cleanup_expired_sessions()` - Remove sessões expiradas
- `revoke_user_sessions(user_id)` - Revoga todas as sessões de um usuário

## 🔄 Transferência de Dados do Supabase

Se você está migrando do Supabase, siga os passos em `002_transfer_lesoes_data.sql`:

### Opção 1: Export/Import via CSV (Recomendado)

```bash
# 1. No Supabase SQL Editor, execute:
COPY (
  SELECT file_name, sha256, description, embedding, created_at
  FROM imagens
  WHERE embedding IS NOT NULL
) TO STDOUT WITH CSV HEADER;

# 2. Salve o resultado em: migrations/data/lesoes_export.csv

# 3. Descomente a seção OPTION 2 em 002_transfer_lesoes_data.sql

# 4. Re-execute as migrations ou execute manualmente:
docker exec -i raiox-postgres psql -U raiox_user -d raiox_recognize < migrations/002_transfer_lesoes_data.sql
```

### Validação Pós-Migração

```sql
-- Ver estatísticas
SELECT * FROM count_lesoes_stats();

-- Ver distribuição de classificações
SELECT
  classificacao,
  COUNT(*) as quantidade,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM lesoes), 2) as percentual
FROM lesoes
GROUP BY classificacao
ORDER BY quantidade DESC;

-- Verificar dimensões dos vetores
SELECT
  file_name,
  vector_dims(embedding) as dimensoes
FROM lesoes
WHERE embedding IS NOT NULL
LIMIT 10;
```

## 🔐 Usuários Padrão

Os seguintes usuários são criados automaticamente (definidos em `003_seed_initial_data.sql`):

| Email | Senha | Role |
|-------|-------|------|
| admin@raiox.com | Admin@123 | admin |
| joao.silva@raiox.com | Doctor@123 | doctor |
| maria.santos@raiox.com | Nurse@123 | nurse |

**⚠️ IMPORTANTE:** Altere essas senhas em produção!

### Gerar Hash de Senha (bcrypt)

```javascript
// No Node.js
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('MinhaSenh@123', 10);
console.log(hash);

// Substitua os hashes em 003_seed_initial_data.sql
```

## 🛠️ Manutenção

### Adicionar Nova Migration

```bash
# Crie um novo arquivo com numeração sequencial
touch migrations/004_nome_da_migration.sql

# Edite o arquivo com suas alterações
nano migrations/004_nome_da_migration.sql

# Para aplicar em banco existente:
docker exec -i raiox-postgres psql -U raiox_user -d raiox_recognize < migrations/004_nome_da_migration.sql
```

### Reset Completo do Banco

```bash
# CUIDADO: Isso apaga TODOS os dados!

# Para no container
docker-compose down

# Remove o volume de dados
docker volume rm back-end_postgres_data

# Inicia novamente (migrations serão re-executadas)
docker-compose up -d postgres
```

### Backup e Restore

```bash
# Backup
docker exec raiox-postgres pg_dump -U raiox_user raiox_recognize > backup.sql

# Restore
docker exec -i raiox-postgres psql -U raiox_user -d raiox_recognize < backup.sql
```

## 🐛 Troubleshooting

### Migration não executou

```bash
# Verifique os logs
docker-compose logs postgres

# Execute manualmente
docker exec -i raiox-postgres psql -U raiox_user -d raiox_recognize < migrations/001_initial_schema.sql
```

### Erro "vector dimension mismatch"

Certifique-se de que todos os embeddings têm exatamente 1536 dimensões (OpenAI text-embedding-3-small).

### Erro "extension vector does not exist"

A imagem Docker `pgvector/pgvector:pg16` já inclui a extensão. Se estiver usando outra imagem, instale pgvector manualmente.

### Permissões negadas

```bash
# Conceda permissões ao usuário
docker exec raiox-postgres psql -U postgres -d raiox_recognize -c "
  GRANT ALL PRIVILEGES ON DATABASE raiox_recognize TO raiox_user;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO raiox_user;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO raiox_user;
"
```

## 📚 Recursos Adicionais

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [PostgreSQL 16 Documentation](https://www.postgresql.org/docs/16/)
- [HNSW Index](https://github.com/pgvector/pgvector#hnsw)
- [Vector Operations](https://github.com/pgvector/pgvector#vector-operations)

## 🔍 Queries Úteis

```sql
-- Ver tamanho das tabelas
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver performance dos índices vetoriais
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE indexname LIKE '%embedding%';

-- Testar busca de similaridade
SELECT * FROM match_lesoes(
  (SELECT embedding FROM lesoes LIMIT 1),
  5
);

-- Ver sessões ativas
SELECT
  s.id,
  u.nome,
  u.email,
  s.ip_address,
  s.created_at,
  s.expires_at
FROM sessoes s
JOIN usuarios u ON s.usuario_id = u.id
WHERE s.revogada = false
  AND s.expires_at > NOW()
ORDER BY s.created_at DESC;
```
