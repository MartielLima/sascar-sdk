# Sascar SDK — Orquestrador de Requisições — Design

- **Data:** 2026-06-12
- **Projeto:** `sascar-sdk` (TypeScript SDK para o WebService SOAP SasIntegra v2.07 da Sascar/Michelin)
- **Tipo:** Especificação de feature — orquestrador de fila para serialização de requisições SOAP
- **Status:** Aguardando revisão do usuário

## 1. Visão geral e escopo

### 1.1 Contexto e motivação

A Sascar/Michelin opera o WebService SasIntegra v2.07 com uma **limitação crítica de
concorrência: o backend aceita apenas uma requisição SOAP por vez por credencial**.
Chamadas paralelas recebem `HTTP 500` ou SOAP Fault com mensagens de "too many
requests" e exigem retry cego do cliente.

O `sascar-sdk` contorna parcialmente essa limitação com um `AsyncQueue` (mutex) em
`src/queue.ts`, mas ele:

1. Só envolve os métodos de posições (`obterPacote*`) — os outros ~45 métodos disparam em
   paralelo e podem saturar o backend.
2. Não tem observabilidade (status, eventos, latência).
3. Não tem cancelamento, deduplicação, retry no nível do orquestrador nem concorrência
   configurável.
4. Não está exposto como serviço — não dá para usar a fila manualmente em outros fluxos.

### 1.2 Objetivo

Substituir o `AsyncQueue` por um **orquestrador de requisições** (`SascarOrchestrator`):

- **Global** — serializa TODAS as 63 chamadas SOAP, não só as de posição.
- **Opcional** — ativado por `useOrchestrator: true` no construtor ou env var
  `SASCAR_USE_ORCHESTRATOR=true`. Default: `false` (mantém comportamento atual).
- **Integrado** — quando ligado, o `SascarClient` enfileira todas as chamadas
  automaticamente; o usuário não precisa mexer nos métodos.
- **Reutilizável** — a classe `SascarOrchestrator` é exportada standalone para uso
  manual em scripts, workers, batch jobs e integrações customizadas.
- **Observável** — status por tarefa, eventos, latência, tentativas.

### 1.3 Não-objetivos (YAGNI)

- NÃO criar interface visual / dashboard de monitoramento.
- NÃO adicionar persistência da fila em disco/Redis (em memória apenas).
- NÃO implementar persistência entre processos (fila é local e volátil).
- NÃO alterar a API pública dos 63 métodos do `SascarClient` (nomes, assinaturas,
  retornos).
- NÃO criar camada de cache de respostas.
- NÃO trocar o `fetch` por `axios` ou adicionar outras dependências.
- NÃO criar scheduler com delay/tempo (a fila é por ordem de chegada).

## 2. Arquitetura

### 2.1 Estrutura de arquivos

```
src/
├── client.ts                 ← refatorado: usa SascarOrchestrator internamente
├── orchestrator.ts           ← NOVO: classe SascarOrchestrator (FIFO + status + eventos)
├── queue.ts                  ← REMOVIDO (substituído por orchestrator.ts)
├── errors.ts                 ← + 2 classes (SascarOrchestratorClosedError, SascarTaskCanceledError)
├── transport/
│   ├── envelope.ts           ← sem mudanças
│   ├── fault.ts              ← sem mudanças
│   └── http.ts               ← sem mudanças
├── types.ts                  ← + tipos públicos do orquestrador
└── index.ts                  ← exporta SascarOrchestrator + tipos públicos
tests/
├── orchestrator.spec.ts      ← NOVO
├── client.spec.ts            ← atualizado: testes de orquestração
└── integration/              ← sem mudanças
docs/
└── superpowers/specs/        ← este design doc
```

### 2.2 Diagrama de componentes

