# Changelog

Todas as mudanças notáveis neste projeto são documentadas aqui.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.1.1] - 2026-06-17

### Corrigido (BUGS CRÍTICOS ENCONTRADOS EM TESTE LIVE)

A v1.1.0 tinha 3 bugs críticos descobertos ao testar contra o servidor real da Sascar. Todos corrigidos:

- **URL dos endpoints errada**: a constante `SASCAR_XMLRPC_URLS.comando` apontava para `/xmlrpc/comando` (404). O manual v3.5 seção 2.3 define `/xmlrpc/enviar_comando`. Renomeada para `.enviarComando` para deixar claro que é o destino padrão.
- **Roteamento errado**: `embarcar_*` e `desembarcar_*` iam para `/xmlrpc/operacao` (incorreto). Apenas os 5 comandos das seções 2.5.30–2.5.34 usam `/operacao`. Corrigido para enviar todos os outros para `/enviar_comando`.
- **Tipo de assinatura errado**: métodos usavam `idVeiculo: number` mas o servidor espera `placa: string` (manual seção 2.5 mostra `<member><name>placa</name><value><string>...</string></value></member>`). Todas as 34+5 assinaturas atualizadas.
- **Membro `ticket` ausente**: o servidor exige `<member><name>ticket</name>...</member>` no request. Adicionado: cada método auto-gera um ticket cliente (0..2147483647) e o envia corretamente.
- **Tipo do `ticketServidor`**: a resposta real é `<string>12132678</string>` (não int). Tipo atualizado de `number` para `string`.
- **Tipo do `idVeiculo` em posicao()**: a resposta real vem como string (a placa). Tipo atualizado para `string`.
- **Modelo de resposta simplificado**: removida a `resultados: Record<string, string>` (que era fictícia — o servidor retorna apenas `ticketServidor`, não um mapa placa→code). Novo tipo `SascarXmlRpcCommandResult = { ticketServidor, statusComando?, ticketCliente }`.

## [1.1.0] - 2026-06-17

### Adicionado

- **Módulo XML-RPC completo**: 34 comandos do manual Sascar v3.5, incluindo `bloqueio`, `desbloqueio`, `atuador`, `texto`, `embarcar_*` (9 métodos), `desembarcar_*` (3 métodos), `inicializar_operacao`, `finalizar_operacao`, `vincular_rota`, `vincular_alerta_avd`, e mais.
- **`SascarXmlRpcClient`**: nova classe paralela a `SascarClient` (SOAP) com endpoints `/xmlrpc/comando` e `/xmlrpc/operacao`. Suporta `timeoutMs`, `maxRetries`, `positionMutex` para o mutex de `posicao()`.
- **Helpers PT-BR**: `bloquearVeiculo(id)`, `desbloquearVeiculo(id)`, `enviarMensagem(id, msg, ticket?)`, `alternarAtuador(id, idAtuador, on|off)`.
- **`aguardarComando(ticket, id, opts?)`**: polling automático em `status_ticket` que converge para `1` (executado) ou `2` (recusado), com `timeoutMs` e `pollIntervalMs` configuráveis.
- **Cobertura 100% do manual XML-RPC v3.5 (seções 2.5.1–2.5.34)**: 34 métodos 1:1 com o `methodName` do manual + 5 helpers ergonômicos.
- **`SascarXmlRpcError`**: subclasse de `SascarApiError` para catching unificado entre SOAP e XML-RPC.
- **Tipos públicos**: `SascarXmlRpcCommandResult`, `SascarXmlRpcOperacaoResult`, `SascarXmlRpcPosicaoResult`, `SascarXmlRpcSenhaResult`, `SascarComandoEnviado`, `SascarComandoStatus`, `SascarComandoStatusFinal`, `SascarXmlRpcParam`, `SASCAR_XMLRPC_URLS`.
- **202 testes** (era 121), 0 `any` em produção, transport isolado com retry/timeout, parser XML via `fast-xml-parser`.

## [Não liberado]

### Corrigido

- **`obterAlertasAVDVinculados`**: operação SOAP enviada com `O` maiúsculo (`ObterAlertasAVDVinculados`) — o WSDL declara `obterAlertasAVDVinculados`. O servidor respondia "Cannot find dispatch method". Agora envia com o nome correto.
- **Transporte HTTP 5xx + SOAP Fault**: faults aplicacionais retornados com status 500 (ex.: `acesso nao permitido a esta operacao!`, `veiculo nao pertence a gerenciadora`) agora são parseados e propagados em `SascarApiError.fault`, sem retry. Antes, o body era descartado e o usuário recebia apenas `HTTP 500 em ...`, perdendo o diagnóstico. Tickets 500/400 com `<Fault>` no body também são propagados imediatamente.

