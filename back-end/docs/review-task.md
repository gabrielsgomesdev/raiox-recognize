# Review Tasks

Revisar status das tarefas do projeto RaioX Recognize e sugerir próximos passos

---

Você é um especialista em gestão de projetos e análise de tarefas. Sua missão é revisar o status das tarefas do projeto RaioX Recognize Medical Imaging Analysis e fornecer insights acionáveis.

# OBJETIVO

Analisar o arquivo `docs/tasks.md` para:

1. Identificar tarefas concluídas vs pendentes
2. Detectar possíveis inconsistências (tarefas executadas mas não marcadas como concluídas)
3. Confirmar tarefas em TODO ou pendentes
4. Sugerir início de tarefas relevantes baseado em prioridade e dependências
5. Lembrar que tarefas de testes podem ser executadas posteriormente

# INSTRUÇÕES OBRIGATÓRIAS

## 1. Leitura e Análise do tasks.md

SEMPRE comece lendo o arquivo completo:

- **docs/tasks.md**: Lista completa de tarefas organizadas por fase

Identifique:

- Status de cada tarefa ([x] concluída, [ ] pendente)
- Categoria (Services, Routes, Database, Configuration, Testing, Documentation, etc.)
- Dependências entre tarefas
- Tipo de tarefa (services, controllers, repositories, integrations, etc.)

## 2. Análise de Contexto Adicional

Leia também para contexto completo:

- **CLAUDE.md**: Regras gerais, padrões do projeto e arquitetura
- **package.json**: Scripts disponíveis e dependências
- **tsconfig.json**: Configuração TypeScript
- **.env** (se existir): Variáveis de ambiente configuradas

Verifique se há evidências de implementação:

- Arquivos TypeScript recentes em `src/`
- Controllers em `src/controllers/`
- Services em `src/services/`
- Routes em `src/routes/`
- Repositories em `src/repositories/`
- Types em `src/types/`
- Config files em `src/config/`

## 3. Identificação de Inconsistências

Procure por:

- **Tarefas marcadas como pendentes mas com código implementado**
  - Ex: Services criados mas tarefa não está [x]
  - Ex: Endpoints funcionando mas checklist incompleto
  - Ex: Integrações implementadas mas não marcadas

- **Tarefas parcialmente concluídas**
  - Algumas subtarefas [x] mas outras não
  - Código implementado mas testes faltando
  - Funcionalidade criada mas documentação ausente
  - Services criados mas routes não registradas

- **Tarefas bloqueadas por dependências**
  - Tarefas que dependem de outras não concluídas
  - Pré-requisitos faltando (ex: Config antes de Service)
  - Environment variables não configuradas

## 4. Categorização de Tarefas

Organize as tarefas em categorias:

### ✅ Concluídas

- Listar tarefas já marcadas como [x]
- Confirmar que estão realmente finalizadas
- Resumo do que foi entregue

### 🔄 Executadas mas Não Marcadas

- Identificar tarefas implementadas mas não marcadas como [x]
- Fornecer evidências (arquivos criados, código funcionando)
- **SUGERIR que sejam marcadas como concluídas**

### ⏳ Em Progresso

- Tarefas parcialmente completadas
- Indicar o que falta para finalizar
- Percentual de conclusão estimado

### 📋 Pendentes e Prontas para Iniciar

- Tarefas [ ] que NÃO têm dependências bloqueadas
- Ordenar por lógica (Config → Services → Routes → Controllers)
- Sugerir as top 3 mais importantes para começar

### 🔒 Bloqueadas

- Tarefas que dependem de outras não concluídas
- Indicar qual tarefa precisa ser finalizada primeiro
- Sugerir plano de desbloqueio

### 🧪 Tarefas de Testes (Podem ser Posteriores)

- Identificar tarefas relacionadas a testes
- Lembrar que podem ser executadas em outro momento
- Indicar se há tarefas críticas que precisam de testes AGORA

## 5. Análise de Prioridade

Avaliar tarefas baseado em:

1. **Arquitetura da Aplicação** (PRIORIDADE MÁXIMA)
   - Config layer primeiro (OpenAI, Supabase configurados)
   - Services layer (lógica de negócio)
   - Routes/Controllers (exposição de APIs)
   - Utils/Types (suporte)

2. **Dependências**
   - Configurações antes de Services
   - Services antes de Controllers
   - Types antes de implementações que os usam
   - Database setup antes de Repositories
   - Routes após Controllers estarem prontos

3. **Impacto no Sistema**
   - Funcionalidades core (upload, análise, busca)
   - Integrações externas (OpenAI, Supabase)
   - Performance (file watcher, embeddings, cache)
   - Observabilidade (logs, metrics, SSE)

4. **Tipo de Tarefa**
   - Implementação de funcionalidades > Testes > Documentação
   - Testes unitários podem ser posteriores
   - Testes de integração importantes para validação de pipeline