```
┌──────────────────────────────────────────────────────────────┐
│                       SascarClient                            │
│                                                               │
│   obterVeiculos() ─┐                                         │
│   obterClientes() ─┼─► private request() ──► orchestrator     │
│   obterPacote*()  ─┘                       .enqueue(execute) │
│                                              │                │
│   useOrchestrator: true ────────────────────►│                │
└──────────────────────────────────────────────┼────────────────┘
                                               │
                          ┌────────────────────▼────────────────────┐
                          │           SascarOrchestrator              │
                          │                                            │
                          │  • queue: Task[]                          │
                          │  • running: Set<Task>                     │
                          │  • concurrency: number (default 1)        │
                          │  • events: emitter interno (on/off)       │
                          │  • options.retry / dedup / autoStart      │
                          │                                            │
                          │  public API:                               │
                          │    enqueue(fn, opts) → Promise<T>          │
                          │    run / status / cancel / abort / drain   │
                          │    close / on / off                        │
                          └────────────────────┬───────────────────────┘
                                               │
                          ┌────────────────────▼────────────────────┐
                          │   Uso manual standalone                   │
                          │                                            │
                          │   const orch = new SascarOrchestrator();  │
                          │   orch.enqueue(() => myTask());           │
                          └────────────────────────────────────────────┘
```

### 2.3 Princípios

- **Mesma classe, dois modos.** `SascarOrchestrator` é uma única classe; o
  `SascarClient` apenas a usa internamente. Quem quiser controle manual importa
  a mesma classe e a usa direto.
- **Falha visível, fila contínua.** Erros rejeitam a `Promise` retornada por
  `enqueue()` e a fila segue processando as próximas tarefas.
- **Sem estado compartilhado entre instâncias.** Cada `SascarClient` tem sua
  própria instância de orquestrador; o `SascarOrchestrator` standalone é
  independente de qualquer client.
- **Backpressure automático.** Como é em memória e tem `concurrency=1` por
  default, enfileirar N tarefas simplesmente cria N promises que ficam
  pendentes; nada é perdido.

## 3. Configuração e ativação

### 3.1 Tipo da opção no client

```typescript
// src/client.ts (adição)
export interface SascarClientOptions {
  timeoutMs?: number;
  maxRetries?: number;
  wsdlUrl?: string;

  // NOVO
  useOrchestrator?: boolean;
  orchestrator?: Partial<OrchestratorOptions>;
}
```

### 3.2 Resolução da opção `useOrchestrator`

```typescript
function resolveUseOrchestrator(options?: SascarClientOptions): boolean {
  if (options?.useOrchestrator !== undefined) return options.useOrchestrator;
  const env = process.env.SASCAR_USE_ORCHESTRATOR;
  if (env !== undefined) return env.toLowerCase() === 'true';
  return false;
}
```

### 3.3 Modos de uso

```typescript
// 1) Automático via option
const client = new SascarClient(creds, { useOrchestrator: true });

// 2) Automático via env var
// SASCAR_USE_ORCHESTRATOR=true node app.js
const client = new SascarClient();

// 3) Configuração rica do orquestrador
const client = new SascarClient(creds, {
  useOrchestrator: true,
  orchestrator: {
    concurrency: 1,         // default 1
    retry: { maxAttempts: 3, shouldRetry: (e) => e instanceof SascarConnectionError },
    dedup: false
  }
});

// 4) Desligado explicitamente (paralelo, comportamento legado)
const client = new SascarClient(creds, { useOrchestrator: false });
```

## 4. API do `SascarOrchestrator`

### 4.1 Tipos públicos (`src/types.ts`)

```typescript
export type TaskStatus = 'pending' | 'running' | 'done' | 'failed' | 'canceled';

export interface TaskInfo<T = unknown> {
  id: string;
  status: TaskStatus;
  attempts: number;
  enqueuedAt: number;
  startedAt?: number;
  finishedAt?: number;
  latencyMs?: number;
  error?: unknown;
  result?: T;
  key?: string;
  meta?: Record<string, unknown>;
}

export interface RetryConfig {
  maxAttempts?: number;                              // default 1 (sem retry)
  backoffMs?: (attempt: number) => number;           // default: 250 * 2^(n-1) com jitter
  shouldRetry?: (err: unknown) => boolean;           // default: SascarConnectionError || SascarTimeoutError
}

export interface EnqueueOptions {
  key?: string;
  retry?: RetryConfig;
  signal?: AbortSignal;
  meta?: Record<string, unknown>;
}

export interface OrchestratorOptions {
  concurrency?: number;                              // default 1
  retry?: RetryConfig;                               // default aplicado por tarefa
  dedup?: boolean;                                   // default false
  autoStart?: boolean;                               // default true
}

export type OrchestratorEvent =
  | 'task:enqueue'
  | 'task:start'
  | 'task:done'
  | 'task:error'
  | 'task:retry'
  | 'task:cancel'
  | 'queue:idle'
  | 'queue:drain'
  | 'queue:close';

export type OrchestratorListener = (task: TaskInfo, ...args: unknown[]) => void;
```

