# F2 — Conformidade com Manual Sascar — Design + Gap Report

- **Data:** 2026-06-09
- **Fase:** F2 do master design
- **Status:** Aguardando aprovação do usuário
- **Manual referência:** `WebService_SasIntegra_v2.07_Portugues.pdf` (290 páginas) — baixado, texto extraído, indexado em `sascar-manual-v2.07-pt-text`

## Metodologia

1. Download do PDF via `curl` (~7.8 MB).
2. Extração de texto via `pdf-parse` (npm) — 13.205 linhas / 290 páginas.
3. Indexação no `context-mode` (`ctx_index`).
4. Busca do sumário (seções 4.1-4.63) via `ctx_search` com queries em PT.
5. Cross-check entre sumário oficial e métodos públicos do `SascarClient`.
6. Identificação de gaps.

## Sumário oficial do manual (seções 4.1 a 4.63)

| Seção | Operação SOAP (oficial) | SDK method | Status |
|-------|------------------------|------------|--------|
| 4.1 | atualizarSenha | `atualizarSenha` | ✅ |
| 4.2 | ObterAlertasAVDVinculados | `obterAlertasAVDVinculados` | ✅ |
| 4.3 | ObterGrupoAtuadores | `obterGrupoAtuadores` | ✅ |
| 4.4 | ObterCadastroAlertasAVD | `obterCadastroAlertasAVD` | ✅ |
| 4.5 | ObterClientes | `obterClientes` | ✅ |
| 4.6 | ObterClientesV2 | `obterClientesV2` | ✅ |
| 4.7 | ObterStatusComando | `obterStatusComando` | ✅ |
| 4.8 | ObterStatusComandoTicketSascar | `obterStatusComandoTicketSascar` | ✅ |
| 4.9 | ObterTipoComando | `obterTipoComando` | ✅ |
| 4.10 | ObterPacotePosicoes | `obterPacotePosicoes` | ✅ |
| 4.11 | ObterPacotePosicoesMotorista | `obterPacotePosicoesMotorista` | ✅ |
| 4.12 | ObterPacotePosicoesMotoristaComPlaca | `obterPacotePosicoesMotoristaComPlaca` | ✅ |
| 4.13 | ObterPacotePosicoesMotoristaRestricao | `obterPacotePosicoesMotoristaRestricao` | ✅ |
| 4.14 | ObterPacotePosicaoMotoristaPorRange | `obterPacotePosicaoMotoristaPorRange` | ✅ |
| 4.15 | ObterPacotePosicaoMotoristaHistorico | `obterPacotePosicaoHistorico` (genérico, sem sufixo Motorista) | ⚠️ verificar |
| 4.16 | ObterPacotePosicaoMotoristaPorRangeJSON | `obterPacotePosicaoMotoristaPorRangeJSON` | ✅ |
| 4.17 | ObterPacotePosicoesMotoristaJSON | `obterPacotePosicoesMotoristaJSON` | ✅ |
| 4.18 | ObterPacotePosicoesRestricao | `obterPacotePosicoesRestricao` | ✅ |
| 4.19 | ObterPacotePosicaoPorRange | `obterPacotePosicaoPorRange` | ✅ |
| 4.20 | ObterMacroTd50Tmcd | `obterMacroTd50Tmcd` | ✅ |
| 4.21 | ObterMacroTd50TmcdDetalhado | `obterMacroTd50TmcdDetalhado` | ✅ |
| 4.22 | ObterMascaraDispositivo | `obterMascaraDispositivo` | ✅ |
| 4.23 | ObterMacroTd40 | `obterMacroTd40` | ✅ |
| 4.24 | ObterLayout | `obterLayout` | ✅ |
| 4.25 | ObterLayoutDetalhado | `obterLayoutDetalhado` | ✅ |
| 4.26 | ObterLayoutAcaoEmbarcadaAVD | `obterLayoutAcaoEmbarcadaAVD` | ✅ |
| 4.27 | ObterRotas | `obterRotas` | ✅ |
| 4.28 | ObterVeiculos | `obterVeiculos` | ✅ |
| 4.29 | ObterVeiculosJson | `obterVeiculosJson` | ✅ |
| 4.30 | ObterVeiculosRFNacional | `obterVeiculosRFNacional` | ✅ |
| 4.31 | ObterDadosAdicionais | `obterDadosAdicionais` | ✅ |
| 4.32 | ObterPontosReferencia | `obterPontosReferencia` | ✅ |
| 4.33 | ObterSequenciamentoEvento | `obterSequenciamentoEvento` | ✅ |
| **4.34** | **ObterEnderecoPosicao** | **❌ FALTA** | GAP |
| 4.35 | ObterEventosTempoDirecao | `obterEventosTempoDirecao` | ✅ |
| 4.36 | ObterMotoristas | `obterMotoristas` | ✅ |
| 4.37 | ObterMotoristasVeiculos | `obterMotoristasVeiculos` | ✅ |
| 4.38 | ObterLayoutTecladoVeiculos | `obterLayoutTecladoVeiculos` | ✅ |
| 4.39 | ObterLayoutGrupoPontos | `obterLayoutGrupoPontos` | ✅ |
| 4.40 | ObterPacoteLocalizacao | `obterPacoteLocalizacao` | ✅ |
| 4.41 | ComandoEmbarquePontoDiario | `comandoEmbarquePontoDiario` | ✅ |
| 4.42 | ObterEventoTelemetriaIntegracao | `obterEventoTelemetriaIntegracao` | ✅ |
| 4.43 | ObterEventoTelemetriaDescricao | `obterEventoTelemetriaDescricao` | ✅ |
| 4.44 | ObterDeltaTelemetriaIntegracao | `obterDeltaTelemetriaIntegracao` | ✅ |
| 4.45 | EnviarParametrizacaoTelemetria | `enviarParametrizacaoTelemetria` | ✅ |
| 4.46 | ObterMacroTms3 | `obterMacroTms3` | ✅ |
| 4.47 | ObterPacotePosicaoHistorico | `obterPacotePosicaoHistorico` | ✅ |
| 4.48 | ObterPacotePosicoesJSON | `obterPacotePosicoesJSON` | ✅ |
| 4.49 | ObterPacotePosicoesJSONComPlaca | `obterPacotePosicoesJSONComPlaca` | ✅ |
| 4.50 | ObterPacotePosicaoPorRangeJSON | `obterPacotePosicaoPorRangeJSON` | ✅ |
| 4.51 | SolicitarEventosCaixaPreta (DESATIVADO) | `solicitarEventosCaixaPreta` (deprecated) | ✅ |
| 4.52 | RecuperarEventosCaixaPreta | `recuperarEventosCaixaPreta` | ✅ |
| **4.53** | **ObterPacotePosicoesRFNacional** | **❌ FALTA** (temos `obterVeiculosRFNacional`, mas não a versão pacote) | GAP |
| 4.54 | GetPositionsPacketJSON | `getPositionsPacketJSON` | ✅ |
| 4.55 | GetDriverPositionPacketJSON | `getDriverPositionPacketJSON` | ✅ |
| 4.56 | GetPositionPacketByRangeJSON | `getPositionPacketByRangeJSON` | ✅ |
| 4.57 | GetDriverPositionPacketByRangeJSON | `getDriverPositionPacketByRangeJSON` | ✅ |
| 4.58 | GetPositionPacketWithLicensePlateJSON | `getPositionPacketWithLicensePlateJSON` | ✅ |
| 4.59 | GetVehiclesJSON | chamado internamente em `obterVeiculosJson` | ✅ |
| 4.60 | ObterDeltaTelemetriaIntegracaoInercia | `obterDeltaTelemetriaIntegracaoInercia` | ✅ |
| 4.61/4.62 | (variantes DataChegada) | `obterDeltaTelemetriaIntegracaoDataChegada`, `obterDeltaTelemetriaIntegracaoInerciaDataChegada` | ✅ |
| 4.63 | ObterDadosAdicionaisCliente | `obterDadosAdicionaisCliente` | ✅ |

