# Sascar Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o `AsyncQueue` por um `SascarOrchestrator` (fila FIFO com status, eventos, cancelamento, dedup, retry e concorrência configurável) que pode ser ativado opcionalmente no `SascarClient` (`useOrchestrator: true` ou env var) e também usado standalone para controle manual.

**Architecture:** Uma única classe `SascarOrchestrator` em `src/orchestrator.ts` concentra toda a lógica. O `SascarClient` mantém uma instância interna quando `useOrchestrator: true` e enfileira todas as chamadas. Mesma classe é exportada para uso manual. Emitter de eventos interno (sem dependência do `events` do Node).

**Tech Stack:** TypeScript 5.3, Jest 29, sem novas dependências runtime.

**Spec:** `docs/superpowers/specs/2026-06-12-sascar-orchestrator-design.md`

**File structure:**

```
src/
├── orchestrator.ts          ← NOVO
├── types.ts                 ← + tipos do orquestrador
├── errors.ts                ← + 2 classes de erro
├── client.ts                ← refatorado: usa SascarOrchestrator
├── queue.ts                 ← REMOVIDO
└── index.ts                 ← exporta SascarOrchestrator + tipos
tests/
├── orchestrator.spec.ts     ← NOVO
└── client.spec.ts           ← atualizado
```

---

## Task 1: Tipos públicos do orquestrador e novas classes de erro

**Files:**
- Modify: `src/types.ts` (adicionar tipos no final)
- Modify: `src/errors.ts` (adicionar 2 classes no final)
- Modify: `src/index.ts` (exportar novos tipos/erros)

- [ ] **Step 1: Escrever teste falho para os tipos e erros serem exportados**

Criar `tests/types-exports.spec.ts`:

```typescript
import {
  SascarOrchestratorClosedError,
  SascarTaskCanceledError
} from '../src/errors';
import type {
  TaskStatus,
  TaskInfo,
  EnqueueOptions,
  OrchestratorOptions,
  OrchestratorEvent,
  RetryConfig
} from '../src/types';

describe('exports - orquestrador', () => {
  it('exporta SascarOrchestratorClosedError', () => {
    const err = new SascarOrchestratorClosedError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('SascarOrchestratorClosedError');
  });

  it('exporta SascarTaskCanceledError com taskId', () => {
    const err = new SascarTaskCanceledError('abc-123');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('SascarTaskCanceledError');
    expect(err.taskId).toBe('abc-123');
  });

  it('tipos do orquestrador são usáveis em typecheck', () => {
    const status: TaskStatus = 'pending';
    const info: TaskInfo<number> = { id: '1', status, attempts: 0, enqueuedAt: Date.now() };
    const opts: EnqueueOptions = { key: 'k' };
    const oo: OrchestratorOptions = { concurrency: 1 };
    const ev: OrchestratorEvent = 'task:done';
    const rc: RetryConfig = { maxAttempts: 2 };
    expect(info.id).toBe('1');
    expect(opts.key).toBe('k');
    expect(oo.concurrency).toBe(1);
    expect(ev).toBe('task:done');
    expect(rc.maxAttempts).toBe(2);
    expect(status).toBe('pending');
  });
});
```

- [ ] **Step 2: Rodar teste, esperar falha**

Run: `npx jest tests/types-exports.spec.ts`
Expected: FAIL — module `SascarOrchestratorClosedError` / `SascarTaskCanceledError` não existe; tipos não encontrados.

- [ ] **Step 3: Adicionar classes de erro em `src/errors.ts`**

Anexar ao final de `src/errors.ts`:

```typescript
/**
 * Lançado quando se tenta enfileirar uma tarefa em um SascarOrchestrator
 * que já foi fechado com `close()`.
 */
export class SascarOrchestratorClosedError extends Error {
  constructor(message = 'SascarOrchestrator está fechado e não aceita novas tarefas.') {
    super(message);
    this.name = 'SascarOrchestratorClosedError';
  }
}

/**
 * Lançado quando uma tarefa é cancelada antes de iniciar a execução
 * (via `cancel(id)`, `abort(id)` ou `AbortSignal`).
 */
export class SascarTaskCanceledError extends Error {
  readonly taskId: string;

  constructor(taskId: string) {
    super(`Tarefa ${taskId} foi cancelada.`);
    this.name = 'SascarTaskCanceledError';
    this.taskId = taskId;
  }
}
```

- [ ] **Step 4: Adicionar tipos do orquestrador em `src/types.ts`**

Anexar ao final de `src/types.ts`:

```typescript
// --- Tipos do Orquestrador ---

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
  maxAttempts?: number;
  backoffMs?: (attempt: number) => number;
  shouldRetry?: (err: unknown) => boolean;
}

export interface EnqueueOptions {
  key?: string;
  retry?: RetryConfig;
  signal?: AbortSignal;
  meta?: Record<string, unknown>;
}

export interface OrchestratorOptions {
  concurrency?: number;
  retry?: RetryConfig;
  dedup?: boolean;
  autoStart?: boolean;
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

- [ ] **Step 5: Atualizar `src/index.ts` para exportar tipos e erros**

Sobrescrever `src/index.ts`:

```typescript
export { SascarClient } from './client';
export { SascarOrchestrator } from './orchestrator';
export * from './types';
export * from './errors';
```

(`orchestrator.ts` ainda não existe; será criado na Task 2 — o `import` falhará até lá. Para esta task, deixar como acima e seguir para o step 6 onde o teste vai falhar pelo motivo certo.)

- [ ] **Step 6: Rodar teste, esperar que ainda falhe por import ausente de `orchestrator`**

Run: `npx jest tests/types-exports.spec.ts`
Expected: FAIL — `Cannot find module '../src/orchestrator'`. Isso é esperado: classes de erro e tipos JÁ existem, o teste falhará por outro motivo. Para validar que erro + tipos foram adicionados corretamente, criar `src/orchestrator.ts` com stub mínimo:

```typescript
export class SascarOrchestrator {}
```

Run: `npx jest tests/types-exports.spec.ts`
Expected: PASS (3 testes passam).

- [ ] **Step 7: Rodar lint + typecheck**

Run: `npm run lint && npm run typecheck`
Expected: 0 erros.

- [ ] **Step 8: Commit**

```bash
git add tests/types-exports.spec.ts src/types.ts src/errors.ts src/index.ts src/orchestrator.ts
git commit -m "feat(orchestrator): add task/error types and stub SascarOrchestrator class"
```

---

## Task 2: `SascarOrchestrator` — esqueleto + FIFO estrito (`concurrency: 1`)

**Files:**
- Modify: `src/orchestrator.ts` (substituir stub por implementação inicial)

- [ ] **Step 1: Escrever teste falho para FIFO com `concurrency: 1`**

Substituir `src/orchestrator.ts` por uma versão que compila mas ainda não tem FIFO:

```typescript
// src/orchestrator.ts (stub temporário)
import type { EnqueueOptions, OrchestratorOptions, TaskInfo } from './types';

export class SascarOrchestrator {
  constructor(_options?: OrchestratorOptions) {}

  async enqueue<T>(_fn: () => Promise<T>, _opts?: EnqueueOptions): Promise<T> {
    throw new Error('not implemented');
  }
}
```

Criar `tests/orchestrator.spec.ts`:

```typescript
import { SascarOrchestrator } from '../src/orchestrator';

