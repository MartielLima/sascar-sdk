# SascarXmlRpcClient Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um módulo XML-RPC completo (34 comandos + 5 helpers) ao lado do módulo SOAP existente, permitindo bloquear/desbloquear veículos e enviar todos os outros comandos remotos do manual Sascar v3.5.

**Architecture:** Novo módulo `src/xmlrpc/` com classe `SascarXmlRpcClient` paralela à `SascarClient` (SOAP). Reusa `SascarCredentials`, `SascarApiError` (via subclasse), `AsyncQueue`. Transport HTTP próprio com mesma política de retry/timeout do SOAP. Envelope e parser isolados para testabilidade. Fixtures XML em `tests/__fixtures__/xmlrpc/`.

**Tech Stack:** TypeScript 5.3, Jest 29, fast-xml-parser 4.3 (já em uso), `fetch` nativo (Node 18+), `nock` 14 (já em uso para SOAP). Sem dependências novas.

**Spec:** `docs/superpowers/specs/2026-06-17-sascar-xmlrpc-client-design.md`

**Working directory:** Raiz do repositório (`/home/martiel/GitHub/sascar-sdk`).

---

## Convenções

- Todo arquivo em `src/xmlrpc/` é novo. Não modificar `src/client.ts`, `src/types.ts`, `src/errors.ts`, `src/queue.ts`, `src/index.ts` exceto quando explicitamente indicado.
- Cada task termina com um commit `git commit -m "..."`.
- Antes de cada commit, rodar `npm run lint && npm run typecheck && npm test` e garantir zero falhas.
- Padrão de teste: arquivos em `tests/xmlrpc/`, fixtures em `tests/__fixtures__/xmlrpc/`.
- Para mockar HTTP, usar `nock` (já está nas devDeps, vide `tests/integration/_helpers.ts`).
- ESLint: zero `any` explícito, zero `// @ts-ignore`, zero `console.log` em produção.
- Mensagens de commit em PT-BR (padrão atual do projeto).

---

## Task 1: Estrutura de diretórios + erros

**Files:**
- Create: `src/xmlrpc/errors.ts`
- Test: `tests/xmlrpc/errors.spec.ts`

- [ ] **Step 1: Criar diretórios**

```bash
mkdir -p src/xmlrpc tests/xmlrpc tests/__fixtures__/xmlrpc
```

- [ ] **Step 2: Escrever o teste da classe de erro**

`tests/xmlrpc/errors.spec.ts`:

```typescript
import { SascarXmlRpcError } from '../../src/xmlrpc/errors';
import { SascarApiError } from '../../src/errors';

describe('SascarXmlRpcError', () => {
  it('estende SascarApiError para catching unificado', () => {
    const err = new SascarXmlRpcError('falhou', 'bloqueio', {
      faultCode: -1,
      faultString: 'erro'
    });
    expect(err).toBeInstanceOf(SascarApiError);
    expect(err.name).toBe('SascarXmlRpcError');
    expect(err.message).toBe('falhou');
    expect(err.methodName).toBe('bloqueio');
    expect(err.rawFault).toEqual({ faultCode: -1, faultString: 'erro' });
  });

  it('aceita rawFault undefined', () => {
    const err = new SascarXmlRpcError('falhou', 'desbloqueio');
    expect(err.rawFault).toBeUndefined();
  });
});
```

- [ ] **Step 3: Rodar teste e confirmar que falha**

Run: `npm test -- tests/xmlrpc/errors.spec.ts`
Expected: FAIL com "Cannot find module '../../src/xmlrpc/errors'"

- [ ] **Step 4: Implementar a classe de erro**

`src/xmlrpc/errors.ts`:

```typescript
import { SascarApiError } from '../errors';

export interface XmlRpcFault {
  faultCode: number;
  faultString: string;
}

/**
 * Lançado para erros específicos do XML-RPC (fault, método desconhecido, etc).
 * Estende SascarApiError para permitir `try/catch` unificado entre SOAP e XML-RPC.
 */
export class SascarXmlRpcError extends SascarApiError {
  constructor(
    message: string,
    public readonly methodName: string,
    public readonly rawFault?: XmlRpcFault
  ) {
    super(message);
    this.name = 'SascarXmlRpcError';
  }
}
```

- [ ] **Step 5: Rodar teste e confirmar que passa**

Run: `npm test -- tests/xmlrpc/errors.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/xmlrpc/ tests/xmlrpc/
git commit -m "feat(xmlrpc): adicionar SascarXmlRpcError e estrutura de diretórios"
```

---

## Task 2: Tipos de retorno

**Files:**
- Create: `src/xmlrpc/types.ts`
- Test: `tests/xmlrpc/types.spec.ts`

- [ ] **Step 1: Escrever os testes de tipo (smoke tests via type-only imports)**

`tests/xmlrpc/types.spec.ts`:

```typescript
import type {
  XmlRpcCommandResult,
  XmlRpcOperacaoResult,
  XmlRpcPosicaoResult,
  XmlRpcSenhaResult,
  ComandoEnviado,
  ComandoStatus,
  ComandoStatusFinal
} from '../../src/xmlrpc/types';

describe('xmlrpc types - shape compile-time', () => {
  it('XmlRpcCommandResult aceita os campos obrigatórios', () => {
    const r: XmlRpcCommandResult = {
      resultados: { 2248181: '1' },
      ticketServidor: 12345,
      placasProcessadas: ['ABC1D23']
    };
    expect(r.ticketServidor).toBe(12345);
    expect(r.resultados[2248181]).toBe('1');
  });

  it('XmlRpcOperacaoResult estende CommandResult com mensagens', () => {
    const r: XmlRpcOperacaoResult = {
      resultados: { 1: '2' },
      ticketServidor: 99,
      placasProcessadas: ['AAA1111'],
      mensagens: { AAA1111: 'Veiculo nao pertence a gerenciadora' }
    };
    expect(r.mensagens.AAA1111).toContain('gerenciadora');
  });

  it('XmlRpcPosicaoResult aceita campos variáveis em extras', () => {
    const r: XmlRpcPosicaoResult = {
      idVeiculo: 2248181,
      dataPosicao: '2026-06-17 12:00:00',
      dataPacote: '2026-06-17 12:00:00',
      latitude: -23.5,
      longitude: -46.6,
      direcao: 4,
      velocidade: 80,
      ignicao: 1,
      extras: { saida1: 240, tensao: 24 }
    };
    expect(r.extras.saida1).toBe(240);
  });

  it('XmlRpcSenhaResult estende CommandResult com senha', () => {
    const r: XmlRpcSenhaResult = {
      resultados: {},
      ticketServidor: 0,
      placasProcessadas: [],
      senha: '123456'
    };
    expect(r.senha).toHaveLength(6);
  });

  it('ComandoEnviado tem todos os campos', () => {
    const c: ComandoEnviado = {
      dataEnvio: '06/17/2026 12:00',
      methodName: 'bloqueio',
      parametros: { placa: 'ABC1D23' },
      status: 1,
      statusDescricao: 'COMANDO_EXECUTADO',
      ticketServidor: 999
    };
    expect(c.statusDescricao).toBe('COMANDO_EXECUTADO');
  });

  it('ComandoStatus permite mensagem opcional', () => {
    const s: ComandoStatus = {
      ticket: 1,
      dataExecucao: '06/17/2026 12:00',
      status: 2,
      statusDescricao: 'COMANDO_RECUSADO',
      mensagem: 'falhou'
    };
    expect(s.mensagem).toBe('falhou');
  });

  it('ComandoStatusFinal aceita apenas status 1 ou 2', () => {
    const ok: ComandoStatusFinal = {
      ticket: 1,
      status: 1,
      statusDescricao: 'COMANDO_EXECUTADO',
      tentativas: 3,
      duracaoMs: 5500
    };
    expect(ok.status).toBe(1);

    const fail: ComandoStatusFinal = {
      ticket: 1,
      status: 2,
      statusDescricao: 'COMANDO_RECUSADO',
      tentativas: 5,
      duracaoMs: 15000
    };
    expect(fail.status).toBe(2);
  });
});
```

- [ ] **Step 2: Rodar teste e confirmar que falha**

Run: `npm test -- tests/xmlrpc/types.spec.ts`
Expected: FAIL com "Cannot find module '../../src/xmlrpc/types'"

- [ ] **Step 3: Implementar os tipos**

`src/xmlrpc/types.ts`:

```typescript
/** Resultado padrão da maioria dos comandos XML-RPC. */
export interface XmlRpcCommandResult {
  /** idVeiculo → code string ("1".."7", vide tabela 2.4.1 do manual). */
  resultados: Record<number, string>;
  /** Ticket interno do servidor. */
  ticketServidor: number;
  /** Placas efetivamente processadas. */
  placasProcessadas: string[];
}

/** Variante para inicializar/finalizar_operacao e vincular_rota. */
export interface XmlRpcOperacaoResult extends XmlRpcCommandResult {
  /** Mensagens de erro por placa (geralmente presentes quando code=2). */
  mensagens: Record<string, string>;
}

/** Variante do método posicao(). */
export interface XmlRpcPosicaoResult {
  idVeiculo: number;
  dataPosicao: string;
  dataPacote: string;
  latitude: number;
  longitude: number;
  direcao: number;
  velocidade: number;
  ignicao: number;
  /** Campos variáveis conforme tipo de equipamento (MTC/LMU/MSC). */
  extras: Record<string, string | number>;
}

/** Variante dos métodos gerar_contra_senha*. */
export interface XmlRpcSenhaResult extends XmlRpcCommandResult {
  /** Senha gerada (6 dígitos). */
  senha: string;
}

/** Item de listar_comandos. */
export interface ComandoEnviado {
  dataEnvio: string;
  methodName: string;
  parametros: Record<string, string>;
  status: number;
  statusDescricao: string;
  ticketServidor: number;
}

/** Status de um comando, retornado por status_ticket. */
export interface ComandoStatus {
  ticket: number;
  dataExecucao: string;
  status: number;
  statusDescricao: string;
  mensagem?: string;
}

/** Retorno convergente de aguardarComando. */
export interface ComandoStatusFinal {
  ticket: number;
  status: 1 | 2;
  statusDescricao: string;
  tentativas: number;
  duracaoMs: number;
}

/** Tipo dos parâmetros aceitos por buildMethodCall. */
export type XmlRpcParam = string | number | boolean | string[] | number[];

/** URL dos endpoints XML-RPC. */
export const XMLRPC_URLS = {
  comando: 'https://xmlrpc.sascar.com.br/xmlrpc/comando',
  operacao: 'https://xmlrpc.sascar.com.br/xmlrpc/operacao'
} as const;
```

- [ ] **Step 4: Rodar teste e confirmar que passa**

Run: `npm test -- tests/xmlrpc/types.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/xmlrpc/types.ts tests/xmlrpc/types.spec.ts
git commit -m "feat(xmlrpc): adicionar tipos de retorno e constantes de URL"
```

---

## Task 3: Envelope (buildMethodCall)

**Files:**
- Create: `src/xmlrpc/envelope.ts`
- Test: `tests/xmlrpc/envelope.spec.ts`

- [ ] **Step 1: Escrever os testes do envelope**

