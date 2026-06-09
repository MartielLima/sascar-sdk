# Sascar SDK — Auditoria Técnica Integral — Design

- **Data:** 2026-06-09
- **Projeto:** `sascar-sdk` (TypeScript SDK para o WebService SOAP SasIntegra v2.07 da Sascar/Michelin)
- **Tipo:** Especificação de auditoria técnica com correções
- **Status:** Aprovado pelo usuário, aguardando implementação por fases

## 1. Visão geral e escopo

### Objetivo
Realizar uma auditoria técnica profunda do `sascar-sdk` e aplicar as correções necessárias, garantindo que o SDK seja robusto, tipado, testado, documentado e em conformidade com a documentação oficial SasIntegra v2.07.

### Não-objetivos (YAGNI)
- Não criar uma interface gráfica (web/desktop) para consumir o SDK.
- Não adicionar dependências "modernizadoras" sem necessidade (axios, zod, etc.).
- Não criar um servidor proxy/middleware.
- Não traduzir mensagens de erro da Sascar para múltiplos idiomas.
- Não alterar a API pública (nomes de métodos, parâmetros, formato de retorno) sem aprovação explícita.

### Fases (cada uma = 1 design doc + 1 plano + implementação + aprovação)

| # | Fase | Entregas | Esforço |
|---|------|----------|---------|
| F1 | Higiene de código & tipos | build verde, lint, typecheck, `any` removidos, nomenclatura consistente | M |
| F2 | Conformidade com manual Sascar | gap report, métodos faltantes adicionados | G |
| F3 | Robustez do cliente SOAP | timeout, retry, tratamento de Fault, mensagens claras | M |
| F4 | Testes | unit + integração com mocks, ≥ 80% cobertura | G |
| F5 | Documentação & DX | README revisado, CHANGELOG, .env.example, exemplos | P |

### Critérios de aceitação globais
- `npm run build` passa sem warnings.
- `npm run lint` passa.
- `npm test` com ≥ 80% cobertura em `src/`.
- 100% dos métodos do PDF oficial Sascar v2.07 implementados.
- README reflete fielmente o estado real do código.
- Sem `any` no código de produção (exceções documentadas).
- Cliente SOAP com timeout configurável, retry exponencial e erros tipados.

## 2. Arquitetura técnica

### Estado atual
```
src/
├── client.ts   (386 LoC)  ← SoapClient, request<T>(), 60 métodos públicos
├── types.ts    (594 LoC)  ← 38 interfaces
├── queue.ts    ( 47 LoC)  ← AsyncQueue (mutex)
├── errors.ts   ( 20 LoC)  ← 3 classes de erro
└── index.ts    (  4 LoC)  ← re-exports
tests/
├── client.spec.ts (222 LoC)
└── queue.spec.ts  ( 48 LoC)
```

### Problemas prováveis a corrigir em F1
1. Uso de `any` em pontos de tipagem do envelope/resposta.
2. `string | null` misturado com opcionais sem critério.
3. Mistura de nomenclatura PT (`obter*`) e EN (`get*`) — **decisão alvo: padronizar em PT (alinhado com o manual Sascar); métodos `get*` que sejam apenas aliases em inglês podem ser mantidos como deprecated wrappers, ou removidos após aprovação do usuário em F1**.
4. `request<TReturn>` sem validação do envelope.
5. Faltam scripts `typecheck` e `format` em `package.json`.
6. `dist/` commitado no repo.
7. Possível ausência de timeout no `fetch` subjacente.
8. Credenciais placeholder em exemplos do README.

### Arquitetura alvo (após F1 + F3)
```
src/
├── client.ts                 ← SascarClient (refatorado, sem any)
├── transport/
│   ├── http.ts               ← SOAP transport (fetch + timeout + retry)
│   ├── envelope.ts           ← buildSoapEnvelope + parseSoapResponse
│   └── fault.ts              ← SascarSoapFault + parser de <SOAP-ENV:Fault>
├── queue.ts                  ← AsyncQueue (mantido)
├── errors.ts                 ← 5 classes tipadas
├── types.ts                  ← tipos organizados (decidir flat vs subdiretórios)
└── index.ts
```

### Princípios
- Camada de transporte isolada — testável sem o cliente.
- Erros tipados, nunca string crua.
- `request<T>` retorna `Promise<T>` e **lança** erros tipados.
- Fila envolve apenas o transporte HTTP.
- Manter 100% da API pública atual em F1 (zero breaking changes).

## 3. Estratégia de conformidade com o manual Sascar (F2)