### Alterado (BREAKING)

- **`Veiculo.isTelemetry` → `Veiculo.telemetria`** — a API real retorna `telemetria` (minúsculo, sem prefixo `is`). O campo declarado anteriormente nunca casava com o payload.
- **`Veiculo.esn` e `Veiculo.idProjeto`** passam de obrigatórios para opcionais (`?`) — não são retornados para todos os veículos.
- **`Cliente.CPF` → `Cliente.cpf`** e **`Cliente.CNPJ` → `Cliente.cnpj`** — a API real retorna os campos em minúsculas. O tipo declarado anteriormente nunca casava com o payload, deixando `cliente.CPF` e `cliente.CNPJ` sempre `undefined`. Quem dependia dos nomes em maiúsculas precisa atualizar o código.

### Adicionado

- **11 métodos descobertos no WSDL ao vivo** (auditoria 2026-06-17, ausentes do manual v2.07):
  - `consultaQuantidadePacotesPosicoesPendentes()` — quantidade de pacotes pendentes na fila
  - `getSmartCamerasEvents(params)` — eventos de SmartCameras (câmeras embarcadas) com filtros
  - `obterMotoristasPorVeiculo(idVeiculo)` — motoristas vinculados a um veículo
  - `obterLayoutAreaAvd()` — grupos/áreas AVD com metadados de auditoria
  - `obterLayoutData(layout)` — dados básicos de um layout
  - `obterMensagemPortal(idVeiculo)` — mensagens do portal para o veículo
  - `obterPacoteIntegracaoDeltatelemetria(quantidade)` — pacote de delta de telemetria
  - `obterPacotePosicoesComPlaca(quantidade)` — posições com campo `placa`
  - `obterTelemetriaPortal(idVeiculo)` — snapshot telemetria portal
  - `obterEventoTelemetriaIntegracaoDataChegada(...)` — eventos por range de chegada
  - `verificarVeiculoIntegrado(idVeiculo)` — verifica integração, retorna boolean único
- **Helpers de mapeamento de atuadores/sensores**:
  - `getMapeamentoVeiculo(idVeiculo, opts?)` — cruza cadastro com catálogo e retorna `{atuadores, sensores, portaBloqueio, portaPanico}` indexados por slot
  - `findAtuador(idVeiculo, descricaoOrSlot, opts?)` — busca por substring case-insensitive ou slot; reconhece casos especiais "bloqueio"/"panico" via `portaBloqueio`/`portaPanico`
- **9 novos tipos** em `src/types.ts`: `PacotePendente`, `SmartCamerasMotorista`, `SmartCamerasPayload`, `SmartCamerasEvento`, `SmartCamerasEventsParams`, `LayoutGrupoAreaAvd`, `MensagemPortal`, `TelemetriaPortal`, `AtuadorMapeado`, `SensorMapeado`, `VeiculoMapeado`.
- **4 campos opcionais em `DeltaTelemetria`** (observados em respostas reais, ausentes no manual): `tempoDuracaoFaixaAmarela`, `tempoDuracaoFaixaAzul`, `tempoDuracaoFaixaVerde`, `tempoDuracaoFaixaVermelha`.
- 22 testes novos: 12 de integração (nock) cobrindo os 11 métodos + 10 para os helpers.
- Campos observados na API real adicionados a `PacotePosicaoXML`:
  - `integradoraId?: number` — ID da integradora/conta.
  - `nomeMensagem?: string` — nome amigável correlato a `codigoMacro`.
  - `eventoFormatado?: string`, `eventoSeqFormatado?: string` — eventos e sequenciamento como string formatada.
  - `temperaturaSerial?: number`, `umidadeSerial?: number` — sensores seriais (já existiam em `PacotePosicaoJSON`).
- Campo `eventosTelemetria?: EventoTelemetria[]` em `PacotePosicaoJSON` — observado nas variantes `*Motorista*`.
- Campo `odometroExato?: number` em `PacotePosicaoJSON` — odômetro de alta precisão observado em respostas reais da API, ausente no manual v2.07. Retornado por `obterPacotePosicoesJSON` e variantes.
- 4 testes de transporte cobrindo SOAP Fault em 5xx/4xx.
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
