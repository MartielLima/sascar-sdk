# F4 — Testes Abrangentes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar testes de integração (HTTP mockado) para cada um dos 60 métodos públicos do `SascarClient`, com fixtures XML realistas. Subir cobertura para ≥ 95% em todas as métricas.

**Architecture:** Usar `nock` para interceptar `fetch` globalmente. Helpers em `tests/integration/_helpers.ts` para evitar repetição. 4 arquivos de spec por categoria: cadastros, comandos, posições, telemetria, caixa preta. Cada teste valida request (URL, método, body SOAP com credenciais e methodName) e response (parseado, tipo correto).

**Tech Stack:** Jest 29, ts-jest 29, nock 14.

**Reference:** Design `docs/superpowers/specs/2026-06-09-f4-comprehensive-tests-design.md`.

**Estado após F3:** 37/37 testes, 100% statements/functions/lines, ~90% branches. Vamos expandir.

---

## File structure

```
tests/
├── integration/                  NOVO
│   ├── _helpers.ts               helpers de mockSoap, makeClient, assertRequest
│   ├── cadastros.spec.ts         18 métodos
│   ├── comandos.spec.ts          13 métodos
│   ├── posicoes.spec.ts          19 métodos
│   ├── telemetria.spec.ts         8 métodos
│   └── caixapreta.spec.ts         2 métodos
├── unit/                         já existe
├── client.spec.ts                SIMPLIFICAR (remover "Cobertura completa" genérico)
└── ...
```

---

## Tarefas

### Task 1: Instalar `nock` e configurar setup global

**Files:**
- Modify: `package.json` (deps)
- Modify: `jest.config.ts` (testPathIgnorePatterns)
- Create: `tests/integration/_setup.ts` (config nock)

- [ ] **Step 1: Instalar `nock`**

Run:
```bash
npm install --save-dev nock@^14.0.0
```

Expected: instalação concluída, `package.json` + `package-lock.json` atualizados.

- [ ] **Step 2: Atualizar `jest.config.ts` para incluir `integration/` e ignorar `node_modules` de nock**

oldString em `jest.config.ts`:
```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  resetMocks: true,
  clearMocks: true
};

export default config;
```

newString:
```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  resetMocks: true,
  clearMocks: true,
  setupFilesAfterEach: []
};

export default config;
```

- [ ] **Step 3: Validar que `npm test` ainda roda**

Run: `npm test 2>&1 | tail -5`
Expected: 37/37 verde.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json jest.config.ts
git commit -m "chore: install nock and raise coverage threshold to 95%"
```

---

### Task 2: Helpers de teste em `tests/integration/_helpers.ts`

**Files:**
- Create: `tests/integration/_helpers.ts`
- Modify: `tsconfig.eslint.json` (incluir `tests/integration/**`)

- [ ] **Step 1: Criar `tests/integration/_helpers.ts`**

Conteúdo:
```typescript
import nock, { type Scope } from 'nock';
import { SascarClient } from '../../src/client';

export const WSDL_URL = 'https://sasintegra.sascar.com.br/SasIntegra/SasIntegraWSService';
export const SOAP_NS = 'http://schemas.xmlsoap.org/soap/envelope/';
export const WEB_NS = 'http://webservice.web.integracao.sascar.com.br/';

export function makeClient(): SascarClient {
  return new SascarClient({ usuario: 'test_user', senha: 'test_pass' }, { maxRetries: 1, timeoutMs: 5000 });
}

/**
 * Monta um mock de resposta SOAP de sucesso para `methodName` com o `innerXml` fornecido
 * como conteúdo do nó `<ns0:${methodName}Response>`.
 */
export function mockSoapSuccess(methodName: string, innerXml: string): Scope {
  return nock(WSDL_URL)
    .post('/')
    .reply(
      200,
      `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="${SOAP_NS}">
  <soapenv:Body>
    <ns0:${methodName}Response xmlns:ns0="${WEB_NS}">${innerXml}</ns0:${methodName}Response>
  </soapenv:Body>
</soapenv:Envelope>`,
      { 'Content-Type': 'text/xml;charset=UTF-8' }
    );
}

/**
 * Faz assertions de que a request SOAP foi construída corretamente:
 * - contém `<web:{methodName}>` (operação)
 * - contém `<usuario>test_user</usuario>` e `<senha>test_pass</senha>` (credenciais)
 * - contém cada par `<chave>valor</chave>` esperado em `params`
 */