### 4.2 Métodos

| Método | Assinatura | Descrição |
|--------|-----------|-----------|
| `enqueue` | `<T>(fn: () => Promise<T>, opts?: EnqueueOptions) => Promise<T>` | Enfileira `fn` e retorna a `Promise` do resultado. |
| `run` | `<T>(fn: () => Promise<T>, opts?: EnqueueOptions) => Promise<T>` | Sinônimo de `enqueue` para legibilidade em scripts. |
| `status` | `(id: string) => TaskInfo \| undefined` | Retorna `TaskInfo` atual da tarefa. |
| `cancel` | `(id: string) => boolean` | Cancela tarefa pendente. Em execução: no-op. Retorna `true` se cancelou. |
| `abort` | `(id: string) => boolean` | `cancel` + aborta via `AbortSignal` se fornecido. |
| `drain` | `() => Promise<void>` | Resolve quando `pending === 0 && running === 0`. |
| `close` | `() => Promise<void>` | Rejeita pendentes com `SascarOrchestratorClosedError`; resolve `drain()`. |
| `on` | `(event: OrchestratorEvent, fn: OrchestratorListener) => this` | Assina evento. |
| `off` | `(event: OrchestratorEvent, fn: OrchestratorListener) => this` | Remove listener. |
| `size` | `number` | Pending + running. |
| `pending` | `number` | Tarefas ainda não iniciadas. |
| `running` | `number` | Tarefas em execução. |
| `concurrency` | `number` | Limite configurado. |

### 4.3 Eventos

```typescript
orchestrator.on('task:enqueue', (task) => {...});
orchestrator.on('task:start',   (task) => {...});
orchestrator.on('task:done',    (task) => {...});
orchestrator.on('task:error',   (task, err) => {...});
orchestrator.on('task:retry',   (task, attempt, delayMs) => {...});
orchestrator.on('task:cancel',  (task) => {...});
orchestrator.on('queue:idle',   () => {...});
orchestrator.on('queue:drain',  () => {...});
orchestrator.on('queue:close',  () => {...});
```

### 4.4 Comportamento de retry

Retry é por tarefa. Configurável em `EnqueueOptions.retry` (sobrescreve
global) ou `OrchestratorOptions.retry` (default aplicado a todas as tarefas).

```typescript
const orch = new SascarOrchestrator({
  retry: {
    maxAttempts: 3,                                  // default 1 (sem retry)
    backoffMs: (n) => 250 * 2 ** n,                  // 250, 500, 1000ms
    shouldRetry: (err) => err instanceof SascarConnectionError
  }
});
```

`shouldRetry(err)` é chamado após cada falha. Se retornar `true` e `attempts <
maxAttempts`, o orquestrador espera `backoffMs(attempt)` e tenta de novo. Erros
tipados do transport (`SascarApiError`, `SascarAuthError`, `SascarRateLimitError`)
continuam sendo lançados pelo transport e respeitam o `shouldRetry` do
orquestrador.

**Default `shouldRetry`**: retenta em `SascarConnectionError` e `SascarTimeoutError`;
não retenta em `SascarApiError`, `SascarAuthError`, `SascarRateLimitError`.

### 4.5 Deduplicação

Quando `dedup: true`, tarefas com a mesma `key` (fornecida em `EnqueueOptions`)
são deduplicadas:

- Se já existe uma tarefa com a mesma `key` em `pending` ou `running`, a nova
  chamada **retorna a mesma Promise** da tarefa original. Não inicia uma nova.