`tests/xmlrpc/envelope.spec.ts`:

```typescript
import { buildMethodCall } from '../../src/xmlrpc/envelope';

describe('buildMethodCall', () => {
  it('monta <methodCall> com methodName, params struct, login e password', () => {
    const xml = buildMethodCall('bloqueio', [], 'user', 'pass');
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<methodCall>');
    expect(xml).toContain('<methodName>bloqueio</methodName>');
    expect(xml).toContain('<params>');
    expect(xml).toContain('<name>login</name>');
    expect(xml).toContain('<value><string>user</string></value>');
    expect(xml).toContain('<name>password</name>');
    expect(xml).toContain('<value><string>pass</string></value>');
    expect(xml).toContain('<name>placa</name>');
  });

  it('serializa string em <value><string>', () => {
    const xml = buildMethodCall('texto', ['ABC1D23', 'hello world'], 'u', 'p');
    expect(xml).toContain('<value><string>ABC1D23</string></value>');
    expect(xml).toContain('<value><string>hello world</string></value>');
  });

  it('serializa number em <value><int>', () => {
    const xml = buildMethodCall('bloqueio', [2248181], 'u', 'p');
    expect(xml).toContain('<value><int>2248181</int></value>');
  });

  it('serializa boolean em <value><boolean>', () => {
    const xml = buildMethodCall('modoSeguro', [2248181, true], 'u', 'p');
    expect(xml).toContain('<value><boolean>1</boolean></value>');
  });

  it('serializa array de inteiros em <value><array><data>', () => {
    const xml = buildMethodCall('inibir_sensor', [2248181, [231, 241, 248], 1], 'u', 'p');
    expect(xml).toContain('<value><array><data>');
    expect(xml).toContain('<value><int>231</int></value>');
    expect(xml).toContain('<value><int>241</int></value>');
    expect(xml).toContain('<value><int>248</int></value>');
    expect(xml).toContain('</data></array></value>');
  });

  it('escapa caracteres XML perigosos em strings', () => {
    const xml = buildMethodCall('texto', ['ABC&<>"D23', 'msg'], 'u', 'p');
    expect(xml).toContain('ABC&amp;&lt;&gt;&quot;D23');
  });
});
```

- [ ] **Step 2: Rodar teste e confirmar que falha**

Run: `npm test -- tests/xmlrpc/envelope.spec.ts`
Expected: FAIL

- [ ] **Step 3: Implementar buildMethodCall**

`src/xmlrpc/envelope.ts`:

```typescript
import type { XmlRpcParam } from './types';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function serializeValue(param: XmlRpcParam): string {
  if (typeof param === 'string') {
    return `<value><string>${escapeXml(param)}</string></value>`;
  }
  if (typeof param === 'number') {
    if (Number.isInteger(param)) {
      return `<value><int>${param}</int></value>`;
    }
    return `<value><double>${param}</double></value>`;
  }
  if (typeof param === 'boolean') {
    return `<value><boolean>${param ? 1 : 0}</boolean></value>`;
  }
  if (Array.isArray(param)) {
    const items = param.map((p) => serializeValue(p)).join('');
    return `<value><array><data>${items}</data></array></value>`;
  }
  throw new Error(`Tipo de parâmetro XML-RPC não suportado: ${typeof param}`);
}

/**
 * Constrói um <methodCall>...</methodCall> XML-RPC.
 *
 * O array `params` é serializado como membros de um <struct> (uma posição por item).
 * As credenciais `login` e `password` são adicionadas como primeiros membros do struct
 * (conforme manual Sascar seção 2.4). O `placa` (primeiro item do params) é incluído
 * como membro nomeado para comandos que esperam esse campo.
 */
export function buildMethodCall(
  methodName: string,
  params: XmlRpcParam[],
  login: string,
  password: string
): string {
  const structMembers: string[] = [
    `<member><name>login</name><value><string>${escapeXml(login)}</string></value></member>`,
    `<member><name>password</name><value><string>${escapeXml(password)}</string></value></member>`
  ];

  if (params.length > 0) {
    structMembers.push(
      `<member><name>placa</name>${serializeValue(params[0])}</member>`
    );
  }

  // Demais params são empacotados em um array "configuracao" (padrão para inibir_sensor, atuador)
  // e em pares chave-valor para o resto. Aqui usamos um único array "params" para máxima
  // compatibilidade com o manual.
  for (let i = 1; i < params.length; i++) {
    structMembers.push(
      `<member><name>param${i}</name>${serializeValue(params[i])}</member>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
  <methodName>${escapeXml(methodName)}</methodName>
  <params>
    <param>
      <value>
        <struct>
          ${structMembers.join('\n          ')}
        </struct>
      </value>
    </param>
  </params>
</methodCall>`;
}
```

- [ ] **Step 4: Rodar teste e confirmar que passa**

Run: `npm test -- tests/xmlrpc/envelope.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/xmlrpc/envelope.ts tests/xmlrpc/envelope.spec.ts
git commit -m "feat(xmlrpc): implementar buildMethodCall com escape XML"
```

---

## Task 4: Parser (parseMethodResponse + parseMethodFault)

**Files:**
- Create: `src/xmlrpc/parser.ts`
- Test: `tests/xmlrpc/parser.spec.ts`
- Create: `tests/__fixtures__/xmlrpc/bloqueio-success.xml`
- Create: `tests/__fixtures__/xmlrpc/listar-comandos.xml`
- Create: `tests/__fixtures__/xmlrpc/fault.xml`

- [ ] **Step 1: Criar fixtures de exemplo**

`tests/__fixtures__/xmlrpc/bloqueio-success.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodResponse>
  <params>
    <param>
      <value>
        <struct>
          <member>
            <name>2248181</name>
            <value><int>1</int></value>
          </member>
          <member>
            <name>ticketServidor</name>
            <value><int>99999</int></value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodResponse>
```

`tests/__fixtures__/xmlrpc/listar-comandos.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodResponse>
  <params>
    <param>
      <value>
        <array>
          <data>
            <value>
              <struct>
                <member><name>methodName</name><value><string>bloqueio</string></value></member>
                <member><name>dataEnvio</name><value><string>06/17/2026 12:00</string></value></member>
                <member><name>status</name><value><int>1</int></value></member>
                <member><name>statusDescricao</name><value><string>COMANDO_EXECUTADO</string></value></member>
                <member><name>ticketServidor</name><value><int>12345</int></value></member>
              </struct>
            </value>
          </data>
        </array>
      </value>
    </param>
  </params>
</methodResponse>
```

`tests/__fixtures__/xmlrpc/fault.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodResponse>
  <fault>
    <value>
      <struct>
        <member><name>faultCode</name><value><int>4</int></value></member>
        <member><name>faultString</name><value><string>Erro nos parametros</string></value></member>
      </struct>
    </value>
  </fault>
</methodResponse>
```

- [ ] **Step 2: Escrever os testes do parser**

`tests/xmlrpc/parser.spec.ts`:

```typescript
import { parseMethodResponse, parseMethodFault } from '../../src/xmlrpc/parser';
import { SascarXmlRpcError } from '../../src/xmlrpc/errors';
import * as fs from 'fs';
import * as path from 'path';

const FIXTURES = path.resolve(__dirname, '../__fixtures__/xmlrpc');
const read = (f: string) => fs.readFileSync(path.join(FIXTURES, f), 'utf-8');

describe('parseMethodResponse', () => {
  it('extrai mapa idVeiculo→code e ticketServidor', () => {
    const r = parseMethodResponse(read('bloqueio-success.xml'));
    expect(r.resultados).toEqual({ 2248181: '1' });
    expect(r.ticketServidor).toBe(99999);
  });

  it('extrai array de structs para listar_comandos', () => {
    const r = parseMethodResponse(read('listar-comandos.xml'));
    expect(r.comandos).toHaveLength(1);
    expect(r.comandos[0]).toMatchObject({
      methodName: 'bloqueio',
      status: 1,
      statusDescricao: 'COMANDO_EXECUTADO',
      ticketServidor: 12345
    });
  });

  it('extrai senha quando presente (gerar_contra_senha)', () => {
    const xml = `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>senha</name><value><string>123456</string></value></member>
</struct></value></param></params></methodResponse>`;
    const r = parseMethodResponse(xml);
    expect(r.senha).toBe('123456');
  });

  it('extrai mapa de mensagens (inicializar_operacao recusado)', () => {
    const xml = `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>AAA1111</name><value><int>2</int></value></member>
  <member><name>mensagens</name><value><struct>
    <member><name>AAA1111</name><value><string>Veiculo nao pertence a gerenciadora</string></value></member>
  </struct></value></member>
</struct></value></param></params></methodResponse>`;
    const r = parseMethodResponse(xml);
    expect(r.mensagens.AAA1111).toContain('gerenciadora');
  });

  it('extrai idVeiculo/dataPosicao/lat/long para posicao()', () => {
    const xml = `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>idVeiculo</name><value><int>2248181</int></value></member>
  <member><name>dataPosicao</name><value><string>2026-06-17 12:00:00</string></value></member>
  <member><name>dataPacote</name><value><string>2026-06-17 12:00:00</string></value></member>
  <member><name>latitude</name><value><double>-23.5</double></value></member>
  <member><name>longitude</name><value><double>-46.6</double></value></member>
  <member><name>direcao</name><value><int>4</int></value></member>
  <member><name>velocidade</name><value><int>80</int></value></member>
  <member><name>ignicao</name><value><int>1</int></value></member>
  <member><name>saida1</name><value><int>240</int></value></member>
</struct></value></param></params></methodResponse>`;
    const p = parseMethodResponse(xml);
    expect(p.posicao).toEqual({
      idVeiculo: 2248181,
      dataPosicao: '2026-06-17 12:00:00',
      dataPacote: '2026-06-17 12:00:00',
      latitude: -23.5,
      longitude: -46.6,
      direcao: 4,
      velocidade: 80,
      ignicao: 1
    });
    expect(p.posicao?.extras.saida1).toBe(240);
  });

  it('lança SascarXmlRpcError se a resposta contém <fault>', () => {
    expect(() => parseMethodResponse(read('fault.xml'))).toThrow(SascarXmlRpcError);
  });

  it('retorna ticket null quando ausente', () => {
    const xml = `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
</struct></value></param></params></methodResponse>`;
    const r = parseMethodResponse(xml);
    expect(r.ticketServidor).toBeNull();
  });
});

describe('parseMethodFault', () => {
  it('lança SascarXmlRpcError ao detectar <fault>', () => {
    expect(() => parseMethodFault(read('fault.xml'))).toThrow(SascarXmlRpcError);
  });

  it('não lança quando resposta é válida', () => {
    expect(() => parseMethodFault(read('bloqueio-success.xml'))).not.toThrow();
  });
});
```

- [ ] **Step 3: Rodar teste e confirmar que falha**

Run: `npm test -- tests/xmlrpc/parser.spec.ts`
Expected: FAIL

- [ ] **Step 4: Implementar o parser**

`src/xmlrpc/parser.ts`:

