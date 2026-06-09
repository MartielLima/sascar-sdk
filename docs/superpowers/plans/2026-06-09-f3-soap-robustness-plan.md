# F3 — Robustez do Cliente SOAP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o `SascarClient` resiliente: timeout, retry com backoff exponencial, erros tipados (`SascarTimeoutError`, `SascarAuthError`) e parser de SOAP Fault robusto. API pública mantida (apenas adição opcional).

**Architecture:** Extrair lógica HTTP/SOAP do `client.ts` para 3 módulos em `src/transport/`: `http.ts` (fetch + timeout + retry), `envelope.ts` (build/parse), `fault.ts` (parser de Fault). O `client.ts` vira um orquestrador fino. Backoff exponencial com jitter (±20%).

**Tech Stack:** TypeScript 5.3+, `fetch` nativo + `AbortController` (Node ≥18).

**Reference:** Design `docs/superpowers/specs/2026-06-09-f3-soap-robustness-design.md`.

**Estado após F1:** 15/15 testes, build/lint/typecheck verdes, 0 `any`, Prettier+ESLint configurados.

---

## File structure da F3

```
src/
├── client.ts                (modificado: delega para transport/)
├── transport/               (novo diretório)
│   ├── http.ts              (novo: sendSoapRequest com timeout+retry)
│   ├── envelope.ts          (novo: buildSoapEnvelope + parseSoapResponse)
│   └── fault.ts             (novo: parseSoapFault)
├── errors.ts                (modificado: +SascarTimeoutError, +SascarAuthError)
└── ...
tests/
├── transport/               (novo diretório)
│   ├── http.spec.ts
│   ├── envelope.spec.ts
│   └── fault.spec.ts
└── client.spec.ts           (modificado: novos casos de timeout/retry/auth)
```

---

## Tarefas

### Task 1: Adicionar erros `SascarTimeoutError` e `SascarAuthError` (TDD)

**Files:**
- Modify: `src/errors.ts`
- Test: `tests/errors.spec.ts` (novo)

- [ ] **Step 1: Criar `tests/errors.spec.ts` (RED)**

Conteúdo:
```typescript
import {
  SascarApiError,
  SascarAuthError,
  SascarConnectionError,
  SascarRateLimitError,
  SascarTimeoutError
} from '../src/errors';

describe('Error classes', () => {
  it('SascarTimeoutError herda de SascarConnectionError e expõe timeoutMs', () => {
    const err = new SascarTimeoutError('timeout reached', 5000);
    expect(err).toBeInstanceOf(SascarTimeoutError);
    expect(err).toBeInstanceOf(SascarConnectionError);
    expect(err.name).toBe('SascarTimeoutError');
    expect(err.timeoutMs).toBe(5000);
  });

  it('SascarAuthError herda de SascarApiError e expõe statusCode', () => {
    const err = new SascarAuthError('unauthorized', 401);
    expect(err).toBeInstanceOf(SascarAuthError);
    expect(err).toBeInstanceOf(SascarApiError);
    expect(err.name).toBe('SascarAuthError');
    expect(err.statusCode).toBe(401);
  });

  it('SascarRateLimitError herda de Error e tem name correto', () => {
    const err = new SascarRateLimitError('rate limit');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('SascarRateLimitError');
  });
});
```

- [ ] **Step 2: Rodar para ver FAIL**

Run: `npm test -- tests/errors.spec.ts 2>&1 | tail -15`
Expected: FAIL — `SascarTimeoutError` e `SascarAuthError` não exportados.

- [ ] **Step 3: Adicionar classes a `src/errors.ts`**

oldString em `src/errors.ts`:
```typescript
export class SascarConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SascarConnectionError';
  }
}

export class SascarRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SascarRateLimitError';
  }
}

export class SascarApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SascarApiError';
  }
}
```

