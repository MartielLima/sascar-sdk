# SascarXmlRpcClient — Design Spec

**Data:** 2026-06-17
**Status:** Aprovado pelo usuário
**Autor:** brainstorming + opencode
**Versão alvo do protocolo:** XML-RPC Sascar v3.5 (61 páginas)

## Contexto

O SDK `sascar-sdk` foi auditado em 2026-06-09 e declarado como tendo
**cobertura 100% do manual SasIntegra v2.07 (seções 4.1–4.63)** — isso é
verdade para o protocolo **SOAP**. Porém, em conversa de 2026-06-17 o
usuário apontou que o **protocolo XML-RPC** (documento separado de
61 páginas) não foi mapeado. O XML-RPC concentra as operações
**escritas** (comandos) — incluindo **bloqueio e desbloqueio de
veículos**, que são exatamente as operações que faltavam.

Este design preenche o gap: adiciona um módulo XML-RPC completo ao
lado do módulo SOAP, sem tocar em `src/client.ts` (SascarClient).

## Objetivos

1. Mapear **100% dos 34 comandos XML-RPC** documentados no manual
   v3.5 (seções 2.5.1 a 2.5.34).
2. Expor helpers de alto nível em PT-BR (paralelos aos do SascarClient
   SOAP) para os casos mais comuns: bloquear, desbloquear, enviar
   mensagem, alternar atuador, aguardar execução.
3. Preservar nomenclatura **idêntica** ao `methodName` do manual nos
   métodos 1:1, para que qualquer integrador com o PDF em mãos consiga
   mapear diretamente.
4. Reusar infra existente: `SascarCredentials`, `SascarApiError` (classe
   base), `AsyncQueue` (mutex para comandos de posição), padrão de
   timeout/retry.
5. Manter zero `any` em produção (padrão atual do SDK: 0 erros no ESLint).
6. Adicionar **~100 testes** com fixtures XML, mantendo a paridade com o
   módulo SOAP (94 testes hoje → ~194 ao final).

## Não-objetivos (YAGNI)

- **Não** implementar transporte binário/raw TCP — o manual só descreve
  HTTP+XML-RPC.
- **Não** implementar SOAP `obterStatusComando` no módulo XML-RPC (já
  existe no `SascarClient` SOAP).
- **Não** introduzir camada de facade — `SascarClient` (SOAP) e
  `SascarXmlRpcClient` (XML-RPC) ficam expostos independentemente; o
  consumidor importa o que precisa.
- **Não** adicionar cache — a natureza dos comandos é write/once; cache
  só faria sentido para `obterStatusComando` (que já está no SOAP).
- **Não** adicionar pool de conexões — HTTP/HTTPS keep-alive do `fetch`
  nativo já é suficiente.

## Decisões de design

| # | Decisão | Justificativa |
|---|---------|---------------|
| 1 | Nova classe `SascarXmlRpcClient` em `src/xmlrpc/` | Protocolo e autenticação diferentes justificam separação total |
| 2 | Métodos 1:1 com o manual + helpers de alto nível | Flexibilidade +DX sem perder fidelidade ao spec |
| 3 | Reusa `SascarCredentials` (campos `usuario`/`senha`) | Suporte Sascar confirma que são as mesmas credenciais |
| 4 | Retorna `XmlRpcCommandResult` (com `ticketServidor`); helper `aguardarComando()` faz polling | Transparência +DX para consultar status |
| 5 | Testes com fixtures XML pré-gravadas | Padrão atual do SDK; rápido, determinístico, sem rede |
| 6 | Erros via `SascarXmlRpcError extends SascarApiError` | `try/catch` funciona igual em ambos os protocolos |
| 7 | Mutex em `posicao` (recomendado pelo manual 3.2.2) | Reusa `AsyncQueue` do SOAP |
| 8 | Retry idêntico ao SOAP: 5xx + ECONNRESET/ETIMEDOUT | Padrão já validado em produção |

## Arquitetura

### Estrutura de arquivos

```
src/
├── client.ts                       (SascarClient SOAP — INTOCADO)
├── types.ts                        (SascarCredentials — reusado)
├── errors.ts                       (SascarApiError base — reusado)
├── queue.ts                        (AsyncQueue — reusado)
├── index.ts                        (atualizado: re-exporta src/xmlrpc/index.ts)
└── xmlrpc/                         (NOVO MÓDULO)
    ├── client.ts                   (SascarXmlRpcClient — classe principal)
    ├── envelope.ts                 (buildMethodCall, escapeXml)
    ├── parser.ts                   (parseMethodResponse, parseMethodFault)
    ├── transport.ts                (sendXmlRpcRequest com retry/timeout)
    ├── errors.ts                   (SascarXmlRpcError extends SascarApiError)
    ├── types.ts                    (XmlRpcCommandResult, ComandoStatus, etc.)
    └── index.ts                    (barrel: exporta classe + tipos)
```