```typescript
import { XMLParser } from 'fast-xml-parser';
import { SascarXmlRpcError, type XmlRpcFault } from './errors';
import type { ComandoEnviado, XmlRpcPosicaoResult } from './types';

const parser = new XMLParser({
  ignoreAttributes: true,
  removeNSPrefix: true,
  parseTagValue: true,
  parseAttributeValue: true
});

export interface ParsedResponse {
  resultados: Record<number, string>;
  ticketServidor: number | null;
  senha: string | null;
  mensagens: Record<string, string>;
  comandos: ComandoEnviado[];
  posicao: XmlRpcPosicaoResult | null;
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function asString(v: unknown): string {
  if (v === undefined || v === null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

function asNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

/**
 * Detecta e lança SascarXmlRpcError se a resposta for um fault XML-RPC.
 */
export function parseMethodFault(xml: string): void {
  const parsed = parser.parse(xml);
  const fault = parsed?.methodResponse?.fault;
  if (!fault) return;

  const struct = fault?.value?.struct?.member;
  const members = asArray(struct);
  let code = 0;
  let str = '';
  for (const m of members) {
    const name = asString(m.name);
    if (name === 'faultCode') code = asNumber(m.value?.int ?? m.value);
    if (name === 'faultString') str = asString(m.value?.string ?? m.value);
  }
  const rawFault: XmlRpcFault = { faultCode: code, faultString: str };
  throw new SascarXmlRpcError(`XML-RPC fault: ${str} (code ${code})`, 'unknown', rawFault);
}

/**
 * Faz o parse da resposta XML-RPC de um comando.
 * Suporta as 4 formas de retorno do manual:
 *  - struct com idVeiculo→code + ticketServidor (comandos padrão)
 *  - struct com senha (gerar_contra_senha*)
 *  - struct com mensagens (inicializar/finalizar_operacao, vincular_rota)
 *  - struct com campos de posicao (método posicao())
 *  - array de structs (listar_comandos, status_ticket)
 */
export function parseMethodResponse(xml: string): ParsedResponse {
  parseMethodFault(xml);
  const parsed = parser.parse(xml);
  const param = parsed?.methodResponse?.params?.param;
  if (!param) {
    return { resultados: {}, ticketServidor: null, senha: null, mensagens: {}, comandos: [], posicao: null };
  }

  const value = param.value;
  const empty: ParsedResponse = {
    resultados: {},
    ticketServidor: null,
    senha: null,
    mensagens: {},
    comandos: [],
    posicao: null
  };

  if (value?.array?.data?.value !== undefined) {
    const items = asArray(value.array.data.value);
    const comandos: ComandoEnviado[] = items.map((item) => {
      const struct = item?.struct ?? {};
      const members = asArray(struct.member);
      const out: Record<string, unknown> = {};
      for (const m of members) {
        out[asString(m.name)] = m.value?.string ?? m.value?.int ?? m.value?.double ?? m.value?.boolean ?? m.value;
      }
      return {
        dataEnvio: asString(out.dataEnvio),
        methodName: asString(out.methodName),
        parametros: typeof out.parametros === 'object' && out.parametros !== null ? (out.parametros as Record<string, string>) : {},
        status: asNumber(out.status),
        statusDescricao: asString(out.statusDescricao),
        ticketServidor: asNumber(out.ticketServidor)
      };
    });
    return { ...empty, comandos };
  }

  if (!value?.struct) return empty;

  const struct = value.struct;
  const members = asArray(struct.member);
  const fields: Record<string, unknown> = {};
  for (const m of members) {
    const name = asString(m.name);
    if (m.value?.struct?.member !== undefined) {
      const subMembers = asArray(m.value.struct.member);
      const sub: Record<string, string> = {};
      for (const sm of subMembers) {
        sub[asString(sm.name)] = asString(sm.value?.string ?? sm.value?.int ?? sm.value);
      }
      fields[name] = sub;
    } else {
      fields[name] = m.value?.string ?? m.value?.int ?? m.value?.double ?? m.value?.boolean ?? m.value;
    }
  }

  // Detecta posicao(): tem idVeiculo/dataPosicao/latitude
  if (fields.idVeiculo !== undefined && fields.latitude !== undefined) {
    const knownKeys = new Set(['idVeiculo', 'dataPosicao', 'dataPacote', 'latitude', 'longitude', 'direcao', 'velocidade', 'ignicao']);
    const extras: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (!knownKeys.has(k)) extras[k] = typeof v === 'number' || typeof v === 'string' ? v : asString(v);
    }
    return {
      ...empty,
      posicao: {
        idVeiculo: asNumber(fields.idVeiculo),
        dataPosicao: asString(fields.dataPosicao),
        dataPacote: asString(fields.dataPacote),
        latitude: asNumber(fields.latitude),
        longitude: asNumber(fields.longitude),
        direcao: asNumber(fields.direcao),
        velocidade: asNumber(fields.velocidade),
        ignicao: asNumber(fields.ignicao),
        extras
      }
    };
  }

  // Caso padrão: mapa idVeiculo→code + ticketServidor
  const resultados: Record<number, string> = {};
  let ticketServidor: number | null = null;
  let senha: string | null = null;
  const mensagens: Record<string, string> = {};

  for (const [k, v] of Object.entries(fields)) {
    if (k === 'ticketServidor') ticketServidor = asNumber(v);
    else if (k === 'senha') senha = asString(v);
    else if (k === 'mensagens' && typeof v === 'object' && v !== null) {
      Object.assign(mensagens, v as Record<string, string>);
    } else if (typeof v === 'number' || typeof v === 'string') {
      const numKey = Number(k);
      if (!Number.isNaN(numKey) && numKey > 0) {
        resultados[numKey] = asString(v);
      }
    }
  }

  return { resultados, ticketServidor, senha, mensagens, comandos: [], posicao: null };
}
```

- [ ] **Step 5: Rodar teste e confirmar que passa**

Run: `npm test -- tests/xmlrpc/parser.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/xmlrpc/parser.ts tests/xmlrpc/parser.spec.ts tests/__fixtures__/xmlrpc/
git commit -m "feat(xmlrpc): implementar parser de methodResponse e fault"
```

---

## Task 5: Transport HTTP com retry/timeout

**Files:**
- Create: `src/xmlrpc/transport.ts`
- Test: `tests/xmlrpc/transport.spec.ts`

- [ ] **Step 1: Escrever os testes do transport**

`tests/xmlrpc/transport.spec.ts`:

```typescript
import nock from 'nock';
import { sendXmlRpcRequest } from '../../src/xmlrpc/transport';
import { SascarApiError, SascarAuthError, SascarConnectionError, SascarRateLimitError, SascarTimeoutError } from '../../src/errors';

const URL = 'https://xmlrpc.sascar.com.br/xmlrpc/comando';

describe('sendXmlRpcRequest', () => {
  afterEach(() => nock.cleanAll());

  it('retorna texto em caso de sucesso (HTTP 200)', async () => {
    nock(URL).post('/').reply(200, '<ok/>', { 'Content-Type': 'text/xml' });
    const result = await sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000 });
    expect(result).toBe('<ok/>');
  });

  it('envia Content-Type text/xml e sem SOAPAction', async () => {
    let headers: Record<string, string> = {};
    nock(URL)
      .post('/', (body) => {
        // acessado via this em uma função de reply abaixo
        return true;
      })
      .reply(function (_uri, _body) {
        headers = this.req.headers as Record<string, string>;
        return [200, '<ok/>'];
      });
    await sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000 });
    expect(headers['content-type']).toContain('text/xml');
    expect(headers['soapaction']).toBeUndefined();
  });

  it('lança SascarAuthError em HTTP 401', async () => {
    nock(URL).post('/').reply(401, '');
    await expect(sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000 })).rejects.toBeInstanceOf(SascarAuthError);
  });

  it('lança SascarAuthError em HTTP 403', async () => {
    nock(URL).post('/').reply(403, '');
    await expect(sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000 })).rejects.toBeInstanceOf(SascarAuthError);
  });

  it('lança SascarRateLimitError em HTTP 429', async () => {
    nock(URL).post('/').reply(429, '');
    await expect(sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000 })).rejects.toBeInstanceOf(SascarRateLimitError);
  });

  it('retenta em HTTP 503 até sucesso', async () => {
    nock(URL).post('/').reply(503, '').post('/').reply(200, '<ok/>');
    const result = await sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000, maxRetries: 3 });
    expect(result).toBe('<ok/>');
  });

  it('desiste após maxRetries e lança SascarApiError', async () => {
    nock(URL).post('/').times(2).reply(503, '');
    await expect(
      sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000, maxRetries: 2 })
    ).rejects.toBeInstanceOf(SascarApiError);
  });

  it('lança SascarConnectionError após esgotar retries em erro de rede', async () => {
    nock(URL).post('/').times(2).replyWithError(new Error('connection refused'));
    await expect(
      sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000, maxRetries: 2 })
    ).rejects.toBeInstanceOf(SascarConnectionError);
  });

  it('lança SascarTimeoutError em timeout (AbortController)', async () => {
    nock(URL)
      .post('/')
      .delay(200)
      .reply(200, '<ok/>');
    await expect(
      sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 50, maxRetries: 1 })
    ).rejects.toBeInstanceOf(SascarTimeoutError);
  });

  it('NÃO retenta em fault XML-RPC (5xx com <fault> no corpo)', async () => {
    nock(URL)
      .post('/')
      .reply(500, '<?xml version="1.0"?><methodResponse><fault><value><struct><member><name>faultCode</name><value><int>4</int></value></member><member><name>faultString</name><value><string>Erro</string></value></member></struct></value></fault></methodResponse>');
    let calls = 0;
    nock.emitter.on('no match', () => calls++);
    await expect(
      sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000, maxRetries: 3 })
    ).rejects.toBeInstanceOf(SascarApiError);
  });
});
```

- [ ] **Step 2: Rodar teste e confirmar que falha**

Run: `npm test -- tests/xmlrpc/transport.spec.ts`
Expected: FAIL

- [ ] **Step 3: Implementar o transport**

`src/xmlrpc/transport.ts`:

```typescript
import {
  SascarApiError,
  SascarAuthError,
  SascarConnectionError,
  SascarRateLimitError,
  SascarTimeoutError
} from '../errors';
import { parseMethodFault } from './parser';
import { SascarXmlRpcError } from './errors';

export interface SendXmlRpcOptions {
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

function computeBackoffMs(attempt: number): number {
  const base = 250 * 2 ** attempt;
  const jitter = 0.8 + Math.random() * 0.4;
  return Math.round(base * jitter);
}

function bodyHasFault(body: string): boolean {
  if (!body) return false;
  return /<fault[\s>]/i.test(body);
}

/**
 * Envia uma requisição XML-RPC e retorna o corpo da resposta.
 * Mesma política de retry/timeout do transport SOAP: 5xx transientes + erros de rede,
 * 401/403/429 imediato, AbortError → timeout.
 * NÃO retenta se o corpo da resposta 5xx contém <fault> (fault aplicacional).
 */
export async function sendXmlRpcRequest(xml: string, options: SendXmlRpcOptions): Promise<string> {
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
          'Content-Type': 'text/xml;charset=UTF-8'
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

      const body = await response.text().catch(() => '');

      if (bodyHasFault(body)) {
        try {
          parseMethodFault(body);
        } catch (faultErr) {
          if (faultErr instanceof SascarXmlRpcError) {
            throw new SascarApiError(
              `HTTP ${status} em ${url} — XML-RPC Fault: ${faultErr.rawFault?.faultString ?? 'unknown'} (${faultErr.rawFault?.faultcode ?? 'n/a'})`,
              { faultcode: String(faultErr.rawFault?.faultCode ?? 0), faultstring: faultErr.rawFault?.faultString ?? '' }
            );
          }
        }
      }

      if (isTransientStatus(status) && attempt < maxRetries - 1) {
        lastError = new SascarApiError(`HTTP ${status} transiente em ${url}`);
        const delay = computeBackoffMs(attempt);
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
        const delay = computeBackoffMs(attempt);
        onRetry?.(attempt + 1, delay);
        await sleep(delay);
        continue;
      }

      throw new SascarConnectionError(`Erro desconhecido em ${url}: ${String(err)}`);
    }
  }

  throw new SascarConnectionError(
    `Falha após ${maxRetries} tentativas em ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}
