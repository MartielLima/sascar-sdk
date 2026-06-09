# F1 — Higiene de Código & Tipos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Colocar o `sascar-sdk` num estado de higiene mínima: build, lint e typecheck passam sem warnings; cobertura 100%; `any`s removidos do código de produção; ferramentas padronizadas (ESLint, Prettier, scripts npm); `.gitignore` configurado. **Zero breaking changes** na API pública.

**Architecture:** Refatorações cirúrgicas em `client.ts`, `types.ts`, `errors.ts`. Nenhuma mudança de método público. Tipos mais estritos (`unknown` → parsing seguro com validação), e quando inevitável, `any` com `eslint-disable` localizado + comentário justificando. Estilo padronizado via Prettier + ESLint com `@typescript-eslint`.

**Tech Stack:** TypeScript 5.3+, Jest 29, ts-jest 29, ESLint 8, @typescript-eslint, Prettier 3.

**Reference:** Master design `docs/superpowers/specs/2026-06-09-sascar-sdk-audit-design.md` (seção F1).

**Baseline medido em 2026-06-09:**
- `npm run build`: ✅ verde
- `npm run lint`: ❌ sem config
- `npm test`: ⚠️ 12/12 passam, cobertura 99.28% (threshold 100% em jest.config.ts)
- `dist/` commitado no repo
- Sem `.gitignore`, `.eslintrc`, `.prettierrc`

---

## Tarefas

### Task 1: Criar `.gitignore` e remover `dist/`/`coverage/` do repo

**Files:**
- Create: `.gitignore`
- Modify: index (untrack `dist/` e `coverage/`)

- [ ] **Step 1: Escrever `.gitignore`**

Conteúdo:
```gitignore
# dependencies
node_modules/

# build output
dist/

# coverage
coverage/

# env
.env
.env.local
.env.*.local

# editor
.vscode/
.idea/
.DS_Store

# logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

- [ ] **Step 2: Remover `dist/` e `coverage/` do tracking do git (manter arquivos locais)**

Run:
```bash
git rm -r --cached dist coverage
```

Expected: `rm 'dist/...'` linhas listadas.

- [ ] **Step 3: Verificar que `git status` mostra os arquivos como deletados**

Run: `git status`
Expected: aparecem como `deleted:` em verde.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore and untrack dist/ and coverage/"
```

---

### Task 2: Adicionar scripts `typecheck`, `format` e `format:check` ao `package.json`

**Files:**
- Modify: `package.json:14-20`

- [ ] **Step 1: Substituir o bloco `scripts` em `package.json`**

oldString em `package.json`:
```json
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build",
    "lint": "eslint src --ext .ts",
    "test": "jest",
    "test:coverage": "jest --coverage"
  },
```

newString:
```json
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build",
    "lint": "eslint \"src/**/*.ts\" \"tests/**/*.ts\"",
    "lint:fix": "eslint \"src/**/*.ts\" \"tests/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\" \"*.{json,md}\"",
    "format:check": "prettier --check \"src/**/*.ts\" \"tests/**/*.ts\" \"*.{json,md}\"",
    "test": "jest",
    "test:coverage": "jest --coverage"
  },
```

- [ ] **Step 2: Rodar `npm run typecheck` para garantir que o script funciona**

Run: `npm run typecheck`
Expected: exit 0, sem erros.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add typecheck and format scripts"
```

---

### Task 3: Adicionar dependências de lint e format

**Files:**
- Modify: `package.json:21-32` (deps)
- Create: `.eslintrc.cjs`, `.eslintignore`
- Create: `.prettierrc.json`, `.prettierignore`

- [ ] **Step 1: Instalar dependências de desenvolvimento**

Run:
```bash
npm install --save-dev \
  @typescript-eslint/eslint-plugin@^7.0.0 \
  @typescript-eslint/parser@^7.0.0 \
  eslint@^8.56.0 \
  prettier@^3.1.0
