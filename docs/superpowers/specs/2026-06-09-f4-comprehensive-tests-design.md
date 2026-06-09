# F4 — Testes Abrangentes — Design

- **Data:** 2026-06-09
- **Fase:** F4 do master design
- **Status:** Aguardando aprovação do usuário
- **Referência:** `docs/superpowers/specs/2026-06-09-sascar-sdk-audit-design.md` (seção F4)

## Objetivo

Atingir ≥ 95% de cobertura (statements/branches/functions/lines) com testes significativos, organizados por categoria de método, usando fixtures XML realistas (não apenas "resolved"). Validar:
- Chamadas HTTP feitas corretamente (URL, método, headers, body).
- Envelope SOAP formado corretamente para cada operação.
- Resposta parseada e tipada corretamente.
- Cada método público tem pelo menos 1 teste de sucesso.

## Estado atual após F3

| Métrica | Valor |
|---------|-------|
| Total de testes | 37 |
| Statements coverage | 100% |
| Branches coverage | ~90% |
| Funções coverage | 100% |
| Linhas coverage | 100% |
| Métodos públicos do `SascarClient` | 60 |
| Métodos com teste dedicado de sucesso | ~22 (apenas os do "Cobertura completa" genérico + few targeted) |

**Gap:** a maioria dos 60 métodos tem apenas um teste genérico que verifica `resolves.toBeDefined()` mas não valida o envelope SOAP enviado nem a estrutura do retorno parseado.

## Escopo

### Dentro de escopo

1. **Adicionar `nock`** para mockar HTTP em testes de integração (intercepta `fetch` globalmente).
2. **Criar fixtures XML** em `tests/fixtures/` (1 fixture por categoria, com dados realistas de 1-2 registros).
3. **1 arquivo de teste por categoria**:
   - `tests/integration/cadastros.spec.ts` — métodos de cadastros e entidades.
   - `tests/integration/posicoes.spec.ts` — métodos de posições/rastreamento.
   - `tests/integration/telemetria.spec.ts` — métodos de telemetria e caixa preta.
   - `tests/integration/comandos.spec.ts` — métodos de comandos e macros.
4. **Cada teste valida**:
   - Request: URL correta, método POST, headers `Content-Type: text/xml` e `SOAPAction: ""`, body contém `<web:{methodName}>` e credenciais.
   - Response: status 200, fixture retornada parseada para o tipo correto.
5. **Subir threshold de coverage** no `jest.config.ts` para 95% em todas as métricas.
6. **Refatorar testes existentes** que são fracos (ex: o `Cobertura completa` do `client.spec.ts` que faz apenas `resolves.toBeDefined()`).

### Fora de escopo (YAGNI)

- Testes contra servidor real da Sascar (sem credenciais, sem CI de homologação).
- Testes de carga / stress (fora do escopo de uma lib).
- Mutation testing (ex: Stryker) — fora; temos boa cobertura funcional.
- Snapshot testing de XML exato (frágil; faremos asserções em substrings).

## Arquitetura de testes

### Estrutura de pastas
```
tests/
├── unit/                         ← já existem transport/, errors.spec.ts
│   ├── transport/
│   │   ├── envelope.spec.ts
│   │   ├── fault.spec.ts
│   │   └── http.spec.ts
│   └── errors.spec.ts
├── integration/                  ← NOVO
│   ├── _helpers.ts               ← mockSoapResponse(soapBody), assertSoapRequest
│   ├── cadastros.spec.ts
│   ├── posicoes.spec.ts
│   ├── telemetria.spec.ts
│   └── comandos.spec.ts
├── fixtures/                     ← NOVO
│   ├── clientes.xml
│   ├── veiculos.xml
│   ├── posicoes-pacote.xml
│   ├── telemetria-delta.xml
│   └── ... (1 por método ou categoria)
├── client.spec.ts                ← manter mas simplificar
├── errors.spec.ts
└── queue.spec.ts
```

### Helpers (`tests/integration/_helpers.ts`)

```typescript
import nock from 'nock';
import { SascarClient } from '../../src/client';

export const WSDL_URL = 'https://sasintegra.sascar.com.br/SasIntegra/SasIntegraWSService';

export function makeClient(): SascarClient {
  return new SascarClient({ usuario: 'u', senha: 'p' });
}

export function mockSoapSuccess(methodName: string, innerXml: string): nock.Scope {
  return nock(WSDL_URL)
    .post('/')
    .reply(200, `<?xml version="1.0"?>
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <ns0:${methodName}Response xmlns:ns0="http://webservice.web.integracao.sascar.com.br/">
            ${innerXml}
          </ns0:${methodName}Response>
        </soapenv:Body>
      </soapenv:Envelope>`);
}

export function assertSoapRequest(
  scope: nock.Scope,
  expectedMethod: string,
  expectedParams: Record<string, unknown>
): void {
  expect(scope.isDone()).toBe(true);
  // body validation done per-test via the scope interceptor
}
```