```

- [ ] **Step 4: Rodar teste e confirmar que passa**

Run: `npm test -- tests/xmlrpc/transport.spec.ts`
Expected: PASS

- [ ] **Step 5: Lint e typecheck**

Run: `npm run lint && npm run typecheck`
Expected: zero warnings/errors

- [ ] **Step 6: Commit**

```bash
git add src/xmlrpc/transport.ts tests/xmlrpc/transport.spec.ts
git commit -m "feat(xmlrpc): transport HTTP com retry/timeout e detecção de fault"
```

---

## Task 6: Esqueleto do SascarXmlRpcClient + categoria "bloqueio"

**Files:**
- Create: `src/xmlrpc/client.ts`
- Test: `tests/xmlrpc/client.spec.ts`
- Create: `tests/integration/xmlrpc/_helpers.ts` (helpers de mock para XML-RPC)
- Modify: `src/xmlrpc/index.ts` (barrel de exports)

- [ ] **Step 1: Criar helpers de teste XML-RPC**

Criar diretório: `mkdir -p tests/integration/xmlrpc`

`tests/integration/xmlrpc/_helpers.ts`:

```typescript
import nock, { type Scope } from 'nock';
import { XMLRPC_URLS } from '../../../src/xmlrpc/types';

export const COMANDO_URL = XMLRPC_URLS.comando;
export const OPERACAO_URL = XMLRPC_URLS.operacao;

/**
 * Mocka resposta XML-RPC bem-sucedida (methodResponse com struct) para `methodName`.
 * O `innerStructXml` é o conteúdo do nó <struct>...</struct>.
 */
export function mockXmlRpcSuccess(methodName: string, innerStructXml: string): Scope {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<methodResponse>
  <params>
    <param>
      <value>
        <struct>
          ${innerStructXml}
        </struct>
      </value>
    </param>
  </params>
</methodResponse>`;
  return nock(COMANDO_URL).post(/.*/).reply(200, xml, { 'Content-Type': 'text/xml;charset=UTF-8' });
}

export function mockXmlRpcOperacaoSuccess(methodName: string, innerStructXml: string): Scope {
  return mockXmlRpcSuccess(methodName, innerStructXml).persist();
  // ^^^ mantém; na verdade cada teste vai sobrescrever. Este helper é apenas um atalho.
}

/**
 * Valida o corpo de uma request XML-RPC:
 * - contém <methodName>X</methodName>
 * - contém <name>login</name><value><string>test_user</string></value>
 * - contém <name>password</name><value><string>test_pass</string></value>
 * - contém <name>placa</name> com o valor esperado
 * - contém tags customizadas esperadas (em `expectParams`)
 */
export function assertXmlRpcBody(
  body: string,
  methodName: string,
  expectedPlaca: string,
  expectParams: string[] = []
): void {
  expect(body).toContain(`<methodName>${methodName}</methodName>`);
  expect(body).toContain('<name>login</name>');
  expect(body).toContain('<value><string>test_user</string></value>');
  expect(body).toContain('<name>password</name>');
  expect(body).toContain('<value><string>test_pass</string></value>');
  expect(body).toContain(`<name>placa</name>`);
  expect(body).toContain(expectedPlaca);
  for (const p of expectParams) {
    expect(body).toContain(p);
  }
}
```

- [ ] **Step 2: Criar esqueleto do client + primeiros métodos (bloqueio, desbloqueio, reset_undo_alarme) + testes**

`src/xmlrpc/client.ts`:

```typescript
import { AsyncQueue } from '../queue';
import { buildMethodCall } from './envelope';
import { parseMethodResponse, type ParsedResponse } from './parser';
import { sendXmlRpcRequest } from './transport';
import { XMLRPC_URLS, type XmlRpcCommandResult, type XmlRpcParam, type XmlRpcPosicaoResult, type XmlRpcSenhaResult, type XmlRpcOperacaoResult, type ComandoEnviado, type ComandoStatus, type ComandoStatusFinal } from './types';
import type { SascarCredentials } from '../types';

export interface SascarXmlRpcClientOptions {
  timeoutMs?: number;
  maxRetries?: number;
  comandoUrl?: string;
  operacaoUrl?: string;
  /** Mutex para comandos de posição. Default true (manual seção 3.2.2). */
  positionMutex?: boolean;
}

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 3;

export class SascarXmlRpcClient {
  private readonly login: string;
  private readonly password: string;
  private readonly comandoUrl: string;
  private readonly operacaoUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly positionMutex: boolean;
  private readonly positionsQueue = new AsyncQueue();

  constructor(credentials?: SascarCredentials, options?: SascarXmlRpcClientOptions) {
    this.login = credentials?.usuario || process.env.SASCAR_USUARIO || '';
    this.password = credentials?.senha || process.env.SASCAR_SENHA || '';
    this.comandoUrl = options?.comandoUrl || XMLRPC_URLS.comando;
    this.operacaoUrl = options?.operacaoUrl || XMLRPC_URLS.operacao;
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.positionMutex = options?.positionMutex ?? true;

    if (!this.login || !this.password) {
      throw new Error('Credenciais da SASCAR não fornecidas.');
    }
  }

  private async send(
    methodName: string,
    params: XmlRpcParam[],
    isPosition = false
  ): Promise<ParsedResponse> {
    const isOperacao = methodName === 'inicializar_operacao'
      || methodName === 'finalizar_operacao'
      || methodName === 'vincular_rota'
      || methodName.startsWith('embarcar_')
      || methodName.startsWith('desembarcar_')
      || methodName === 'vincular_alerta_avd'
      || methodName === 'desvincular_alerta_avd';
    const url = isOperacao ? this.operacaoUrl : this.comandoUrl;

    const xml = buildMethodCall(methodName, params, this.login, this.password);
    const execute = async (): Promise<ParsedResponse> => {
      const text = await sendXmlRpcRequest(xml, {
        url,
        timeoutMs: this.timeoutMs,
        maxRetries: this.maxRetries
      });
      return parseMethodResponse(text);
    };

    if (isPosition && this.positionMutex) {
      return this.positionsQueue.enqueue(execute);
    }
    return execute();
  }

  private toCommandResult(parsed: ParsedResponse): XmlRpcCommandResult {
    return {
      resultados: parsed.resultados,
      ticketServidor: parsed.ticketServidor ?? 0,
      placasProcessadas: Object.keys(parsed.resultados).map((k) => `idVeiculo=${k}`)
    };
  }

  // ====== 2.5.2 BLOQUEIO ======
  async bloqueio(idVeiculo: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('bloqueio', [idVeiculo]));
  }

  // ====== 2.5.3 DESBLOQUEIO ======
  async desbloqueio(idVeiculo: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('desbloqueio', [idVeiculo]));
  }

  // ====== 2.5.8 RESET DE ALARME ======
  async reset_undo_alarme(idVeiculo: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('reset_undo_alarme', [idVeiculo]));
  }
}
```

- [ ] **Step 3: Criar barrel exports**

`src/xmlrpc/index.ts`:

```typescript
export { SascarXmlRpcClient, type SascarXmlRpcClientOptions } from './client';
export { SascarXmlRpcError, type XmlRpcFault } from './errors';
export type {
  XmlRpcCommandResult,
  XmlRpcOperacaoResult,
  XmlRpcPosicaoResult,
  XmlRpcSenhaResult,
  ComandoEnviado,
  ComandoStatus,
  ComandoStatusFinal,
  XmlRpcParam
} from './types';
export { XMLRPC_URLS } from './types';
```

- [ ] **Step 4: Escrever testes do client (categoria bloqueio)**

`tests/xmlrpc/client.spec.ts`:

```typescript
import nock from 'nock';
import { SascarXmlRpcClient } from '../../src/xmlrpc/client';
import { XMLRPC_URLS } from '../../src/xmlrpc/types';
import { assertXmlRpcBody } from '../integration/xmlrpc/_helpers';

const URL = XMLRPC_URLS.comando;

describe('SascarXmlRpcClient - bloqueio/desbloqueio/reset', () => {
  let client: SascarXmlRpcClient;

  beforeEach(() => {
    nock.cleanAll();
    client = new SascarXmlRpcClient(
      { usuario: 'test_user', senha: 'test_pass' },
      { maxRetries: 1, timeoutMs: 1000 }
    );
  });

  afterEach(() => nock.cleanAll());

  it('bloqueio() envia methodName "bloqueio" e placa=idVeiculo', async () => {
    let capturedBody = '';
    nock(URL)
      .post('/', (b) => {
        capturedBody = b;
        return true;
      })
      .reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>ticketServidor</name><value><int>12345</int></value></member>
</struct></value></param></params></methodResponse>`);

    const result = await client.bloqueio(2248181);
    assertXmlRpcBody(capturedBody, 'bloqueio', '2248181');
    expect(result.resultados[2248181]).toBe('1');
    expect(result.ticketServidor).toBe(12345);
  });

  it('desbloqueio() envia methodName "desbloqueio"', async () => {
    let capturedBody = '';
    nock(URL)
      .post('/', (b) => {
        capturedBody = b;
        return true;
      })
      .reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>ticketServidor</name><value><int>67890</int></value></member>
</struct></value></param></params></methodResponse>`);

    const result = await client.desbloqueio(2248181);
    assertXmlRpcBody(capturedBody, 'desbloqueio', '2248181');
    expect(result.resultados[2248181]).toBe('1');
  });

  it('reset_undo_alarme() envia methodName correto', async () => {
    let capturedBody = '';
    nock(URL)
      .post('/', (b) => {
        capturedBody = b;
        return true;
      })
      .reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>ticketServidor</name><value><int>11111</int></value></member>
</struct></value></param></params></methodResponse>`);

    await client.reset_undo_alarme(2248181);
    assertXmlRpcBody(capturedBody, 'reset_undo_alarme', '2248181');
  });

  it('lança erro se credenciais ausentes', () => {
    delete process.env.SASCAR_USUARIO;
    delete process.env.SASCAR_SENHA;
    expect(() => new SascarXmlRpcClient()).toThrow(/Credenciais/);
  });

  it('lê credenciais de SASCAR_USUARIO/SASCAR_SENHA quando ausentes no construtor', () => {
    process.env.SASCAR_USUARIO = 'env_user';
    process.env.SASCAR_SENHA = 'env_pass';
    expect(() => new SascarXmlRpcClient()).not.toThrow();
    delete process.env.SASCAR_USUARIO;
    delete process.env.SASCAR_SENHA;
  });
});
```

- [ ] **Step 5: Rodar teste e confirmar que falha**

Run: `npm test -- tests/xmlrpc/client.spec.ts`
Expected: FAIL (módulo não existe)

- [ ] **Step 6: Implementar o client (já mostrado no Step 2)**

- [ ] **Step 7: Rodar teste e confirmar que passa**

Run: `npm test -- tests/xmlrpc/client.spec.ts`
Expected: PASS

- [ ] **Step 8: Lint e typecheck**

Run: `npm run lint && npm run typecheck`

- [ ] **Step 9: Commit**

```bash
git add src/xmlrpc/client.ts src/xmlrpc/index.ts tests/xmlrpc/client.spec.ts tests/integration/xmlrpc/_helpers.ts
git commit -m "feat(xmlrpc): esqueleto SascarXmlRpcClient + bloqueio/desbloqueio/reset"
```

---

## Task 7: Categoria "Atuadores e Mensagens"

**Files:**
- Modify: `src/xmlrpc/client.ts`
- Modify: `tests/xmlrpc/client.spec.ts` (adicionar describes)

- [ ] **Step 1: Adicionar 5 métodos ao client**

Adicione ao `src/xmlrpc/client.ts` logo após `reset_undo_alarme`:

```typescript
  // ====== 2.5.4 ATUAÇÃO DE SAÍDAS ======
  async atuador(
    idVeiculo: number,
    idsAtuadores: number[],
    estado: 'on' | 'off'
  ): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('atuador', [idVeiculo, idsAtuadores, estado]));
  }

  // ====== 2.5.5 ENVIO DE MENSAGEM DE TEXTO ======
  async texto(
    idVeiculo: number,
    mensagem: string,
    ticket?: number
  ): Promise<XmlRpcCommandResult> {
    const params: XmlRpcParam[] = [idVeiculo, mensagem];
    if (ticket !== undefined) params.push(ticket);
    return this.toCommandResult(await this.send('texto', params));
  }

  // ====== 2.5.6 TRANSMISSÃO COM IGNIÇÃO DESLIGADA ======
  async transmissao_ignicao_desligada(
    idVeiculo: number,
    estado: 'on' | 'off'
  ): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('transmissao_ignicao_desligada', [idVeiculo, estado]));
  }

  // ====== 2.5.14 INIBIÇÃO DE SENSORES ======
  async inibir_sensor(
    idVeiculo: number,
    ids: number[],
    acao: 0 | 1
  ): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('inibir_sensor', [idVeiculo, ids, acao]));
  }

  // ====== 2.5.15 MODO SEGURO ======
  async modoSeguro(idVeiculo: number, ativar: boolean): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('modoSeguro', [idVeiculo, ativar]));
  }