- Tarefas com `key` diferente nunca colidem.

Útil para evitar chamadas duplicadas quando múltiplos lugares do código pedem o
mesmo dado em paralelo.

### 4.6 Cancelamento

```typescript
const controller = new AbortController();
const promise = orch.enqueue(fn, { signal: controller.signal });
controller.abort(); // rejeita a promise com SascarTaskCanceledError (se ainda pendente)
```

Ou diretamente:

```typescript
const id = '...';
orch.cancel(id);     // cancela se pendente; ignora se em execução
orch.abort(id);      // cancela + dispara signal se houver
```

Cancelamento em tarefa já em execução: **no-op** (a tarefa em si não tem como
ser interrompida a menos que ela honre o `AbortSignal` recebido).

### 4.7 Uso manual standalone

```typescript
import { SascarOrchestrator } from 'sascar-sdk';

const orch = new SascarOrchestrator({ concurrency: 1 });

orch.on('task:error', (t, e) => log.error(`#${t.id}`, e));
orch.on('task:done',  (t) => log.info(`#${t.id} em ${t.latencyMs}ms`));

await Promise.all([
  orch.enqueue(() => client.obterVeiculos(), { key: 'veiculos' }),
  orch.enqueue(() => client.obterClientes(), { key: 'clientes' })
]);

await orch.drain();
await orch.close();
```

## 5. Integração com `SascarClient`

### 5.1 Mudanças no `client.ts`

- Campo privado `positionsQueue = new AsyncQueue()` é **removido**.
- Novo campo privado: `orchestrator?: SascarOrchestrator` (criado só se
  `useOrchestrator: true`).
- O método privado `request()` é refatorado:
  - Parâmetro `isPositionMethod` é **removido** (a fila é global).
  - Lógica: se `this.orchestrator` existe → `return this.orchestrator.enqueue(execute)`;
    senão → `return execute()` (paralelo, comportamento atual).

```typescript
// src/client.ts (refatorado, trecho relevante)
private async request<TReturn>(
  methodName: string,
  params: T.SoapBody = {}
): Promise<TReturn> {
  const xml = buildSoapEnvelope(methodName, params, this.usuario, this.senha);
  const execute = async (): Promise<TReturn> => { /* ... mesmo código de hoje ... */ };

  if (this.orchestrator) {
    return this.orchestrator.enqueue(() => execute(), { meta: { method: methodName } });
  }
  return execute();
}
```

### 5.2 Acessar o orquestrador a partir do client (modo manual dentro do client)

Quem optou por `useOrchestrator: true` pode também acessar a instância para
observabilidade:

```typescript
const client = new SascarClient(creds, { useOrchestrator: true });
client.orchestrator.on('queue:idle', () => console.log('fila ociosa'));
```

`client.orchestrator` é um getter público, exposto **somente** se
`useOrchestrator: true`. Caso contrário, é `undefined` (e o tipo do getter é
`SascarOrchestrator | undefined`).

## 6. Erros

### 6.1 Novas classes em `src/errors.ts`

```typescript
export class SascarOrchestratorClosedError extends Error {
  constructor(message = 'SascarOrchestrator está fechado e não aceita novas tarefas.') {
    super(message);
    this.name = 'SascarOrchestratorClosedError';
  }
}