newString:
```typescript
export class SascarConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SascarConnectionError';
  }
}

export class SascarRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SascarRateLimitError';
  }
}

export class SascarApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SascarApiError';
  }
}

/**
 * Lançado quando a requisição HTTP excede o timeout configurado.
 * Herda de SascarConnectionError para permitir catching amplo.
 */
export class SascarTimeoutError extends SascarConnectionError {
  readonly timeoutMs: number;

  constructor(message: string, timeoutMs: number) {
    super(message);
    this.name = 'SascarTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Lançado em falhas de autenticação (HTTP 401/403 ou SOAP Fault de auth).
 * Herda de SascarApiError.
 */
export class SascarAuthError extends SascarApiError {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'SascarAuthError';
    this.statusCode = statusCode;
  }
}
```

- [ ] **Step 4: Rodar para ver PASS**

Run: `npm test -- tests/errors.spec.ts 2>&1 | tail -10`
Expected: PASS — 3/3 testes verdes.

- [ ] **Step 5: Rodar suite completa (não regrediu)**

Run: `npm test 2>&1 | tail -10`
Expected: 18/18 testes verdes (15 antigos + 3 novos).

- [ ] **Step 6: Commit**

```bash
git add src/errors.ts tests/errors.spec.ts
git commit -m "feat(errors): add SascarTimeoutError and SascarAuthError"
```

---

### Task 2: Extrair `buildSoapEnvelope` para `src/transport/envelope.ts` (refactor sem mudança de comportamento)

**Files:**
- Create: `src/transport/envelope.ts`
- Modify: `src/client.ts:1-45`
- Test: `tests/transport/envelope.spec.ts` (novo)

- [ ] **Step 1: Criar `tests/transport/envelope.spec.ts` (RED)**

Conteúdo:
```typescript
import { buildSoapEnvelope } from '../../src/transport/envelope';

describe('buildSoapEnvelope', () => {
  it('gera envelope SOAP com header, body e credenciais', () => {
    const xml = buildSoapEnvelope('obterVeiculos', { quantidade: 100 }, 'user', 'pass');
    expect(xml).toContain('<?xml');
    expect(xml).toContain('http://schemas.xmlsoap.org/soap/envelope/');
    expect(xml).toContain('<soapenv:Header/>');
    expect(xml).toContain('<web:obterVeiculos>');
    expect(xml).toContain('<usuario>user</usuario>');
    expect(xml).toContain('<senha>pass</senha>');
    expect(xml).toContain('<quantidade>100</quantidade>');
  });

  it('omite parâmetros undefined', () => {
    const xml = buildSoapEnvelope('obterVeiculos', { quantidade: 100 }, 'u', 'p');
    expect(xml).not.toContain('<idVeiculo>undefined</idVeiculo>');
  });
});
```

- [ ] **Step 2: Rodar para ver FAIL**

Run: `npm test -- tests/transport/envelope.spec.ts 2>&1 | tail -10`
Expected: FAIL — `Cannot find module '../../src/transport/envelope'`.

- [ ] **Step 3: Criar `src/transport/envelope.ts`**

Conteúdo:
```typescript
import { XMLBuilder } from 'fast-xml-parser';
import type { SoapBody } from '../types';

const SOAP_NS = 'http://schemas.xmlsoap.org/soap/envelope/';
const WEB_NS = 'http://webservice.web.integracao.sascar.com.br/';

const builder = new XMLBuilder({
  ignoreAttributes: false,
  format: false,
  suppressEmptyNode: true
});

/**
 * Constrói um envelope SOAP XML para a operação informada.
 * Inclui as credenciais (usuario, senha) no body conforme o WSDL SasIntegra.
 */
export function buildSoapEnvelope(methodName: string, body: SoapBody, usuario: string, senha: string): string {
  const envelope = {
    'soapenv:Envelope': {
      '@_xmlns:soapenv': SOAP_NS,
      '@_xmlns:web': WEB_NS,
      'soapenv:Header': '',
      'soapenv:Body': {
        [`web:${methodName}`]: {
          usuario,
          senha,
          ...body
        }
      }
    }
  };
  return builder.build(envelope);
}
```