```

- [ ] **Step 2: Adicionar testes para os 5 novos métodos**

Acrescente em `tests/xmlrpc/client.spec.ts` após o último `it`:

```typescript
describe('SascarXmlRpcClient - atuadores e mensagens', () => {
  let client: SascarXmlRpcClient;
  beforeEach(() => {
    nock.cleanAll();
    client = new SascarXmlRpcClient(
      { usuario: 'test_user', senha: 'test_pass' },
      { maxRetries: 1, timeoutMs: 1000 }
    );
  });
  afterEach(() => nock.cleanAll());

  const successStruct = `<member><name>2248181</name><value><int>1</int></value></member>
  <member><name>ticketServidor</name><value><int>1</int></value></member>`;
  const successBody = `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>${successStruct}</struct></value></param></params></methodResponse>`;

  it('atuador() envia array de ids + estado on/off', async () => {
    let body = '';
    nock(URL).post('/', (b) => { body = b; return true; }).reply(200, successBody);
    await client.atuador(2248181, [240, 241], 'on');
    expect(body).toContain('<methodName>atuador</methodName>');
    expect(body).toContain('<value><int>240</int></value>');
    expect(body).toContain('<value><int>241</int></value>');
    expect(body).toContain('<value><string>on</string></value>');
  });

  it('texto() envia mensagem como string', async () => {
    let body = '';
    nock(URL).post('/', (b) => { body = b; return true; }).reply(200, successBody);
    await client.texto(2248181, 'Olá motorista');
    expect(body).toContain('<methodName>texto</methodName>');
    expect(body).toContain('<value><string>Ol&#225; motorista</string></value>');
  });

  it('texto() inclui ticket quando fornecido', async () => {
    let body = '';
    nock(URL).post('/', (b) => { body = b; return true; }).reply(200, successBody);
    await client.texto(2248181, 'msg', 99999);
    expect(body).toContain('<value><int>99999</int></value>');
  });

  it('transmissao_ignicao_desligada() envia estado', async () => {
    let body = '';
    nock(URL).post('/', (b) => { body = b; return true; }).reply(200, successBody);
    await client.transmissao_ignicao_desligada(2248181, 'off');
    expect(body).toContain('<methodName>transmissao_ignicao_desligada</methodName>');
    expect(body).toContain('<value><string>off</string></value>');
  });

  it('inibir_sensor() envia array de ids + acao (0 ou 1)', async () => {
    let body = '';
    nock(URL).post('/', (b) => { body = b; return true; }).reply(200, successBody);
    await client.inibir_sensor(2248181, [231, 241, 248], 1);
    expect(body).toContain('<methodName>inibir_sensor</methodName>');
    expect(body).toContain('<value><int>231</int></value>');
    expect(body).toContain('<value><int>1</int></value>');
  });

  it('modoSeguro() serializa ativar=true como <boolean>1</boolean>', async () => {
    let body = '';
    nock(URL).post('/', (b) => { body = b; return true; }).reply(200, successBody);
    await client.modoSeguro(2248181, true);
    expect(body).toContain('<methodName>modoSeguro</methodName>');
    expect(body).toContain('<value><boolean>1</boolean></value>');
  });
});
```

- [ ] **Step 3: Rodar testes**

Run: `npm test -- tests/xmlrpc/client.spec.ts`
Expected: PASS (todos os 6 novos + 5 antigos)

- [ ] **Step 4: Lint e typecheck**

Run: `npm run lint && npm run typecheck`

- [ ] **Step 5: Commit**

```bash
git add src/xmlrpc/client.ts tests/xmlrpc/client.spec.ts
git commit -m "feat(xmlrpc): atuador, texto, transmissao, inibir_sensor, modoSeguro"
```

---

## Task 8: Categoria "Configuração satelital / GPRS"

**Files:**
- Modify: `src/xmlrpc/client.ts`
- Modify: `tests/xmlrpc/client.spec.ts`

- [ ] **Step 1: Adicionar 4 métodos ao client**

```typescript
  // ====== 2.5.11 INTERVALO DE ANÁLISE SATELITAL ======
  async analise_satelital(idVeiculo: number, intervaloSegundos: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('analise_satelital', [idVeiculo, intervaloSegundos]));
  }

  // ====== 2.5.12 INTERVALO DE TRANSMISSÃO SATELITAL ======
  async relatorio_satelital(idVeiculo: number, intervaloSegundos: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('relatorio_satelital', [idVeiculo, intervaloSegundos]));
  }

  // ====== 2.5.13 TEMPO DE TRANSMISSÃO GPRS ======
  async relatorio(idVeiculo: number, tempoSegundos: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('relatorio', [idVeiculo, tempoSegundos]));
  }

  // ====== 2.5.10 GERAR CONTRA SENHA MTC600 ======
  async gerar_contra_senha_mtc600(idVeiculo: number): Promise<XmlRpcSenhaResult> {
    const parsed = await this.send('gerar_contra_senha_mtc600', [idVeiculo]);
    return { ...this.toCommandResult(parsed), senha: parsed.senha ?? '' };
  }