### Categorização dos 60 métodos (já identificados no `client.ts`)

| Categoria | Métodos | Já cobertos | A cobrir |
|-----------|---------|-------------|----------|
| **Cadastros** (17) | atualizarSenha, obterAlertasAVDVinculados, obterGrupoAtuadores, obterCadastroAlertasAVD, obterClientes, obterClientesV2, obterVeiculos, obterVeiculosJson, obterVeiculosRFNacional, obterDadosAdicionais, obterDadosAdicionaisCliente, obterPontosReferencia, obterSequenciamentoEvento, obterMotoristas, obterMotoristasVeiculos, obterLayoutTecladoVeiculos, obterLayoutGrupoPontos, obterRotas | parcial (genérico) | 18 dedicated tests |
| **Comandos e macros** (10) | obterStatusComando, obterStatusComandoTicketSascar, obterTipoComando, obterMacroTd50Tmcd, obterMacroTd50TmcdDetalhado, obterMascaraDispositivo, obterMacroTd40, obterLayout, obterLayoutDetalhado, obterLayoutAcaoEmbarcadaAVD, comandoEmbarquePontoDiario, enviarParametrizacaoTelemetria, obterMacroTms3 | parcial | 13 dedicated tests |
| **Posições** (19) | obterPacotePosicoes, obterPacotePosicoesJSON, obterPacotePosicoesMotorista, obterPacotePosicoesMotoristaJSON, obterPacotePosicoesMotoristaComPlaca, obterPacotePosicoesJSONComPlaca, obterPacotePosicoesRestricao, obterPacotePosicoesMotoristaRestricao, obterPacotePosicaoMotoristaPorRange, obterPacotePosicaoMotoristaPorRangeJSON, obterPacotePosicaoHistorico, obterPacotePosicaoPorRange, obterPacotePosicaoPorRangeJSON, obterPacoteLocalizacao, getPositionsPacketJSON, getDriverPositionPacketJSON, getPositionPacketByRangeJSON, getDriverPositionPacketByRangeJSON, getPositionPacketWithLicensePlateJSON | parcial | 19 dedicated tests |
| **Telemetria** (8) | obterDeltaTelemetriaIntegracao, obterDeltaTelemetriaIntegracaoInercia, obterDeltaTelemetriaIntegracaoDataChegada, obterDeltaTelemetriaIntegracaoInerciaDataChegada, obterEventoTelemetriaIntegracao, obterEventoTelemetriaDescricao, obterEventosTempoDirecao, obterEventosTempoDirecaoDataChegada | parcial | 8 dedicated tests |
| **Caixa preta** (2) | solicitarEventosCaixaPreta (deprecated), recuperarEventosCaixaPreta | parcial | 2 dedicated tests |

**Total de novos testes planejados:** ~60 (1 por método).

## Critérios de aceite

- [ ] `npm test` com ≥ 95% statements/branches/functions/lines.
- [ ] Cada um dos 60 métodos públicos tem 1 teste de sucesso com fixture XML realista.
- [ ] Cada teste valida que o body SOAP contém o `<web:{methodName}>` correto.
- [ ] Cada teste valida que o body SOAP contém as credenciais.
- [ ] Cada teste valida que o retorno foi parseado para o tipo correto (smoke check de campos chave).
- [ ] 0 `pending` ou `it.todo` (todo método público coberto).
- [ ] `nock` é restaurado em `afterEach` (sem vazamento entre testes).
- [ ] Build/lint/typecheck verdes.

## Riscos

| Risco | Mitigação |
|-------|-----------|
| `nock` quebrar quando o `client.ts` muda a URL | Constante `WSDL_URL` em `_helpers.ts`; assertion explícita. |
| Fixtures com schema errado mascararem bugs | Validar manualmente 2-3 fixtures contra a doc Sascar (F2 vai ampliar). |
| Tempo de execução crescer (60+ testes com `nock`) | `nock` é rápido (intercepta antes da rede); alvo < 15s total. |
| Threshold 95% muito agressivo bloquear merge | Ajustável se houver branches genuinamente impossíveis de testar. |

## Não-objetivos confirmados

- NÃO remover a fila (`AsyncQueue`).
- NÃO trocar `fetch` por `axios`.
- NÃO mudar a API pública.
