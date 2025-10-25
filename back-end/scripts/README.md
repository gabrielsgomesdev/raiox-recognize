# 📥 Script de Importação de Lesões

Script automatizado para processar e importar **2.298 imagens de lesões** do arquivo `metadata.csv` para o banco de dados PostgreSQL.

## 🎯 O que ele faz?

Para cada imagem no `metadata.csv`, o script:

1. ✅ Lê a imagem do diretório `imagens-lesoes/`
2. ✅ Calcula hash SHA-256 para deduplicação
3. ✅ **Gera descrição a partir do metadata.csv** (sem usar Vision API!)
4. ✅ Gera **embedding vetorial** (1536 dimensões) da descrição via OpenAI
5. ✅ Insere no PostgreSQL na tabela `lesoes`
6. ✅ Salva checkpoint automático para retomar se falhar

**Nota:** O script não usa OpenAI Vision porque já temos todos os metadados no CSV!

## 📋 Pré-requisitos

### 1. Banco de Dados Configurado

```bash
# Inicie o PostgreSQL
docker-compose up -d postgres

# Verifique se está rodando
docker ps
```

### 2. Variáveis de Ambiente

Certifique-se de que o `.env` está configurado:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=raiox_recognize
DB_USER=raiox_user
DB_PASSWORD=raiox_password_dev

# OpenAI
OPENAI_API_KEY=sk-...  # SUA CHAVE AQUI
OPENAI_VISION_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### 3. Organizar Arquivos

**Estrutura esperada:**

```
back-end/
├── migrations/
│   └── data/
│       └── metadata.csv          ← Já está aqui ✅
├── imagens-lesoes/               ← Coloque as imagens AQUI
│   ├── PAT_1516_1765_530.png
│   ├── PAT_46_881_939.png
│   ├── PAT_1545_1867_547.png
│   └── ... (2.298 imagens)
└── scripts/
    └── import-lesoes.ts
```

**⚠️ IMPORTANTE:** Mova a pasta de 3GB de imagens para `back-end/imagens-lesoes/`

## 🚀 Como Usar

### Execução Completa

```bash
# Rode o script
npm run import:lesoes
```

O script vai:
- Processar em **batches de 10 imagens** por vez
- Aguardar **5 segundos** entre batches (rate limiting)
- Salvar checkpoint a cada batch
- Mostrar progresso em tempo real

### Saída Esperada

```
🚀 Iniciando importação de lesões...

📖 Lendo CSV...
📊 Total de registros no CSV: 2298
📋 A processar: 2298

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 BATCH 1/46
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[0] Processando: PAT_1516_1765_530.png
   📁 Calculando hash da imagem...
   📝 Gerando descrição a partir do metadata...
   📄 Descrição: Lesão classificada como nevo_benigno localizada na região: braço...
   🧮 Gerando embedding...
   💾 Inserindo no banco...
   ✅ Sucesso!

[1] Processando: PAT_46_881_939.png
   📁 Calculando hash da imagem...
   📝 Gerando descrição a partir do metadata...
   ...

📊 Progresso: 2.2% (50/2298)
✅ Processados: 50
❌ Erros: 0

⏳ Aguardando 2s antes do próximo batch...
```

## ⚙️ Configurações

Edite `scripts/import-lesoes.ts` se necessário:

```typescript
const CONFIG = {
  // Processar 50 imagens por vez (otimizado sem Vision API)
  batchSize: 50,

  // Aguardar 2 segundos entre batches
  delayBetweenBatches: 2000,

  // Tentar 3 vezes se der erro
  maxRetries: 3,

  // Modelo OpenAI
  embeddingModel: 'text-embedding-3-small',
};
```

## 🔄 Sistema de Checkpoint

O script salva automaticamente o progresso em `.import-checkpoint.json`.

### Retomar Importação Interrompida

Se o script parar por qualquer motivo (erro, Ctrl+C, etc):

```bash
# Simplesmente rode novamente
npm run import:lesoes

# Você verá:
📍 Checkpoint encontrado!
   Retomando do índice: 145
   Processados até agora: 145
   Erros até agora: 2
```

### Recomeçar do Zero

```bash
# Delete o checkpoint
rm scripts/.import-checkpoint.json

# Rode novamente
npm run import:lesoes
```

## 🛠️ Troubleshooting

### ❌ Erro: "Diretório de imagens não encontrado"

```bash
# Certifique-se de que a pasta existe
mkdir imagens-lesoes

# Mova as imagens para lá
# No Windows: Copie a pasta para G:\projetos\raiox-recognize\back-end\imagens-lesoes\
```

### ❌ Erro: "OPENAI_API_KEY not found"

```bash
# Edite o .env e adicione sua chave
nano .env

# Adicione:
OPENAI_API_KEY=sk-sua-chave-aqui
```

### ❌ Erro: "Connection refused" (PostgreSQL)

```bash
# Inicie o banco
docker-compose up -d postgres

# Aguarde 30 segundos
sleep 30

# Tente novamente
npm run import:lesoes
```

### ❌ Erro: "Rate limit exceeded" (OpenAI)

