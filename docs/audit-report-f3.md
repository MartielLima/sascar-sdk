# F3 — Robustez SOAP — Relatório de Execução

**Data:** 2026-06-09

## Mudanças aplicadas

### Novos módulos (camada de transporte)

- **`src/transport/envelope.ts`** — `buildSoapEnvelope(methodName, body, usuario, senha)` extraído como função pura testável. 100% cobertura.
- **`src/transport/fault.ts`** — `parseSoapFault(xml)` retorna `SascarSoapFault` ou `null`. 100% statements/functions/lines.
- **`src/transport/http.ts`** — `sendSoapRequest(xml, options)` com:
  - Timeout via `AbortController`
  - HTTP 401/403 → `SascarAuthError`
  - HTTP 429 → `SascarRateLimitError`
  - HTTP 5xx transiente → retry com backoff exponencial (250ms→500ms→1s ±20% jitter)
  - Timeout → `SascarTimeoutError`
  - Erro de rede → `SascarConnectionError`
  - 100% statements/functions/lines

### Erros adicionados

- `SascarTimeoutError extends SascarConnectionError` com `timeoutMs`.
- `SascarAuthError extends SascarApiError` com `statusCode`.
- `SascarApiError` agora carrega `fault?: SascarSoapFault` opcional.

### `SascarClient` refatorado

- Aceita novo 2º parâmetro `SascarClientOptions` opcional:
  - `timeoutMs` (default 30000)
  - `maxRetries` (default 3)
  - `wsdlUrl` (default produção)
- `request<T>` delega para `sendSoapRequest` + `parseSoapFault` + `XMLParser`.
- API pública mantida (apenas adições).

## Cobertura final

| Arquivo | Stmts | Branch | Funcs | Lines |
|---------|-------|--------|-------|-------|
| `client.ts` | 100% | 89% | 100% | 100% |
| `errors.ts` | 100% | 100% | 100% | 100% |
| `queue.ts` | 100% | 100% | 100% | 100% |
| `transport/envelope.ts` | 100% | 100% | 100% | 100% |
| `transport/fault.ts` | 100% | 85.71% | 100% | 100% |
| `transport/http.ts` | 100% | 95.23% | 100% | 100% |
| **Global** | **100%** | **~90%** | **100%** | **100%** |

## Testes: 15 → 37 (+22)

| Categoria | Antes F3 | Depois F3 |
|-----------|----------|-----------|
| Erros tipados | 1 (do baseline) | 3 (+2 novos) |
| Transport: envelope | 0 | 2 |
| Transport: fault | 0 | 4 |
| Transport: http | 0 | 5 |
| Transport: retry | 0 | 3 |
| Transport: edge cases (maxRetries 0, network retry) | 0 | 2 |
| Client integração (timeout/auth/rate via options) | 0 | 3 |

## Critérios de aceite

- [x] Build verde
- [x] Lint verde
- [x] Typecheck verde
- [x] 37/37 testes passando
- [x] Timeout funciona (AbortController)
- [x] Retry com backoff exponencial
- [x] HTTP 401/403 → SascarAuthError
- [x] HTTP 429 → SascarRateLimitError
- [x] HTTP 5xx transiente → retry
- [x] API pública mantida (zero breaking changes)
- [x] Faults SOAP tipados com faultcode/faultstring/detail

## Commits (7)

```
4149b4c feat(errors): add SascarTimeoutError and SascarAuthError
76e65d6 refactor(transport): extract buildSoapEnvelope to transport/envelope.ts
f97c2c4 feat(transport): add SOAP Fault parser
4b11cdc feat(transport): add HTTP transport with timeout and typed errors
690a3e6 test(transport): add retry tests for HTTP transport
d47459e refactor(client): delegate HTTP/SOAP to transport layer
9163b3a test(client): add integration tests for transport options
```

## Próxima fase

**F4 — Testes**: subir cobertura de branches para 95%+, adicionar testes de integração com fixtures XML para cada categoria (cadastros, posições, telemetria, comandos), validar tipos de retorno vs documentação Sascar.