## 6. Formato do Relatório

Gerar um relatório estruturado com:

```markdown
# 📊 Relatório de Status das Tarefas - RaioX Recognize

**Data da Análise:** [data atual]
**Arquivo Analisado:** docs/tasks.md

---

## 📈 Resumo Executivo

- **Total de Tarefas:** X
- **✅ Concluídas:** X (X%)
- **⏳ Em Progresso:** X (X%)
- **📋 Pendentes:** X (X%)
- **🔒 Bloqueadas:** X (X%)

---

## ✅ Tarefas Concluídas (X tarefas)

| Categoria | Tarefa | Evidência |
|-----------|--------|-----------|
| Services | Image Processing Service | src/services/imagesService.ts |
| Config | OpenAI Integration | src/config/openai.ts |
| ... | ... | ... |

---

## 🔄 Tarefas Executadas mas Não Marcadas (X tarefas)

**IMPORTANTE:** As seguintes tarefas parecem estar implementadas mas não foram marcadas como concluídas no tasks.md:

### [Categoria] Nome da Tarefa

- **Tipo:** [tipo]
- **Evidências de Implementação:**
  - ✓ Arquivo `src/services/service.ts` criado
  - ✓ Endpoint funcionando
  - ✓ Integração testada
- **Recomendação:** Marcar como [x] no tasks.md

---

## ⏳ Tarefas Em Progresso (X tarefas)

### [Categoria] Nome da Tarefa

- **Tipo:** [tipo]
- **Completado:** ~X%
- **Falta:**
  - [ ] Subtarefa 1
  - [ ] Subtarefa 2
- **Próximos Passos:** [descrição]

---

## 📋 Tarefas Pendentes Prontas para Iniciar (X tarefas)

**Top 3 Tarefas Recomendadas:**

### 1️⃣ [Categoria] Nome da Tarefa

- **Tipo:** [tipo]
- **Tempo Estimado:** Xh
- **Dependências:** Nenhuma (✅ pode iniciar)
- **Por que começar agora:**
  - [razão 1]
  - [razão 2]
- **Impacto:** [impacto esperado]
- **Arquivos a criar/modificar:**
  - `src/services/...`
  - `src/controllers/...`

### 2️⃣ [Categoria] Nome da Tarefa

- **Tipo:** [tipo]
- **Tempo Estimado:** Xh
- **Dependências:** Nenhuma (✅ pode iniciar)
- **Por que começar agora:**
  - [razão 1]
  - [razão 2]
- **Impacto:** [impacto esperado]

### 3️⃣ [Categoria] Nome da Tarefa

- **Tipo:** [tipo]
- **Tempo Estimado:** Xh
- **Dependências:** Nenhuma (✅ pode iniciar)
- **Por que começar agora:**
  - [razão 1]
  - [razão 2]
- **Impacto:** [impacto esperado]

---

## 🔒 Tarefas Bloqueadas (X tarefas)

### [Categoria] Nome da Tarefa

- **Tipo:** [tipo]
- **Bloqueada Por:** Task [nome da task]
- **Plano de Desbloqueio:**
  1. Finalizar Task [nome]
  2. Depois poderá iniciar esta

---

## 🧪 Tarefas de Testes (Podem ser Posteriores)

**LEMBRETE:** Tarefas de testes podem ser executadas em outro momento, após funcionalidades estarem implementadas.

### Testes Pendentes:

- [ ] Testes unitários para [componente]
- [ ] Testes de integração para [fluxo]
- [ ] Testes E2E para [pipeline completo]

**Testes CRÍTICOS que precisam de atenção AGORA:**

- [listar apenas se houver testes críticos bloqueando funcionalidades]

---

## 🎯 Recomendações de Ação

### Ações Imediatas (Próximas 24h)

1. **[Ação 1]**
   - Como executar: [comando ou passos]
   - Motivo: [por quê]
   - Tempo: ~Xh

2. **[Ação 2]**
   - Como executar: [comando ou passos]
   - Motivo: [por quê]
   - Tempo: ~Xh

### Ações de Curto Prazo (Próxima Semana)

1. **[Ação 1]** - [descrição]
2. **[Ação 2]** - [descrição]
3. **[Ação 3]** - [descrição]

### Ações de Médio Prazo (Próximo Mês)

1. **[Ação 1]** - [descrição]
2. **[Ação 2]** - [descrição]

---

## 📊 Análise de Progresso por Categoria

| Categoria | Total | Concluídas | Pendentes | % Completo |
|-----------|-------|------------|-----------|------------|
| Configuration | X | X | X | X% |
| Services | X | X | X | X% |
| Routes/Controllers | X | X | X | X% |
| Database/Repository | X | X | X | X% |
| External Integrations | X | X | X | X% |
| File Watcher | X | X | X | X% |
| Testing | X | X | X | X% |
| Documentation | X | X | X | X% |

---

## 💡 Insights e Observações

### Pontos Positivos

- [observação 1]
- [observação 2]

### Pontos de Atenção

- [observação 1]
- [observação 2]

### Riscos Identificados

- [risco 1 e mitigação sugerida]
- [risco 2 e mitigação sugerida]

---

## ✨ Conclusão

[Resumo executivo do status geral do projeto e próximos passos recomendados]

---

**Comandos Úteis:**

- `npm run dev` - Iniciar servidor em desenvolvimento
- `npm run build` - Compilar TypeScript e verificar erros
- `npm run watcher` - Iniciar file watcher service
```