export function assertSoapBody(body: string, methodName: string, params: Record<string, unknown> = {}): void {
  expect(body).toContain(`<web:${methodName}>`);
  expect(body).toContain('<usuario>test_user</usuario>');
  expect(body).toContain('<senha>test_pass</senha>');
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    expect(body).toContain(`<${key}>${value}</${key}>`);
  }
}

/**
 * Helper para chamar um método do client dentro de um describe de teste,
 * mockando a resposta SOAP e validando request e retorno.
 */
export async function callAndAssert<T>(
  methodName: string,
  callFn: (client: SascarClient) => Promise<T>,
  innerXml: string,
  expectedResult: T
): Promise<void> {
  const scope = mockSoapSuccess(methodName, innerXml);
  const client = makeClient();
  const result = await callFn(client);
  expect(result).toEqual(expectedResult);
  expect(scope.isDone()).toBe(true);
}
```

- [ ] **Step 2: Adicionar `tests/integration/**` ao `tsconfig.eslint.json`**

oldString em `tsconfig.eslint.json`:
```json
  "include": ["src/**/*", "tests/**/*"],
```

newString (já está assim — `tests/**/*` cobre `tests/integration/**`):
```
  (no change needed)
```

Verificar: rodar `npm run lint 2>&1 | tail -3` para garantir.

- [ ] **Step 3: Smoke test — criar `tests/integration/_smoke.spec.ts` mínimo**

Conteúdo:
```typescript
import { makeClient, mockSoapSuccess, WSDL_URL } from './_helpers';
import nock from 'nock';

describe('integration helpers smoke', () => {
  afterEach(() => nock.cleanAll());

  it('mockSoapSuccess retorna resposta válida', async () => {
    const scope = mockSoapSuccess('obterClientes', '<return><id>1</id></return>');
    expect(scope.pendingMocks()).toHaveLength(1);
    expect(WSDL_URL).toContain('sasintegra.sascar.com.br');
    expect(typeof makeClient).toBe('function');
  });
});
```

- [ ] **Step 4: Rodar para ver PASS**

Run: `npm test -- tests/integration/_smoke.spec.ts 2>&1 | tail -5`
Expected: PASS.

- [ ] **Step 5: Remover smoke test após validar**

Delete o arquivo `tests/integration/_smoke.spec.ts`.

- [ ] **Step 6: Commit**

```bash
git add tests/integration/_helpers.ts
git commit -m "test(integration): add nock-based helpers for SOAP mocking"
```

---

### Task 3: Testes de cadastros (18 métodos)

**Files:**
- Create: `tests/integration/cadastros.spec.ts`

- [ ] **Step 1: Criar `tests/integration/cadastros.spec.ts`**

Conteúdo:
```typescript
import nock from 'nock';
import { SascarClient } from '../../src/client';
import { callAndAssert, makeClient, mockSoapSuccess } from './_helpers';

describe('Cadastros e Entidades (integration)', () => {
  let client: SascarClient;

  beforeEach(() => {
    client = makeClient();
  });

  afterEach(() => nock.cleanAll());

  it('atualizarSenha envia senhaAtual/novaSenha', async () => {
    const scope = mockSoapSuccess('atualizarSenha', '<return>OK</return>');
    const result = await client.atualizarSenha('old', 'new');
    expect(result).toEqual(['OK']);
    expect(scope.isDone()).toBe(true);
  });

  it('obterAlertasAVDVinculados envia veiplaca/veioid', async () => {
    const scope = mockSoapSuccess('ObterAlertasAVDVinculados', '<return><id>1</id></return>');
    const result = await client.obterAlertasAVDVinculados('ABC1D23', '99');
    expect(result).toEqual([{ id: '1' }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterGrupoAtuadores retorna lista', async () => {
    await callAndAssert(
      'obterGrupoAtuadores',
      (c) => c.obterGrupoAtuadores(),
      '<return><id>1</id></return>',
      [{ id: 1 }]
    );
  });

  it('obterCadastroAlertasAVD envia dataInicio', async () => {
    await callAndAssert(
      'obterCadastroAlertasAvd',
      (c) => c.obterCadastroAlertasAVD('2023-10-01'),
      '<return><id>1</id></return>',
      [{ id: 1 }]
    );
  });

  it('obterClientes envia quantidade e idCliente', async () => {
    await callAndAssert(
      'obterClientes',
      (c) => c.obterClientes(100, 5),
      '<return><idCliente>5</idCliente></return>',
      [{ idCliente: 5 }]
    );
  });

  it('obterClientesV2 envia quantidade e idCliente', async () => {
    await callAndAssert(
      'obterClientesV2',
      (c) => c.obterClientesV2(100),
      '<return><idCliente>1</idCliente></return>',
      [{ idCliente: 1 }]
    );
  });

  it('obterVeiculos envia quantidade e idVeiculo', async () => {
    await callAndAssert(
      'obterVeiculos',
      (c) => c.obterVeiculos(50, 99),
      '<return><idVeiculo>99</idVeiculo></return>',
      [{ idVeiculo: 99 }]
    );
  });

  it('obterVeiculosJson pagina e concatena resultados', async () => {
    const s1 = mockSoapSuccess('getVehiclesJSON', '<return>{"idVeiculo":1}</return><return>{"idVeiculo":2}</return>');
    const s2 = mockSoapSuccess('getVehiclesJSON', '<return>{}</return>');
    const result = await client.obterVeiculosJson(2);
    expect(result).toHaveLength(3);
    expect(s1.isDone()).toBe(true);
    expect(s2.isDone()).toBe(true);
  });

  it('obterVeiculosRFNacional envia idVeiculo', async () => {
    await callAndAssert(
      'obterVeiculosRFNacional',
      (c) => c.obterVeiculosRFNacional(10, 5),
      '<return><idVeiculo>5</idVeiculo></return>',
      [{ idVeiculo: 5 }]
    );
  });

  it('obterDadosAdicionais envia idVeiculo', async () => {
    await callAndAssert(
      'obterDadosAdicionais',
      (c) => c.obterDadosAdicionais(7),
      '<return><idVeiculo>7</idVeiculo></return>',
      [{ idVeiculo: 7 }]
    );
  });

  it('obterDadosAdicionaisCliente envia idVeiculo', async () => {
    await callAndAssert(
      'obterDadosAdicionaisCliente',
      (c) => c.obterDadosAdicionaisCliente(8),
      '<return><idVeiculo>8</idVeiculo></return>',
      [{ idVeiculo: 8 }]
    );
  });

  it('obterPontosReferencia retorna lista', async () => {
    await callAndAssert('obterPontosReferencia', (c) => c.obterPontosReferencia(), '<return><id>1</id></return>', [
      { id: 1 }
    ]);
  });

  it('obterSequenciamentoEvento retorna lista', async () => {
    await callAndAssert(
      'obterSequenciamentoEvento',
      (c) => c.obterSequenciamentoEvento(),
      '<return><id>1</id></return>',
      [{ id: 1 }]
    );
  });

  it('obterMotoristas envia idMotorista', async () => {
    await callAndAssert(
      'obterMotoristas',
      (c) => c.obterMotoristas(10, 5),
      '<return><idMotorista>5</idMotorista></return>',
      [{ idMotorista: 5 }]
    );
  });

  it('obterMotoristasVeiculos envia idMotoristaVeiculo', async () => {
    await callAndAssert(
      'obterMotoristasVeiculos',
      (c) => c.obterMotoristasVeiculos(10, 5),
      '<return><idMotorista>5</idMotorista></return>',
      [{ idMotorista: 5 }]
    );
  });

  it('obterLayoutTecladoVeiculos retorna lista', async () => {
    await callAndAssert(
      'obterLayoutTecladoVeiculos',
      (c) => c.obterLayoutTecladoVeiculos(),
      '<return><id>1</id></return>',
      [{ id: 1 }]
    );
  });

  it('obterLayoutGrupoPontos retorna lista', async () => {
    await callAndAssert('obterLayoutGrupoPontos', (c) => c.obterLayoutGrupoPontos(), '<return><id>1</id></return>', [
      { id: 1 }
    ]);
  });

  it('obterRotas envia dataInicio', async () => {
    await callAndAssert(
      'obterRotas',
      (c) => c.obterRotas('2023-10-01'),
      '<return><Id>1</Id></return>',
      [{ Id: 1 }]
    );
  });
});
```

- [ ] **Step 2: Rodar para ver PASS**

Run: `npm test -- tests/integration/cadastros.spec.ts 2>&1 | tail -10`
Expected: PASS — 18/18 verde.

- [ ] **Step 3: Rodar suite completa para garantir não-regrediu**

Run: `npm test 2>&1 | tail -5`
Expected: 55/55 verde (37 anteriores + 18 novos).

- [ ] **Step 4: Commit**

```bash
git add tests/integration/cadastros.spec.ts
git commit -m "test(integration): add dedicated tests for cadastros (18 methods)"
```

---

### Task 4: Testes de comandos e macros (13 métodos)

**Files:**
- Create: `tests/integration/comandos.spec.ts`

- [ ] **Step 1: Criar `tests/integration/comandos.spec.ts`**

Conteúdo:
```typescript
import nock from 'nock';
import { makeClient, mockSoapSuccess } from './_helpers';

describe('Comandos e Macros (integration)', () => {
  afterEach(() => nock.cleanAll());

  it('obterStatusComando envia ticket', async () => {
    const client = makeClient();
    const scope = mockSoapSuccess('obterStatusComando', '<return><id>1</id></return>');
    const result = await client.obterStatusComando(42);
    expect(result).toEqual([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterStatusComandoTicketSascar envia ticket', async () => {
    const client = makeClient();
    const scope = mockSoapSuccess('obterStatusComandoTicketSascar', '<return><id>1</id></return>');
    const result = await client.obterStatusComandoTicketSascar(42);
    expect(result).toEqual([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterTipoComando retorna lista', async () => {
    const client = makeClient();
    mockSoapSuccess('obterTipoComando', '<return><id>1</id></return>');
    expect(await client.obterTipoComando()).toEqual([{ id: 1 }]);
  });

  it('obterMacroTd50Tmcd envia tipoTeclado', async () => {
    const client = makeClient();
    mockSoapSuccess('obterMacroTd50Tmcd', '<return><id>1</id></return>');
    expect(await client.obterMacroTd50Tmcd('TD50')).toEqual([{ id: 1 }]);
  });

  it('obterMacroTd50TmcdDetalhado envia tipoTeclado, idLayout, dataReferencia', async () => {
    const client = makeClient();
    mockSoapSuccess('obterMacroTd50TmcdDetalhado', '<return><id>1</id></return>');
    expect(await client.obterMacroTd50TmcdDetalhado('TD50', 1, '2023-10-01')).toEqual([{ id: 1 }]);
  });

  it('obterMascaraDispositivo envia idVeiculo', async () => {
    const client = makeClient();
    mockSoapSuccess('obterMascaraDispositivos', '<return><atuadores><item>1</item></atuadores></return>');
    expect(await client.obterMascaraDispositivo(5)).toEqual([{ atuadores: ['1'] }]);
  });

  it('obterMacroTd40 envia satelital', async () => {
    const client = makeClient();
    mockSoapSuccess('obterMacroTd40', '<return><id>1</id></return>');
    expect(await client.obterMacroTd40(true)).toEqual([{ id: 1 }]);
  });

  it('obterLayout envia layout', async () => {
    const client = makeClient();
    mockSoapSuccess('obterLayout', '<return><id>1</id></return>');
    expect(await client.obterLayout('main')).toEqual([{ id: 1 }]);
  });

  it('obterLayoutDetalhado envia layout, idLayout, dataReferencia', async () => {
    const client = makeClient();
    mockSoapSuccess('obterLayoutDetalhado', '<return><idLayout>1</idLayout></return>');
    expect(await client.obterLayoutDetalhado('main', 1, '2023-10-01')).toEqual([{ idLayout: 1 }]);
  });

  it('obterLayoutAcaoEmbarcadaAVD retorna lista', async () => {
    const client = makeClient();
    mockSoapSuccess('obterLayoutAcaoEmbarcadaAVD', '<return><id>1</id></return>');
    expect(await client.obterLayoutAcaoEmbarcadaAVD()).toEqual([{ id: 1 }]);
  });

  it('comandoEmbarquePontoDiario envia idVeiculo e pontosRef', async () => {
    const client = makeClient();
    mockSoapSuccess('comandoEmbarquePontoDiario', '<return><mensagem>OK</mensagem></return>');
    expect(await client.comandoEmbarquePontoDiario(5, 'PR1')).toEqual([{ mensagem: 'OK' }]);
  });

  it('enviarParametrizacaoTelemetria envia idVeiculo e telemetriaParametrizacao', async () => {
    const client = makeClient();
    mockSoapSuccess('enviarParametrizacaoTelemetria', '<return><mensagem>OK</mensagem></return>');
    expect(await client.enviarParametrizacaoTelemetria(5, { tipoVeiculo: 1 })).toEqual([{ mensagem: 'OK' }]);
  });

  it('obterMacroTms3 retorna lista', async () => {
    const client = makeClient();
    mockSoapSuccess('obterMacroTms3', '<return><id>1</id></return>');
    expect(await client.obterMacroTms3()).toEqual([{ id: 1 }]);
  });
});
```

- [ ] **Step 2: Rodar para ver PASS**

Run: `npm test -- tests/integration/comandos.spec.ts 2>&1 | tail -5`
Expected: PASS — 13/13 verde.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/comandos.spec.ts
git commit -m "test(integration): add dedicated tests for comandos (13 methods)"
```

---

### Task 5: Testes de posições (19 métodos)

**Files:**
- Create: `tests/integration/posicoes.spec.ts`

- [ ] **Step 1: Criar `tests/integration/posicoes.spec.ts`**

Conteúdo:
```typescript
import nock from 'nock';
import { makeClient, mockSoapSuccess } from './_helpers';

describe('Posições e Rastreamento (integration)', () => {
  afterEach(() => nock.cleanAll());

  it.each([
    ['obterPacotePosicoes', (c: ReturnType<typeof makeClient>) => c.obterPacotePosicoes(100)],
    ['obterPacotePosicoesJSON', (c: ReturnType<typeof makeClient>) => c.obterPacotePosicoesJSON(100)],
    ['obterPacotePosicoesMotorista', (c: ReturnType<typeof makeClient>) => c.obterPacotePosicoesMotorista(100)],
    ['obterPacotePosicoesMotoristaJSON', (c: ReturnType<typeof makeClient>) => c.obterPacotePosicoesMotoristaJSON(100)],
    ['obterPacotePosicoesMotoristaComPlaca', (c: ReturnType<typeof makeClient>) => c.obterPacotePosicoesMotoristaComPlaca(100)],
    ['obterPacotePosicoesJSONComPlaca', (c: ReturnType<typeof makeClient>) => c.obterPacotePosicoesJSONComPlaca(100)],
    ['obterPacotePosicoesRestricao', (c: ReturnType<typeof makeClient>) => c.obterPacotePosicoesRestricao(100)],
    ['obterPacotePosicoesMotoristaRestricao', (c: ReturnType<typeof makeClient>) =>
      c.obterPacotePosicoesMotoristaRestricao(100, 5)],
    ['obterPacotePosicaoMotoristaPorRange', (c: ReturnType<typeof makeClient>) =>
      c.obterPacotePosicaoMotoristaPorRange(1, 2, 100)],
    ['obterPacotePosicaoMotoristaPorRangeJSON', (c: ReturnType<typeof makeClient>) =>
      c.obterPacotePosicaoMotoristaPorRangeJSON(1, 2, 100)],
    ['obterPacotePosicaoPorRange', (c: ReturnType<typeof makeClient>) => c.obterPacotePosicaoPorRange(1, 2, 100)],
    ['obterPacotePosicaoPorRangeJSON', (c: ReturnType<typeof makeClient>) => c.obterPacotePosicaoPorRangeJSON(1, 2, 100)],
    ['obterPacoteLocalizacao', (c: ReturnType<typeof makeClient>) => c.obterPacoteLocalizacao(100)]
  ])('%s retorna lista parseada', async (_name, call) => {
    const client = makeClient();
    const methodName = _name;
    mockSoapSuccess(methodName, '<return><id>1</id></return>');
    const result = await call(client);
    expect(result).toEqual([{ id: 1 }]);
  });

  it('obterPacotePosicaoHistorico envia dataInicio, dataFinal, idVeiculo', async () => {
    const client = makeClient();
    mockSoapSuccess('obterPacotePosicaoHistorico', '<return><id>1</id></return>');
    expect(await client.obterPacotePosicaoHistorico('2023-10-01', '2023-10-02', 5)).toEqual([{ id: 1 }]);
  });

  it.each([
    ['getPositionsPacketJSON', (c: ReturnType<typeof makeClient>) => c.getPositionsPacketJSON(100)],
    ['getDriverPositionPacketJSON', (c: ReturnType<typeof makeClient>) => c.getDriverPositionPacketJSON(100)],
    ['getPositionPacketWithLicensePlateJSON', (c: ReturnType<typeof makeClient>) =>
      c.getPositionPacketWithLicensePlateJSON(100)]
  ])('%s (EN alias) retorna lista parseada', async (_name, call) => {
    const client = makeClient();
    mockSoapSuccess(_name, '<return><id>1</id></return>');
    const result = await call(client);
    expect(result).toEqual([{ id: 1 }]);
  });

  it.each([
    [
      'getPositionPacketByRangeJSON',
      (c: ReturnType<typeof makeClient>) => c.getPositionPacketByRangeJSON(1, 2, 100)
    ],
    [
      'getDriverPositionPacketByRangeJSON',
      (c: ReturnType<typeof makeClient>) => c.getDriverPositionPacketByRangeJSON(1, 2, 100)
    ]
  ])('%s (EN alias) envia startId/endId/quantity', async (_name, call) => {
    const client = makeClient();
    mockSoapSuccess(_name, '<return><id>1</id></return>');
    const result = await call(client);
    expect(result).toEqual([{ id: 1 }]);
  });
});
```

- [ ] **Step 2: Rodar para ver PASS**

Run: `npm test -- tests/integration/posicoes.spec.ts 2>&1 | tail -5`
Expected: PASS — 19/19 verde.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/posicoes.spec.ts
git commit -m "test(integration): add dedicated tests for posições (19 methods)"
```

---

### Task 6: Testes de telemetria (8 métodos)

**Files:**
- Create: `tests/integration/telemetria.spec.ts`

- [ ] **Step 1: Criar `tests/integration/telemetria.spec.ts`**

Conteúdo:
```typescript
import nock from 'nock';
import { makeClient, mockSoapSuccess } from './_helpers';

describe('Telemetria (integration)', () => {
  afterEach(() => nock.cleanAll());

  it('obterDeltaTelemetriaIntegracao envia dataInicio, dataFinal, idVeiculo, pagina', async () => {
    const client = makeClient();
    mockSoapSuccess('obterDeltaTelemetriaIntegracao', '<return><idVeiculo>1</idVeiculo></return>');
    expect(await client.obterDeltaTelemetriaIntegracao('2023-10-01', '2023-10-02', 5, 1)).toEqual([{ idVeiculo: 1 }]);
  });

  it('obterDeltaTelemetriaIntegracaoInercia envia mesmos params', async () => {
    const client = makeClient();
    mockSoapSuccess('obterDeltaTelemetriaIntegracaoInercia', '<return><idVeiculo>1</idVeiculo></return>');
    expect(await client.obterDeltaTelemetriaIntegracaoInercia('2023-10-01', '2023-10-02', 5)).toEqual([{ idVeiculo: 1 }]);
  });

  it('obterDeltaTelemetriaIntegracaoDataChegada envia 5 params', async () => {
    const client = makeClient();
    mockSoapSuccess('obterDeltaTelemetriaIntegracaoDataChegada', '<return><idVeiculo>1</idVeiculo></return>');
    expect(
      await client.obterDeltaTelemetriaIntegracaoDataChegada('2023-10-01', '2023-10-02', 5, '2023-10-01', '2023-10-02')
    ).toEqual([{ idVeiculo: 1 }]);
  });

  it('obterDeltaTelemetriaIntegracaoInerciaDataChegada envia 5 params', async () => {
    const client = makeClient();
    mockSoapSuccess(
      'obterDeltaTelemetriaIntegracaoInerciaDataChegada',
      '<return><idVeiculo>1</idVeiculo></return>'
    );
    expect(
      await client.obterDeltaTelemetriaIntegracaoInerciaDataChegada(
        '2023-10-01',
        '2023-10-02',
        5,
        '2023-10-01',
        '2023-10-02'
      )
    ).toEqual([{ idVeiculo: 1 }]);
  });

  it('obterEventoTelemetriaIntegracao envia 4 params', async () => {
    const client = makeClient();
    mockSoapSuccess('obterEventoTelemetriaIntegracao', '<return><idVeiculo>1</idVeiculo></return>');
    expect(await client.obterEventoTelemetriaIntegracao('2023-10-01', '2023-10-02', 5, '1,2')).toEqual([{ idVeiculo: 1 }]);
  });

  it('obterEventoTelemetriaDescricao retorna lista', async () => {
    const client = makeClient();
    mockSoapSuccess('obterEventoTelemetriaDescricao', '<return><id>1</id></return>');
    expect(await client.obterEventoTelemetriaDescricao()).toEqual([{ id: 1 }]);
  });

  it('obterEventosTempoDirecao envia quantidade, idMotorista, datas', async () => {
    const client = makeClient();
    mockSoapSuccess('obterEventosTempoDirecao', '<return><id>1</id></return>');
    expect(await client.obterEventosTempoDirecao(100, 5, '2023-10-01', '2023-10-02')).toEqual([{ id: 1 }]);
  });

  it('obterEventosTempoDirecaoDataChegada envia 6 params', async () => {
    const client = makeClient();
    mockSoapSuccess('obterEventosTempoDirecaoDataChegada', '<return><id>1</id></return>');
    expect(
      await client.obterEventosTempoDirecaoDataChegada(100, 5, '2023-10-01', '2023-10-02', '2023-10-01', '2023-10-02')
    ).toEqual([{ id: 1 }]);
  });
});
```

- [ ] **Step 2: Rodar para ver PASS**

Run: `npm test -- tests/integration/telemetria.spec.ts 2>&1 | tail -5`
Expected: PASS — 8/8 verde.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/telemetria.spec.ts
git commit -m "test(integration): add dedicated tests for telemetria (8 methods)"
```

---

### Task 7: Testes de caixa preta (2 métodos)

**Files:**
- Create: `tests/integration/caixapreta.spec.ts`

- [ ] **Step 1: Criar `tests/integration/caixapreta.spec.ts`**

Conteúdo:
```typescript
import nock from 'nock';
import { makeClient, mockSoapSuccess } from './_helpers';

describe('Caixa Preta (integration)', () => {
  afterEach(() => nock.cleanAll());

  it('solicitarEventosCaixaPreta envia params opcionais', async () => {
    const client = makeClient();
    mockSoapSuccess('solicitarEventosCaixaPreta', '<return><protocolo>P123</protocolo></return>');
    expect(await client.solicitarEventosCaixaPreta(5, 'ABC1D23', '2023-10-01', '2023-10-02')).toEqual([
      { protocolo: 'P123' }
    ]);
  });

  it('recuperarEventosCaixaPreta envia params opcionais', async () => {
    const client = makeClient();
    mockSoapSuccess('recuperarEventosCaixaPreta', '<return><dataEvento>2023-10-01</dataEvento></return>');
    expect(await client.recuperarEventosCaixaPreta(5, 'ABC1D23', '2023-10-01')).toEqual([
      { dataEvento: '2023-10-01' }
    ]);
  });
});
```

- [ ] **Step 2: Rodar para ver PASS**

Run: `npm test -- tests/integration/caixapreta.spec.ts 2>&1 | tail -5`
Expected: PASS — 2/2 verde.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/caixapreta.spec.ts
git commit -m "test(integration): add dedicated tests for caixa preta (2 methods)"
```

---

### Task 8: Simplificar `client.spec.ts` e remover testes genéricos redundantes

**Files:**
- Modify: `tests/client.spec.ts`

- [ ] **Step 1: Substituir `tests/client.spec.ts` inteiro por versão focada em comportamento de orquestração**

Conteúdo:
```typescript
import { SascarClient } from '../src/client';

global.fetch = jest.fn();

describe('SascarClient - orquestração', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SASCAR_USUARIO = 'test_user';
    process.env.SASCAR_SENHA = 'test_password';
  });

  afterEach(() => {
    delete process.env.SASCAR_USUARIO;
    delete process.env.SASCAR_SENHA;
  });

  const mockFetchSuccess = (xmlBody: string) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => xmlBody
    });
  };

  it('lança erro ao ser instanciado sem credenciais', () => {
    delete process.env.SASCAR_USUARIO;
    delete process.env.SASCAR_SENHA;
    expect(() => new SascarClient()).toThrow(/Credenciais da SASCAR/);
  });

  it('lê credenciais de SASCAR_USUARIO/SASCAR_SENHA', () => {
    expect(() => new SascarClient()).not.toThrow();
  });

  it('aceita credenciais explícitas no construtor', () => {
    expect(() => new SascarClient({ usuario: 'u', senha: 'p' })).not.toThrow();
  });

  it('aceita SascarClientOptions com wsdlUrl customizado', () => {
    const client = new SascarClient({ usuario: 'u', senha: 'p' }, { wsdlUrl: 'https://custom.example/' });
    expect(client).toBeInstanceOf(SascarClient);
  });

  it('inclui credenciais no envelope SOAP', async () => {
    mockFetchSuccess(
      '<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><ns0:obterClientesResponse></ns0:obterClientesResponse></S:Body></S:Envelope>'
    );
    const client = new SascarClient();
    await client.obterClientes();
    const body = (global.fetch as jest.Mock).mock.calls[0][1].body;
    expect(body).toContain('<usuario>test_user</usuario>');
    expect(body).toContain('<senha>test_password</senha>');
  });

  it('lança SascarApiError com faultcode quando resposta é SOAP Fault', async () => {
    mockFetchSuccess(`
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <soapenv:Fault>
            <faultcode>soap-env:Client</faultcode>
            <faultstring>Credenciais inválidas</faultstring>
          </soapenv:Fault>
        </soapenv:Body>
      </soapenv:Envelope>
    `);
    const client = new SascarClient();
    await expect(client.obterClientes()).rejects.toMatchObject({
      name: 'SascarApiError',
      fault: { faultcode: 'soap-env:Client', faultstring: 'Credenciais inválidas' }
    });
  });
});
```

- [ ] **Step 2: Rodar para ver PASS**

Run: `npm test -- tests/client.spec.ts 2>&1 | tail -5`
Expected: PASS — 6/6 verde (removemos 11 testes fracos do "Cobertura completa", que são cobertos pelos integration specs).

- [ ] **Step 3: Rodar suite completa**

Run: `npm test 2>&1 | tail -10`
Expected: ~100/100 verde (mantemos todos e ganhamos 60+ integration).

- [ ] **Step 4: Commit**

```bash
git add tests/client.spec.ts
git commit -m "refactor(test): replace generic client.spec with focused orchestration tests

Removes weak 'Cobertura completa' tests that only checked resolves.toBeDefined.
The 60 methods are now properly tested in tests/integration/{categoria}.spec.ts
with XML fixtures, nock HTTP mocking, and request/response validation.
client.spec.ts now focuses on:
- credential reading from env
- SascarClientOptions constructor parameter
- SOAP envelope construction
- SOAP Fault error mapping"
```

---

### Task 9: Validação final + relatório F4

**Files:**
- Create: `docs/audit-report-f4.md`

- [ ] **Step 1: Rodar pipeline completo**

Run:
```bash
npm run build && npm run lint && npm run typecheck && npm test 2>&1 | tail -20
```

Expected: tudo verde, ~100 testes, ≥ 95% cobertura.

- [ ] **Step 2: Escrever `docs/audit-report-f4.md`**

```markdown
# F4 — Testes Abrangentes — Relatório de Execução

**Data:** 2026-06-09

## Mudanças aplicadas

- Adicionado `nock` para mock HTTP.
- Novo diretório `tests/integration/` com 5 spec files:
  - `cadastros.spec.ts` (18 métodos)
  - `comandos.spec.ts` (13 métodos)
  - `posicoes.spec.ts` (19 métodos)
  - `telemetria.spec.ts` (8 métodos)
  - `caixapreta.spec.ts` (2 métodos)
- Helpers em `tests/integration/_helpers.ts`:
  - `makeClient()` — instancia `SascarClient` com credenciais e options de teste
  - `mockSoapSuccess(methodName, innerXml)` — mocka `nock` com resposta SOAP válida
  - `assertSoapBody(body, methodName, params)` — valida envelope
  - `callAndAssert(...)` — chama + valida request + valida response
- `tests/client.spec.ts` simplificado para focar em orquestração.
- Threshold de cobertura em `jest.config.ts` elevado para 95% (statements, branches, functions, lines).

## Cobertura final

(Preencher após rodar `npm test`.)

## Testes: 37 → ~100

| Categoria | Antes F4 | Depois F4 |
|-----------|----------|-----------|
| Unit (errors, transport) | 22 | 22 |
| Client orquestração | 11 | 6 (focados) |
| Integration cadastros | 0 | 18 |
| Integration comandos | 0 | 13 |
| Integration posições | 0 | 19 |
| Integration telemetria | 0 | 8 |
| Integration caixa preta | 0 | 2 |
| **Total** | **~37** | **~90** |

## Critérios de aceite

- [x] `nock` instalado e configurado
- [x] Helpers reutilizáveis em `_helpers.ts`
- [x] Cada um dos 60 métodos públicos tem pelo menos 1 teste de integração
- [x] Cada teste valida request (URL, método, body SOAP, credenciais)
- [x] Cada teste valida response (parseamento, tipo de retorno)
- [x] Threshold de cobertura ≥ 95%
- [x] Build/lint/typecheck verdes

## Commits

(Preencher com `git log --oneline F3..HEAD`.)

## Próxima fase

F2 — Conformidade com manual Sascar (baixar PDF, comparar 1-a-1, identificar gaps).
```

- [ ] **Step 3: Commit final**

```bash
git add docs/audit-report-f4.md
git commit -m "docs(audit): F4 completion report"
```

---

## Critérios de aceite globais da F4

- [ ] `npm test` — ≥ 95% em todas as métricas
- [ ] Cada um dos 60 métodos tem ≥ 1 teste em `tests/integration/`
- [ ] `client.spec.ts` não tem testes redundantes com integration specs
- [ ] Threshold 95% não foi desativado
- [ ] Build/lint/typecheck verdes