- [ ] **Step 4: Rodar para ver PASS**

Run: `npm test -- tests/transport/envelope.spec.ts 2>&1 | tail -10`
Expected: PASS — 2/2 verdes.

- [ ] **Step 5: Refatorar `client.ts` para usar o novo módulo**

oldString em `src/client.ts:1-5`:
```typescript
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { AsyncQueue } from './queue';
import { SascarConnectionError, SascarApiError } from './errors';
import * as T from './types';
```

newString:
```typescript
import { XMLParser } from 'fast-xml-parser';
import { AsyncQueue } from './queue';
import { SascarConnectionError, SascarApiError } from './errors';
import { buildSoapEnvelope } from './transport/envelope';
import { sendSoapRequest } from './transport/http';
import * as T from './types';
```

oldString em `src/client.ts:11`:
```typescript
  private parser = new XMLParser({ ignoreAttributes: true, removeNSPrefix: true });
```

newString:
```typescript
  private parser = new XMLParser({ ignoreAttributes: true, removeNSPrefix: true });
  // (buildSoapEnvelope foi movido para ./transport/envelope; see import above)
```

oldString em `src/client.ts:23-46` (todo o método `buildSoapEnvelope`):
```typescript
  private buildSoapEnvelope(methodName: string, bodyObj: T.SoapBody): string {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      suppressEmptyNode: true
    });

    const envelope = {
      'soapenv:Envelope': {
        '@_xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
        '@_xmlns:web': 'http://webservice.web.integracao.sascar.com.br/',
        'soapenv:Header': '',
        'soapenv:Body': {
          [`web:${methodName}`]: {
            usuario: this.usuario,
            senha: this.senha,
            ...bodyObj
          }
        }
      }
    };

    return builder.build(envelope);
  }
```

newString (remove o método privado inteiro, mantém só comentário):
```typescript
  // buildSoapEnvelope foi extraído para src/transport/envelope.ts
```

- [ ] **Step 6: Rodar testes para garantir que não regrediu**

Run: `npm test 2>&1 | tail -10`
Expected: 17/17 testes verdes (15 antigos + 2 novos do envelope).

- [ ] **Step 7: Commit**

```bash
git add src/transport/envelope.ts src/client.ts tests/transport/envelope.spec.ts
git commit -m "refactor(transport): extract buildSoapEnvelope to transport/envelope.ts"
```

---

### Task 3: Criar `src/transport/fault.ts` com parser de SOAP Fault (TDD)

**Files:**
- Create: `src/transport/fault.ts`
- Test: `tests/transport/fault.spec.ts` (novo)

- [ ] **Step 1: Criar `tests/transport/fault.spec.ts` (RED)**