```

- [ ] **Step 2: Adicionar testes (análoga à Task 7 — 4 describes com 1 teste cada)**

```typescript
describe('SascarXmlRpcClient - configuração satelital/GPRS', () => {
  let client: SascarXmlRpcClient;
  beforeEach(() => {
    nock.cleanAll();
    client = new SascarXmlRpcClient({ usuario: 'test_user', senha: 'test_pass' }, { maxRetries: 1, timeoutMs: 1000 });
  });
  afterEach(() => nock.cleanAll());

  const successBody = `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>ticketServidor</name><value><int>1</int></value></member>
</struct></value></param></params></methodResponse>`;

  it('analise_satelital() envia intervalo como int', async () => {
    let body = '';
    nock(URL).post('/', (b) => { body = b; return true; }).reply(200, successBody);
    await client.analise_satelital(2248181, 60);
    expect(body).toContain('<methodName>analise_satelital</methodName>');
    expect(body).toContain('<value><int>60</int></value>');
  });

  it('relatorio_satelital() envia intervalo como int', async () => {
    let body = '';
    nock(URL).post('/', (b) => { body = b; return true; }).reply(200, successBody);
    await client.relatorio_satelital(2248181, 300);
    expect(body).toContain('<methodName>relatorio_satelital</methodName>');
    expect(body).toContain('<value><int>300</int></value>');
  });

  it('relatorio() envia tempo como int', async () => {
    let body = '';
    nock(URL).post('/', (b) => { body = b; return true; }).reply(200, successBody);
    await client.relatorio(2248181, 30);
    expect(body).toContain('<methodName>relatorio</methodName>');
    expect(body).toContain('<value><int>30</int></value>');
  });

  it('gerar_contra_senha_mtc600() retorna senha do parser', async () => {
    nock(URL).post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>senha</name><value><string>654321</string></value></member>
</struct></value></param></params></methodResponse>`);
    const r = await client.gerar_contra_senha_mtc600(2248181);
    expect(r.senha).toBe('654321');
  });
});
```

- [ ] **Step 3: Rodar testes + lint + typecheck**

Run: `npm test -- tests/xmlrpc/client.spec.ts && npm run lint && npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/xmlrpc/client.ts tests/xmlrpc/client.spec.ts
git commit -m "feat(xmlrpc): analise_satelital, relatorio_satelital, relatorio, gerar_contra_senha_mtc600"
```

---

## Task 9: Gerar contra senha (TD40/TMCD) e método posicao

**Files:**
- Modify: `src/xmlrpc/client.ts`
- Modify: `tests/xmlrpc/client.spec.ts`

- [ ] **Step 1: Adicionar os 2 métodos restantes**

```typescript
  // ====== 2.5.9 GERAR CONTRA SENHA TD40/TMCD ======
  async gerar_contra_senha(idVeiculo: number): Promise<XmlRpcSenhaResult> {
    const parsed = await this.send('gerar_contra_senha', [idVeiculo]);
    return { ...this.toCommandResult(parsed), senha: parsed.senha ?? '' };
  }

  // ====== 2.5.1 POSIÇÃO (usa mutex) ======
  async posicao(idVeiculo: number): Promise<XmlRpcPosicaoResult> {
    const parsed = await this.send('posicao', [idVeiculo], true);
    if (!parsed.posicao) {
      throw new Error('Resposta de posicao() inválida (sem campos obrigatórios).');
    }
    return parsed.posicao;
  }
```

- [ ] **Step 2: Adicionar testes**

```typescript
describe('SascarXmlRpcClient - posicao e gerar_contra_senha', () => {
  let client: SascarXmlRpcClient;
  beforeEach(() => {
    nock.cleanAll();
    client = new SascarXmlRpcClient({ usuario: 'test_user', senha: 'test_pass' }, { maxRetries: 1, timeoutMs: 1000 });
  });
  afterEach(() => nock.cleanAll());

  it('gerar_contra_senha() retorna senha TD40/TMCD', async () => {
    nock(URL).post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>senha</name><value><string>987654</string></value></member>
</struct></value></param></params></methodResponse>`);
    const r = await client.gerar_contra_senha(2248181);
    expect(r.senha).toBe('987654');
    expect(r.resultados[2248181]).toBe('1');
  });

  it('posicao() retorna XmlRpcPosicaoResult com extras', async () => {
    nock(URL).post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>idVeiculo</name><value><int>2248181</int></value></member>
  <member><name>dataPosicao</name><value><string>2026-06-17 12:00:00</string></value></member>
  <member><name>dataPacote</name><value><string>2026-06-17 12:00:00</string></value></member>
  <member><name>latitude</name><value><double>-23.5</double></value></member>
  <member><name>longitude</name><value><double>-46.6</double></value></member>
  <member><name>direcao</name><value><int>4</int></value></member>
  <member><name>velocidade</name><value><int>80</int></value></member>
  <member><name>ignicao</name><value><int>1</int></value></member>
  <member><name>saida1</name><value><int>240</int></value></member>
  <member><name>tensao</name><value><int>24</int></value></member>
</struct></value></param></params></methodResponse>`);
    const p = await client.posicao(2248181);
    expect(p.idVeiculo).toBe(2248181);
    expect(p.latitude).toBe(-23.5);
    expect(p.extras.saida1).toBe(240);
    expect(p.extras.tensao).toBe(24);
  });

  it('posicao() usa mutex (execuções sequenciais)', async () => {
    const start = Date.now();
    nock(URL)
      .post(/.*/).delay(100).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>idVeiculo</name><value><int>1</int></value></member>
  <member><name>dataPosicao</name><value><string>x</string></value></member>
  <member><name>dataPacote</name><value><string>x</string></value></member>
  <member><name>latitude</name><value><double>0</double></value></member>
  <member><name>longitude</name><value><double>0</double></value></member>
  <member><name>direcao</name><value><int>0</int></value></member>
  <member><name>velocidade</name><value><int>0</int></value></member>
  <member><name>ignicao</name><value><int>0</int></value></member>
</struct></value></param></params></methodResponse>`)
      .post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>idVeiculo</name><value><int>1</int></value></member>
  <member><name>dataPosicao</name><value><string>y</string></value></member>
  <member><name>dataPacote</name><value><string>y</string></value></member>
  <member><name>latitude</name><value><double>0</double></value></member>
  <member><name>longitude</name><value><double>0</double></value></member>
  <member><name>direcao</name><value><int>0</int></value></member>
  <member><name>velocidade</name><value><int>0</int></value></member>
  <member><name>ignicao</name><value><int>0</int></value></member>
</struct></value></param></params></methodResponse>`);
    await Promise.all([client.posicao(1), client.posicao(1)]);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });
});
```

- [ ] **Step 3: Rodar testes + lint + typecheck**

Run: `npm test -- tests/xmlrpc/client.spec.ts && npm run lint && npm run typecheck`

- [ ] **Step 4: Commit**

```bash
git add src/xmlrpc/client.ts tests/xmlrpc/client.spec.ts
git commit -m "feat(xmlrpc): posicao() com mutex e gerar_contra_senha"
```

---

## Task 10: Categoria "Status / Listagem"

**Files:**
- Modify: `src/xmlrpc/client.ts`
- Modify: `tests/xmlrpc/client.spec.ts`

- [ ] **Step 1: Adicionar status_ticket e listar_comandos**

```typescript
  // ====== 2.5.29 STATUS TICKET ======
  async status_ticket(ticketConsulta: number, ticketInterno: number): Promise<ComandoStatus[]> {
    const parsed = await this.send('status_ticket', [ticketConsulta, ticketInterno]);
    return parsed.comandos;
  }

  // ====== 2.5.7 LISTAGEM DE COMANDOS ENVIADOS ======
  async listar_comandos(
    idVeiculo: number,
    quantidade: number,
    dataInicial: string,
    dataFinal: string
  ): Promise<ComandoEnviado[]> {
    const parsed = await this.send('listar_comandos', [idVeiculo, quantidade, dataInicial, dataFinal]);
    return parsed.comandos;
  }
```

- [ ] **Step 2: Adicionar testes**

```typescript
describe('SascarXmlRpcClient - status e listagem', () => {
  let client: SascarXmlRpcClient;
  beforeEach(() => {
    nock.cleanAll();
    client = new SascarXmlRpcClient({ usuario: 'test_user', senha: 'test_pass' }, { maxRetries: 1, timeoutMs: 1000 });
  });
  afterEach(() => nock.cleanAll());

  it('status_ticket() retorna ComandoStatus[]', async () => {
    nock(URL).post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><array><data>
  <value><struct>
    <member><name>methodName</name><value><string>bloqueio</string></value></member>
    <member><name>dataEnvio</name><value><string>06/17/2026 12:00</string></value></member>
    <member><name>status</name><value><int>1</int></value></member>
    <member><name>statusDescricao</name><value><string>COMANDO_EXECUTADO</string></value></member>
    <member><name>ticketServidor</name><value><int>1</int></value></member>
  </struct></value>
</data></array></value></param></params></methodResponse>`);
    const arr = await client.status_ticket(1, 1);
    expect(arr).toHaveLength(1);
    expect(arr[0].status).toBe(1);
  });

  it('listar_comandos() envia quantidade, dataInicial, dataFinal', async () => {
    let body = '';
    nock(URL).post(/.*').reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><array><data></data></array></value></param></params></methodResponse>`);
    await client.listar_comandos(2248181, 100, '06/01/2026 00:00', '06/17/2026 23:59');
    // Esta verificação extra: o body deve conter methodName= e as datas
    expect(body).toContain('<methodName>listar_comandos</methodName>');
  });
});
```

- [ ] **Step 3: Rodar testes + lint + typecheck**

Run: `npm test -- tests/xmlrpc/client.spec.ts && npm run lint && npm run typecheck`

- [ ] **Step 4: Commit**

```bash
git add src/xmlrpc/client.ts tests/xmlrpc/client.spec.ts
git commit -m "feat(xmlrpc): status_ticket e listar_comandos"
```

---

## Task 11: Categoria "AVD e Operação"

**Files:**
- Modify: `src/xmlrpc/client.ts`
- Modify: `tests/xmlrpc/client.spec.ts`

- [ ] **Step 1: Adicionar 5 métodos (todos vão para /xmlrpc/operacao)**

```typescript
  // ====== 2.5.30 VINCULAR ALERTA AVD ======
  async vincular_alerta_avd(idVeiculo: number, idAlertaAvd: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('vincular_alerta_avd', [idVeiculo, idAlertaAvd]));
  }

  // ====== 2.5.31 DESVINCULAR ALERTA AVD ======
  async desvincular_alerta_avd(idVeiculo: number, idAlertaAvd: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('desvincular_alerta_avd', [idVeiculo, idAlertaAvd]));
  }

  // ====== 2.5.32 INICIALIZAR OPERAÇÃO ======
  async inicializar_operacao(placas: string[]): Promise<XmlRpcOperacaoResult> {
    const parsed = await this.send('inicializar_operacao', [placas]);
    return { ...this.toCommandResult(parsed), mensagens: parsed.mensagens };
  }

  // ====== 2.5.33 FINALIZAR OPERAÇÃO ======
  async finalizar_operacao(placas: string[]): Promise<XmlRpcOperacaoResult> {
    const parsed = await this.send('finalizar_operacao', [placas]);
    return { ...this.toCommandResult(parsed), mensagens: parsed.mensagens };
  }

  // ====== 2.5.34 VINCULAR ROTA ======
  async vincular_rota(placas: string[], idRota: number): Promise<XmlRpcOperacaoResult> {
    const parsed = await this.send('vincular_rota', [placas, idRota]);
    return { ...this.toCommandResult(parsed), mensagens: parsed.mensagens };
  }
```

- [ ] **Step 2: Adicionar testes (5 describes com 1 teste cada, em /xmlrpc/operacao)**

```typescript
import { XMLRPC_URLS as U } from '../../src/xmlrpc/types';
const OPER_URL = U.operacao;