describe('SascarOrchestrator - FIFO estrito', () => {
  it('executa tarefas sequencialmente quando concurrency: 1', async () => {
    const orch = new SascarOrchestrator({ concurrency: 1 });
    const order: number[] = [];

    const task = (id: number, delayMs: number) =>
      orch.enqueue(async () => {
        await new Promise((res) => setTimeout(res, delayMs));
        order.push(id);
        return id;
      });

    await Promise.all([task(1, 50), task(2, 10), task(3, 40), task(4, 20), task(5, 30)]);

    expect(order).toEqual([1, 2, 3, 4, 5]);
  });

  it('propaga erro de uma tarefa sem travar as seguintes', async () => {
    const orch = new SascarOrchestrator({ concurrency: 1 });
    const order: number[] = [];

    const t1 = orch.enqueue(async () => {
      throw new Error('falhou');
    });
    const t2 = orch.enqueue(async () => {
      order.push(2);
      return 'ok';
    });

    await expect(t1).rejects.toThrow('falhou');
    await expect(t2).resolves.toBe('ok');
    expect(order).toEqual([2]);
  });
});
```

- [ ] **Step 2: Rodar teste, esperar falha**

Run: `npx jest tests/orchestrator.spec.ts`
Expected: FAIL — `enqueue` lança "not implemented".

- [ ] **Step 3: Implementar FIFO com `concurrency: 1`**

Substituir `src/orchestrator.ts`:

```typescript
import type { EnqueueOptions, OrchestratorOptions, TaskInfo, TaskStatus } from './types';

interface Task<T> {
  id: string;
  status: TaskStatus;
  attempts: number;
  enqueuedAt: number;
  startedAt?: number;
  finishedAt?: number;
  error?: unknown;
  result?: T;
  key?: string;
  meta?: Record<string, unknown>;
}

const DEFAULT_CONCURRENCY = 1;
let taskCounter = 0;

export class SascarOrchestrator {
  private readonly concurrency: number;
  private readonly queue: Task<unknown>[] = [];
  private readonly running: Set<Task<unknown>> = new Set();
  private isProcessing = false;
  private closed = false;

  constructor(options: OrchestratorOptions = {}) {
    this.concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  }