Conteúdo:
```typescript
import { parseSoapFault } from '../../src/transport/fault';

describe('parseSoapFault', () => {
  it('extrai faultcode e faultstring de um Fault bem-formado', () => {
    const xml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <soapenv:Fault>
            <faultcode>soap-env:Client</faultcode>
            <faultstring>Credenciais inválidas</faultstring>
          </soapenv:Fault>
        </soapenv:Body>
      </soapenv:Envelope>
    `;
    const fault = parseSoapFault(xml);
    expect(fault).not.toBeNull();
    expect(fault?.faultcode).toBe('soap-env:Client');
    expect(fault?.faultstring).toBe('Credenciais inválidas');
  });

  it('extrai detail quando presente', () => {
    const xml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <soapenv:Fault>
            <faultcode>soap-env:Server</faultcode>
            <faultstring>Internal error</faultstring>
            <detail>Stack trace here</detail>
          </soapenv:Fault>
        </soapenv:Body>
      </soapenv:Envelope>
    `;
    const fault = parseSoapFault(xml);
    expect(fault?.detail).toBe('Stack trace here');
  });

  it('retorna null quando não há Fault', () => {
    const xml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <obterVeiculosResponse></obterVeiculosResponse>
        </soapenv:Body>
      </soapenv:Envelope>
    `;
    expect(parseSoapFault(xml)).toBeNull();
  });

  it('lida com Fault malformado retornando faultstring parcial', () => {
    const xml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <soapenv:Fault>
            <faultstring>Apenas string</faultstring>
          </soapenv:Fault>
        </soapenv:Body>
      </soapenv:Envelope>
    `;
    const fault = parseSoapFault(xml);
    expect(fault?.faultstring).toBe('Apenas string');
    expect(fault?.faultcode).toBe('unknown');
  });
});
```

- [ ] **Step 2: Rodar para ver FAIL**

Run: `npm test -- tests/transport/fault.spec.ts 2>&1 | tail -10`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Criar `src/transport/fault.ts`**

Conteúdo:
```typescript
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({ ignoreAttributes: true, removeNSPrefix: true });

export interface SascarSoapFault {
  faultcode: string;
  faultstring: string;
  detail?: string;
}

/**
 * Faz o parse de uma resposta XML SOAP procurando um Fault.
 * Retorna null se não houver Fault, ou um SascarSoapFault com os
 * campos extraídos. Em caso de Fault malformado, retorna o que
 * conseguir extrair com faultcode 'unknown'.
 */
export function parseSoapFault(xml: string): SascarSoapFault | null {
  const parsed = parser.parse(xml);
  const fault = parsed?.Envelope?.Body?.Fault;
  if (!fault) return null;

  return {
    faultcode: typeof fault.faultcode === 'string' ? fault.faultcode : 'unknown',
    faultstring: typeof fault.faultstring === 'string' ? fault.faultstring : '',
    detail: typeof fault.detail === 'string' ? fault.detail : undefined
  };
}
```

- [ ] **Step 4: Rodar para ver PASS**

Run: `npm test -- tests/transport/fault.spec.ts 2>&1 | tail -10`
Expected: PASS — 4/4 verdes.

- [ ] **Step 5: Commit**

```bash
git add src/transport/fault.ts tests/transport/fault.spec.ts
git commit -m "feat(transport): add SOAP Fault parser"
```

---

### Task 4: Criar `src/transport/http.ts` com timeout + retry (TDD — parte 1: timeout)

**Files:**
- Create: `src/transport/http.ts`
- Test: `tests/transport/http.spec.ts` (novo)

- [ ] **Step 1: Criar `tests/transport/http.spec.ts` com testes de timeout (RED)**

Conteúdo:
```typescript
import { sendSoapRequest, type SendSoapOptions } from '../../src/transport/http';

global.fetch = jest.fn();

describe('sendSoapRequest - timeout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lança SascarTimeoutError quando fetch excede timeoutMs', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        })
    );

    const opts: SendSoapOptions = { url: 'https://x', timeoutMs: 50 };
    await expect(sendSoapRequest('<xml/>', opts)).rejects.toThrow(/timeout/i);
  });

  it('retorna texto da resposta em caso de sucesso', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => '<ok/>'
    });
    const result = await sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000 });
    expect(result).toBe('<ok/>');
  });

  it('lança SascarAuthError em HTTP 401', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => ''
    });
    await expect(sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000 })).rejects.toThrow(/auth|401/i);
  });

  it('lança SascarAuthError em HTTP 403', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => ''
    });
    await expect(sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000 })).rejects.toThrow(/auth|403/i);
  });

  it('lança SascarRateLimitError em HTTP 429', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => ''
    });
    await expect(sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000 })).rejects.toThrow(/rate|429/i);
  });
});
```

- [ ] **Step 2: Rodar para ver FAIL**

Run: `npm test -- tests/transport/http.spec.ts 2>&1 | tail -10`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Criar `src/transport/http.ts` (GREEN para timeout + auth + rate)**

Conteúdo:
```typescript
import { SascarApiError, SascarAuthError, SascarConnectionError, SascarRateLimitError, SascarTimeoutError } from '../errors';

export interface SendSoapOptions {
  url: string;
  timeoutMs: number;
  maxRetries?: number;
  onRetry?: (attempt: number, delayMs: number) => void;
}

const TRANSIENT_STATUS = new Set([500, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function isTransientStatus(status: number): boolean {
  return TRANSIENT_STATUS.has(status);
}

/**
 * Envia uma requisição SOAP e retorna o corpo da resposta como string.
 *
 * Comportamento:
 *  - Aplica timeout via AbortController
 *  - Em status 401/403 lança SascarAuthError
 *  - Em status 429 lança SascarRateLimitError
 *  - Em status 5xx transiente, faz retry com backoff exponencial (até maxRetries)
 *  - Em outros status não-ok, lança SascarApiError
 *  - Em erro de rede, lança SascarConnectionError
 *  - Em timeout, lança SascarTimeoutError
 */
export async function sendSoapRequest(xml: string, options: SendSoapOptions): Promise<string> {
  const { url, timeoutMs } = options;
  const maxRetries = options.maxRetries ?? 3;
  const onRetry = options.onRetry;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          SOAPAction: '""'
        },
        body: xml,
        signal: controller.signal
      });

      clearTimeout(timer);

      if (response.ok) {
        return await response.text();
      }

      const status = response.status;

      if (status === 401 || status === 403) {
        throw new SascarAuthError(`HTTP ${status} em ${url}`, status);
      }

      if (status === 429) {
        throw new SascarRateLimitError(`HTTP 429 (rate limit) em ${url}`);
      }

      if (isTransientStatus(status) && attempt < maxRetries - 1) {
        lastError = new SascarApiError(`HTTP ${status} transiente em ${url}`);
        const delay = 250 * 2 ** attempt * (0.8 + Math.random() * 0.4);
        onRetry?.(attempt + 1, delay);
        await sleep(delay);
        continue;
      }

      throw new SascarApiError(`HTTP ${status} em ${url}`);
    } catch (err) {
      clearTimeout(timer);

      if (err instanceof SascarAuthError || err instanceof SascarRateLimitError || err instanceof SascarApiError) {
        throw err;
      }

      if (err instanceof Error && err.name === 'AbortError') {
        throw new SascarTimeoutError(`Timeout (${timeoutMs}ms) em ${url}`, timeoutMs);
      }

      if (err instanceof Error) {
        const isLastAttempt = attempt === maxRetries - 1;
        if (isLastAttempt) {
          throw new SascarConnectionError(`Erro de rede em ${url}: ${err.message}`);
        }
        lastError = err;
        const delay = 250 * 2 ** attempt * (0.8 + Math.random() * 0.4);
        onRetry?.(attempt + 1, delay);
        await sleep(delay);
        continue;
      }

      throw new SascarConnectionError(`Erro desconhecido em ${url}: ${String(err)}`);
    }
  }

  // unreachable
  throw new SascarConnectionError(
    `Falha após ${maxRetries} tentativas em ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}
```

- [ ] **Step 4: Rodar para ver PASS**

Run: `npm test -- tests/transport/http.spec.ts 2>&1 | tail -10`
Expected: PASS — 5/5 verdes.

- [ ] **Step 5: Commit**

```bash
git add src/transport/http.ts tests/transport/http.spec.ts
git commit -m "feat(transport): add HTTP transport with timeout and typed errors"
```

---

### Task 5: Adicionar testes de retry no `http.spec.ts` (TDD — parte 2: retry)

**Files:**
- Modify: `tests/transport/http.spec.ts`

- [ ] **Step 1: Adicionar testes de retry ao final do `http.spec.ts`**

Inserir antes do `});` final do describe:

```typescript
  describe('sendSoapRequest - retry', () => {
    it('retenta em HTTP 503 até sucesso', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 503, text: async () => '' })
        .mockResolvedValueOnce({ ok: false, status: 502, text: async () => '' })
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '<ok/>' });

      const result = await sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000, maxRetries: 3 });
      expect(result).toBe('<ok/>');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('desiste após maxRetries e lança SascarApiError', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => ''
      });

      await expect(
        sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000, maxRetries: 2 })
      ).rejects.toThrow(/HTTP 503/);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('chama onRetry entre tentativas', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 503, text: async () => '' })
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '<ok/>' });

      const onRetry = jest.fn();
      await sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000, maxRetries: 3, onRetry });
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Number));
    });
  });
