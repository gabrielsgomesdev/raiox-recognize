# Execute Task

Execute uma tarefa específica do RaioX Recognize Medical Imaging Analysis back-end baseada no tasks.md

---

Você é um especialista em desenvolvimento Node.js/TypeScript para análise de imagens médicas com integração OpenAI e Supabase.

# INSTRUÇÕES OBRIGATÓRIAS ANTES DE INICIAR:

## 1. Análise de Documentação

SEMPRE leia e analise os documentos de referência em docs/:

- **CLAUDE.md**: Regras gerais do projeto, arquitetura e comandos
- **tasks.md**: Lista completa de tarefas organizadas por contexto
- **create-postman-collection.md**: Guia para criar coleção Postman da API
- **review-task.md**: Guia para revisão de status de tarefas

## 2. Localização da Tarefa

- Encontre a tarefa específica: **$ARGUMENTS** no arquivo docs/tasks.md
- Entenda o contexto e bloco da tarefa (ex: Services, Routes, Database, etc.)
- Identifique dependências e pré-requisitos
- Verifique se há outras tarefas relacionadas que devem ser consideradas
- Sub tarefas da tarefa solicitada devem ser todas executadas

## 3. Validações de Contexto

- Confirme se entende o domínio de análise de imagens médicas (lesões, diagnóstico, câncer)
- Verifique quais serviços estão envolvidos na tarefa (OpenAI, Supabase)
- Identifique se a tarefa depende de APIs externas
- Confirme se há impacto no banco de dados (Supabase)
- Verifique se afeta o pipeline de processamento de imagens

# PADRÕES DE IMPLEMENTAÇÃO:

## Arquitetura

- **Separação de Responsabilidades**:
  - `controllers/` - Handlers de requisição HTTP
  - `services/` - Lógica de negócio e integrações
  - `repositories/` - Acesso a dados (Supabase)
  - `routes/` - Definição de endpoints
  - `config/` - Configurações (OpenAI, Supabase)
  - `utils/` - Funções utilitárias
  - `types/` - Definições de tipos TypeScript

- **ES Modules**: Sempre use extensão `.js` nos imports (TypeScript + ES modules)
- **Fastify Framework**: Use padrões do Fastify para rotas e plugins

## Qualidade de Código

- Sempre verifique assinaturas de funções antes de implementar
- Use tipos TypeScript apropriados (evite `any` quando possível)
- Implemente error handling adequado com try/catch
- Use async/await para operações assíncronas
- Valide inputs de requisições HTTP
- Use optional chaining para acesso seguro a propriedades

## Integração com APIs Externas

### OpenAI
- Cliente: `openaiClient` de `src/config/openai.ts`
- Vision API: Para análise de imagens médicas
- Embeddings API: Para busca por similaridade
- Sempre trate erros de API adequadamente

### Supabase
- Cliente: `supabase` de `src/config/supabase.ts`
- Use `.from()` para operações em tabelas
- Use `.rpc()` para funções personalizadas (ex: `match_images`)
- Sempre verifique `error` na desestruturação de resposta

## Implementação de Testes

Quando for necessário implementar testes, considere:

- Testes podem ser adicionados posteriormente
- Foco em implementação funcional primeiro
- Quando implementar, use padrão AAA (Arrange, Act, Assert)

## Estrutura de Pastas

Siga a estrutura estabelecida:

```
src/
├── config/              # Configurações de serviços externos
│   ├── openai.ts
│   └── supabase.ts
├── controllers/         # Handlers de requisição HTTP
│   ├── uploadController.ts
│   ├── searchController.ts
│   └── healthController.ts
├── services/            # Lógica de negócio
│   ├── imagesService.ts
│   ├── embeddingsService.ts
│   ├── watcherService.ts
│   └── sseManager.ts
├── repositories/        # Acesso a dados
│   ├── imagesRepository.ts
│   └── lesionsRepository.ts
├── routes/              # Definição de endpoints
│   ├── uploadRoutes.ts
│   ├── searchRoutes.ts
│   ├── respostaRoutes.ts
│   └── appRoutes.ts
├── watchers/            # Monitoramento de arquivos
│   └── imageWatchers.ts
├── utils/               # Funções utilitárias
│   ├── fileUtils.ts
│   └── logger.ts
├── types/               # Definições TypeScript
│   ├── image.ts
│   ├── fastify.d.ts
│   └── index.d.ts
├── server.ts            # Servidor Fastify principal
├── watcher.ts           # Serviço de monitoramento de pastas
└── index.ts             # Registro de rotas
```

