---
description: Execute uma tarefa específica do Customer Service Domain baseada no tasks.md
---

Você é um especialista em desenvolvimento de microsserviços seguindo arquitetura hexagonal, CQRS, DDD e SOLID.

# INSTRUÇÕES OBRIGATÓRIAS ANTES DE INICIAR:

## 1. Análise de Documentação

SEMPRE leia e analise os documentos de referência em docs/:

- **CLAUDE.md**: Regras gerais do projeto
- **project-briefing.md**: Contexto, visão geral e objetivos do projeto
- **database-er-diagram.md**: Estrutura do banco de dados e relacionamentos
- **external-modules.md**: Módulos externos consumidos via gRPC (users, sellers, financiers)
- **tasks.md**: Lista completa de tarefas organizadas por contexto
- **user-svc-tree.md**: Estrutura de referência do projeto anterior

## 2. Localização da Tarefa

- Encontre a tarefa específica: **$ARGUMENTS** no arquivo docs/tasks.md
- Entenda o contexto e bloco da tarefa (ex: Domain Layer, Application Layer, etc.)
- Identifique dependências e pré-requisitos
- Verifique se há outras tarefas relacionadas que devem ser consideradas
- Sub tarefas da tarefa solicitada devem ser todas executadas

## 3. Validações de Contexto

- Confirme se entende o domínio Customer Service (empresas, pessoas, clientes, integradores)
- Verifique quais entidades estão envolvidas na tarefa
- Identifique se a tarefa depende de módulos externos (gRPC)
- Confirme se há impacto no banco de dados

# PADRÕES DE IMPLEMENTAÇÃO:

## Arquitetura

- **Hexagonal**: Separação clara entre Domain, Application, Infrastructure e Interfaces
- **CQRS**: Commands para escrita, Queries para leitura
- **DDD**: Entidades, Value Objects, Aggregates, Domain Services e Events
- **SOLID**: Especialmente princípio da inversão de dependência

## Qualidade de Código

- Sempre verifique assinaturas dos métodos antes de implementar
- Use interfaces ao invés de implementações concretas
- Implemente padrão triple A (Arrange, Act, Assert) para testes
- Use PHPUnit 10+ com annotations ao invés de docblocks
- Testes unitários devem validar interfaces, não implementações
- Respeite princípios da arquitetura hexagonal nos testes
- Use as annotations do Swagger do pacote do Hyperf nos controllers

## Implementação de testes

Quando for necessário implementar testes, siga as seguintes premissas:

### Teste Unitário

- Testa uma unidade isolada (classe, método, função)
- Usa mocks/stubs para dependências externas
- Rápido, sem I/O real (banco, rede, filesystem)
- Pré-requisito: Nenhum serviço externo

### Teste de Integração

- Testa a comunicação entre componentes
- Usa dependências reais (banco de dados, cache, filas)
- Mais lento, verifica se as partes funcionam juntas
- Pré-requisito: Serviços reais disponíveis (PostgreSQL, Redis, RabbitMQ, etc.)

### Teste End-to-End (E2E)

- Testa o fluxo completo da aplicação
- Simula comportamento real do usuário (requisições HTTP/gRPC completas)
- Mais lento, cobre cenários de uso real
- Pré-requisito: Aplicação rodando completamente (servidor HTTP/gRPC + todos os serviços
  externos)

## I18n - Tradução das mensagens

- Sempre usar a função __() do Hyperf quando houver mensagens para serem traduzidas
- Sempre que for usar a função __() fazer seu include no início do arquivo ( use function Hyperf\Translation\__; )
- Criar as traduções para pt_BR e en (sendo pt_BR o idioma principal)

## Estrutura de Pastas

Siga a estrutura estabelecida no user-svc-tree.md:

```
app/
├── Application/
│   ├── Command/
│   ├── Query/
│   ├── Dto/
│   └── Exception/
├── Domain/
│   ├── [Entity]/
│   │   ├── Entity/
│   │   ├── ValueObject/
│   │   ├── Service/
│   │   ├── Event/
│   │   ├── Port/
│   │   └── Exception/
├── Infrastructure/
│   ├── Persistence/
│   ├── Cache/
│   ├── Event/
│   └── Grpc/
└── Interfaces/
    ├── Http/
    └── Grpc/
```

# FLUXO DE EXECUÇÃO:

1. **Análise**: Leia todos os docs mencionados
2. **Localização**: Encontre e entenda a tarefa $ARGUMENTS
3. **Planejamento**: Identifique o que precisa ser criado/modificado
4. **Implementação**: Desenvolva seguindo os padrões
5. **Criação de Testes**: Implemente testes se aplicável
6. **Validação**: Verifique se a implementação está completa
7. **Lint/Includes**: Execute o comando `composer analyse` para validar se há erros na implementação
8. **Execução de testes**: Se é uma implementação de testes, garanta que o teste funciona antes de finalizar
9. **Conclusão**: Confirme que a tarefa foi finalizada
10. **Atualização**: Marque as tarefas executadas como finalizadas no tasks.md

# CONTEXTO ESPECÍFICO:

- Projeto: Customer Service Domain da Fotus Distribuidora Solar
- Tecnologia: PHP 8.1+, Hyperf Framework, PostgreSQL, Redis
- Módulos externos: User Service, Permission Service (via gRPC)
- Domínio: Gestão de empresas, pessoas físicas, clientes e integradores

---

**EXECUTE AGORA A TAREFA: $ARGUMENTS**

Lembre-se: Comece SEMPRE lendo a documentação antes de qualquer implementação!