```

- [ ] **Step 2: Rodar para ver PASS**

Run: `npm test -- tests/transport/http.spec.ts 2>&1 | tail -15`
Expected: PASS — 8/8 verdes.

- [ ] **Step 3: Commit**

```bash
git add tests/transport/http.spec.ts
git commit -m "test(transport): add retry tests for HTTP transport"
```

---

### Task 6: Refatorar `client.ts` para usar transport/ (refactor com testes existentes)

**Files:**
- Modify: `src/client.ts`

- [ ] **Step 1: Adicionar `SascarClientOptions` e usar `sendSoapRequest` no `request<T>`**

oldString em `src/client.ts:1-22`:
```typescript
import { XMLParser } from 'fast-xml-parser';
import { AsyncQueue } from './queue';
import { SascarConnectionError, SascarApiError } from './errors';
import { buildSoapEnvelope } from './transport/envelope';
import { sendSoapRequest } from './transport/http';
import * as T from './types';

/**
 * Cliente SOAP para o WebService SasIntegra v2.07 da Sascar/Michelin.
 *
 * Nomenclatura: métodos em PT (`obter*`) são a forma canônica.
 * Métodos em inglês (`get*`) são aliases mantidos por compatibilidade
 * com a nomenclatura do WSDL e operações SOAP oficiais.
 */