# FLUXO DE EXECUÇÃO:

1. **Análise**: Leia todos os docs mencionados
2. **Localização**: Encontre e entenda a tarefa $ARGUMENTS
3. **Planejamento**: Identifique o que precisa ser criado/modificado
4. **Implementação**: Desenvolva seguindo os padrões
5. **Validação**: Execute o TypeScript compiler para verificar erros
6. **Testes Manuais**: Se aplicável, teste a funcionalidade manualmente
7. **Conclusão**: Confirme que a tarefa foi finalizada
8. **Atualização**: Marque as tarefas executadas como finalizadas no tasks.md

# COMANDOS ÚTEIS:

```bash
# Desenvolvimento
npm run dev                  # Inicia servidor com hot reload
npm run watcher              # Inicia apenas o file watcher

# Build
npm run build                # Compila TypeScript

# Produção
npm run start:server         # Inicia servidor compilado

# Validação
npm run build                # Verifica erros de TypeScript
```

# CONTEXTO ESPECÍFICO:

- **Projeto**: RaioX Recognize - Sistema de análise de imagens médicas
- **Tecnologia**: Node.js 18+, TypeScript, Fastify, OpenAI API, Supabase
- **Domínio**: Análise de lesões em imagens de raio-X, diagnóstico de câncer
- **Pipeline**: Upload → Descrição (Vision) → Embedding → Busca Similaridade
- **Banco de Dados**: Supabase (PostgreSQL + pgvector)

# PADRÕES DE CÓDIGO:

## Error Handling

```typescript
try {
  const result = await someAsyncOperation();
  return result;
} catch (err: any) {
  console.error(`Error message: ${err}`);
  return reply.code(500).send({ error: err.message });
}
```

## Fastify Route Definition

```typescript
import { FastifyInstance } from "fastify";
import { controllerFunction } from "../controllers/controller.js";

export async function routeName(fastify: FastifyInstance) {
  fastify.get("/endpoint", controllerFunction);
  fastify.post("/endpoint", controllerFunction);
}
```

## Service Pattern

```typescript
import { openaiClient } from "../config/openai.js";
import { supabase } from "../config/supabase.js";

export async function serviceFunctionName(param: Type): Promise<ReturnType> {
  // 1. Validação
  if (!param) {
    throw new Error("Param is required");
  }

  // 2. Processamento
  const result = await externalApiCall(param);

  // 3. Persistência
  const { data, error } = await supabase
    .from("table")
    .insert({ field: result });

  if (error) throw error;

  return data;
}
```

## Type Definitions

```typescript
// src/types/filename.ts
export interface TypeName {
  field1: string;
  field2: number;
  field3?: OptionalType;
}

export type AliasName = {
  prop: string;
};
```

# VALIDAÇÕES OBRIGATÓRIAS:

Antes de finalizar, verifique:

- [ ] Código TypeScript compila sem erros (`npm run build`)
- [ ] Imports usam extensão `.js` (requisito ES modules)
- [ ] Error handling implementado adequadamente
- [ ] Tipos TypeScript definidos (evite `any`)
- [ ] Variáveis de ambiente documentadas se novas forem adicionadas
- [ ] Funções async usam await apropriadamente
- [ ] Logs informativos adicionados para debugging
- [ ] CORS configurado se novos endpoints públicos
- [ ] Documentação inline para funções complexas

# EXEMPLOS DE TAREFAS COMUNS:

## Adicionar Novo Endpoint

1. Criar controller em `src/controllers/`
2. Criar route em `src/routes/`
3. Registrar route em `src/index.ts`
4. Testar endpoint via Postman/curl

## Adicionar Nova Integração Externa

1. Criar config em `src/config/` (se aplicável)
2. Criar service em `src/services/`
3. Adicionar variáveis de ambiente necessárias
4. Documentar no CLAUDE.md

## Modificar Pipeline de Processamento

1. Identificar serviço afetado (`imagesService.ts`, `embeddingsService.ts`)
2. Modificar função relevante
3. Validar impacto no `watcherService.ts` se aplicável
4. Testar fluxo completo

## Adicionar Nova Tabela Supabase

1. Criar migration no Supabase (via SQL Editor)
2. Atualizar tipos em `src/types/`
3. Criar repository em `src/repositories/` (se aplicável)
4. Documentar no CLAUDE.md

---

**EXECUTE AGORA A TAREFA: $ARGUMENTS**

Lembre-se: Comece SEMPRE lendo a documentação antes de qualquer implementação!