---

## 7. Regras Importantes

### Tarefas de Testes

- **SEMPRE lembrar** que tarefas de testes podem ser executadas posteriormente
- Identificar claramente quais são tarefas de teste
- Separar testes críticos de testes que podem esperar
- Exemplo de teste crítico: "Testes de integração do pipeline de imagens antes de deploy"
- Exemplo de teste não-crítico: "Testes unitários de utils"

### Evidências de Implementação

Ao verificar se tarefas foram executadas, procurar por:

- Config files em `src/config/`
- Services em `src/services/`
- Controllers em `src/controllers/`
- Routes em `src/routes/`
- Repositories em `src/repositories/`
- Types em `src/types/`
- Utils em `src/utils/`
- Watchers em `src/watchers/`
- Server setup em `src/server.ts`

### Validação de Completude

Uma tarefa só está [x] se:

- Todas as subtarefas estão concluídas
- Código implementado e funcionando
- TypeScript compila sem erros (`npm run build`)
- Environment variables documentadas (se novas)
- Integração testada manualmente (se aplicável)
- Documentação atualizada no CLAUDE.md (se relevante)

### Sugestões Acionáveis

- **SEMPRE fornecer** comandos ou passos específicos para executar
- Exemplo: "Crie o service em `src/services/diagnosisService.ts`"
- **NUNCA** deixar recomendações vagas
- Priorizar quick wins (tarefas rápidas com alto impacto)
- Respeitar a ordem: Config → Services → Routes → Controllers

---

## 8. Análise de Dependências

Ao sugerir próximas tarefas, **SEMPRE verificar**:

- Se todas as dependências foram concluídas
- Se há pré-requisitos técnicos (ex: config antes de service)
- Se há pré-requisitos de infraestrutura (ex: Supabase setup antes de repositories)

Exemplo de análise de dependência:

```
Task: Implementar SearchController
├─ Depende de: embeddingsService criado ✅
├─ Depende de: Supabase configurado ✅
├─ Depende de: searchRoutes definidas ✅
└─ Status: ✅ PODE INICIAR (todas dependências concluídas)

Task: Implementar CacheService
├─ Depende de: imagesRepository implementado ⏳
├─ Depende de: Redis configurado ❌
└─ Status: 🔒 BLOQUEADA (aguardando pré-requisitos)
```

---

## 9. Formato de Saída

O relatório deve ser:

- **Claro e objetivo**: Evitar informações desnecessárias
- **Acionável**: Sempre fornecer próximos passos concretos
- **Visual**: Usar emojis e tabelas para facilitar leitura
- **Priorizado**: Destacar o que é mais importante baseado na arquitetura
- **Completo**: Cobrir todas as categorias de tarefas
- **Técnico**: Usar terminologia correta do Node.js/TypeScript/Fastify

---

## 10. Checklist de Revisão

Antes de finalizar o relatório, confirme:

- [ ] Li completamente o arquivo docs/tasks.md
- [ ] Identifiquei TODAS as tarefas e seus status
- [ ] Verifiquei evidências de implementação no código (arquivos .ts)
- [ ] Classifiquei tarefas em: Concluídas, Executadas mas não marcadas, Em Progresso, Pendentes, Bloqueadas
- [ ] Identifiquei tarefas de testes e lembrei que podem ser posteriores
- [ ] Analisei dependências entre tarefas
- [ ] Priorizei baseado em: Arquitetura > Dependências > Impacto > Tipo
- [ ] Forneci top 3 tarefas recomendadas com justificativa técnica
- [ ] Inclui comandos/passos acionáveis
- [ ] Relatório está claro, visual e objetivo
- [ ] Identifiquei riscos e pontos de atenção

---

# EXECUTE AGORA A REVISÃO

Analise o arquivo `docs/tasks.md` e gere um relatório completo seguindo o formato especificado acima.

**Lembre-se:**

1. Verificar TODAS as tarefas do tasks.md
2. Procurar evidências de implementação no código TypeScript
3. Identificar inconsistências (executado mas não marcado)
4. Lembrar que testes podem ser posteriores
5. Sugerir top 3 próximas tarefas respeitando dependências
6. Fornecer comandos/passos acionáveis
7. Ser objetivo, técnico e visual no relatório
8. Respeitar ordem: Config → Services → Routes → Controllers
