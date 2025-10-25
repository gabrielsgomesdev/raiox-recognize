# 🗄️ Setup do Banco de Dados PostgreSQL

Guia completo para configuração do banco de dados PostgreSQL + pgvector para o RaioX Recognize.

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 18+ instalado
- OpenAI API Key

## 🚀 Setup Rápido (5 minutos)

```bash
# 1. Clone o repositório (se ainda não fez)
cd back-end

# 2. Configure as variáveis de ambiente
cp .env.example .env

# 3. Edite o .env e adicione sua OpenAI API Key
nano .env  # ou use seu editor preferido

# 4. Inicie o PostgreSQL
docker-compose up -d postgres

# 5. Aguarde o banco inicializar (30-60 segundos)
docker-compose logs -f postgres

# 6. Verifique se funcionou
docker exec raiox-postgres psql -U raiox_user -d raiox_recognize -c "\dt"

# 7. Instale as dependências do Node.js
npm install

# 8. Inicie o servidor
npm run dev
```

✅ Pronto! O banco está configurado com:
- Todas as tabelas criadas
- Índices vetoriais HNSW
- Usuário admin criado
- Funções de busca por similaridade

## 🔧 Configuração Detalhada

### 1. Variáveis de Ambiente

Edite o arquivo `.env` com suas configurações:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=raiox_recognize
DB_USER=raiox_user
DB_PASSWORD=raiox_password_dev  # ⚠️ Altere em produção!

# OpenAI
OPENAI_API_KEY=sk-...  # Sua chave da OpenAI

# JWT
JWT_SECRET=gere_uma_chave_secreta_aqui_min_32_caracteres
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Server
PORT=3000
NODE_ENV=development
```

### 2. Gerar JWT Secret

```bash
# Linux/Mac
openssl rand -base64 64

# Windows PowerShell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### 3. Iniciar o Banco de Dados

```bash
# Inicia apenas o PostgreSQL
docker-compose up -d postgres

# Ver logs em tempo real
docker-compose logs -f postgres

# Você deve ver:
# ✅ Schema inicial criado com sucesso!
# 📊 Tabelas: usuarios, pacientes, imagens, lesoes, sessoes
# 🔍 Índices vetoriais HNSW criados
# 👥 Usuários criados: 3
```

### 4. Verificar Instalação

```bash
# Conectar ao banco
docker exec -it raiox-postgres psql -U raiox_user -d raiox_recognize

# Dentro do psql, execute:
\dt                          # Listar tabelas
\df match_*                  # Listar funções de busca
SELECT * FROM usuarios;      # Ver usuários criados
SELECT * FROM vw_estatisticas;  # Ver estatísticas
\q                           # Sair
```

## 🔄 Migração do Supabase

Se você está migrando dados do Supabase:

### Passo 1: Exportar Dados do Supabase

1. Acesse o **Supabase SQL Editor**
2. Execute esta query:

```sql
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
```

3. Salve o resultado em: `migrations/data/lesoes_export.csv`

### Passo 2: Importar para PostgreSQL Local

```bash
# 1. Certifique-se de que o arquivo CSV está em migrations/data/

# 2. Edite migrations/002_transfer_lesoes_data.sql
# Descomente a seção "OPTION 2: Using CSV Import"

# 3. Ajuste o caminho do arquivo no script

# 4. Execute a migration
docker exec -i raiox-postgres psql -U raiox_user -d raiox_recognize < migrations/002_transfer_lesoes_data.sql
```

### Passo 3: Validar Migração

```sql
-- Conecte ao banco
docker exec -it raiox-postgres psql -U raiox_user -d raiox_recognize

-- Verifique quantas lesões foram importadas
SELECT * FROM count_lesoes_stats();

-- Verifique distribuição de classificações
SELECT
  classificacao,
  COUNT(*) as quantidade
FROM lesoes
GROUP BY classificacao
ORDER BY quantidade DESC;

-- Teste busca de similaridade
SELECT * FROM match_lesoes(
  (SELECT embedding FROM lesoes LIMIT 1),
  5
);
```

## 👤 Usuários Padrão

| Email | Senha | Role | Descrição |
|-------|-------|------|-----------|
| admin@raiox.com | Admin@123 | admin | Administrador do sistema |
| joao.silva@raiox.com | Doctor@123 | doctor | Médico exemplo |
| maria.santos@raiox.com | Nurse@123 | nurse | Enfermeira exemplo |