**5 passos:**
1. **Coletar**: baixar PDF de `connectedfleet.michelin.com/.../WebService_SasIntegra_v2.07_Portugues.pdf` via `ctx_fetch_and_index` (TTL 30 dias).
2. **Extrair**: queries em PT ("obter", "comando", "listar", "consultar") para listar operações, parâmetros e retornos.
3. **Mapear**: tabela em `docs/superpowers/specs/2026-06-09-f2-manual-conformity-gap-report.md`.
4. **Analisar gaps**: ✅/⚠️/❌ por método.
5. **Implementar**: métodos faltantes ou divergentes.

**Critério de "100% coberto":**
- Toda operação do manual tem método público no SDK.
- Parâmetros obrigatórios estão na assinatura.
- Campos de retorno documentados estão tipados.

**Divergências não-óbvias** são levantadas ao usuário antes de alterar.

## 4. Estratégia de testes (F4)

### Stack
- Manter Jest + ts-jest.
- Adicionar **`nock`** para mocks HTTP.

### Pirâmide
1. **Unit** (`tests/unit/`) — `envelope`, `fault`, `queue` (expandir), `errors`.
2. **Integração** (`tests/integration/`) — 1 arquivo por categoria:
   - `cadastros.spec.ts`, `posicoes.spec.ts`, `telemetria.spec.ts`, `comandos.spec.ts`.
3. **Erros** (`tests/integration/errors.spec.ts`) — HTTP 500, timeout, SOAP Fault, 401/403.

### Convenções
- Testes isolados; `beforeEach` reseta `nock`.
- Sem credenciais reais — `nock` intercepta.
- Fixtures em `tests/fixtures/*.xml`.
- `jest.config.ts` com threshold 80% em `src/`.

### Fora de escopo
- Teste de carga real (sem credenciais Sascar).
- Teste contra servidor real.

## 5. Fluxo de execução por fase

Para cada fase:
```
1. Investigar
2. Escrever design doc: docs/superpowers/specs/2026-06-09-f<N>-<nome>-design.md
3. Self-review do design
4. Usuário revisa e aprova
5. writing-plans → plano
6. Usuário revisa e aprova plano
7. TDD → implementar
8. Verificar build + lint + test
9. Commit
10. Próxima fase
```

### Ordem de execução
| Ordem | Fase | Razão |
|------|------|-------|
| 1ª | F1 (Higiene) | Base limpa para o resto |
| 2ª | F3 (Robustez) | Erros tipados antes de testar mais |
| 3ª | F4 (Testes) | Infra sólida para ampliar cobertura |
| 4ª | F2 (Conformidade) | Adicionar métodos é mais barato com infra OK |
| 5ª | F5 (Docs) | Doc reflete o estado final |

### Padrão de commits
Conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`.

### Pontos de checkpoint
- Após design doc de cada fase.
- Após implementação de cada fase (build + lint + test verdes).

## 6. Entregas finais, riscos e próximo passo

### Entregas finais
1. Repositório com 5 fases commitadas, `main` atualizado.
2. `docs/superpowers/specs/` com 1 design doc por fase + este geral.
3. `docs/superpowers/plans/` com 1 plano por fase.
4. `docs/audit-report.md` — relatório executivo com tabela de gaps antes/depois, métricas, melhorias aplicadas, itens conhecidos.
5. README e CHANGELOG atualizados.

### Riscos e mitigações
| Risco | Mitigação |
|-------|-----------|
| PDF Sascar mudar | Cache TTL 30 dias + checagem de hash |
| WSDL não público | Comparação por leitura do PDF; ~1-2% de imprecisão aceitável |
| Tipagem SOAP permissiva | Tipos como "shape mínimo", opcionais onde o manual não garante |
| `dist/` no repo | Verificar impacto; ajustar `.gitignore` se possível |
| Mudanças de tipos quebrarem consumidores | Em F1 só ajustar nulos/opcionais internamente |

### Não-correções (decididas)
- NÃO trocar `fetch` por `axios` (zero runtime deps exceto `fast-xml-parser`).
- NÃO traduzir JSDoc para inglês (mantém PT, alinhado com doc Sascar).
- NÃO alterar API pública sem aprovação.

### Próximo passo
1. ✅ Este design doc escrito.
2. ⏭️ Self-review inline (placeholders, contradições, ambiguidade).
3. ⏭️ Usuário revisa este arquivo.
4. ⏭️ Aprovado → invocar `writing-plans` para gerar plano da **F1 (Higiene)**.
5. ⏭️ Implementar F1 com TDD.

### Referência cruzada
Cada fase gera seu próprio arquivo `2026-06-09-f<N>-<nome>-design.md` e `2026-06-09-f<N>-<nome>-plan.md`, linkando de volta para este documento geral.