export class SascarClient {
  private usuario: string;
  private senha: string;
  private wsdlUrl = 'https://sasintegra.sascar.com.br/SasIntegra/SasIntegraWSService';
  private positionsQueue = new AsyncQueue();
  private parser = new XMLParser({ ignoreAttributes: true, removeNSPrefix: true });
  // (buildSoapEnvelope foi movido para ./transport/envelope; see import above)

  constructor(credentials?: T.SascarCredentials) {
    this.usuario = credentials?.usuario || process.env.SASCAR_USUARIO || '';
    this.senha = credentials?.senha || process.env.SASCAR_SENHA || '';

    if (!this.usuario || !this.senha) {
      throw new Error('Credenciais da SASCAR não fornecidas.');
    }
  }
```

newString:
```typescript
import { XMLParser } from 'fast-xml-parser';
import { AsyncQueue } from './queue';
import { SascarApiError } from './errors';
import { buildSoapEnvelope } from './transport/envelope';
import { sendSoapRequest } from './transport/http';
import { parseSoapFault } from './transport/fault';
import * as T from './types';

/**
 * Opções de configuração do cliente. Todos os campos são opcionais.
 */
export interface SascarClientOptions {
  /** Timeout em ms para cada requisição HTTP. Default: 30000. */
  timeoutMs?: number;
  /** Número máximo de tentativas (incluindo a primeira). Default: 3. */
  maxRetries?: number;
  /** URL alternativa do WebService SasIntegra. */
  wsdlUrl?: string;
}

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_WSDL_URL = 'https://sasintegra.sascar.com.br/SasIntegra/SasIntegraWSService';

/**
 * Cliente SOAP para o WebService SasIntegra v2.07 da Sascar/Michelin.
 *
 * Nomenclatura: métodos em PT (`obter*`) são a forma canônica.
 * Métodos em inglês (`get*`) são aliases mantidos por compatibilidade
 * com a nomenclatura do WSDL e operações SOAP oficiais.
 */
export class SascarClient {
  private usuario: string;
  private senha: string;
  private wsdlUrl: string;
  private timeoutMs: number;
  private maxRetries: number;
  private positionsQueue = new AsyncQueue();
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
  }
```

oldString em `src/client.ts` — substituir o método `request<TReturn>` inteiro:

Localizar:
```typescript
  private async request<TReturn>(methodName: string, params: T.SoapBody = {}, isPositionMethod = false): Promise<TReturn> {
    const xml = this.buildSoapEnvelope(methodName, params);

    const execute = async () => {
      let response: Response;
      try {
        response = await fetch(this.wsdlUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml;charset=UTF-8',
            SOAPAction: `""`
          },
          body: xml
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new SascarConnectionError(`Erro de conexão com a Sascar: ${message}`);
      }

      const text = await response.text();
      const parsed = this.parser.parse(text);

      if (parsed.Envelope?.Body?.Fault) {
        throw new SascarApiError(`Erro SOAP da Sascar: ${parsed.Envelope.Body.Fault.faultstring}`);
      }

      const responseNode = parsed.Envelope?.Body?.[`${methodName}Response`];
      if (responseNode === undefined) {
        throw new SascarApiError('Resposta inválida do servidor Sascar.');
      }

      let result = responseNode.return;

      if (!result) return [] as unknown as TReturn;

      // JSON parses nested strings
      const parseItem = (item: unknown): unknown => {
        if (typeof item === 'string' && (item.trim().startsWith('{') || item.trim().startsWith('['))) {
          try {
            return JSON.parse(item);
          } catch {
            // intentionally ignored — fallback to original string
          }
        }
        return item;
      };

      if (Array.isArray(result)) {
        result = result.map(parseItem);
      } else {
        result = [parseItem(result)]; // Force array for multiple returns
      }

      // Se for método não-lista, podemos extrair dps. Mas a maioria é lista.
      return result as unknown as TReturn;
    };

    if (isPositionMethod) {
      return this.positionsQueue.enqueue(execute);
    }
    return execute();
  }
```

newString:
```typescript
  private async request<TReturn>(methodName: string, params: T.SoapBody = {}, isPositionMethod = false): Promise<TReturn> {
    const xml = buildSoapEnvelope(methodName, params, this.usuario, this.senha);

    const execute = async (): Promise<TReturn> => {
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
            // intentionally ignored — fallback to original string
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

    if (isPositionMethod) {
      return this.positionsQueue.enqueue(execute);
    }
    return execute();
  }
```

- [ ] **Step 2: Atualizar `SascarApiError` para aceitar fault opcional**

oldString em `src/errors.ts`:
```typescript
export class SascarApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SascarApiError';
  }
}
```

newString:
```typescript
export class SascarApiError extends Error {
  readonly fault?: import('../transport/fault').SascarSoapFault;