export class SascarTaskCanceledError extends Error {
  readonly taskId: string;
  constructor(taskId: string) {
    super(`Tarefa ${taskId} foi cancelada.`);
    this.name = 'SascarTaskCanceledError';
    this.taskId = taskId;
  }
}
```

### 6.2 Política de erro

| Cenário | Comportamento |
|---------|---------------|
| Tarefa falha e retry esgotou | Rejeita `Promise` retornada por `enqueue()` com o erro original. Fila continua. |
| `close()` com tarefas pendentes | Rejeita todas as pendentes com `SascarOrchestratorClosedError`. |
| `cancel()` em tarefa pendente | Rejeita com `SascarTaskCanceledError`. |
| `cancel()` em tarefa em execução | No-op. Emite `task:cancel` mas a tarefa em si não é interrompida. |
| Erros do transport (5xx, 401, 429, timeout) | Erros tipados do `src/errors.ts` continuam sendo lançados; orquestrador aplica `shouldRetry` por tarefa. |

## 7. Compatibilidade e migração

### 7.1 Breaking changes

- **`AsyncQueue` removido de `src/index.ts`.** Quem fazia
  `import { AsyncQueue } from 'sascar-sdk'` precisa usar `SascarOrchestrator`.
  A `AsyncQueue` era exportada mas não era usada fora de `client.ts` — confirmar
  via `grep -r "AsyncQueue" --include="*.ts" .` antes de remover.
- **`isPositionMethod` removido do `request()` interno.** Não é API pública.
- Comportamento padrão (`useOrchestrator: false`) **inalterado** — zero impacto
  para quem não ativa.

### 7.2 Migração recomendada

```diff
- import { AsyncQueue } from 'sascar-sdk';
- const q = new AsyncQueue();
+ import { SascarOrchestrator } from 'sascar-sdk';
+ const q = new SascarOrchestrator();
```

## 8. Testes

### 8.1 `tests/orchestrator.spec.ts` (novo)

Cobrir:

- [ ] FIFO estrito com `concurrency: 1` (5 tarefas com delays variados, ordem de término = ordem de entrada).
- [ ] `concurrency: 3` processa até 3 em paralelo.
- [ ] `status(id)` reflete transições pending → running → done/failed.
- [ ] Eventos disparam na ordem: `task:enqueue` → `task:start` → (`task:retry`?) → `task:done` / `task:error`.
- [ ] `cancel(id)` em pendente rejeita com `SascarTaskCanceledError`.
- [ ] `cancel(id)` em em execução é no-op.
- [ ] `AbortSignal` rejeita tarefa pendente.
- [ ] `dedup: true` com mesma `key` retorna a mesma Promise.
- [ ] `dedup: true` com `key` diferente enfileira normalmente.
- [ ] Retry: `maxAttempts: 3` chama `fn` 3 vezes no caso de erro retentável.
- [ ] Retry: `shouldRetry` retornando `false` não retenta.
- [ ] Retry: `shouldRetry` padrão não retenta em `SascarApiError`, retenta em `SascarConnectionError`.
- [ ] `drain()` resolve quando fila esvazia.
- [ ] `drain()` chamado antes de enfileirar resolve imediatamente.
- [ ] `close()` rejeita pendentes com `SascarOrchestratorClosedError`.
- [ ] `size` / `pending` / `running` retornam contadores corretos.

### 8.2 `tests/client.spec.ts` (atualizado)

- [ ] `useOrchestrator: true` serializa chamadas entre métodos diferentes (verificar com `jest.fn` que 2 chamadas paralelas não disparam `fetch` em paralelo).
- [ ] `useOrchestrator: false` mantém paralelismo (2 chamadas disparam `fetch` em paralelo).
- [ ] `SASCAR_USE_ORCHESTRATOR=true` ativa via env.
- [ ] `client.orchestrator` é `SascarOrchestrator` quando ligado, `undefined` quando desligado.
- [ ] `AsyncQueue` removido do `index.ts`.

## 9. Documentação

### 9.1 README — nova seção

```markdown
## 🧭 Orquestrador de Requisições

A Sascar limita o WebService SasIntegra a **uma requisição por vez por
credencial**. Disparar várias chamadas em paralelo causa `HTTP 500` ou
SOAP Fault transitório e exige retry cego.

Esta SDK inclui um **orquestrador de fila** que serializa TODAS as chamadas
SOAP, é **opcional** e **altamente recomendado** em produção.

### Modo automático (recomendado)

Ligue com `useOrchestrator: true` no construtor ou via env var:

