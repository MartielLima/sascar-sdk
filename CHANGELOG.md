# Changelog

Todas as mudanças notáveis neste projeto são documentadas aqui.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Não liberado]

### Adicionado

- 3 novos métodos para cobertura 100% do manual SasIntegra v2.07:
  - `obterEnderecoPosicao(latitude, longitude)` — reverse geocoding
  - `obterPacotePosicoesRFNacional(quantidade)` — posições de rastreadores de cargas
  - `obterPacotePosicaoMotoristaHistorico(dataInicio, dataFinal, idVeiculo?)` — histórico com info de motorista
- 2 novos erros tipados: `SascarTimeoutError` e `SascarAuthError`.
- Timeout configurável via `AbortController` (default 30s).
- Retry automático com backoff exponencial (250ms→500ms→1s ±20% jitter) para 5xx e erros de rede.
- Segundo parâmetro opcional no construtor: `SascarClientOptions { timeoutMs, maxRetries, wsdlUrl }`.
- Camada de transporte isolada em `src/transport/`: `envelope.ts`, `fault.ts`, `http.ts`.
- 5 classes de erro tipadas: `SascarApiError`, `SascarConnectionError`, `SascarRateLimitError`, `SascarTimeoutError`, `SascarAuthError`.
- `SascarApiError` agora carrega `fault?: SascarSoapFault`.
- Testes de integração com `nock` para todos os 63 métodos (94 testes total).
- ESLint 8 + `@typescript-eslint` v7 + Prettier 3.
- `tsconfig.eslint.json` para linting type-aware.
- `.gitignore` cobrindo `node_modules/`, `dist/`, `coverage/`, `.env*`.

### Modificado

- 0 `any` em código de produção (eram 13 antes).
- 0 `any[]` em `types.ts` (eram 8 antes).
- `buildSoapEnvelope` extraído para `transport/envelope.ts` (função pura testável).
- `parseSoapFault` extraído para `transport/fault.ts` (parser tolerante).
- `while (true)` em `obterVeiculosJson` substituído por `while (keepPaginating)`.
- `catch (err: any)` substituído por `catch (err)` com `instanceof Error` check.

### Documentação

- README atualizado com 63 métodos, novos erros, SascarClientOptions, exemplos.
- `.env.example` adicionado.
- Este CHANGELOG.

## [1.0.0] — 2024

### Adicionado

- Release inicial com 60 métodos públicos.
- `AsyncQueue` (mutex) para serialização de chamadas.
- README com referência completa.