  constructor(message: string, fault?: import('../transport/fault').SascarSoapFault) {
    super(message);
    this.name = 'SascarApiError';
    this.fault = fault;
  }
}
```

- [ ] **Step 3: Rodar testes para garantir que não regrediu**

Run: `npm test 2>&1 | tail -15`
Expected: todos os 18 anteriores + 8 do transport = 26/26 verde.

- [ ] **Step 4: Commit**

```bash
git add src/client.ts src/errors.ts
git commit -m "refactor(client): delegate HTTP/SOAP to transport layer

- Extract sendSoapRequest call into transport/http.ts
- Use parseSoapFault from transport/fault.ts
- Accept SascarClientOptions in constructor (timeoutMs, maxRetries, wsdlUrl)
- SascarApiError now carries optional SascarSoapFault
- Backward compatible: options is optional, all defaults"
```

---

### Task 7: Adicionar testes integrados no `client.spec.ts` (TDD)

**Files:**
- Modify: `tests/client.spec.ts`

- [ ] **Step 1: Adicionar testes de integração no `client.spec.ts`**

Inserir antes do `});` final do `describe('SascarClient', ...)`:

```typescript
  describe('integração com transport (timeout/auth/retry)', () => {
    it('usa timeoutMs configurado via options', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              const err = new Error('aborted');
              err.name = 'AbortError';
              reject(err);
            });
          })
      );
      const client = new SascarClient(undefined, { timeoutMs: 50, maxRetries: 1 });
      await expect(client.obterClientes()).rejects.toThrow(/timeout/i);
    });

    it('lança SascarAuthError em HTTP 401', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => ''
      });
      const client = new SascarClient();
      await expect(client.obterClientes()).rejects.toThrow(/auth|401/i);
    });

    it('lança SascarRateLimitError em HTTP 429', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => ''
      });
      const client = new SascarClient();
      await expect(client.obterClientes()).rejects.toThrow(/rate|429/i);
    });
  });
