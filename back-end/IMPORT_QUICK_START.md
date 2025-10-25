# 🚀 Quick Start - Importação de Lesões

Guia rápido para importar as 2.298 imagens de lesões do metadata.csv.

## ✅ Checklist Pré-Execução

- [ ] PostgreSQL rodando (`docker-compose up -d postgres`)
- [ ] `.env` configurado com `OPENAI_API_KEY`
- [ ] Pasta `imagens-lesoes/` criada
- [ ] 3GB de imagens movidos para `imagens-lesoes/`
- [ ] `metadata.csv` em `migrations/data/` ✅ (já está)

## 📁 Estrutura de Arquivos

```
back-end/
├── .env                          ← Configure OPENAI_API_KEY aqui
├── migrations/
│   └── data/
│       └── metadata.csv          ← ✅ Já está aqui
├── imagens-lesoes/               ← ⚠️ COLOQUE AS IMAGENS AQUI
│   ├── PAT_1516_1765_530.png
│   ├── PAT_46_881_939.png
│   └── ... (2.298 arquivos)
└── scripts/
    └── import-lesoes.ts
```

## 🎬 3 Comandos para Importar Tudo

```bash
# 1. Mover imagens (Windows)
# Copie sua pasta de imagens para: G:\projetos\raiox-recognize\back-end\imagens-lesoes\

# 2. Verificar se o banco está rodando
docker ps | grep raiox-postgres

# 3. Rodar importação
npm run import:lesoes
```

Pronto! O script vai processar automaticamente todas as 2.298 imagens.

## ⏱️ Tempo Estimado

- **~10-15 minutos** para processar tudo ⚡
- **~$0.05 USD** de custo na OpenAI API (só embeddings!)
- Progresso salvo automaticamente (pode parar e retomar)
- **Sem Vision API** - usa metadados do CSV

## 📊 Acompanhar Progresso

```bash
# Em outro terminal, veja quantas foram processadas
docker exec -it raiox-postgres psql -U raiox_user -d raiox_recognize -c "SELECT COUNT(*) FROM lesoes;"
```

## 🔄 Retomar se Parar

```bash
# Se o script parar, simplesmente rode de novo
npm run import:lesoes

# Ele vai continuar de onde parou!
```

## ✅ Validar Importação

```bash
# Conecte ao banco
docker exec -it raiox-postgres psql -U raiox_user -d raiox_recognize

# Veja total
SELECT COUNT(*) FROM lesoes;

# Veja distribuição
SELECT classificacao, COUNT(*) FROM lesoes GROUP BY classificacao;

# Teste busca de similaridade
SELECT * FROM match_lesoes(
  (SELECT embedding FROM lesoes LIMIT 1),
  5
);
```

## 🆘 Problemas Comuns

### Erro: "Diretório de imagens não encontrado"

```bash
mkdir imagens-lesoes
# Depois mova as imagens para lá
```

### Erro: "OPENAI_API_KEY not found"

```bash
# Edite .env e adicione:
nano .env
# OPENAI_API_KEY=sk-sua-chave-aqui
```

### Banco não conecta

```bash
docker-compose up -d postgres
sleep 30  # Aguarde inicializar
npm run import:lesoes
```

---

**📖 Documentação Completa:** `scripts/README.md`

**🗄️ Setup do Banco:** `SETUP_DATABASE.md`