O script já tem rate limiting (5s entre batches). Se mesmo assim der erro:

1. Aumente o delay:
   ```typescript
   delayBetweenBatches: 10000, // 10 segundos
   ```

2. Reduza o batch size:
   ```typescript
   batchSize: 5, // Processar 5 por vez
   ```

### ❌ Muitas imagens duplicadas (SHA256)

Isso é normal! O script pula automaticamente imagens duplicadas.

```
   ⏭️  Já existe no banco (SHA256 duplicado)
```

## 📊 Custos Estimados da OpenAI

**Para 2.298 imagens:**

- **Embeddings API (text-embedding-3-small):**
  - ~2.298 requests × $0.00002/request = **~$0.05 USD** ✅

**Total estimado: ~$0.05 USD** (85% mais barato que usar Vision API!)

⚠️ **Nota:** Não usamos Vision API porque já temos metadados completos no CSV.

## ⏱️ Tempo Estimado

- **Batch de 50 imagens** = ~10-15 segundos (só embeddings)
- **Total de 46 batches** = ~7-11 minutos

Com pausas de 2s entre batches:
- **~46 batches × 12s** = ~9 minutos
- **+ 46 × 2s pausa** = +1.5 minutos
- **Total: ~10-15 minutos** ⚡

💡 **Muito mais rápido!** Sem Vision API, o processo é 12x mais rápido!

## 📈 Acompanhamento em Tempo Real

### Ver quantas lesões foram inseridas

```bash
# Conecte ao banco
docker exec -it raiox-postgres psql -U raiox_user -d raiox_recognize

# Conte as lesões
SELECT COUNT(*) FROM lesoes;

# Veja distribuição de diagnósticos
SELECT
  classificacao,
  COUNT(*) as quantidade
FROM lesoes
GROUP BY classificacao
ORDER BY quantidade DESC;
```

### Ver checkpoint atual

```bash
cat scripts/.import-checkpoint.json
```

## ✅ Validação Pós-Importação

Após concluir, valide os dados:

```sql
-- Conecte ao banco
docker exec -it raiox-postgres psql -U raiox_user -d raiox_recognize

-- 1. Total de lesões
SELECT COUNT(*) as total FROM lesoes;
-- Esperado: ~2298 (pode ser menos se houver duplicatas)

-- 2. Lesões com embedding
SELECT COUNT(*) as com_embedding
FROM lesoes
WHERE embedding IS NOT NULL;
-- Esperado: Igual ao total

-- 3. Distribuição por classificação
SELECT
  classificacao,
  COUNT(*) as qtd,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM lesoes), 1) as pct
FROM lesoes
GROUP BY classificacao
ORDER BY qtd DESC;

-- 4. Testar busca de similaridade
SELECT * FROM match_lesoes(
  (SELECT embedding FROM lesoes LIMIT 1),
  5
);
-- Deve retornar 5 lesões similares
```

## 🔍 Diagnósticos Mapeados

O script mapeia automaticamente os códigos do CSV:

| Código CSV | Diagnóstico Completo | Severidade |
|-----------|---------------------|------------|
| BCC | carcinoma_basocelular | moderado |
| SCC | carcinoma_espinocelular | grave |
| MEL | melanoma_maligno | grave |
| NEV | nevo_benigno | leve |
| ACK | queratose_actinica | leve |
| SEK | queratose_seborreica | leve |

## 📝 Logs e Debug

Os logs são impressos em tempo real no console. Para salvar em arquivo:

```bash
# Salvar logs em arquivo
npm run import:lesoes 2>&1 | tee import-log.txt

# Ver apenas erros
npm run import:lesoes 2>&1 | grep "❌"
```

## 🚨 Em Caso de Emergência

### Parar a Importação

```bash
# Ctrl+C no terminal

# O checkpoint será salvo automaticamente
```

### Reverter Importação (CUIDADO!)

```sql
-- Conecte ao banco
docker exec -it raiox-postgres psql -U raiox_user -d raiox_recognize

-- Delete todas as lesões (⚠️ NÃO PODE SER DESFEITO!)
TRUNCATE TABLE lesoes;

-- Ou delete apenas as importadas hoje:
DELETE FROM lesoes WHERE criado_em::date = CURRENT_DATE;
```

## 🎉 Após Importação Bem-Sucedida

1. ✅ Checkpoint será automaticamente removido
2. ✅ Você verá estatísticas finais:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 IMPORTAÇÃO CONCLUÍDA!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Total processado: 2285
❌ Total de erros: 13
⏱️  Iniciado em: 2025-01-25T14:30:00.000Z
⏱️  Finalizado em: 2025-01-25T17:45:00.000Z
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗑️  Checkpoint removido (importação completa)
```

3. ✅ Agora você pode usar a busca por similaridade!

```bash
# Teste a API de busca
curl -X POST http://localhost:3000/buscar-similares \
  -H "Content-Type: application/json" \
  -d '{"query":"melanoma maligno com bordas irregulares","k":5}'
```

---

**Dúvidas?** Consulte `CLAUDE.md` ou `SETUP_DATABASE.md` para mais informações.