```

- [ ] **Step 2: Rodar para ver PASS**

Run: `npm test 2>&1 | tail -15`
Expected: 29/29 verde (26 anteriores + 3 novos).

- [ ] **Step 3: Commit**

```bash
git add tests/client.spec.ts
git commit -m "test(client): add integration tests for transport options"
```

---

### Task 8: Validação final + relatório F3

**Files:**
- Create: `docs/audit-report-f3.md`

- [ ] **Step 1: Rodar pipeline completo**

Run:
```bash
npm run build && npm run lint && npm run typecheck && npm test 2>&1 | tail -15
```

Expected: tudo verde, 29/29 testes.

- [ ] **Step 2: Escrever `docs/audit-report-f3.md`**

```markdown
# F3 — Robustez SOAP — Relatório de Execução

**Data:** 2026-06-09

## Mudanças aplicadas

- `transport/envelope.ts` — `buildSoapEnvelope` extraído (função pura testável).
- `transport/fault.ts` — `parseSoapFault` retorna `SascarSoapFault` ou null.
- `transport/http.ts` — `sendSoapRequest` com timeout (AbortController), retry exponencial com jitter, erros tipados.
- `SascarTimeoutError`, `SascarAuthError` adicionados a `errors.ts`.
- `SascarApiError` agora carrega `fault?: SascarSoapFault` opcional.
- `SascarClient` aceita `SascarClientOptions` opcional (timeoutMs, maxRetries, wsdlUrl).
- `client.ts` refatorado para delegar ao transport (mais magro).

## Testes

| Antes | Depois |
|-------|--------|
| 15 testes | 29 testes |
| 0 testes de transport | 11 testes de transport (envelope 2, fault 4, http 5, retry 3) |
| 0 testes de erro tipado novo | 3 testes de classes de erro + 3 testes integrados |

## Critérios de aceite

- [x] Build verde
- [x] Lint verde
- [x] Typecheck verde
- [x] 29/29 testes passando
- [x] Timeout funciona (AbortController)
- [x] Retry com backoff (250ms→500ms→1s ± jitter)
- [x] HTTP 401/403 → SascarAuthError
- [x] HTTP 429 → SascarRateLimitError
- [x] HTTP 5xx transiente → retry
- [x] API pública mantida (apenas adição opcional)
- [x] Zero breaking changes

## Próxima fase

F4 — Testes (subir cobertura de branches de 85% para 95%+, adicionar testes de integração com nock para cada categoria).
```

- [ ] **Step 3: Commit final**

```bash
git add docs/audit-report-f3.md
git commit -m "docs(audit): F3 completion report"
```

---

## Critérios de aceite globais da F3

- [ ] `npm run build` — exit 0
- [ ] `npm run lint` — exit 0
- [ ] `npm run typecheck` — exit 0
- [ ] `npm test` — 29/29 testes
- [ ] Cobertura: 100% statements/functions/lines em `src/transport/` e `src/errors.ts`
- [ ] API pública: `SascarClient` aceita 2º arg opcional `SascarClientOptions`
- [ ] Zero breaking changes