### URLs (do manual, seção 2.3)

| Endpoint | Usado por |
|----------|-----------|
| `https://xmlrpc.sascar.com.br/xmlrpc/enviar_comando` | `posicao`, `bloqueio`, `desbloqueio`, `atuador`, `texto`, `transmissao_ignicao_desligada`, `gerar_contra_senha`, `gerar_contra_senha_mtc600`, `reset_undo_alarme`, `modoSeguro`, `inibir_sensor`, `analise_satelital`, `relatorio_satelital`, `relatorio`, `listar_comandos`, `status_ticket` (padrão — manual seção 2.3) |
| `https://xmlrpc.sascar.com.br/xmlrpc/operacao` | `inicializar_operacao`, `finalizar_operacao`, `vincular_rota`, `vincular_alerta_avd`, `desvincular_alerta_avd`, todos os `embarcar_*` e `desembarcar_*` |

A configuração de URL é exposta via `SascarXmlRpcClientOptions.comandoUrl`
e `.operacaoUrl`.

## Interface pública

### Classe e opções

```typescript
export interface SascarXmlRpcClientOptions {
  timeoutMs?: number;        // default 30000
  maxRetries?: number;       // default 3 (5xx + erros de rede)
  comandoUrl?: string;       // default: https://xmlrpc.sascar.com.br/xmlrpc/comando
  operacaoUrl?: string;      // default: https://xmlrpc.sascar.com.br/xmlrpc/operacao
  positionMutex?: boolean;   // default true (recomendado manual 3.2.2)
}

export class SascarXmlRpcClient {
  constructor(credentials?: SascarCredentials, options?: SascarXmlRpcClientOptions);
}
```

### Helpers de alto nível (5)

```typescript
bloquearVeiculo(placa: string): Promise<XmlRpcCommandResult>;
desbloquearVeiculo(placa: string): Promise<XmlRpcCommandResult>;
enviarMensagem(placa: string, mensagem: string, ticket?: number): Promise<XmlRpcCommandResult>;
alternarAtuador(placa: string, idAtuador: number, estado: 'on' | 'off'): Promise<XmlRpcCommandResult>;
aguardarComando(
  ticket: number,
  placa: string,
  opts?: { timeoutMs?: number; pollIntervalMs?: number }
): Promise<ComandoStatusFinal>;
```

### Métodos 1:1 com o manual (34)

Agrupados por categoria do sumário 2.5 do manual:

| § | methodName | Assinatura TypeScript |
|---|------------|----------------------|
| 2.5.1 | `posicao` | `(idVeiculo) => Promise<XmlRpcPosicaoResult>` |
| 2.5.2 | `bloqueio` | `(idVeiculo) => Promise<XmlRpcCommandResult>` |
| 2.5.3 | `desbloqueio` | `(idVeiculo) => Promise<XmlRpcCommandResult>` |
| 2.5.4 | `atuador` | `(idVeiculo, idsAtuadores, estado) => Promise<XmlRpcCommandResult>` |
| 2.5.5 | `texto` | `(idVeiculo, mensagem, ticket?) => Promise<XmlRpcCommandResult>` |
| 2.5.6 | `transmissao_ignicao_desligada` | `(idVeiculo, estado) => Promise<XmlRpcCommandResult>` |
| 2.5.7 | `listar_comandos` | `(idVeiculo, quantidade, dataInicial, dataFinal) => Promise<ComandoEnviado[]>` (datas formato `mm/dd/aaaa hh:mm` conforme manual) |
| 2.5.8 | `reset_undo_alarme` | `(idVeiculo) => Promise<XmlRpcCommandResult>` |
| 2.5.9 | `gerar_contra_senha` | `(idVeiculo) => Promise<XmlRpcSenhaResult>` |
| 2.5.10 | `gerar_contra_senha_mtc600` | `(idVeiculo) => Promise<XmlRpcSenhaResult>` |
| 2.5.11 | `analise_satelital` | `(idVeiculo, intervaloSegundos) => Promise<XmlRpcCommandResult>` |
| 2.5.12 | `relatorio_satelital` | `(idVeiculo, intervaloSegundos) => Promise<XmlRpcCommandResult>` |
| 2.5.13 | `relatorio` | `(idVeiculo, tempoSegundos) => Promise<XmlRpcCommandResult>` |
| 2.5.14 | `inibir_sensor` | `(idVeiculo, ids, acao: 0 \| 1) => Promise<XmlRpcCommandResult>` |
| 2.5.15 | `modoSeguro` | `(idVeiculo, ativar: boolean) => Promise<XmlRpcCommandResult>` |
| 2.5.16–2.5.28 | `embarcar_*` e `desembarcar_*` (12 métodos) | cada um `(idVeiculo, idLayout?) => Promise<XmlRpcCommandResult>` |
| 2.5.29 | `status_ticket` | `(ticketConsulta, ticketInterno) => Promise<ComandoStatus[]>` |
| 2.5.30 | `vincular_alerta_avd` | `(idVeiculo, idAlertaAvd) => Promise<XmlRpcCommandResult>` |
| 2.5.31 | `desvincular_alerta_avd` | `(idVeiculo, idAlertaAvd) => Promise<XmlRpcCommandResult>` |
| 2.5.32 | `inicializar_operacao` | `(placas) => Promise<XmlRpcOperacaoResult>` |
| 2.5.33 | `finalizar_operacao` | `(placas) => Promise<XmlRpcOperacaoResult>` |
| 2.5.34 | `vincular_rota` | `(placas, idRota) => Promise<XmlRpcOperacaoResult>` |