```

Expected: instalação concluída, `package.json` e `package-lock.json` atualizados.

- [ ] **Step 2: Criar `.eslintrc.cjs`**

Conteúdo:
```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-typing'
  ],
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  ignorePatterns: ['dist/', 'coverage/', 'node_modules/'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console': 'off',
    'eqeqeq': ['error', 'smart']
  }
};
```

- [ ] **Step 3: Criar `.eslintignore`**

Conteúdo:
```
dist/
coverage/
node_modules/
```

- [ ] **Step 4: Criar `.prettierrc.json`**

Conteúdo:
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 120,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

- [ ] **Step 5: Criar `.prettierignore`**

Conteúdo:
```
dist/
coverage/
node_modules/
bun.lock
package-lock.json
```

- [ ] **Step 6: Rodar `npm run lint` para confirmar que config funciona**

Run: `npm run lint`
Expected: pode listar erros existentes (vamos corrigir nas tasks seguintes). Sem crash de "config not found".

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .eslintrc.cjs .eslintignore .prettierrc.json .prettierignore
git commit -m "chore: configure ESLint and Prettier"
```

---

### Task 4: Aplicar formatação Prettier em todo o código

**Files:**
- Modify: arquivos em `src/`, `tests/`, e `package.json` (formatado pelo Prettier)

- [ ] **Step 1: Rodar `npm run format`**

Run: `npm run format`
Expected: lista de arquivos reformatados. Sem erros.

- [ ] **Step 2: Rodar `npm run format:check` para confirmar**

Run: `npm run format:check`
Expected: exit 0, "All matched files use Prettier code style!"

- [ ] **Step 3: Rodar `npm run build` e `npm test` para garantir que nada quebrou**

Run:
```bash
npm run build && npm test 2>&1 | tail -20
```

Expected: build verde, 12/12 testes passam (cobertura pode ainda estar em 99.28% — não é objetivo dessa task).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "style: apply Prettier formatting"
```

---

### Task 5: Remover `any` de `client.ts` e `types.ts`

**Files:**
- Modify: `src/client.ts:22, 47, 82, 251, 379`
- Modify: `src/types.ts` (campos `any[]` e `any`)

Contexto: `client.ts` tem 4 ocorrências de `any`:
- linha 22: `bodyObj: any` em `buildSoapEnvelope`
- linha 47: `params: any = {}` em `request<TReturn>`
- linha 82: `item: any` em `parseItem`
- linha 251: `Promise<any[]>` em `enviarParametrizacaoTelemetria`
- linha 379: `Promise<any>` em `solicitarEventosCaixaPreta`

`types.ts` tem `any[]` em:
- `MacroTd50TmcdDetalhado.listaLayout`, `listaVeiculos`
- `PacotePosicaoXML.eventoSequenciamento`, `evento`, `eventosTelemetria`, `acessorios`
- `PacotePosicaoJSON.eventoSequenciamento`
- `PositionPacketJSON.sequencingEvent`, `events`, `telemetryEvents`

- [ ] **Step 1: Adicionar tipo `SoapBody` em `src/types.ts` no topo (após `SascarCredentials`)**

oldString em `src/types.ts:1-4`:
```typescript
export interface SascarCredentials {
  usuario?: string;
  senha?: string;
}
```

newString (substitui o bloco acima):
```typescript
export interface SascarCredentials {
  usuario?: string;
  senha?: string;
}

/**
 * Tipo para o corpo de uma requisição SOAP.
 * Cada chave é um parâmetro da operação e o valor é o dado enviado.
 */
