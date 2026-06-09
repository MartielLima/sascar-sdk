# F3 — Robustez do Cliente SOAP — Design

- **Data:** 2026-06-09
- **Fase:** F3 do master design
- **Status:** Aguardando aprovação do usuário
- **Referência:** `docs/superpowers/specs/2026-06-09-sascar-sdk-audit-design.md` (seção F3)

## Objetivo

Tornar o cliente SOAP resiliente a falhas de rede, timeouts, erros de autenticação e SOAP Faults. Tudo via erros tipados que o consumidor pode capturar com `instanceof` e tratar diferencialmente.

## Escopo

### Dentro de escopo

1. **Timeout configurável** em todas as chamadas HTTP (default 30s).
2. **Retry com backoff exponencial** para erros transientes (HTTP 5xx, ECONNRESET, timeouts), com no máximo 3 tentativas.
3. **Erros tipados** adicionais:
   - `SascarTimeoutError` (extends `SascarConnectionError`).
   - `SascarAuthError` (HTTP 401/403 ou SOAP Fault de auth).
   - `SascarRateLimitError` (já existe, mantida; pode ser disparada por HTTP 429 ou Fault de cota).
4. **Parser de SOAP Fault robusto**: extrair `faultcode`, `faultstring`, `detail` (se houver).
5. **Mensagens de erro claras**: incluir `methodName`, URL, status code quando relevante.
6. **Opção no construtor** para desabilitar retry (default: habilitado com 3 tentativas).
7. **Opção no construtor** para customizar timeout (default: 30.000ms).

### Fora de escopo (YAGNI)

- Rate limiting **ativo** (cliente limitando chamadas por janela de tempo) — fora; o rate limit do servidor é tratado passivamente.
- Persistência de credenciais em keychain — fora.
- Refresh automático de credenciais — fora.
- Pool de conexões HTTP — `fetch` já gerencia keep-alive por baixo.
- Suporte a mTLS — fora (Sascar não documenta).
- Circuit breaker — fora; a fila atual já evita sobrecarga.

## Arquitetura alvo

### Antes (atual)
```typescript
private async request<TReturn>(...) {
  // inline fetch + parser + try/catch
}
```

### Depois (alvo)
```
src/
├── client.ts                ← SascarClient (refatorado: delega para transport)
├── transport/
│   ├── http.ts              ← sendSoapRequest(xml, options): Promise<xml>
│   ├── envelope.ts          ← buildSoapEnvelope + parseSoapResponse (extraído)
│   └── fault.ts             ← SascarSoapFault interface + parseSoapFault(xml)
├── queue.ts                 ← AsyncQueue (mantido)
└── errors.ts                ← 5 classes tipadas
```

### Fluxo de uma chamada

```
client.obterVeiculos(...)
  → request<T> (client.ts)
     → buildSoapEnvelope (transport/envelope.ts)
     → queue.enqueue (se isPositionMethod)
        → execute (com retry+timeout)
           → sendSoapRequest (transport/http.ts)
              → AbortController para timeout
              → fetch com retry exponencial em erros transientes
              → retorna texto XML
           → parseSoapResponse (transport/envelope.ts)
              → se Fault → SascarApiError / SascarAuthError
              → retorna payload
```

## Decisões de design

### D1: Onde fica o timeout/retry — no transport ou no client?
**Decisão:** no `transport/http.ts` (camada de I/O). Vantagens: testável isoladamente, reutilizável, sem conhecer a Sascar.

### D2: Quais erros são "transientes" e justificam retry?
**Decisão:** retry em:
- Network error (`fetch` rejeita — `TypeError: fetch failed`).
- Timeout (`AbortError` do `AbortController`).
- HTTP 5xx (502, 503, 504 — 500 também, mas só se não for auth).
- SOAP Fault com code `soap-env:Server` (servidor Sascar indisponível momentâneo).

**NÃO** retry em:
- HTTP 401/403 (auth — não vai resolver com retry).
- HTTP 429 (rate limit — retry imediato piora a situação; vamos lançar `SascarRateLimitError`).
- SOAP Fault com code `soap-env:Client` (erro do cliente — não vai resolver com retry).
- XML malformado (erro nosso).

### D3: Backoff exponencial
**Decisão:** 250ms → 500ms → 1000ms (3 tentativas). Jitter de ±20% para evitar thundering herd. Configurável.

### D4: API do construtor
**Decisão:** adicionar segundo parâmetro opcional `options: SascarClientOptions`:

```typescript
export interface SascarClientOptions {
  /** Timeout em ms (default 30000) */
  timeoutMs?: number;
  /** Número máximo de tentativas (default 3) */
  maxRetries?: number;
  /** URL alternativa do WSDL (default produção) */
  wsdlUrl?: string;
}
```

Backward compatible: clientes existentes não precisam mudar nada.

### D5: Mensagem de erro
**Decisão:** incluir contexto:

```typescript
new SascarApiError(
  `[obterVeiculos] SOAP Fault da Sascar: ${fault.faultstring}`,
  { methodName, faultcode, faultstring, detail }
)
```

### D6: `SascarRateLimitError` quando?
**Decisão:** HTTP 429 → `SascarRateLimitError`. SOAP Fault com texto contendo "rate" / "limite" / "cota" → `SascarRateLimitError`. Outros 5xx → `SascarApiError`.

## Tipos adicionais

```typescript
// src/errors.ts
export class SascarTimeoutError extends SascarConnectionError {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message);
    this.name = 'SascarTimeoutError';
  }
}

export class SascarAuthError extends SascarApiError {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'SascarAuthError';
  }
}

// src/transport/fault.ts
export interface SascarSoapFault {
  faultcode: string;
  faultstring: string;
  detail?: string;
}
```

## Critérios de aceite da F3

- [ ] `npm run build` — exit 0
- [ ] `npm run lint` — exit 0
- [ ] `npm run typecheck` — exit 0
- [ ] `npm test` — todos os testes anteriores passam + novos testes de timeout/retry/auth
- [ ] Cliente não trava indefinidamente em chamadas lentas (timeout funciona)
- [ ] Erros de rede têm retry automático com backoff
- [ ] SOAP Faults de auth são tipados como `SascarAuthError`
- [ ] SOAP Faults de servidor são tipados como `SascarApiError`
- [ ] HTTP 429 lança `SascarRateLimitError`
- [ ] API pública mantida (apenas adição de `options` opcional no construtor)
- [ ] Zero breaking changes

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Retry em loop infinito se Sascar retornar 500 sempre | `maxRetries` cap; respeitado sempre. |
| `AbortController` não suportado em Node < 15 | `engines.node >= 18` já é exigido no `package.json`. |
| Timeout muito agressivo quebra chamadas legítimas na WAN | Default 30s é conservador; ajustável. |
| SOAP Fault com estrutura inesperada trava parser | Parser tolerante: extrai o que consegue. |