## Tipos de retorno

```typescript
// Resultado padrão da maioria dos comandos
export interface XmlRpcCommandResult {
  resultados: Record<number, string>;  // idVeiculo → code string ("1".."7")
  ticketServidor: number;               // interno, usar com status_ticket
  placasProcessadas: string[];
}

// Para operacao/vincular_rota (mapa de mensagens de erro)
export interface XmlRpcOperacaoResult extends XmlRpcCommandResult {
  mensagens: Record<string, string>;    // placa → mensagem de erro
}

// posicao()
export interface XmlRpcPosicaoResult {
  placa: string;
  dataPosicao: string;
  dataPacote: string;
  latitude: number;
  longitude: number;
  direcao: number;
  velocidade: number;
  ignicao: number;
  extras: Record<string, string | number>;
}

// gerar_contra_senha*
export interface XmlRpcSenhaResult extends XmlRpcCommandResult {
  senha: string;                        // 6 dígitos TD40/TD50 ou MTC600
}

// listar_comandos
export interface ComandoEnviado {
  dataEnvio: string;                    // mm/dd/aaaa hh:mm
  methodName: string;
  parametros: Record<string, string>;
  status: number;                       // 1..7
  statusDescricao: string;
  ticketServidor: number;
}

// status_ticket
export interface ComandoStatus {
  ticket: number;
  dataExecucao: string;
  status: number;                       // 1..7
  statusDescricao: string;
  mensagem?: string;
}

// aguardarComando (saída convergente)
export interface ComandoStatusFinal {
  ticket: number;
  status: 1 | 2;                        // 1 executado, 2 recusado
  statusDescricao: string;
  tentativas: number;
  duracaoMs: number;
}
```

### Tabela de status (manual 2.4.1)

| code | tipo | descrição |
|---|---|---|
| 1 | COMANDO_EXECUTADO | Comando executado com sucesso |
| 2 | COMANDO_RECUSADO | Comando falhou ao executar |
| 3 | NAO_PROCESSADO | Aguardando processamento |
| 4 | INIBIDO | Comando inibido pelo portal |
| 5 | COMANDO_CANCELADO | Cancelado |
| 6 | COMANDO_PENDENTE | Pendente de envio |
| 7 | COMANDO_EXECUTADO_SEM_RETORNO | Executado mas sem status_ticket |

## Erros

```typescript
export class SascarXmlRpcError extends SascarApiError {
  constructor(
    message: string,
    public readonly methodName: string,
    public readonly rawFault?: XmlRpcFault
  );
}

export interface XmlRpcFault {
  faultCode: number;
  faultString: string;
}
```

O consumidor pode fazer `try { ... } catch (e) { if (e instanceof SascarApiError) ... }`
e capturar erros de ambos os protocolos com uma única classe base.

## Estratégia de testes

### Fixtures (`tests/__fixtures__/xmlrpc/`)

10+ XMLs gravados cobrindo cada método + variantes:
- sucesso (code=1) e recusado (code=2) para cada categoria
- fault XML-RPC (tag `<fault>`)
- resposta vazia
- respostas multi-item (listar_comandos com 3 itens, inicializar_operacao com 5 placas)
- método com senha (gerar_contra_senha)

### Cobertura