**⚠️ IMPORTANTE: Altere essas senhas antes de usar em produção!**

### Como Alterar Senhas

```sql
-- Conecte ao banco
docker exec -it raiox-postgres psql -U raiox_user -d raiox_recognize

-- Atualize a senha (substitua o hash pelo gerado no Node.js)
UPDATE usuarios
SET senha_hash = '$2b$10$SEU_HASH_BCRYPT_AQUI'
WHERE email = 'admin@raiox.com';
```

Gerar hash no Node.js:

```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('MinhaNovaSenh@123', 10);
console.log(hash);
```

## 🔍 Testar o Sistema

### 1. Testar Busca de Similaridade

```javascript
// No seu código Node.js
import { pool } from './src/config/database.js';

// Gerar embedding de teste
const testEmbedding = Array(1536).fill(0.5);

// Buscar lesões similares
const result = await pool.query(
  'SELECT * FROM match_lesoes($1, 5)',
  [JSON.stringify(testEmbedding)]
);

console.log(result.rows);
```

### 2. Testar Autenticação JWT

```bash
# Teste login via API (quando implementar)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@raiox.com","password":"Admin@123"}'
```

## 🛠️ Comandos Úteis

### Docker

```bash
# Iniciar banco
docker-compose up -d postgres

# Parar banco
docker-compose stop postgres

# Ver logs
docker-compose logs -f postgres

# Reiniciar banco
docker-compose restart postgres

# Remover banco (⚠️ APAGA TUDO!)
docker-compose down -v
```

### Backup e Restore

```bash
# Backup completo
docker exec raiox-postgres pg_dump -U raiox_user raiox_recognize > backup_$(date +%Y%m%d).sql

# Backup apenas dados
docker exec raiox-postgres pg_dump -U raiox_user -a raiox_recognize > dados_backup.sql

# Restore
docker exec -i raiox-postgres psql -U raiox_user -d raiox_recognize < backup_20250125.sql
```

### Queries de Manutenção

```sql
-- Limpar sessões expiradas
SELECT cleanup_expired_sessions();

-- Revogar todas as sessões de um usuário
SELECT revoke_user_sessions('uuid-do-usuario');

-- Ver tamanho do banco
SELECT pg_size_pretty(pg_database_size('raiox_recognize'));

-- Ver tamanho das tabelas
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🐛 Troubleshooting

### Porta 5432 já está em uso

```bash
# Descubra qual processo está usando
# Windows
netstat -ano | findstr :5432

# Linux/Mac
lsof -i :5432

# Solução 1: Pare o outro PostgreSQL
# Solução 2: Mude a porta no docker-compose.yml para "5433:5432"
```

### Migrations não executaram

```bash
# Execute manualmente
docker exec -i raiox-postgres psql -U raiox_user -d raiox_recognize < migrations/001_initial_schema.sql
docker exec -i raiox-postgres psql -U raiox_user -d raiox_recognize < migrations/003_seed_initial_data.sql
```

### Erro "extension vector does not exist"

```bash
# Verifique se está usando a imagem correta
docker-compose down
# Edite docker-compose.yml e certifique-se: image: pgvector/pgvector:pg16
docker-compose up -d postgres
```

### Não consigo conectar do Node.js

Verifique:
1. `.env` tem as credenciais corretas
2. Container está rodando: `docker ps`
3. Porta está aberta: `telnet localhost 5432`

## 📚 Próximos Passos

1. ✅ Configurar autenticação JWT no backend
2. ✅ Criar rotas de login/logout
3. ✅ Implementar middleware de autenticação
4. ✅ Criar endpoints CRUD para pacientes e imagens
5. ✅ Integrar busca de similaridade nas rotas

Veja `CLAUDE.md` para mais informações sobre a arquitetura do projeto.

## 🔗 Links Úteis

- [Documentação pgvector](https://github.com/pgvector/pgvector)
- [PostgreSQL 16 Docs](https://www.postgresql.org/docs/16/)
- [HNSW Index](https://github.com/pgvector/pgvector#hnsw)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)

---

**Dúvidas?** Consulte o `migrations/README.md` para informações detalhadas sobre as migrations.