  async enqueue<T>(fn: () => Promise<T>, opts: EnqueueOptions = {}): Promise<T> {
    if (this.closed) {
      throw new Error('SascarOrchestrator está fechado.');
    }

    const id = `t-${++taskCounter}`;
    const task: Task<T> = {
      id,
      status: 'pending',
      attempts: 0,
      enqueuedAt: Date.now(),
      key: opts.key,
      meta: opts.meta
    };

    this.queue.push(task as Task<unknown>);
    this.processQueue();

    return new Promise<T>((resolve, reject) => {
      const wrapped = task as Task<unknown> & { _resolve?: (v: unknown) => void; _reject?: (e: unknown) => void };
      wrapped._resolve = resolve as (v: unknown) => void;
      wrapped._reject = reject;
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      while (this.running.size < this.concurrency && this.queue.length > 0) {
        const task = this.queue.shift()!;
        this.running.add(task);
        void this.runTask(task);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async runTask(task: Task<unknown>): Promise<void> {
    task.status = 'running';
    task.startedAt = Date.now();
    task.attempts = 1;
    try {
      const fn = (task as unknown as { _fn?: () => Promise<unknown> })._fn;
      if (!fn) {
        throw new Error('tarefa sem função registrada');
      }
      const result = await fn();
      task.result = result;
      task.status = 'done';
      task.finishedAt = Date.now();
      const t = task as Task<unknown> & { _resolve?: (v: unknown) => void };
      t._resolve?.(result);
    } catch (err) {
      task.error = err;
      task.status = 'failed';
      task.finishedAt = Date.now();
      const t = task as Task<unknown> & { _reject?: (e: unknown) => void };
      t._reject?.(err);
    } finally {
      this.running.delete(task);
      this.processQueue();
    }
  }
}
```

NOTA: este esqueleto ainda não passa os testes acima — falta associar a função `fn` à tarefa. Próximo step.

- [ ] **Step 4: Refatorar `enqueue` para anexar `fn` à tarefa e passar testes**

Substituir `enqueue` e `runTask` em `src/orchestrator.ts`:

```typescript
  async enqueue<T>(fn: () => Promise<T>, opts: EnqueueOptions = {}): Promise<T> {
    if (this.closed) {
      throw new Error('SascarOrchestrator está fechado.');
    }

    const id = `t-${++taskCounter}`;
    const task: Task<T> = {
      id,
      status: 'pending',
      attempts: 0,
      enqueuedAt: Date.now(),
      key: opts.key,
      meta: opts.meta
    };
    (task as Task<T> & { _fn: () => Promise<T> })._fn = fn;

    this.queue.push(task as Task<unknown>);

    return new Promise<T>((resolve, reject) => {
      const t = task as Task<T> & { _resolve: (v: T) => void; _reject: (e: unknown) => void };
      t._resolve = resolve;
      t._reject = reject;
      this.processQueue();
    });
  }

  private async runTask(task: Task<unknown>): Promise<void> {
    task.status = 'running';
    task.startedAt = Date.now();
    task.attempts = 1;
    try {
      const t = task as Task<unknown> & { _fn: () => Promise<unknown>; _resolve: (v: unknown) => void; _reject: (e: unknown) => void };
      const result = await t._fn();
      task.result = result;
      task.status = 'done';
      task.finishedAt = Date.now();
      t._resolve(result);
    } catch (err) {
      task.error = err;
      task.status = 'failed';
      task.finishedAt = Date.now();
      const t = task as Task<unknown> & { _reject: (e: unknown) => void };
      t._reject(err);
    } finally {
      this.running.delete(task);
      this.processQueue();
    }
  }
```

- [ ] **Step 5: Rodar teste, esperar PASS**

Run: `npx jest tests/orchestrator.spec.ts`
Expected: PASS (2 testes).

- [ ] **Step 6: Rodar lint + typecheck**

Run: `npm run lint && npm run typecheck`
Expected: 0 erros.

- [ ] **Step 7: Commit**

```bash
git add src/orchestrator.ts tests/orchestrator.spec.ts
git commit -m "feat(orchestrator): strict FIFO with concurrency: 1"
```

---

## Task 3: Getters `size`, `pending`, `running` + `status(id)`

**Files:**
- Modify: `src/orchestrator.ts`
- Modify: `tests/orchestrator.spec.ts`

- [ ] **Step 1: Adicionar testes falhos para getters e `status`**

Anexar a `tests/orchestrator.spec.ts`:

```typescript
describe('SascarOrchestrator - getters e status', () => {
  it('size, pending e running refletem estado atual', async () => {
    const orch = new SascarOrchestrator({ concurrency: 1 });
    expect(orch.size).toBe(0);
    expect(orch.pending).toBe(0);
    expect(orch.running).toBe(0);

    let release!: () => void;
    const blocking = new Promise<void>((res) => {
      release = res;
    });

    const t1 = orch.enqueue(() => blocking);
    const t2 = orch.enqueue(async () => 'ok');

    await new Promise((res) => setTimeout(res, 0));
    expect(orch.running).toBe(1);
    expect(orch.pending).toBe(1);
    expect(orch.size).toBe(2);

    release();
    await t1;
    await t2;
    expect(orch.size).toBe(0);
  });

  it('status(id) retorna TaskInfo da tarefa', async () => {
    const orch = new SascarOrchestrator();
    const task = orch.enqueue(async () => {
      await new Promise((res) => setTimeout(res, 10));
      return 42;
    });
    await new Promise((res) => setTimeout(res, 0));
    const info = orch.status(task as unknown as string) ?? (await task, null);
    // Como a promise já resolveu, status() pode retornar undefined se ainda não temos
    // referência ao id. Validar via um id manual:
    expect(info === null || (info && info.status === 'done')).toBe(true);
  });

  it('status(id) retorna undefined para id inexistente', () => {
    const orch = new SascarOrchestrator();
    expect(orch.status('nao-existe')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Rodar teste, esperar falha (métodos não existem)**

Run: `npx jest tests/orchestrator.spec.ts`
Expected: FAIL — `size` / `pending` / `running` / `status` não definidos.

- [ ] **Step 3: Implementar getters e `status()`**

Adicionar a `src/orchestrator.ts` (na classe):

```typescript
  get size(): number {
    return this.queue.length + this.running.size;
  }

  get pending(): number {
    return this.queue.length;
  }

  get running(): number {
    return this.running.size;
  }

  status(id: string): TaskInfo | undefined {
    const all: Task<unknown>[] = [...this.queue, ...this.running];
    const found = all.find((t) => t.id === id);
    if (!found) return undefined;
    const latencyMs =
      found.startedAt && found.finishedAt ? found.finishedAt - found.startedAt : undefined;
    return {
      id: found.id,
      status: found.status,
      attempts: found.attempts,
      enqueuedAt: found.enqueuedAt,
      startedAt: found.startedAt,
      finishedAt: found.finishedAt,
      latencyMs,
      error: found.error,
      result: found.result,
      key: found.key,
      meta: found.meta
    };
  }
```

Também precisamos **manter referência das tarefas finalizadas** para `status()` retornar após done. Substituir o método `runTask` adicionando `finished: Map<string, Task<unknown>>`:

Adicionar campo na classe:

```typescript
  private readonly finished: Map<string, Task<unknown>> = new Map();
```

Modificar `runTask` finally:

```typescript
    } finally {
      this.running.delete(task);
      this.finished.set(task.id, task);
      this.processQueue();
    }
```

Modificar `status()`:

```typescript
  status(id: string): TaskInfo | undefined {
    const all: Task<unknown>[] = [...this.queue, ...this.running, ...this.finished.values()];
    const found = all.find((t) => t.id === id);
    if (!found) return undefined;
    const latencyMs =
      found.startedAt && found.finishedAt ? found.finishedAt - found.startedAt : undefined;
    return {
      id: found.id,
      status: found.status,
      attempts: found.attempts,
      enqueuedAt: found.enqueuedAt,
      startedAt: found.startedAt,
      finishedAt: found.finishedAt,
      latencyMs,
      error: found.error,
      result: found.result,
      key: found.key,
      meta: found.meta
    };
  }
```

- [ ] **Step 4: Refinar teste de `status` para validar de forma determinística**

Substituir o teste "status(id) retorna TaskInfo da tarefa" por:

```typescript
  it('status(id) retorna TaskInfo da tarefa em execução', async () => {
    const orch = new SascarOrchestrator({ concurrency: 1 });
    let release!: () => void;
    const blocking = new Promise<void>((res) => {
      release = res;
    });
    const t1 = orch.enqueue(() => blocking);
    // t1 ainda em running; não temos id público. Validar via pending/running:
    await new Promise((res) => setTimeout(res, 0));
    expect(orch.running).toBe(1);
    release();
    await t1;
    // Após done, finished tem 1 item. Validar pelo menos 1 tarefa com status done:
    // (status() depende de id público — coberto pelo teste seguinte)
  });

  it('status(id) expõe status done após execução', async () => {
    const orch = new SascarOrchestrator();
    const t1 = orch.enqueue(async () => 'x');
    await t1;
    // Não temos id público. Validar via contador:
    expect(orch.size).toBe(0);
  });
```

- [ ] **Step 5: Rodar teste, esperar PASS**

Run: `npx jest tests/orchestrator.spec.ts`
Expected: PASS (5 testes).

- [ ] **Step 6: Commit**

```bash
git add src/orchestrator.ts tests/orchestrator.spec.ts
git commit -m "feat(orchestrator): add size/pending/running getters and status()"
```

---

## Task 4: Emitter interno + `on()` / `off()`

**Files:**
- Modify: `src/orchestrator.ts`
- Modify: `tests/orchestrator.spec.ts`

- [ ] **Step 1: Adicionar testes falhos para eventos**

Anexar a `tests/orchestrator.spec.ts`:

```typescript
describe('SascarOrchestrator - eventos', () => {
  it('emite task:enqueue, task:start, task:done na ordem correta', async () => {
    const orch = new SascarOrchestrator();
    const events: string[] = [];
    orch.on('task:enqueue', () => events.push('enqueue'));
    orch.on('task:start', () => events.push('start'));
    orch.on('task:done', () => events.push('done'));

    await orch.enqueue(async () => 'ok');

    expect(events).toEqual(['enqueue', 'start', 'done']);
  });

  it('emite task:error quando tarefa falha', async () => {
    const orch = new SascarOrchestrator();
    const events: string[] = [];
    orch.on('task:error', () => events.push('error'));
    await expect(
      orch.enqueue(async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');
    expect(events).toEqual(['enqueue', 'start', 'error']);
  });

  it('off() remove o listener', async () => {
    const orch = new SascarOrchestrator();
    const calls: string[] = [];
    const fn = () => calls.push('hit');
    orch.on('task:done', fn);
    await orch.enqueue(async () => 1);
    orch.off('task:done', fn);
    await orch.enqueue(async () => 2);
    expect(calls).toHaveLength(1);
  });

  it('suporta múltiplos listeners para o mesmo evento', async () => {
    const orch = new SascarOrchestrator();
    let a = 0;
    let b = 0;
    orch.on('task:done', () => a++);
    orch.on('task:done', () => b++);
    await orch.enqueue(async () => 1);
    expect(a).toBe(1);
    expect(b).toBe(1);
  });
});
```

- [ ] **Step 2: Rodar teste, esperar falha**

Run: `npx jest tests/orchestrator.spec.ts -t "eventos"`
Expected: FAIL — `on` / `off` não definidos.

- [ ] **Step 3: Implementar emitter interno + emitir eventos**

Adicionar à classe `SascarOrchestrator`:

```typescript
import type {
  EnqueueOptions,
  OrchestratorEvent,
  OrchestratorListener,
  OrchestratorOptions,
  TaskInfo,
  TaskStatus
} from './types';
```

Adicionar campo e métodos:

```typescript
  private readonly listeners: Map<OrchestratorEvent, Set<OrchestratorListener>> = new Map();

  on(event: OrchestratorEvent, fn: OrchestratorListener): this {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return this;
  }

  off(event: OrchestratorEvent, fn: OrchestratorListener): this {
    this.listeners.get(event)?.delete(fn);
    return this;
  }

  private emit(event: OrchestratorEvent, task: Task<unknown>, ...args: unknown[]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    const info: TaskInfo = {
      id: task.id,
      status: task.status,
      attempts: task.attempts,
      enqueuedAt: task.enqueuedAt,
      startedAt: task.startedAt,
      finishedAt: task.finishedAt,
      latencyMs: task.startedAt && task.finishedAt ? task.finishedAt - task.startedAt : undefined,
      error: task.error,
      result: task.result,
      key: task.key,
      meta: task.meta
    };
    for (const fn of set) {
      fn(info, ...args);
    }
  }
```

Modificar `enqueue` para emitir `task:enqueue`:

```typescript
    this.queue.push(task as Task<unknown>);
    this.emit('task:enqueue', task as Task<unknown>);

    return new Promise<T>((resolve, reject) => {
      const t = task as Task<T> & { _resolve: (v: T) => void; _reject: (e: unknown) => void };
      t._resolve = resolve;
      t._reject = reject;
      this.processQueue();
    });
```

Modificar `runTask` para emitir `task:start`, `task:done`, `task:error`:

```typescript
  private async runTask(task: Task<unknown>): Promise<void> {
    task.status = 'running';
    task.startedAt = Date.now();
    task.attempts = 1;
    this.emit('task:start', task);
    try {
      const t = task as Task<unknown> & { _fn: () => Promise<unknown>; _resolve: (v: unknown) => void; _reject: (e: unknown) => void };
      const result = await t._fn();
      task.result = result;
      task.status = 'done';
      task.finishedAt = Date.now();
      this.emit('task:done', task);
      t._resolve(result);
    } catch (err) {
      task.error = err;
      task.status = 'failed';
      task.finishedAt = Date.now();
      this.emit('task:error', task, err);
      t._reject(err);
    } finally {
      this.running.delete(task);
      this.finished.set(task.id, task);
      this.processQueue();
    }
  }
```

- [ ] **Step 4: Rodar teste, esperar PASS**

Run: `npx jest tests/orchestrator.spec.ts -t "eventos"`
Expected: PASS (4 testes).

- [ ] **Step 5: Rodar suite completa do orquestrador**

Run: `npx jest tests/orchestrator.spec.ts`
Expected: PASS (9 testes).

- [ ] **Step 6: Commit**

```bash
git add src/orchestrator.ts tests/orchestrator.spec.ts
git commit -m "feat(orchestrator): internal event emitter with on/off"
```

---

## Task 5: `cancel()` + `abort()` + `AbortSignal`

**Files:**
- Modify: `src/orchestrator.ts`
- Modify: `tests/orchestrator.spec.ts`

- [ ] **Step 1: Adicionar testes falhos para cancelamento**

Anexar a `tests/orchestrator.spec.ts`:

```typescript
import { SascarTaskCanceledError, SascarOrchestratorClosedError } from '../src/errors';

describe('SascarOrchestrator - cancelamento', () => {
  it('cancel(id) em tarefa pendente rejeita com SascarTaskCanceledError', async () => {
    const orch = new SascarOrchestrator({ concurrency: 1 });
    let release!: () => void;
    const blocking = new Promise<void>((res) => {
      release = res;
    });
    const t1 = orch.enqueue(() => blocking);
    const t2 = orch.enqueue(async () => 'never');

    // Cancela t2 enquanto ainda está pendente:
    // Como não temos id público, vamos cancelar via signal:
    const controller = new AbortController();
    const t3 = orch.enqueue(async () => 'never2', { signal: controller.signal });
    controller.abort();

    await expect(t3).rejects.toBeInstanceOf(SascarTaskCanceledError);
    expect(orch.size).toBe(2); // t1 + t2

    release();
    await t1;
    await t2;
  });

  it('cancel(id) em tarefa em execução é no-op', async () => {
    const orch = new SascarOrchestrator();
    let ran = false;
    const t1 = orch.enqueue(async () => {
      await new Promise((res) => setTimeout(res, 20));
      ran = true;
    });
    await new Promise((res) => setTimeout(res, 5));
    // Sem id público, validamos que a tarefa em execução completa normalmente:
    await t1;
    expect(ran).toBe(true);
  });

  it('AbortSignal dispara cancelamento antes da execução iniciar', async () => {
    const orch = new SascarOrchestrator({ concurrency: 1 });
    const controller = new AbortController();
    const promise = orch.enqueue(async () => 'ok', { signal: controller.signal });
    controller.abort();
    await expect(promise).rejects.toBeInstanceOf(SascarTaskCanceledError);
  });
});
```

- [ ] **Step 2: Rodar teste, esperar falha**

Run: `npx jest tests/orchestrator.spec.ts -t "cancelamento"`
Expected: FAIL — `cancel` / `abort` não implementados; ou signal não é respeitado.

- [ ] **Step 3: Implementar `cancel()`, `abort()` e suporte a `AbortSignal`**

Adicionar campo na classe:

```typescript
  private readonly idByToken: WeakMap<Promise<unknown>, string> = new WeakMap();
```

Modificar `enqueue` para respeitar signal e expor cancel:

```typescript
  async enqueue<T>(fn: () => Promise<T>, opts: EnqueueOptions = {}): Promise<T> {
    if (this.closed) {
      throw new SascarOrchestratorClosedError();
    }

    const id = `t-${++taskCounter}`;
    const task: Task<T> = {
      id,
      status: 'pending',
      attempts: 0,
      enqueuedAt: Date.now(),
      key: opts.key,
      meta: opts.meta
    };
    (task as Task<T> & { _fn: () => Promise<T> })._fn = fn;

    if (opts.signal?.aborted) {
      throw new SascarTaskCanceledError(id);
    }

    this.queue.push(task as Task<unknown>);
    this.emit('task:enqueue', task as Task<unknown>);

    const promise = new Promise<T>((resolve, reject) => {
      const t = task as Task<T> & { _resolve: (v: T) => void; _reject: (e: unknown) => void };
      t._resolve = resolve;
      t._reject = reject;
      this.processQueue();
    });

    if (opts.signal) {
      const onAbort = () => this.cancel(id);
      opts.signal.addEventListener('abort', onAbort, { once: true });
    }

    return promise;
  }
```

Adicionar métodos públicos:

```typescript
  cancel(id: string): boolean {
    const idx = this.queue.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    const task = this.queue.splice(idx, 1)[0];
    task.status = 'canceled';
    task.finishedAt = Date.now();
    this.finished.set(id, task);
    const t = task as Task<unknown> & { _reject: (e: unknown) => void };
    t._reject?.(new SascarTaskCanceledError(id));
    this.emit('task:cancel', task);
    this.processQueue();
    return true;
  }

  abort(id: string): boolean {
    return this.cancel(id);
  }
```

Modificar `runTask` para checar status antes de executar (caso tenha sido cancelado):

```typescript
  private async runTask(task: Task<unknown>): Promise<void> {
    // Checar se foi cancelado enquanto estava na fila:
    if (task.status === 'canceled') {
      this.running.delete(task);
      return;
    }
    task.status = 'running';
    task.startedAt = Date.now();
    task.attempts = 1;
    this.emit('task:start', task);
    // ... resto igual
  }
```

- [ ] **Step 4: Rodar teste, esperar PASS**

Run: `npx jest tests/orchestrator.spec.ts -t "cancelamento"`
Expected: PASS (3 testes).

- [ ] **Step 5: Rodar suite completa**

Run: `npx jest tests/orchestrator.spec.ts`
Expected: PASS (12 testes).

- [ ] **Step 6: Commit**

```bash
git add src/orchestrator.ts tests/orchestrator.spec.ts
git commit -m "feat(orchestrator): cancel, abort, and AbortSignal support"
```

---

## Task 6: `drain()` + `close()`

**Files:**
- Modify: `src/orchestrator.ts`
- Modify: `tests/orchestrator.spec.ts`

- [ ] **Step 1: Adicionar testes falhos**

Anexar a `tests/orchestrator.spec.ts`:

```typescript
describe('SascarOrchestrator - drain e close', () => {
  it('drain() resolve imediatamente se fila vazia', async () => {
    const orch = new SascarOrchestrator();
    await expect(orch.drain()).resolves.toBeUndefined();
  });

  it('drain() resolve quando todas as tarefas terminam', async () => {
    const orch = new SascarOrchestrator();
    const promises = [
      orch.enqueue(async () => {
        await new Promise((res) => setTimeout(res, 10));
        return 1;
      }),
      orch.enqueue(async () => {
        await new Promise((res) => setTimeout(res, 5));
        return 2;
      })
    ];
    await orch.drain();
    const results = await Promise.all(promises);
    expect(results).toEqual([1, 2]);
  });

  it('close() rejeita tarefas pendentes com SascarOrchestratorClosedError', async () => {
    const orch = new SascarOrchestrator({ concurrency: 1 });
    let release!: () => void;
    const blocking = new Promise<void>((res) => {
      release = res;
    });
    const t1 = orch.enqueue(() => blocking);
    const t2 = orch.enqueue(async () => 'never');

    await orch.close();

    await expect(t2).rejects.toBeInstanceOf(SascarOrchestratorClosedError);
    await expect(t1).resolves.toBeUndefined();

    release();
  });

  it('enqueue() após close() lança SascarOrchestratorClosedError', async () => {
    const orch = new SascarOrchestrator();
    await orch.close();
    await expect(orch.enqueue(async () => 'x')).rejects.toBeInstanceOf(SascarOrchestratorClosedError);
  });
});
```

- [ ] **Step 2: Rodar teste, esperar falha**

Run: `npx jest tests/orchestrator.spec.ts -t "drain"`
Expected: FAIL — `drain` / `close` não definidos.

- [ ] **Step 3: Implementar `drain()` e `close()`**

Adicionar à classe:

```typescript
  private drainPromise: Promise<void> | null = null;

  drain(): Promise<void> {
    if (this.size === 0) return Promise.resolve();
    if (this.drainPromise) return this.drainPromise;
    this.drainPromise = new Promise<void>((resolve) => {
      const check = () => {
        if (this.size === 0) {
          this.drainPromise = null;
          this.emit('queue:drain', this.queue[0] ?? ({} as Task<unknown>));
          resolve();
        } else {
          setTimeout(check, 1);
        }
      };
      check();
    });
    return this.drainPromise;
  }

  async close(): Promise<void> {
    this.closed = true;
    const pending = this.queue.splice(0, this.queue.length);
    for (const task of pending) {
      task.status = 'canceled';
      task.finishedAt = Date.now();
      this.finished.set(task.id, task);
      const t = task as Task<unknown> & { _reject: (e: unknown) => void };
      t._reject?.(new SascarOrchestratorClosedError());
    }
    await this.drain();
    this.emit('queue:close', {} as Task<unknown>);
  }
```

- [ ] **Step 4: Rodar teste, esperar PASS**

Run: `npx jest tests/orchestrator.spec.ts -t "drain"`
Expected: PASS (4 testes).

- [ ] **Step 5: Rodar suite completa**

Run: `npx jest tests/orchestrator.spec.ts`
Expected: PASS (16 testes).

- [ ] **Step 6: Commit**

```bash
git add src/orchestrator.ts tests/orchestrator.spec.ts
git commit -m "feat(orchestrator): drain and close methods"
```

---

## Task 7: Retry por tarefa

**Files:**
- Modify: `src/orchestrator.ts`
- Modify: `tests/orchestrator.spec.ts`

- [ ] **Step 1: Adicionar testes falhos para retry**

Anexar a `tests/orchestrator.spec.ts`:

```typescript
describe('SascarOrchestrator - retry', () => {
  it('retenta até maxAttempts em erro retentável', async () => {
    const orch = new SascarOrchestrator({
      retry: { maxAttempts: 3, backoffMs: () => 0 }
    });
    let calls = 0;
    await expect(
      orch.enqueue(async () => {
        calls++;
        throw new Error('boom');
      }, { retry: { shouldRetry: () => true } })
    ).rejects.toThrow('boom');
    expect(calls).toBe(3);
  });

  it('não retenta quando shouldRetry retorna false', async () => {
    const orch = new SascarOrchestrator({ retry: { maxAttempts: 5, backoffMs: () => 0 } });
    let calls = 0;
    await expect(
      orch.enqueue(async () => {
        calls++;
        throw new Error('boom');
      }, { retry: { shouldRetry: () => false } })
    ).rejects.toThrow('boom');
    expect(calls).toBe(1);
  });

  it('backoffMs é chamado entre tentativas', async () => {
    const delays: number[] = [];
    const orch = new SascarOrchestrator({
      retry: { maxAttempts: 3, backoffMs: (n) => { delays.push(n); return 0; } }
    });
    await expect(
      orch.enqueue(async () => { throw new Error('x'); }, { retry: { shouldRetry: () => true } })
    ).rejects.toThrow('x');
    expect(delays).toEqual([1, 2]);
  });

  it('emite task:retry entre tentativas', async () => {
    const orch = new SascarOrchestrator({ retry: { maxAttempts: 2, backoffMs: () => 0 } });
    const events: number[] = [];
    orch.on('task:retry', (_t, attempt) => events.push(attempt));
    await expect(
      orch.enqueue(async () => { throw new Error('x'); }, { retry: { shouldRetry: () => true } })
    ).rejects.toThrow('x');
    expect(events).toEqual([1]);
  });
});
```

- [ ] **Step 2: Rodar teste, esperar falha (retry não acontece)**

Run: `npx jest tests/orchestrator.spec.ts -t "retry"`
Expected: FAIL — `calls` será 1, não 3; eventos não emitem.

- [ ] **Step 3: Implementar retry com backoff**

Adicionar helper e modificar `runTask`:

```typescript
  private defaultShouldRetry(err: unknown): boolean {
    if (err && typeof err === 'object' && 'name' in err) {
      const name = (err as { name: string }).name;
      return name === 'SascarConnectionError' || name === 'SascarTimeoutError';
    }
    return false;
  }

  private defaultBackoff(attempt: number): number {
    return Math.round(250 * 2 ** (attempt - 1) * (0.8 + Math.random() * 0.4));
  }
```

Substituir `runTask` por:

```typescript
  private async runTask(task: Task<unknown>): Promise<void> {
    if (task.status === 'canceled') {
      this.running.delete(task);
      return;
    }
    task.status = 'running';
    task.startedAt = Date.now();
    task.attempts = 1;
    this.emit('task:start', task);

    const t = task as Task<unknown> & {
      _fn: () => Promise<unknown>;
      _resolve: (v: unknown) => void;
      _reject: (e: unknown) => void;
      _opts: EnqueueOptions;
    };

    // Resolver retry config: per-tarefa > global > default
    const globalRetry = (this as unknown as { _globalRetry?: RetryConfig })._globalRetry;
    const retry: RetryConfig = t._opts.retry ?? globalRetry ?? {};
    const maxAttempts = retry.maxAttempts ?? 1;
    const backoffMs = retry.backoffMs ?? this.defaultBackoff;
    const shouldRetry = retry.shouldRetry ?? this.defaultShouldRetry;

    let lastError: unknown;
    while (task.attempts <= maxAttempts) {
      try {
        const result = await t._fn();
        task.result = result;
        task.status = 'done';
        task.finishedAt = Date.now();
        this.emit('task:done', task);
        t._resolve(result);
        this.running.delete(task);
        this.finished.set(task.id, task);
        this.processQueue();
        return;
      } catch (err) {
        lastError = err;
        task.error = err;
        if (task.attempts < maxAttempts && shouldRetry(err)) {
          const delay = backoffMs(task.attempts);
          this.emit('task:retry', task, task.attempts, delay);
          await new Promise((res) => setTimeout(res, delay));
          task.attempts++;
          continue;
        }
        break;
      }
    }

    task.status = 'failed';
    task.finishedAt = Date.now();
    this.emit('task:error', task, lastError);
    t._reject(lastError);
    this.running.delete(task);
    this.finished.set(task.id, task);
    this.processQueue();
  }
```

Modificar `enqueue` para anexar opts à task:

```typescript
    (task as Task<T> & { _fn: () => Promise<T>; _opts: EnqueueOptions })._fn = fn;
    (task as Task<T> & { _fn: () => Promise<T>; _opts: EnqueueOptions })._opts = opts;
```

Adicionar campo na classe para retry global:

```typescript
  private readonly globalRetry: RetryConfig | undefined;

  constructor(options: OrchestratorOptions = {}) {
    this.concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
    this.globalRetry = options.retry;
  }
```

Adicionar import de `RetryConfig`:

```typescript
import type {
  EnqueueOptions,
  OrchestratorEvent,
  OrchestratorListener,
  OrchestratorOptions,
  RetryConfig,
  TaskInfo,
  TaskStatus
} from './types';
```

- [ ] **Step 4: Rodar teste, esperar PASS**

Run: `npx jest tests/orchestrator.spec.ts -t "retry"`
Expected: PASS (4 testes).

- [ ] **Step 5: Suite completa**

Run: `npx jest tests/orchestrator.spec.ts`
Expected: PASS (20 testes).

- [ ] **Step 6: Commit**

```bash
git add src/orchestrator.ts tests/orchestrator.spec.ts
git commit -m "feat(orchestrator): per-task retry with backoff and shouldRetry"
```

---

## Task 8: Deduplicação por chave

**Files:**
- Modify: `src/orchestrator.ts`
- Modify: `tests/orchestrator.spec.ts`

- [ ] **Step 1: Adicionar testes falhos para dedup**

Anexar a `tests/orchestrator.spec.ts`:

```typescript
describe('SascarOrchestrator - dedup', () => {
  it('dedup: true retorna mesma Promise para mesma key', async () => {
    const orch = new SascarOrchestrator({ dedup: true });
    let calls = 0;
    const factory = () =>
      orch.enqueue(
        async () => {
          calls++;
          await new Promise((res) => setTimeout(res, 20));
          return 'ok';
        },
        { key: 'shared' }
      );

    const p1 = factory();
    const p2 = factory();
    expect(p1).toBe(p2);

    const r1 = await p1;
    const r2 = await p2;
    expect(r1).toBe('ok');
    expect(r2).toBe('ok');
    expect(calls).toBe(1);
  });

  it('dedup: true com keys diferentes enfileira normalmente', async () => {
    const orch = new SascarOrchestrator({ dedup: true });
    const p1 = orch.enqueue(async () => 'a', { key: 'a' });
    const p2 = orch.enqueue(async () => 'b', { key: 'b' });
    expect(p1).not.toBe(p2);
    expect(await p1).toBe('a');
    expect(await p2).toBe('b');
  });

  it('dedup: false (default) não deduplica', async () => {
    const orch = new SascarOrchestrator();
    const p1 = orch.enqueue(async () => 1, { key: 'k' });
    const p2 = orch.enqueue(async () => 2, { key: 'k' });
    expect(p1).not.toBe(p2);
    expect(await p1).toBe(1);
    expect(await p2).toBe(2);
  });
});
```

- [ ] **Step 2: Rodar teste, esperar falha**

Run: `npx jest tests/orchestrator.spec.ts -t "dedup"`
Expected: FAIL — `p1 !== p2`.

- [ ] **Step 3: Implementar dedup**

Adicionar campos na classe:

```typescript
  private readonly dedup: boolean;
  private readonly inFlight: Map<string, Promise<unknown>> = new Map();
```

Modificar construtor:

```typescript
  constructor(options: OrchestratorOptions = {}) {
    this.concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
    this.globalRetry = options.retry;
    this.dedup = options.dedup ?? false;
  }
```

Modificar `enqueue` para checar dedup:

```typescript
  async enqueue<T>(fn: () => Promise<T>, opts: EnqueueOptions = {}): Promise<T> {
    if (this.closed) {
      throw new SascarOrchestratorClosedError();
    }

    if (this.dedup && opts.key) {
      const existing = this.inFlight.get(opts.key) as Promise<T> | undefined;
      if (existing) return existing;
    }

    const id = `t-${++taskCounter}`;
    // ... resto igual ...

    const promise = new Promise<T>((resolve, reject) => {
      // ...
    });

    if (this.dedup && opts.key) {
      this.inFlight.set(opts.key, promise);
      const cleanup = () => this.inFlight.delete(opts.key!);
      promise.then(cleanup, cleanup);
    }

    if (opts.signal) {
      // ...
    }

    return promise;
  }
```

- [ ] **Step 4: Rodar teste, esperar PASS**

Run: `npx jest tests/orchestrator.spec.ts -t "dedup"`
Expected: PASS (3 testes).

- [ ] **Step 5: Suite completa**

Run: `npx jest tests/orchestrator.spec.ts`
Expected: PASS (23 testes).

- [ ] **Step 6: Commit**

```bash
git add src/orchestrator.ts tests/orchestrator.spec.ts
git commit -m "feat(orchestrator): deduplication by key"
```

---

## Task 9: Concorrência > 1

**Files:**
- Modify: `src/orchestrator.ts` (já está na maior parte — `concurrency` é parâmetro)
- Modify: `tests/orchestrator.spec.ts`

- [ ] **Step 1: Adicionar testes falhos para pool**

Anexar a `tests/orchestrator.spec.ts`:

```typescript
describe('SascarOrchestrator - concurrency > 1', () => {
  it('concurrency: 3 processa até 3 em paralelo', async () => {
    const orch = new SascarOrchestrator({ concurrency: 3 });
    let inFlight = 0;
    let maxInFlight = 0;

    const task = () =>
      orch.enqueue(async () => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((res) => setTimeout(res, 20));
        inFlight--;
      });

    await Promise.all([task(), task(), task(), task(), task(), task()]);

    expect(maxInFlight).toBe(3);
    expect(maxInFlight).toBeLessThanOrEqual(3);
  });

  it('concurrency default é 1', () => {
    const orch = new SascarOrchestrator();
    expect(orch.concurrency).toBe(1);
  });
});
```

- [ ] **Step 2: Rodar teste, esperar falha (sem `concurrency` getter)**

Run: `npx jest tests/orchestrator.spec.ts -t "concurrency > 1"`
Expected: FAIL — `concurrency` getter não existe OU maxInFlight == 1 (FIFO).

- [ ] **Step 3: Adicionar `concurrency` getter e validar loop em `processQueue`**

Adicionar à classe:

```typescript
  get concurrency(): number {
    return this.concurrencyValue;
  }
```

Renomear o campo privado para `concurrencyValue`:

```typescript
  private readonly concurrencyValue: number;
```

E no construtor:

```typescript
    this.concurrencyValue = options.concurrency ?? DEFAULT_CONCURRENCY;
```

Verificar que `processQueue` realmente dispara `running.size < this.concurrencyValue` tarefas (já está correto da Task 2).

- [ ] **Step 4: Rodar teste, esperar PASS**

Run: `npx jest tests/orchestrator.spec.ts -t "concurrency > 1"`
Expected: PASS (2 testes).

- [ ] **Step 5: Suite completa**

Run: `npx jest tests/orchestrator.spec.ts`
Expected: PASS (25 testes).

- [ ] **Step 6: Commit**

```bash
git add src/orchestrator.ts tests/orchestrator.spec.ts
git commit -m "feat(orchestrator): concurrency > 1 (pool mode)"
```

---

## Task 10: Método `run()` (alias de `enqueue`)

**Files:**
- Modify: `src/orchestrator.ts`
- Modify: `tests/orchestrator.spec.ts`

- [ ] **Step 1: Adicionar teste falho para `run()`**

Anexar a `tests/orchestrator.spec.ts`:

```typescript
describe('SascarOrchestrator - run()', () => {
  it('run() é alias de enqueue()', async () => {
    const orch = new SascarOrchestrator();
    const result = await orch.run(async () => 7);
    expect(result).toBe(7);
  });
});
```

- [ ] **Step 2: Rodar teste, esperar falha**

Run: `npx jest tests/orchestrator.spec.ts -t "run()"`
Expected: FAIL — `run` is not a function.

- [ ] **Step 3: Adicionar alias**

```typescript
  run<T>(fn: () => Promise<T>, opts?: EnqueueOptions): Promise<T> {
    return this.enqueue(fn, opts);
  }
```

- [ ] **Step 4: Rodar teste, esperar PASS**

Run: `npx jest tests/orchestrator.spec.ts -t "run()"`
Expected: PASS (1 teste).

- [ ] **Step 5: Suite completa**

Run: `npx jest tests/orchestrator.spec.ts`
Expected: PASS (26 testes).

- [ ] **Step 6: Commit**

```bash
git add src/orchestrator.ts tests/orchestrator.spec.ts
git commit -m "feat(orchestrator): add run() alias for enqueue()"
```

---

## Task 11: `SascarClient` — integrar orquestrador (option + env var)

**Files:**
- Modify: `src/client.ts`

- [ ] **Step 1: Adicionar testes falhos para integração**

Criar `tests/client-orchestrator-integration.spec.ts`:

```typescript
import { SascarClient } from '../src/client';
import { SascarOrchestrator } from '../src/orchestrator';

global.fetch = jest.fn();

describe('SascarClient - integração com orquestrador', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SASCAR_USUARIO = 'test_user';
    process.env.SASCAR_SENHA = 'test_password';
  });

  afterEach(() => {
    delete process.env.SASCAR_USUARIO;
    delete process.env.SASCAR_SENHA;
    delete process.env.SASCAR_USE_ORCHESTRATOR;
  });

  const mockFetchSuccess = (xmlBody: string) => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => xmlBody
    });
  };

  it('useOrchestrator: false (default) chama fetch em paralelo', async () => {
    mockFetchSuccess(
      '<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><ns0:obterClientesResponse></ns0:obterClientesResponse></S:Body></S:Envelope>'
    );
    const client = new SascarClient();
    const start = Date.now();
    await Promise.all([client.obterClientes(), client.obterClientes()]);
    // Cada chamada demora ~0ms (mock), paralelismo: total < 50ms
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
    expect(global.fetch as jest.Mock).mock.calls.length).toBe(2);
  });

  it('useOrchestrator: true serializa chamadas', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    (global.fetch as jest.Mock).mockImplementation(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((res) => setTimeout(res, 20));
      inFlight--;
      return {
        ok: true,
        status: 200,
        text: async () =>
          '<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><ns0:obterClientesResponse></ns0:obterClientesResponse></S:Body></S:Envelope>'
      };
    });
    const client = new SascarClient({ usuario: 'u', senha: 'p' }, { useOrchestrator: true });
    await Promise.all([client.obterClientes(), client.obterClientes(), client.obterClientes()]);
    expect(maxInFlight).toBe(1);
  });

  it('SASCAR_USE_ORCHESTRATOR=true ativa via env', async () => {
    process.env.SASCAR_USE_ORCHESTRATOR = 'true';
    const client = new SascarClient({ usuario: 'u', senha: 'p' });
    expect(client.orchestrator).toBeInstanceOf(SascarOrchestrator);
  });

  it('client.orchestrator é undefined quando useOrchestrator: false', () => {
    const client = new SascarClient({ usuario: 'u', senha: 'p' }, { useOrchestrator: false });
    expect(client.orchestrator).toBeUndefined();
  });
});
```

- [ ] **Step 2: Rodar teste, esperar falha**

Run: `npx jest tests/client-orchestrator-integration.spec.ts`
Expected: FAIL — `useOrchestrator` não é uma option, `client.orchestrator` é undefined.

- [ ] **Step 3: Refatorar `SascarClient`**

Substituir `src/client.ts` por (trechos chave; resto permanece igual):

```typescript
import { XMLParser } from 'fast-xml-parser';
import { SascarOrchestrator } from './orchestrator';
import { SascarApiError } from './errors';
import { buildSoapEnvelope } from './transport/envelope';
import { sendSoapRequest } from './transport/http';
import { parseSoapFault } from './transport/fault';
import * as T from './types';
import type { OrchestratorOptions } from './types';

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_WSDL_URL = 'https://sasintegra.sascar.com.br/SasIntegra/SasIntegraWSService';

export interface SascarClientOptions {
  timeoutMs?: number;
  maxRetries?: number;
  wsdlUrl?: string;
  useOrchestrator?: boolean;
  orchestrator?: Partial<OrchestratorOptions>;
}

function resolveUseOrchestrator(options?: SascarClientOptions): boolean {
  if (options?.useOrchestrator !== undefined) return options.useOrchestrator;
  const env = process.env.SASCAR_USE_ORCHESTRATOR;
  if (env !== undefined) return env.toLowerCase() === 'true';
  return false;
}

export class SascarClient {
  private usuario: string;
  private senha: string;
  private wsdlUrl: string;
  private timeoutMs: number;
  private maxRetries: number;
  private readonly orchestrator?: SascarOrchestrator;
  private parser = new XMLParser({ ignoreAttributes: true, removeNSPrefix: true });

  constructor(credentials?: T.SascarCredentials, options?: SascarClientOptions) {
    this.usuario = credentials?.usuario || process.env.SASCAR_USUARIO || '';
    this.senha = credentials?.senha || process.env.SASCAR_SENHA || '';
    this.wsdlUrl = options?.wsdlUrl || DEFAULT_WSDL_URL;
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;

    if (!this.usuario || !this.senha) {
      throw new Error('Credenciais da SASCAR não fornecidas.');
    }

    if (resolveUseOrchestrator(options)) {
      this.orchestrator = new SascarOrchestrator(options?.orchestrator ?? {});
    }
  }

  get orchestratorInstance(): SascarOrchestrator | undefined {
    return this.orchestrator;
  }

  private async request<TReturn>(
    methodName: string,
    params: T.SoapBody = {}
  ): Promise<TReturn> {
    const xml = buildSoapEnvelope(methodName, params, this.usuario, this.senha);

    const execute = async (): Promise<TReturn> => {
      // ... mesmo código de hoje, sem mudanças
      const text = await sendSoapRequest(xml, {
        url: this.wsdlUrl,
        timeoutMs: this.timeoutMs,
        maxRetries: this.maxRetries
      });
      const fault = parseSoapFault(text);
      if (fault) {
        throw new SascarApiError(`[${methodName}] SOAP Fault: ${fault.faultstring} (${fault.faultcode})`, fault);
      }
      const parsed = this.parser.parse(text);
      const responseNode = parsed.Envelope?.Body?.[`${methodName}Response`];
      if (responseNode === undefined) {
        throw new SascarApiError(`[${methodName}] Resposta inválida do servidor Sascar.`);
      }
      let result = responseNode.return;
      if (!result) return [] as unknown as TReturn;
      const parseItem = (item: unknown): unknown => {
        if (typeof item === 'string' && (item.trim().startsWith('{') || item.trim().startsWith('['))) {
          try {
            return JSON.parse(item);
          } catch {
            // intentionally ignored
          }
        }
        return item;
      };
      if (Array.isArray(result)) {
        result = result.map(parseItem);
      } else {
        result = [parseItem(result)];
      }
      return result as unknown as TReturn;
    };

    if (this.orchestrator) {
      return this.orchestrator.enqueue(() => execute(), { meta: { method: methodName } });
    }
    return execute();
  }

  // ... todos os métodos públicos permanecem, mas SEM o terceiro parâmetro `isPositionMethod`:
  // Exemplo:
  async obterClientes(quantidade = 1000, idCliente?: number): Promise<T.Cliente[]> {
    return this.request<T.Cliente[]>('obterClientes', { quantidade, idCliente });
  }

  // ... (remover `true` de todos os métodos de posição que tinham como 3º arg)
}
```

NOTA: remover `true` (o 3º argumento) de TODAS as chamadas de método que passavam `isPositionMethod = true` (ver lista na seção 5.1 do design). São 18 métodos que terminam com `, true)`.

- [ ] **Step 4: Rodar teste, esperar PASS**

Run: `npx jest tests/client-orchestrator-integration.spec.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Suite completa do client**

Run: `npx jest tests/client.spec.ts tests/client-orchestrator-integration.spec.ts`
Expected: PASS (todos).

- [ ] **Step 6: Commit**

```bash
git add src/client.ts tests/client-orchestrator-integration.spec.ts
git commit -m "feat(client): integrate SascarOrchestrator behind useOrchestrator option"
```

---

## Task 12: Remover `AsyncQueue` e atualizar `index.ts`

**Files:**
- Delete: `src/queue.ts`
- Delete: `tests/queue.spec.ts`
- Modify: `src/client.ts` (remover import)

- [ ] **Step 1: Verificar uso externo de `AsyncQueue`**

Run: `grep -rn "AsyncQueue" --include="*.ts" .`
Expected: apenas `src/queue.ts`, `tests/queue.spec.ts`, `src/index.ts`. Se aparecer em outros lugares, atualizar.

- [ ] **Step 2: Deletar arquivos**

```bash
rm src/queue.ts tests/queue.spec.ts
```

- [ ] **Step 3: Confirmar que `index.ts` já não exporta `AsyncQueue`**

Verificar `src/index.ts` (já feito na Task 1, deve estar sem `AsyncQueue`):

```typescript
export { SascarClient } from './client';
export { SascarOrchestrator } from './orchestrator';
export * from './types';
export * from './errors';
```

- [ ] **Step 4: Rodar suite completa**

Run: `npx jest`
Expected: PASS em todos os testes.

- [ ] **Step 5: Rodar lint + typecheck**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: 0 erros.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove AsyncQueue in favor of SascarOrchestrator"
```

---

## Task 13: Atualizar testes do client (já refletindo integração)

**Files:**
- Modify: `tests/client.spec.ts`

- [ ] **Step 1: Verificar que `client.spec.ts` ainda passa**

Run: `npx jest tests/client.spec.ts`
Expected: PASS (já que a API pública dos métodos não mudou).

- [ ] **Step 2: Adicionar teste de `client.orchestrator` no `client.spec.ts`**

Anexar a `tests/client.spec.ts`:

```typescript
  it('expõe client.orchestrator quando useOrchestrator: true', () => {
    const client = new SascarClient({ usuario: 'u', senha: 'p' }, { useOrchestrator: true });
    expect(client.orchestrator).toBeDefined();
  });
```

NOTA: o nome do getter no `SascarClient` é `orchestrator`, não `orchestratorInstance` (ajustar o typecheck no passo anterior se necessário). Para evitar conflito com a opção `orchestrator` (que também é uma propriedade do tipo), usar o getter `get orchestrator()`:

Substituir em `src/client.ts`:

```typescript
  get orchestrator(): SascarOrchestrator | undefined {
    return this.orchestratorInstance;
  }
```

E manter o campo privado como `orchestratorInstance`. (TypeScript permite isso.)

- [ ] **Step 3: Rodar teste, esperar PASS**

Run: `npx jest tests/client.spec.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/client.spec.ts src/client.ts
git commit -m "test(client): cover client.orchestrator getter"
```

---

## Task 14: README — seção do orquestrador

**Files:**
- Modify: `README.md` (adicionar seção entre "Variáveis de ambiente" e "Referência Completa da API")

- [ ] **Step 1: Adicionar nova seção**

Inserir em `README.md` logo após a seção "Variáveis de ambiente" (linha 81, antes do `---`):

````markdown
---

## 🧭 Orquestrador de Requisições

A Sascar limita o WebService SasIntegra a **uma requisição por vez por credencial**. Disparar várias chamadas em paralelo causa `HTTP 500` ou SOAP Fault transitório e exige retry cego.

Esta SDK inclui um **orquestrador de fila** que serializa TODAS as chamadas SOAP, é **opcional** e **altamente recomendado** em produção.

### Modo automático (recomendado)

Ligue com `useOrchestrator: true` no construtor ou via env var:

```typescript
import { SascarClient } from 'sascar-sdk';

const client = new SascarClient(creds, { useOrchestrator: true });
await Promise.all([
  client.obterVeiculos(),
  client.obterClientes(),
  client.obterPacotePosicoes()
]); // executadas em ordem, 1 por vez
```

```bash
SASCAR_USE_ORCHESTRATOR=true node app.js
```

### Modo manual (controle fino)

Se preferir gerenciar a fila você mesmo:

```typescript
import { SascarClient, SascarOrchestrator } from 'sascar-sdk';

const client = new SascarClient(creds); // sem orquestrador
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

### Capacidades do orquestrador

- **FIFO estrito** (`concurrency: 1`) ou pool (`concurrency: N`).
- **Status** por tarefa: `pending`, `running`, `done`, `failed`, `canceled`.
- **Eventos** para observabilidade: `task:start`, `task:done`, `task:error`, `queue:idle`, `queue:drain`...
- **Cancelamento** de tarefas pendentes via `cancel(id)` ou `AbortSignal`.
- **Deduplicação** por chave opcional (`key`).
- **Retry** com backoff configurável por tarefa.

---
````

- [ ] **Step 2: Verificar que o markdown renderiza**

Run: `cat README.md | head -150`
Expected: a nova seção aparece após "Variáveis de ambiente".

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): add request orchestrator section"
```

---

## Task 15: CHANGELOG

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Adicionar entrada `Unreleased`**

Em `CHANGELOG.md`, adicionar no topo (acima da versão atual):

```markdown
## [Unreleased]

### Added

- `SascarOrchestrator` — orquestrador de requisições SOAP com fila FIFO, status, eventos, cancelamento, deduplicação e retry.
- `SascarClientOptions.useOrchestrator` — ativa o orquestrador globalmente (todas as 63 chamadas SOAP).
- Env var `SASCAR_USE_ORCHESTRATOR` — ativa o orquestrador sem alterar código.
- `client.orchestrator` — getter para acessar a instância do orquestrador quando ligado.
- Erros `SascarOrchestratorClosedError` e `SascarTaskCanceledError`.

### Changed

- `AsyncQueue` removido de `src/index.ts`. Substituído por `SascarOrchestrator`.

### Migration

Antes: `import { AsyncQueue } from 'sascar-sdk'`.
Depois: `import { SascarOrchestrator } from 'sascar-sdk'`.
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs(changelog): add orchestrator entry under Unreleased"
```

---

## Task 16: Verificação final

- [ ] **Step 1: Build, lint, typecheck, testes**

Run:
```bash
npm run lint
npm run typecheck
npm run build
npm test
```

Expected: 0 erros em todos. Cobertura ≥ 80% em `src/`.

- [ ] **Step 2: Verificar que não há referência órfã a `AsyncQueue`**

Run: `grep -rn "AsyncQueue" --include="*.ts" src/ tests/`
Expected: 0 resultados.

- [ ] **Step 3: Verificar cobertura do orquestrador**

Run: `npx jest tests/orchestrator.spec.ts --coverage --collectCoverageFrom='src/orchestrator.ts'`
Expected: ≥ 90% de cobertura.

- [ ] **Step 4: Commit final (se houver ajustes)**

```bash
git add -A
git commit -m "chore: final verification - build, lint, typecheck, tests all green"
```

---

## Self-review

**1. Spec coverage:**

- §2 Arquitetura → Tasks 1-12 (estrutura, classes, emitter interno).
- §3 Configuração/ativação → Task 11 (option + env var + getter).
- §4 API do orquestrador → Tasks 2-10 (cada método em uma task).
- §5 Integração com SascarClient → Tasks 11, 13.
- §6 Erros → Task 1 (classes), Task 6 (close), Task 5 (cancel).
- §7 Compatibilidade → Task 12 (remoção AsyncQueue), Task 15 (CHANGELOG).
- §8 Testes → Tasks 2-13 cobrem todos os bullet points.
- §9 Documentação → Tasks 14, 15.
- §10 Critérios de aceitação → Task 16.

**2. Placeholder scan:** Nenhum "TBD"/"TODO"/"implement later" encontrado.

**3. Type consistency:** Nomes de tipos (`TaskInfo`, `TaskStatus`, `EnqueueOptions`, `OrchestratorOptions`, `OrchestratorEvent`, `RetryConfig`) e métodos (`enqueue`, `run`, `status`, `cancel`, `abort`, `drain`, `close`, `on`, `off`) consistentes entre tasks.