export type SoapBody = Record<string, unknown>;
```

- [ ] **Step 2: Substituir `any` em `buildSoapEnvelope`**

oldString em `src/client.ts:22`:
```typescript
  private buildSoapEnvelope(methodName: string, bodyObj: any): string {
```

newString:
```typescript
  private buildSoapEnvelope(methodName: string, bodyObj: T.SoapBody): string {
```

- [ ] **Step 3: Substituir `any` em `request<TReturn>`**

oldString em `src/client.ts:47`:
```typescript
  private async request<TReturn>(methodName: string, params: any = {}, isPositionMethod = false): Promise<TReturn> {
```

newString:
```typescript
  private async request<TReturn>(methodName: string, params: T.SoapBody = {}, isPositionMethod = false): Promise<TReturn> {
```

- [ ] **Step 4: Substituir `any` em `parseItem`**

oldString em `src/client.ts:82-89`:
```typescript
      // JSON parses nested strings
      const parseItem = (item: any) => {
        if (typeof item === 'string' && (item.trim().startsWith('{') || item.trim().startsWith('['))) {
          try {
              return JSON.parse(item);
          } catch(e) {}
        }
        return item;
      };
```

newString:
```typescript
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
```

- [ ] **Step 5: Tipar retorno de `enviarParametrizacaoTelemetria` com tipo dedicado**

Criar em `src/types.ts`, antes do bloco de importações não há, então adicionamos ao final (após `ParametrizacaoTelemetria`):

oldString em `src/client.ts:251`:
```typescript
  async enviarParametrizacaoTelemetria(idVeiculo: number, params: T.ParametrizacaoTelemetria): Promise<any[]> {
    return this.request<any[]>('enviarParametrizacaoTelemetria', { idVeiculo, telemetriaParametrizacao: params });
  }
```

newString em `src/client.ts:251`:
```typescript
  async enviarParametrizacaoTelemetria(
    idVeiculo: number,
    params: T.ParametrizacaoTelemetria
  ): Promise<T.LogComando[]> {
    return this.request<T.LogComando[]>('enviarParametrizacaoTelemetria', {
      idVeiculo,
      telemetriaParametrizacao: params
    });
  }
```

- [ ] **Step 6: Tipar retorno de `solicitarEventosCaixaPreta`**

oldString em `src/client.ts:379-381`:
```typescript
  async solicitarEventosCaixaPreta(idVeiculo?: number, placa?: string, dataPosicaoInicial?: string, dataPosicaoFinal?: string): Promise<any> {
    return this.request<any>('solicitarEventosCaixaPreta', { idVeiculo, placa, dataPosicaoInicial, dataPosicaoFinal });
  }
```

newString:
```typescript
  async solicitarEventosCaixaPreta(
    idVeiculo?: number,
    placa?: string,
    dataPosicaoInicial?: string,
    dataPosicaoFinal?: string
  ): Promise<T.CaixaPretaSolicitacao> {
    return this.request<T.CaixaPretaSolicitacao>('solicitarEventosCaixaPreta', {
      idVeiculo,
      placa,
      dataPosicaoInicial,
      dataPosicaoFinal
    });
  }
```

- [ ] **Step 7: Adicionar tipo `CaixaPretaSolicitacao` em `src/types.ts`**

Adicionar ao final de `src/types.ts` (após a interface `ParametrizacaoTelemetria`):

```typescript
/**
 * Resposta de `solicitarEventosCaixaPreta`. A Sascar não documenta o
 * formato exato (operação marcada como @deprecated), portanto o tipo
 * é permissivo.
 */
export interface CaixaPretaSolicitacao {
  protocolo?: string;
  mensagem?: string;
  dataSolicitacao?: string;
}
```

- [ ] **Step 8: Rodar `npm run typecheck` e `npm run lint`**

Run:
```bash
npm run typecheck && npm run lint
```

Expected: typecheck verde. Lint pode acusar `any` em `src/types.ts` (passos seguintes). Se o typecheck quebrar em outro lugar, ajustar antes de prosseguir.

- [ ] **Step 9: Substituir `any[]` em `types.ts` por tipos mais específicos**

Em `src/types.ts`:

oldString (linhas 261-262):
```typescript
  listaLayout: any[];
  listaVeiculos: any[];
```
newString:
```typescript
  listaLayout: string[];
  listaVeiculos: T.Veiculo[];
```

oldString (linha 101, `PacotePosicaoXML`):
```typescript
  eventoSequenciamento?: any[];
  evento?: any[];
```
newString:
```typescript
  eventoSequenciamento?: T.SequenciamentoEvento[];
  evento?: T.PosicaoEvento[];
```

oldString (linha 110):
```typescript
  eventosTelemetria?: any[];
  acessorios?: any;
```
newString:
```typescript
  eventosTelemetria?: T.EventoTelemetria[];
  acessorios?: T.AcessorioVeiculo;
```

oldString (linha 166, `PacotePosicaoJSON`):
```typescript
  eventoSequenciamento: any[];
```
newString:
```typescript
  eventoSequenciamento: T.SequenciamentoEvento[];
```

oldString (linhas 233-234, `PositionPacketJSON`):
```typescript
  sequencingEvent?: any[];
  events?: any[];
```
newString:
```typescript
  sequencingEvent?: T.SequenciamentoEvento[];
  events?: T.PosicaoEvento[];
```

oldString (linha 244):
```typescript
  telemetryEvents?: any[];
```
newString:
```typescript
  telemetryEvents?: T.EventoTelemetria[];
```

- [ ] **Step 10: Adicionar tipos auxiliares `PosicaoEvento` e `AcessorioVeiculo` em `types.ts`**

Adicionar ao final de `src/types.ts` (após `CaixaPretaSolicitacao`):

```typescript
/**
 * Evento atômico registrado em um pacote de posição.
 */
export interface PosicaoEvento {
  codigo: number;
  descricao?: string;
  dataHora?: string;
}

/**
 * Estado de acessórios do veículo no momento da posição.
 * Estrutura flexível porque o manual não padroniza o conteúdo.
 */
export interface AcessorioVeiculo {
  [chave: string]: string | number | boolean | null;
}
```

- [ ] **Step 11: Rodar `npm run typecheck` e `npm run lint`**

Run:
```bash
npm run typecheck && npm run lint
```

Expected: typecheck verde. Lint verde para `client.ts`. Em `types.ts` pode haver warnings de organização (vão sumir ao reformatar com prettier).

- [ ] **Step 12: Rodar `npm run format` para garantir consistência**

Run: `npm run format`

- [ ] **Step 13: Rodar build + testes**

Run:
```bash
npm run build && npm test 2>&1 | tail -20
```

Expected: build verde, 12/12 testes passam.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "refactor(types): replace any with concrete types in client.ts and types.ts"
```

---

### Task 6: Padronizar nomenclatura — remover `dist/` e validar o que é `get*` (EN)

**Files:**
- Modify: `src/client.ts` (manter EN aliases documentados, ou renomear — decisão: manter, marcar como deprecated)

Contexto: Há 5 métodos com nomes em inglês: `getPositionsPacketJSON`, `getDriverPositionPacketJSON`, `getPositionPacketByRangeJSON`, `getDriverPositionPacketByRangeJSON`, `getPositionPacketWithLicensePlateJSON`. Estes são aliases de operações SOAP que o backend chama em inglês.

Decisão: **manter** os nomes em inglês (são aliases oficiais do SOAP backend) e adicionar JSDoc em PT explicando isso. **Não renomear** para evitar breaking change.

- [ ] **Step 1: Adicionar JSDoc acima de cada método `get*` em `client.ts`**

oldString em `src/client.ts:317`:
```typescript
  async getPositionsPacketJSON(quantity = 3000): Promise<T.PositionPacketJSON[]> {
```
newString:
```typescript
  /**
   * Alias em inglês do método `obterPacotePosicoesJSON`. Mantido
   * para compatibilidade com a nomenclatura original do WSDL.
   */
  async getPositionsPacketJSON(quantity = 3000): Promise<T.PositionPacketJSON[]> {
```

oldString em `src/client.ts:321`:
```typescript
  async getDriverPositionPacketJSON(quantity = 3000): Promise<T.PositionPacketJSON[]> {
```
newString:
```typescript
  /**
   * Alias em inglês do método `obterPacotePosicoesMotoristaJSON`.
   */
  async getDriverPositionPacketJSON(quantity = 3000): Promise<T.PositionPacketJSON[]> {
```

oldString em `src/client.ts:325`:
```typescript
  async getPositionPacketByRangeJSON(startId: number, endId: number, quantity = 3000): Promise<T.PositionPacketJSON[]> {
```
newString:
```typescript
  /**
   * Alias em inglês do método `obterPacotePosicaoPorRangeJSON`.
   */
  async getPositionPacketByRangeJSON(startId: number, endId: number, quantity = 3000): Promise<T.PositionPacketJSON[]> {
```

oldString em `src/client.ts:329`:
```typescript
  async getDriverPositionPacketByRangeJSON(startId: number, endId: number, quantity = 3000): Promise<T.PositionPacketJSON[]> {
```
newString:
```typescript
  /**
   * Alias em inglês do método `obterPacotePosicaoMotoristaPorRangeJSON`.
   */
  async getDriverPositionPacketByRangeJSON(startId: number, endId: number, quantity = 3000): Promise<T.PositionPacketJSON[]> {
```

oldString em `src/client.ts:333`:
```typescript
  async getPositionPacketWithLicensePlateJSON(quantity = 3000): Promise<T.PositionPacketJSON[]> {
```
newString:
```typescript
  /**
   * Alias em inglês do método `obterPacotePosicoesJSONComPlaca`.
   */
  async getPositionPacketWithLicensePlateJSON(quantity = 3000): Promise<T.PositionPacketJSON[]> {
```

- [ ] **Step 2: Adicionar JSDoc explicando a estratégia ao topo de `client.ts`**

oldString em `src/client.ts:1-5`:
```typescript
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { AsyncQueue } from './queue';
import { SascarConnectionError, SascarApiError } from './errors';
import * as T from './types';

export class SascarClient {
```

newString:
```typescript
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { AsyncQueue } from './queue';
import { SascarConnectionError, SascarApiError } from './errors';
import * as T from './types';

/**
 * Cliente SOAP para o WebService SasIntegra v2.07 da Sascar/Michelin.
 *
 * Nomenclatura: métodos em PT (`obter*`) são a forma canônica.
 * Métodos em inglês (`get*`) são aliases mantidos por compatibilidade
 * com a nomenclatura do WSDL e operações SOAP oficiais.
 */
export class SascarClient {
```

- [ ] **Step 3: Rodar `npm run build && npm test`**

Run:
```bash
npm run build && npm test 2>&1 | tail -20
```

Expected: 12/12 testes passam, sem regressões.

- [ ] **Step 4: Commit**

```bash
git add src/client.ts
git commit -m "docs(client): document PT/EN naming convention in JSDoc"
```

---

### Task 7: Atingir 100% de cobertura de testes

**Files:**
- Modify: `tests/client.spec.ts`

Contexto: a linha 156 de `client.ts` é o caminho de "última página" em `obterVeiculosJson` — quando a Sascar devolve uma página cheia mas o usuário pede mais e não há mais dados. Atualmente o teste `obterVeiculosJson` cobre 3 páginas (1ª cheia, 2ª cheia, 3ª vazia) mas não cobre o caso "última página parcial" (length < quantidade mas > 0).

- [ ] **Step 1: Adicionar novo teste em `client.spec.ts` cobrindo a linha 156**

Inserir ao final do describe `'SascarClient'`, antes do `}` final (logo após o teste de paginação existente):

oldString em `tests/client.spec.ts:130` (final do teste de paginação):
```typescript
    const secondCallBody = (global.fetch as jest.Mock).mock.calls[1][1].body;
    expect(secondCallBody).toContain('<vehicleId>2</vehicleId>');
  });
```

newString (substitui o trecho acima):
```typescript
    const secondCallBody = (global.fetch as jest.Mock).mock.calls[1][1].body;
    expect(secondCallBody).toContain('<vehicleId>2</vehicleId>');
  });

  it('deve parar a paginação quando a última página for parcial (length < quantidade)', async () => {
    const page1 = `
      <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><ns0:getVehiclesJSONResponse>
        <return>{"idVeiculo": 1}</return>
        <return>{"idVeiculo": 2}</return>
        <return>{"idVeiculo": 3}</return>
      </ns0:getVehiclesJSONResponse></S:Body></S:Envelope>
    `;
    const page2 = `
      <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><ns0:getVehiclesJSONResponse>
        <return>{"idVeiculo": 4}</return>
      </ns0:getVehiclesJSONResponse></S:Body></S:Envelope>
    `;
    mockFetchSuccess(page1);
    mockFetchSuccess(page2);

    const client = new SascarClient();
    const result = await client.obterVeiculosJson(3);

    expect(result).toHaveLength(4);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
```

- [ ] **Step 2: Rodar `npm test` e verificar cobertura 100%**

Run:
```bash
npm test 2>&1 | tail -20
```

Expected: cobertura 100% em todos os arquivos. `Tests: 13 passed`.

- [ ] **Step 3: Commit**

```bash
git add tests/client.spec.ts
git commit -m "test(client): add partial-last-page coverage for obterVeiculosJson"
```

---

### Task 8: Atualizar `.gitattributes` (manter como está — não há `.editorconfig`)

**Files:** nenhum

- [ ] **Step 1: Verificar `.gitattributes`**

O `.gitattributes` atual é:
```
# Auto detect text files and perform LF normalization
* text=auto
```

- [ ] **Step 2: Decidir — manter como está (sem mudanças)**

Decisão: manter. LF normalization já está configurado. **Não criar `.editorconfig`** — fora de escopo F1 (decisão do design).

- [ ] **Step 3: Marcar como concluído**

Sem commit. Marcar checkbox.

---

### Task 9: Validação final e relatório da F1

**Files:**
- Create: `docs/audit-report-f1.md` (relatório de execução da fase)

- [ ] **Step 1: Rodar pipeline completo: build + lint + typecheck + test**

Run:
```bash
npm run build && npm run lint && npm run typecheck && npm test 2>&1 | tail -20
```

Expected: tudo verde, 13/13 testes, cobertura 100%.

- [ ] **Step 2: Escrever `docs/audit-report-f1.md`**

Conteúdo:
```markdown
# F1 — Higiene — Relatório de Execução

**Data:** 2026-06-09
**Fase:** F1 (Higiene de Código & Tipos)

## Baseline → Estado final

| Métrica | Antes | Depois |
|---------|-------|--------|
| `npm run build` | ✅ verde | ✅ verde |
| `npm run lint` | ❌ sem config | ✅ verde |
| `npm run typecheck` | ❌ script inexistente | ✅ verde |
| `npm test` cobertura | 99.28% (linha 156) | 100% |
| Testes | 12 passando | 13 passando |
| `any` em código de produção | 5 | 0 |
| `any[]` em `types.ts` | 8 | 0 |
| Scripts npm | 5 | 9 |
| `.gitignore` | ausente | presente |
| `dist/` no git | sim | removido |

## Mudanças aplicadas

1. `.gitignore` criado; `dist/` e `coverage/` untracked.
2. Scripts adicionados: `typecheck`, `lint:fix`, `format`, `format:check`.
3. ESLint 8 + `@typescript-eslint` + Prettier 3 configurados.
4. Prettier aplicado em todo o código.
5. `any` removidos de `client.ts` (5 ocorrências → 0) e `types.ts` (8 ocorrências → 0).
6. Tipos auxiliares adicionados: `SoapBody`, `CaixaPretaSolicitacao`, `PosicaoEvento`, `AcessorioVeiculo`.
7. JSDoc adicionada explicando padrão PT/EN de nomenclatura.
8. Teste novo cobrindo paginação parcial em `obterVeiculosJson`.

## Itens conhecidos (não corrigidos nesta fase)

- Decisão de manter métodos `get*` (EN) como aliases. Migrar consumidores para `obter*` é uma decisão de roadmap fora do escopo F1.
- Credenciais de exemplo placeholder no README (`"foo"`, `"bar"`) — corrigido na F5 (docs).

## Próxima fase

F3 (Robustez do cliente SOAP) — timeout, retry, tratamento de Fault tipado.
```

- [ ] **Step 3: Commit final da F1**

```bash
git add docs/audit-report-f1.md
git commit -m "docs(audit): F1 completion report"
```

- [ ] **Step 4: Verificar `git log` das últimas 10 entradas**

Run: `git log --oneline -10`
Expected: cada task gerou 1 commit, mensagens seguem conventional commits.

---

## Critérios de aceite da F1 (verificar antes de pedir aprovação)

- [ ] `npm run build` — exit 0
- [ ] `npm run lint` — exit 0, sem warnings
- [ ] `npm run typecheck` — exit 0
- [ ] `npm test` — 13/13 testes, cobertura 100% (statements, branches, functions, lines)
- [ ] Zero `any` em `src/`
- [ ] `dist/` e `coverage/` fora do git
- [ ] README e API pública: **inalterados** (zero breaking changes)