\`\`\`typescript
import { SascarClient } from 'sascar-sdk';

const client = new SascarClient(creds, { useOrchestrator: true });
await Promise.all([
  client.obterVeiculos(),
  client.obterClientes(),
  client.obterPacotePosicoes()
]); // executadas em ordem, 1 por vez
\`\`\`

\`\`\`bash
SASCAR_USE_ORCHESTRATOR=true node app.js
\`\`\`

### Modo manual (controle fino)

Se preferir gerenciar a fila você mesmo:

\`\`\`typescript
import { SascarClient, SascarOrchestrator } from 'sascar-sdk';

const client = new SascarClient(creds); // sem orquestrador
const orch = new SascarOrchestrator({ concurrency: 1 });

orch.on('task:error', (t, e) => log.error(\`#\${t.id}\`, e));
orch.on('task:done',  (t) => log.info(\`#\${t.id} em \${t.latencyMs}ms\`));

await Promise.all([
  orch.enqueue(() => client.obterVeiculos(), { key: 'veiculos' }),
  orch.enqueue(() => client.obterClientes(), { key: 'clientes' })
]);

await orch.drain();
await orch.close();
\`\`\`

### Capacidades do orquestrador

- **FIFO estrito** (`concurrency: 1`) ou pool (`concurrency: N`).
- **Status** por tarefa: `pending`, `running`, `done`, `failed`, `canceled`.
- **Eventos** para observabilidade: `task:start`, `task:done`, `task:error`,
  `queue:idle`, `queue:drain`...
- **Cancelamento** de tarefas pendentes via `cancel(id)` ou `AbortSignal`.
- **Deduplicação** por chave opcional (`key`).
- **Retry** com backoff configurável por tarefa.
```

### 9.2 CHANGELOG

Adicionar entrada em `CHANGELOG.md` (seção `Unreleased` ou nova versão):

```markdown
## [Unreleased]

### Added

- `SascarOrchestrator` — orquestrador de requisições SOAP com fila FIFO,
  status, eventos, cancelamento, deduplicação e retry.
- `SascarClientOptions.useOrchestrator` — ativa o orquestrador globalmente
  (todas as 63 chamadas SOAP).
- Env var `SASCAR_USE_ORCHESTRATOR` — ativa o orquestrador sem alterar código.
- `client.orchestrator` — getter para acessar a instância do orquestrador
  quando ligado.
- Erros `SascarOrchestratorClosedError` e `SascarTaskCanceledError`.

### Changed

- `AsyncQueue` removido de `src/index.ts`. Substituído por `SascarOrchestrator`.

### Migration

Antes: `import { AsyncQueue } from 'sascar-sdk'`.
Depois: `import { SascarOrchestrator } from 'sascar-sdk'`.
```

## 10. Critérios de aceitação

- [ ] `npm run build` sem warnings.
- [ ] `npm run lint` sem erros.
- [ ] `npm run typecheck` sem erros.
- [ ] `npm test` com ≥ 80% de cobertura em `src/`.
- [ ] Todos os testes de `tests/orchestrator.spec.ts` passam.
- [ ] `SascarClient` em modo automático serializa chamadas entre métodos
      diferentes (testado).
- [ ] README atualizado com a nova seção.
- [ ] CHANGELOG atualizado.
- [ ] `AsyncQueue` removido do `index.ts` e dos imports internos.

## 11. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| `AsyncQueue` ser usado fora do SDK | `grep` no repo antes de remover. Se houver uso externo documentar no CHANGELOG. |
| Mudar `client.request()` quebrar testes existentes | Atualizar `client.spec.ts` para refletir nova assinatura (sem `isPositionMethod`). |
| Default de `useOrchestrator: false` confundir quem leu a doc | README enfatiza "altamente recomendado" e "opt-in". Env var é alternativa. |
| Retry do orquestrador duplicar com retry do transport | Doc explicita: o retry do orquestrador é sobre o ciclo de vida da tarefa (incluindo transporte), o do transport é por tentativa HTTP. O padrão é `maxAttempts: 1` (sem retry adicional) para não dobrar. |

## 12. Próximo passo

1. ✅ Este design doc escrito.
2. ⏭️ Self-review inline (placeholders, contradições, ambiguidade, escopo).
3. ⏭️ Usuário revisa e aprova.
4. ⏭️ Aprovado → invocar `writing-plans` para gerar plano de implementação.
5. ⏭️ Implementar com TDD.