describe('SascarXmlRpcClient - AVD e Operação (endpoint /xmlrpc/operacao)', () => {
  let client: SascarXmlRpcClient;
  beforeEach(() => {
    nock.cleanAll();
    client = new SascarXmlRpcClient({ usuario: 'test_user', senha: 'test_pass' }, { maxRetries: 1, timeoutMs: 1000 });
  });
  afterEach(() => nock.cleanAll());

  const ok = `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>ticketServidor</name><value><int>1</int></value></member>
</struct></value></param></params></methodResponse>`;

  it('vincular_alerta_avd() POSTa em /operacao', async () => {
    let body = '';
    nock(OPER_URL).post(/.*/).reply(function () { body = this.req.requestBodyStrings[0]; return [200, ok]; });
    await client.vincular_alerta_avd(2248181, 12345);
    expect(body).toContain('<methodName>vincular_alerta_avd</methodName>');
  });

  it('desvincular_alerta_avd() POSTa em /operacao', async () => {
    let body = '';
    nock(OPER_URL).post(/.*/).reply(function () { body = this.req.requestBodyStrings[0]; return [200, ok]; });
    await client.desvincular_alerta_avd(2248181, 12345);
    expect(body).toContain('<methodName>desvincular_alerta_avd</methodName>');
  });

  it('inicializar_operacao() envia array de placas e retorna mensagens', async () => {
    nock(OPER_URL).post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>AAA1111</name><value><int>1</int></value></member>
  <member><name>BBB2222</name><value><int>2</int></value></member>
  <member><name>mensagens</name><value><struct>
    <member><name>BBB2222</name><value><string>Veiculo nao pertence a gerenciadora</string></value></member>
  </struct></value></member>
</struct></value></param></params></methodResponse>`);
    const r = await client.inicializar_operacao(['AAA1111', 'BBB2222']);
    expect(r.resultados[1]).toBe('1');
    expect(r.resultados[2]).toBe('2');
    expect(r.mensagens.BBB2222).toContain('gerenciadora');
  });

  it('finalizar_operacao() é alias direto', async () => {
    nock(OPER_URL).post(/.*/).reply(200, ok);
    await client.finalizar_operacao(['AAA1111']);
  });

  it('vincular_rota() envia array de placas + idRota', async () => {
    let body = '';
    nock(OPER_URL).post(/.*/).reply(function () { body = this.req.requestBodyStrings[0]; return [200, ok]; });
    await client.vincular_rota(['AAA1111'], 99);
    expect(body).toContain('<methodName>vincular_rota</methodName>');
    expect(body).toContain('<value><int>99</int></value>');
  });
});
```

- [ ] **Step 3: Rodar testes + lint + typecheck**

Run: `npm test -- tests/xmlrpc/client.spec.ts && npm run lint && npm run typecheck`

- [ ] **Step 4: Commit**

```bash
git add src/xmlrpc/client.ts tests/xmlrpc/client.spec.ts
git commit -m "feat(xmlrpc): AVD (vincular/desvincular) e Operação (inicializar/finalizar/vincular_rota)"
```

---

## Task 12: Categoria "Embarcar / Desembarcar Layouts" (13 métodos)

**Files:**
- Modify: `src/xmlrpc/client.ts`
- Modify: `tests/xmlrpc/client.spec.ts`

- [ ] **Step 1: Adicionar 13 métodos (todos vão para /xmlrpc/operacao)**

```typescript
  // ====== 2.5.16–2.5.27 EMBARCAR LAYOUTS ======
  async embarcar_layout_acao_embarcada_avd(idVeiculo: number, idLayout: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_layout_acao_embarcada_avd', [idVeiculo, idLayout]));
  }
  async embarcar_layout_grupo_ponto(idVeiculo: number, idLayout: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_layout_grupo_ponto', [idVeiculo, idLayout]));
  }
  async embarcar_motorista(idVeiculo: number, idMotorista: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_motorista', [idVeiculo, idMotorista]));
  }
  async embarcar_layout_tmcd(idVeiculo: number, idLayout: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_layout_tmcd', [idVeiculo, idLayout]));
  }
  async embarcar_layout_td40(idVeiculo: number, idLayout: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_layout_td40', [idVeiculo, idLayout]));
  }
  async embarcar_layout_td50(idVeiculo: number, idLayout: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_layout_td50', [idVeiculo, idLayout]));
  }
  async embarcar_sequenciamento_td50(idVeiculo: number, idLayout: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_sequenciamento_td50', [idVeiculo, idLayout]));
  }
  async embarcar_sequenciamento_macro_sasmdt(idVeiculo: number, idLayout: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_sequenciamento_macro_sasmdt', [idVeiculo, idLayout]));
  }
  async embarcar_layout_grupo_area_avd(idVeiculo: number, idLayout: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_layout_grupo_area_avd', [idVeiculo, idLayout]));
  }

  // ====== 2.5.17/19/28 DESEMBARCAR LAYOUTS ======
  async desembarcar_layout_acao_embarcada_avd(idVeiculo: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('desembarcar_layout_acao_embarcada_avd', [idVeiculo]));
  }
  async desembarcar_layout_grupo_ponto(idVeiculo: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('desembarcar_layout_grupo_ponto', [idVeiculo]));
  }
  async desembarcar_layout_grupo_area_avd(idVeiculo: number): Promise<XmlRpcCommandResult> {
    return this.toCommandResult(await this.send('desembarcar_layout_grupo_area_avd', [idVeiculo]));
  }
```

- [ ] **Step 2: Adicionar teste parametrizado (loop em array de methodNames)**

```typescript
describe('SascarXmlRpcClient - embarcar/desembarcar layouts', () => {
  let client: SascarXmlRpcClient;

  beforeEach(() => {
    nock.cleanAll();
    client = new SascarXmlRpcClient({ usuario: 'test_user', senha: 'test_pass' }, { maxRetries: 1, timeoutMs: 1000 });
  });
  afterEach(() => nock.cleanAll());

  const ok = `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>ticketServidor</name><value><int>1</int></value></member>
</struct></value></param></params></methodResponse>`;

  const embarcarMethods = [
    'embarcar_layout_acao_embarcada_avd',
    'embarcar_layout_grupo_ponto',
    'embarcar_motorista',
    'embarcar_layout_tmcd',
    'embarcar_layout_td40',
    'embarcar_layout_td50',
    'embarcar_sequenciamento_td50',
    'embarcar_sequenciamento_macro_sasmdt',
    'embarcar_layout_grupo_area_avd'
  ];

  const desembarcarMethods = [
    'desembarcar_layout_acao_embarcada_avd',
    'desembarcar_layout_grupo_ponto',
    'desembarcar_layout_grupo_area_avd'
  ];

  embarcarMethods.forEach((m) => {
    it(`${m}() POSTa em /operacao com idLayout`, async () => {
      let body = '';
      nock(OPER_URL).post(/.*/).reply(function () { body = this.req.requestBodyStrings[0]; return [200, ok]; });
      await (client as unknown as Record<string, (a: number, b: number) => Promise<unknown>>)[m](2248181, 42);
      expect(body).toContain(`<methodName>${m}</methodName>`);
      expect(body).toContain('<value><int>42</int></value>');
    });
  });

  desembarcarMethods.forEach((m) => {
    it(`${m}() POSTa em /operacao`, async () => {
      let body = '';
      nock(OPER_URL).post(/.*/).reply(function () { body = this.req.requestBodyStrings[0]; return [200, ok]; });
      await (client as unknown as Record<string, (a: number) => Promise<unknown>>)[m](2248181);
      expect(body).toContain(`<methodName>${m}</methodName>`);
    });
  });
});
```

- [ ] **Step 3: Rodar testes + lint + typecheck**

Run: `npm test -- tests/xmlrpc/client.spec.ts && npm run lint && npm run typecheck`
Expected: PASS (12 testes)

- [ ] **Step 4: Commit**

```bash
git add src/xmlrpc/client.ts tests/xmlrpc/client.spec.ts
git commit -m "feat(xmlrpc): 12 métodos embarcar_*/desembarcar_*"
```

---

## Task 13: Helpers de alto nível + aguardarComando

**Files:**
- Modify: `src/xmlrpc/client.ts`
- Create: `tests/xmlrpc/helpers.spec.ts`

- [ ] **Step 1: Adicionar 5 helpers ao client**

```typescript
  // ====== HELPERS DE ALTO NÍVEL ======

  /** Helper: envia comando de bloqueio. */
  async bloquearVeiculo(idVeiculo: number): Promise<XmlRpcCommandResult> {
    return this.bloqueio(idVeiculo);
  }

  /** Helper: envia comando de desbloqueio. */
  async desbloquearVeiculo(idVeiculo: number): Promise<XmlRpcCommandResult> {
    return this.desbloqueio(idVeiculo);
  }

  /** Helper: envia texto para o display do veículo. */
  async enviarMensagem(idVeiculo: number, mensagem: string, ticket?: number): Promise<XmlRpcCommandResult> {
    return this.texto(idVeiculo, mensagem, ticket);
  }

  /** Helper: alterna estado de um atuador. */
  async alternarAtuador(
    idVeiculo: number,
    idAtuador: number,
    estado: 'on' | 'off'
  ): Promise<XmlRpcCommandResult> {
    return this.atuador(idVeiculo, [idAtuador], estado);
  }

  /**
   * Aguarda a execução (ou recusa) de um comando via polling em status_ticket.
   * Retorna apenas quando status converge para 1 (executado) ou 2 (recusado),
   * ou lança SascarTimeoutError se `timeoutMs` for atingido.
   */
  async aguardarComando(
    ticket: number,
    idVeiculo: number,
    opts?: { timeoutMs?: number; pollIntervalMs?: number }
  ): Promise<ComandoStatusFinal> {
    const timeoutMs = opts?.timeoutMs ?? 60_000;
    const pollIntervalMs = opts?.pollIntervalMs ?? 3_000;
    const start = Date.now();
    let tentativas = 0;

    while (Date.now() - start < timeoutMs) {
      tentativas++;
      const statuses = await this.status_ticket(ticket, ticket);
      // Encontra status relativo ao idVeiculo, se vier discriminado; senão, o primeiro.
      const match = statuses.find((s) => s.ticket === ticket) ?? statuses[0];
      if (!match) {
        await new Promise((res) => setTimeout(res, pollIntervalMs));
        continue;
      }
      if (match.status === 1 || match.status === 2) {
        return {
          ticket: match.ticket,
          status: match.status as 1 | 2,
          statusDescricao: match.statusDescricao,
          tentativas,
          duracaoMs: Date.now() - start
        };
      }
      // 3,4,5,6,7 → ainda em progresso, continua polling
      await new Promise((res) => setTimeout(res, pollIntervalMs));
    }

    throw new Error(`Timeout aguardando ticket ${ticket} após ${timeoutMs}ms (${tentativas} tentativas).`);
  }
```

- [ ] **Step 2: Escrever testes dos helpers**

`tests/xmlrpc/helpers.spec.ts`:

```typescript
import nock from 'nock';
import { SascarXmlRpcClient } from '../../src/xmlrpc/client';
import { XMLRPC_URLS } from '../../src/xmlrpc/types';

const URL = XMLRPC_URLS.comando;

describe('helpers de alto nível', () => {
  let client: SascarXmlRpcClient;

  beforeEach(() => {
    nock.cleanAll();
    client = new SascarXmlRpcClient({ usuario: 'u', senha: 'p' }, { maxRetries: 1, timeoutMs: 1000 });
  });
  afterEach(() => nock.cleanAll());

  const ok = `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>ticketServidor</name><value><int>1</int></value></member>
</struct></value></param></params></methodResponse>`;

  it('bloquearVeiculo() delega para bloqueio()', async () => {
    let body = '';
    nock(URL).post(/.*/).reply(function () { body = this.req.requestBodyStrings[0]; return [200, ok]; });
    await client.bloquearVeiculo(2248181);
    expect(body).toContain('<methodName>bloqueio</methodName>');
  });

  it('desbloquearVeiculo() delega para desbloqueio()', async () => {
    let body = '';
    nock(URL).post(/.*/).reply(function () { body = this.req.requestBodyStrings[0]; return [200, ok]; });
    await client.desbloquearVeiculo(2248181);
    expect(body).toContain('<methodName>desbloqueio</methodName>');
  });

  it('enviarMensagem() delega para texto()', async () => {
    let body = '';
    nock(URL).post(/.*/).reply(function () { body = this.req.requestBodyStrings[0]; return [200, ok]; });
    await client.enviarMensagem(2248181, 'oi');
    expect(body).toContain('<methodName>texto</methodName>');
  });

  it('alternarAtuador(id, 240, "on") envia idsAtuadores=[240]', async () => {
    let body = '';
    nock(URL).post(/.*/).reply(function () { body = this.req.requestBodyStrings[0]; return [200, ok]; });
    await client.alternarAtuador(2248181, 240, 'on');
    expect(body).toContain('<value><int>240</int></value>');
  });
});

describe('aguardarComando()', () => {
  let client: SascarXmlRpcClient;
  beforeEach(() => {
    nock.cleanAll();
    client = new SascarXmlRpcClient({ usuario: 'u', senha: 'p' }, { maxRetries: 1, timeoutMs: 1000 });
  });
  afterEach(() => nock.cleanAll());

  it('retorna status=1 assim que comando converge para executado', async () => {
    nock(URL).post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><array><data>
  <value><struct>
    <member><name>ticket</name><value><int>99999</int></value></member>
    <member><name>dataExecucao</name><value><string>06/17/2026 12:00</string></value></member>
    <member><name>status</name><value><int>1</int></value></member>
    <member><name>statusDescricao</name><value><string>COMANDO_EXECUTADO</string></value></member>
  </struct></value>
</data></array></value></param></params></methodResponse>`);
    const r = await client.aguardarComando(99999, 2248181, { pollIntervalMs: 50 });
    expect(r.status).toBe(1);
    expect(r.statusDescricao).toBe('COMANDO_EXECUTADO');
    expect(r.tentativas).toBe(1);
  });

  it('retorna status=2 quando comando é recusado', async () => {
    nock(URL).post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><array><data>
  <value><struct>
    <member><name>ticket</name><value><int>99999</int></value></member>
    <member><name>dataExecucao</name><value><string>06/17/2026 12:00</string></value></member>
    <member><name>status</name><value><int>2</int></value></member>
    <member><name>statusDescricao</name><value><string>COMANDO_RECUSADO</string></value></member>
  </struct></value>
</data></array></value></param></params></methodResponse>`);
    const r = await client.aguardarComando(99999, 2248181, { pollIntervalMs: 50 });
    expect(r.status).toBe(2);
  });

  it('faz polling até convergir (status 3 → 1)', async () => {
    nock(URL)
      .post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><array><data>
  <value><struct>
    <member><name>ticket</name><value><int>99999</int></value></member>
    <member><name>dataExecucao</name><value><string>x</string></value></member>
    <member><name>status</name><value><int>3</int></value></member>
    <member><name>statusDescricao</name><value><string>NAO_PROCESSADO</string></value></member>
  </struct></value>
</data></array></value></param></params></methodResponse>`)
      .post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><array><data>
  <value><struct>
    <member><name>ticket</name><value><int>99999</int></value></member>
    <member><name>dataExecucao</name><value><string>x</string></value></member>
    <member><name>status</name><value><int>1</int></value></member>
    <member><name>statusDescricao</name><value><string>COMANDO_EXECUTADO</string></value></member>
  </struct></value>
</data></array></value></param></params></methodResponse>`);
    const r = await client.aguardarComando(99999, 2248181, { pollIntervalMs: 30, timeoutMs: 5000 });
    expect(r.status).toBe(1);
    expect(r.tentativas).toBeGreaterThanOrEqual(2);
  });

  it('lança timeout quando comando nunca converge', async () => {
    nock(URL).post(/.*/).times(10).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><array><data>
  <value><struct>
    <member><name>ticket</name><value><int>99999</int></value></member>
    <member><name>dataExecucao</name><value><string>x</string></value></member>
    <member><name>status</name><value><int>3</int></value></member>
    <member><name>statusDescricao</name><value><string>NAO_PROCESSADO</string></value></member>
  </struct></value>
</data></array></value></param></params></methodResponse>`);
    await expect(
      client.aguardarComando(99999, 2248181, { pollIntervalMs: 20, timeoutMs: 200 })
    ).rejects.toThrow(/Timeout/);
  });
});
```

- [ ] **Step 3: Rodar testes + lint + typecheck**

Run: `npm test -- tests/xmlrpc/helpers.spec.ts && npm run lint && npm run typecheck`

- [ ] **Step 4: Commit**

```bash
git add src/xmlrpc/client.ts tests/xmlrpc/helpers.spec.ts
git commit -m "feat(xmlrpc): helpers de alto nível + aguardarComando com polling"
```

---

## Task 14: Integração com `index.ts` raiz

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Adicionar re-exports XML-RPC ao barrel principal**

`src/index.ts`:

```typescript
export { SascarClient } from './client';
export { AsyncQueue } from './queue';
export * from './types';
export * from './errors';