| Arquivo | Casos | Cobertura |
|---------|-------|-----------|
| `tests/xmlrpc/envelope.test.ts` | 6 | escape, params string/number/array, header, login/password |
| `tests/xmlrpc/parser.test.ts` | 8 | sucesso, code=1/2, ticket, fault, senha, mensagens, vazio |
| `tests/xmlrpc/transport.test.ts` | 5 | retry 5xx, timeout, ECONNRESET, mutex, headers |
| `tests/xmlrpc/client.test.ts` | ~70 | 1-2 por método (34 métodos × 1-2 cenários) |
| `tests/xmlrpc/helpers.test.ts` | ~15 | 5 helpers × 3 cenários |
| `tests/xmlrpc/aguardarComando.test.ts` | 4 | convergiu, timeout, status=1, status=2 |
| **Total** | **~108** | — |

**Total geral do projeto:** 94 atuais + ~108 novos = **~202 testes**.

### Princípios

- Mesma config `jest.config.ts` (sem mudanças).
- Mocka `fetch` (igual ao módulo SOAP faz com a camada de transport).
- Cada teste lê sua fixture e afirma shape exato do retorno.
- Zero `any` em código de produção e de teste.

## Exemplo de uso público (entra no README)

```typescript
import { SascarXmlRpcClient } from 'sascar-sdk/xmlrpc';

const xmlrpc = new SascarXmlRpcClient({ usuario: 'user', senha: 'pass' });

// 1. Bloquear veículo (helper)
const { ticketServidor } = await xmlrpc.bloquearVeiculo(2248181);

// 2. Aguardar execução
const status = await xmlrpc.aguardarComando(ticketServidor, 2248181, {
  timeoutMs: 60_000,
  pollIntervalMs: 3_000
});
console.log(status.status === 1 ? 'Bloqueado!' : 'Recusado');

// 3. Ou usar método 1:1 do manual
const result = await xmlrpc.bloqueio(2248181);
console.log(result.resultados); // { 2248181: '1' }

// 4. Atuador arbitrário
await xmlrpc.atuador(2248181, [240], 'on'); // sirene on
await new Promise(r => setTimeout(r, 5000));
await xmlrpc.atuador(2248181, [240], 'off');
```

## Compatibilidade e migração

- **Sem breaking changes**: `SascarClient` (SOAP) não é tocado.
- **Novo entry point**: `sascar-sdk/xmlrpc` (subpath export em `package.json`).
- **Default export** no `index.ts` raiz: re-exporta a classe para `import { SascarXmlRpcClient } from 'sascar-sdk'`.
- **Dependências**: zero novas — usa `fetch` nativo (Node 18+ / Bun 1+), igual ao SOAP.

## Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| URLs Sascar mudam | URLs expostas em `SascarXmlRpcClientOptions` para override |
| Comportamento de polling do `status_ticket` (status 3/4/5/6/7) | `aguardarComando` considera sucesso apenas status 1; recusa em 2; timeout para os demais (configurável) |
| Mutex em `posicao` quebra paralelismo de outros comandos | Mutex opcional via `positionMutex: false`; default true conforme manual |
| **Credenciais do SOAP não funcionarem no XML-RPC (CONFIRMADO em teste live 2026-06-17)** | A SDK está correta. O servidor retorna `faultCode 6: Erro na autenticacao` quando a gerenciadora não tem perfil "comandos remotos". Usuário precisa solicitar à Sascar (vide README seção "Permissões necessárias"). Verificar com `obterTipoComando` antes de tentar. |

## Validação em produção (2026-06-17)

Após a v1.1.0, foi feito teste live contra `https://xmlrpc.sascar.com.br`. **Três bugs críticos** foram encontrados e corrigidos na v1.1.1:

1. **URL errada**: `/xmlrpc/comando` retornava 404. Manual seção 2.3 diz `/xmlrpc/enviar_comando`. ✅ Corrigido.
2. **Tipo errado**: métodos usavam `idVeiculo: number` mas servidor espera `placa: string`. ✅ Corrigido (todas 34+5 assinaturas).
3. **Membro `<name>ticket</name>` ausente**: server rejeitava com "Ticket Inválido". ✅ Adicionado: SDK auto-gera ticket 0..2147483647 e o envia como named param.

Após a v1.1.1, o request é aceito pelo servidor. A falha de `faultCode 6` em seguida é conta, não código. A SDK funciona imediatamente após a Sascar habilitar o perfil XML-RPC.

## Critérios de "pronto"

1. Todos os 34 métodos 1:1 + 5 helpers implementados.
2. ~108 testes novos passando, total ~202.
3. Zero `any` em produção (lint passa).
4. README atualizado com seção "Comandos XML-RPC" + exemplo.
5. `npm run build` sem warnings.
6. `npm test` verde em todas as suites (SOAP + XML-RPC).
7. Compilação TypeScript sem `// @ts-ignore` ou `as any`.