## Gaps identificados

### Gap 1 — 4.34 `obterEnderecoPosicao` (CRÍTICO)

**O que é:** Método para consultar dados de endereço (rua, cidade, UF) a partir de coordenadas lat/long retornadas em pacotes de posição.

**Assinatura (do manual):**
```java
List<EnderecoPosicao> obterEnderecoPosicao(String usuario, string senha, String latitude, String longitude);
```

**Tipo de retorno (já temos a interface):**
```typescript
export interface EnderecoPosicao {
  cidade: string;
  Rua: string;
  uf: string;
}
```

**Esforço:** ~10 LoC. Adicionar método + 1 teste de integração.

### Gap 2 — 4.53 `obterPacotePosicoesRFNacional` (CRÍTICO)

**O que é:** Versão pacote-posições do `obterVeiculosRFNacional` (que existe no SDK). Para rastreamento de veículos em roaming nacional.

**Assinatura (presumida do manual — não li a página 4.53 ainda):**
```java
List<PacotePosicaoRFNacional> obterPacotePosicoesRFNacional(String usuario, string senha, Integer quantidade, Integer idVeiculo);
```

**Esforço:** ~20 LoC (método + tipo `PacotePosicaoRFNacional` + teste de integração). **Requer leitura da seção 4.53 do manual para confirmar campos de retorno.**

### Gap 3 — 4.15 `obterPacotePosicaoMotoristaHistorico` (verificar)

**Possibilidade:** O manual lista `ObterPacotePosicaoMotoristaHistorico` (seção 4.15) com versão específica para motorista, mas o SDK só tem `obterPacotePosicaoHistorico` (genérico, idêntico em chamada).

**Decisão proposta:** adicionar `obterPacotePosicaoMotoristaHistorico(dataInicio, dataFinal, idMotorista?)` que faz a mesma chamada mas retornando info de motorista. **Requer leitura da seção 4.15 do manual para confirmar.**

## Decisões

- **D1:** Adicionar Gap 1 (`obterEnderecoPosicao`) — fácil e útil.
- **D2:** Adicionar Gap 2 (`obterPacotePosicoesRFNacional`) — requer leitura da seção 4.53.
- **D3:** Investigar Gap 3 (`obterPacotePosicaoMotoristaHistorico`) — se for realmente distinto de `obterPacotePosicaoHistorico`, adicionar.
- **D4:** Tipos: usar `Partial<T>` ou `Record<string, unknown>` no retorno de novos métodos, alinhado com a F4 (subset match nos testes).
- **D5:** Testes: 1 integration test por novo método.
- **D6:** README: atualizar com os 3 novos métodos após implementação.

## Não-objetivos

- NÃO corrigir divergências nos 60 métodos já implementados (F4 + F2 confirmam que estão alinhados pelo sumário).
- NÃO adicionar overloads Java-style no TypeScript (sem polimorfismo de tipo).
- NÃO alterar a API pública existente.

## Critérios de aceite

- [ ] `npm run build/lint/typecheck/test` verdes.
- [ ] 3 novos métodos públicos adicionados (ou 2 se Gap 3 for falso positivo).
- [ ] Cobertura 100% nos novos métodos.
- [ ] README atualizado.
- [ ] Sem breaking changes.

## Próxima fase

F5 — Documentação e DX (README, CHANGELOG, .env.example, exemplos).
