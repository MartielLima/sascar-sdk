import { XMLParser } from 'fast-xml-parser';
import { SascarXmlRpcError, type SascarXmlRpcFault } from './errors';
import type { SascarComandoEnviado, SascarXmlRpcPosicaoResult } from './types';

const parser = new XMLParser({
  ignoreAttributes: true,
  removeNSPrefix: true,
  parseTagValue: true,
  parseAttributeValue: true
});

export interface ParsedResponse {
  ticketServidor: string | null;
  statusComando: string | null;
  senha: string | null;
  mensagens: Record<string, string>;
  comandos: SascarComandoEnviado[];
  posicao: SascarXmlRpcPosicaoResult | null;
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
  const rawFault: SascarXmlRpcFault = { faultCode: code, faultString: str };
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
    return { ticketServidor: null, statusComando: null, senha: null, mensagens: {}, comandos: [], posicao: null };
  }

  const value = param.value;
  const empty: ParsedResponse = {
    ticketServidor: null,
    statusComando: null,
    senha: null,
    mensagens: {},
    comandos: [],
    posicao: null
  };

  if (value?.array?.data?.value !== undefined) {
    const items = asArray(value.array.data.value);
    const comandos: SascarComandoEnviado[] = items.map((item) => {
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
        ticketServidor: asString(out.ticketServidor)
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
        idVeiculo: asString(fields.idVeiculo), // pode ser placa (string) ou idVeiculo (número, raro)
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

  // Caso padrão: ticketServidor (string) + opcionalmente statusComando + senha
  let ticketServidor: string | null = null;
  let statusComando: string | null = null;
  let senha: string | null = null;
  const mensagens: Record<string, string> = {};

  for (const [k, v] of Object.entries(fields)) {
    if (k === 'ticketServidor') ticketServidor = asString(v);
    else if (k === 'statusComando') statusComando = asString(v);
    else if (k === 'senha') senha = asString(v);
    else if (k === 'mensagens' && typeof v === 'object' && v !== null) {
      Object.assign(mensagens, v as Record<string, string>);
    }
  }

  return { ticketServidor, statusComando, senha, mensagens, comandos: [], posicao: null };
}