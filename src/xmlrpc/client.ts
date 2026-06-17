import { AsyncQueue } from '../queue';
import { buildMethodCall } from './envelope';
import { parseMethodResponse, type ParsedResponse } from './parser';
import { sendXmlRpcRequest } from './transport';
import { SASCAR_XMLRPC_URLS, type SascarXmlRpcCommandResult, type SascarXmlRpcParam } from './types';
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
    this.comandoUrl = options?.comandoUrl || SASCAR_XMLRPC_URLS.comando;
    this.operacaoUrl = options?.operacaoUrl || SASCAR_XMLRPC_URLS.operacao;
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.positionMutex = options?.positionMutex ?? true;

    if (!this.login || !this.password) {
      throw new Error('Credenciais da SASCAR não fornecidas.');
    }
  }

  private async send(
    methodName: string,
    params: SascarXmlRpcParam[],
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

  private toCommandResult(parsed: ParsedResponse): SascarXmlRpcCommandResult {
    return {
      resultados: parsed.resultados,
      ticketServidor: parsed.ticketServidor ?? 0,
      placasProcessadas: Object.keys(parsed.resultados).map((k) => `idVeiculo=${k}`)
    };
  }

  // ====== 2.5.2 BLOQUEIO ======
  async bloqueio(idVeiculo: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('bloqueio', [idVeiculo]));
  }

  // ====== 2.5.3 DESBLOQUEIO ======
  async desbloqueio(idVeiculo: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('desbloqueio', [idVeiculo]));
  }

  // ====== 2.5.8 RESET DE ALARME ======
  async reset_undo_alarme(idVeiculo: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('reset_undo_alarme', [idVeiculo]));
  }
}