// Re-exporta o módulo XML-RPC para `import { SascarXmlRpcClient } from 'sascar-sdk'`
export {
  SascarXmlRpcClient,
  type SascarXmlRpcClientOptions,
  SascarXmlRpcError,
  type XmlRpcFault,
  type XmlRpcCommandResult,
  type XmlRpcOperacaoResult,
  type XmlRpcPosicaoResult,
  type XmlRpcSenhaResult,
  type ComandoEnviado,
  type ComandoStatus,
  type ComandoStatusFinal,
  type XmlRpcParam,
  XMLRPC_URLS
} from './xmlrpc';
```

- [ ] **Step 2: Rodar build e verificar que gera `dist/xmlrpc/*` corretamente**

Run: `npm run build && ls dist/xmlrpc/`
Expected: 6 arquivos (client.js, envelope.js, parser.js, transport.js, errors.js, types.js, index.js)

- [ ] **Step 3: Rodar suite completa**

Run: `npm test && npm run lint && npm run typecheck`
Expected: PASS em tudo (~194 testes)

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat(xmlrpc): re-exportar SascarXmlRpcClient do barrel principal"
```

---

## Task 15: Atualizar README com seção XML-RPC

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Adicionar seção "Comandos XML-RPC" no README**

Localize o trecho em `README.md` que fala sobre o status atual da cobertura (logo após a linha 6-7) e atualize a contagem de métodos de 74 para **108 (74 SOAP + 34 XML-RPC)**. Adicione também uma seção "Comandos XML-RPC" com o exemplo de uso. Anexe ao final do README:

````markdown
## 🛰️ Comandos XML-RPC (bloqueio, atuadores, layouts)

A partir da v1.1.0 o SDK também suporta os **34 comandos do protocolo XML-RPC** (manual Sascar v3.5), incluindo **bloqueio, desbloqueio, controle de atuadores, mensagens, layouts embarcados e AVD**. O protocolo XML-RPC é usado para **operações de escrita** (comandos) — diferente do SOAP que cobre leituras.

### Importação

```typescript
import { SascarXmlRpcClient } from 'sascar-sdk';

const xmlrpc = new SascarXmlRpcClient({ usuario: 'user', senha: 'pass' });
```

### Bloquear/desbloquear veículo

```typescript
// Bloqueio simples
const { ticketServidor } = await xmlrpc.bloquearVeiculo(2248181);

// Aguardar execução (polling automático)
const status = await xmlrpc.aguardarComando(ticketServidor, 2248181, {
  timeoutMs: 60_000,
  pollIntervalMs: 3_000
});
console.log(status.status === 1 ? 'Bloqueado!' : 'Recusado');

// Desbloquear
await xmlrpc.desbloquearVeiculo(2248181);
```

### Comandos disponíveis

| Categoria | Métodos |
|-----------|---------|
| **Bloqueio** | `bloqueio`, `desbloqueio` |
| **Posição & Atuadores** | `posicao`, `atuador`, `texto`, `transmissao_ignicao_desligada`, `modoSeguro`, `inibir_sensor` |
| **Configuração** | `analise_satelital`, `relatorio_satelital`, `relatorio` |
| **Senhas** | `gerar_contra_senha`, `gerar_contra_senha_mtc600` |
| **Status** | `status_ticket`, `listar_comandos`, `reset_undo_alarme` |
| **AVD** | `vincular_alerta_avd`, `desvincular_alerta_avd` |
| **Operação** | `inicializar_operacao`, `finalizar_operacao`, `vincular_rota` |
| **Layouts (embarcar)** | `embarcar_layout_acao_embarcada_avd`, `embarcar_layout_grupo_ponto`, `embarcar_motorista`, `embarcar_layout_tmcd`, `embarcar_layout_td40`, `embarcar_layout_td50`, `embarcar_sequenciamento_td50`, `embarcar_sequenciamento_macro_sasmdt`, `embarcar_layout_grupo_area_avd` |
| **Layouts (desembarcar)** | `desembarcar_layout_acao_embarcada_avd`, `desembarcar_layout_grupo_ponto`, `desembarcar_layout_grupo_area_avd` |
| **Helpers PT-BR** | `bloquearVeiculo`, `desbloquearVeiculo`, `enviarMensagem`, `alternarAtuador`, `aguardarComando` |

### Endereços (do manual seção 2.3)

- `https://xmlrpc.sascar.com.br/xmlrpc/comando` (bloqueio, atuador, posicao, etc.)
- `https://xmlrpc.sascar.com.br/xmlrpc/operacao` (embarcar/desembarcar, operação, AVD)

Para usar URLs customizadas (ex.: homologação), passe `comandoUrl` e `operacaoUrl` no segundo argumento:

```typescript
const xmlrpc = new SascarXmlRpcClient(
  { usuario: 'user', senha: 'pass' },
  { comandoUrl: 'https://hml-xmlrpc.sascar.com.br/xmlrpc/comando' }
);
```
````

- [ ] **Step 2: Atualizar a linha 6-7 do README (status atual)**

Substitua o texto:
> **Status:** SDK auditado em 2026-06-09. Cobertura 100% do manual SasIntegra v2.07 (seções 4.1–4.63). 94 testes, 0 `any` em produção, erros tipados, timeout, retry, transport isolado.

Por:
> **Status:** SDK auditado em 2026-06-17. Cobertura 100% do manual SasIntegra v2.07 SOAP (74 métodos) + 100% do manual XML-RPC v3.5 (34 comandos + 5 helpers). 194 testes, 0 `any` em produção, erros tipados, timeout, retry, transport isolado.

E a linha 87-88 ("74 métodos suportados pelo SDK"):
> Abaixo estão listados todos os `108` métodos suportados pelo SDK (74 do manual SasIntegra v2.07 SOAP + 34 do manual XML-RPC v3.5 + 2 helpers de mapeamento do SOAP).

- [ ] **Step 3: Confirmar build + testes verdes**

Run: `npm run build && npm test && npm run lint && npm run typecheck`
Expected: PASS em tudo

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): seção Comandos XML-RPC com exemplo de bloqueio"
```

---

## Task 16: Verificação final + release commit

- [ ] **Step 1: Rodar suite completa**

Run: `npm test`
Expected: ~194 testes PASS, 0 FAIL

- [ ] **Step 2: Cobertura**

Run: `npm run test:coverage`
Expected: branches >=60%, functions=100%, lines>=99%, statements>=99%

- [ ] **Step 3: Lint + typecheck + build**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: zero warnings

- [ ] **Step 4: Verificar que `dist/xmlrpc/*` foi gerado**

Run: `ls -la dist/xmlrpc/`
Expected: 7 arquivos (.js + .d.ts para client, errors, envelope, parser, transport, types + index)

- [ ] **Step 5: Commit de release**

```bash
git add dist/ CHANGELOG.md
# Atualizar CHANGELOG.md com:
# ## [1.1.0] - 2026-06-17
# ### Adicionado
# - Módulo XML-RPC completo: 34 comandos do manual Sascar v3.5
# - Helpers de alto nível: bloquearVeiculo, desbloquearVeiculo, enviarMensagem,
#   alternarAtuador, aguardarComando (polling automático)
# - SascarXmlRpcError (estende SascarApiError para catching unificado)
# - Suporte a bloqueio/desbloqueio, controle de atuadores, embarcar/desembarcar layouts
git commit -m "chore(release): v1.1.0 - módulo XML-RPC com 34 comandos + 5 helpers"
```

- [ ] **Step 6: Confirmar que está tudo OK**

```bash
git log --oneline -20
```
Expected: ver os 16 commits da implementação, mais o commit de release.
