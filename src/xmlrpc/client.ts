import { AsyncQueue } from '../queue';
import { buildMethodCall } from './envelope';
import { parseMethodResponse, type ParsedResponse } from './parser';
import { sendXmlRpcRequest } from './transport';
import { SASCAR_XMLRPC_URLS, type SascarXmlRpcCommandResult, type SascarXmlRpcParam, type SascarXmlRpcPosicaoResult, type SascarXmlRpcSenhaResult } from './types';
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

  // ====== 2.5.4 ATUAÇÃO DE SAÍDAS ======
  async atuador(
    idVeiculo: number,
    idsAtuadores: number[],
    estado: 'on' | 'off'
  ): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('atuador', [idVeiculo, idsAtuadores, estado]));
  }

  // ====== 2.5.5 ENVIO DE MENSAGEM DE TEXTO ======
  async texto(
    idVeiculo: number,
    mensagem: string,
    ticket?: number
  ): Promise<SascarXmlRpcCommandResult> {
    const params: SascarXmlRpcParam[] = [idVeiculo, mensagem];
    if (ticket !== undefined) params.push(ticket);
    return this.toCommandResult(await this.send('texto', params));
  }

  // ====== 2.5.6 TRANSMISSÃO COM IGNIÇÃO DESLIGADA ======
  async transmissao_ignicao_desligada(
    idVeiculo: number,
    estado: 'on' | 'off'
  ): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('transmissao_ignicao_desligada', [idVeiculo, estado]));
  }

  // ====== 2.5.14 INIBIÇÃO DE SENSORES ======
  async inibir_sensor(
    idVeiculo: number,
    ids: number[],
    acao: 0 | 1
  ): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('inibir_sensor', [idVeiculo, ids, acao]));
  }

  // ====== 2.5.15 MODO SEGURO ======
  async modoSeguro(idVeiculo: number, ativar: boolean): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('modoSeguro', [idVeiculo, ativar]));
  }

  // ====== 2.5.11 INTERVALO DE ANÁLISE SATELITAL ======
  async analise_satelital(idVeiculo: number, intervaloSegundos: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('analise_satelital', [idVeiculo, intervaloSegundos]));
  }

  // ====== 2.5.12 INTERVALO DE TRANSMISSÃO SATELITAL ======
  async relatorio_satelital(idVeiculo: number, intervaloSegundos: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('relatorio_satelital', [idVeiculo, intervaloSegundos]));
  }

  // ====== 2.5.13 TEMPO DE TRANSMISSÃO GPRS ======
  async relatorio(idVeiculo: number, tempoSegundos: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('relatorio', [idVeiculo, tempoSegundos]));
  }

  // ====== 2.5.10 GERAR CONTRA SENHA MTC600 ======
  async gerar_contra_senha_mtc600(idVeiculo: number): Promise<SascarXmlRpcSenhaResult> {
    const parsed = await this.send('gerar_contra_senha_mtc600', [idVeiculo]);
    return { ...this.toCommandResult(parsed), senha: parsed.senha ?? '' };
  }

  // ====== 2.5.9 GERAR CONTRA SENHA TD40/TMCD ======
  async gerar_contra_senha(idVeiculo: number): Promise<SascarXmlRpcSenhaResult> {
    const parsed = await this.send('gerar_contra_senha', [idVeiculo]);
    return { ...this.toCommandResult(parsed), senha: parsed.senha ?? '' };
  }

  // ====== 2.5.1 POSIÇÃO (usa mutex) ======
  async posicao(idVeiculo: number): Promise<SascarXmlRpcPosicaoResult> {
    const parsed = await this.send('posicao', [idVeiculo], true);
    if (!parsed.posicao) {
      throw new Error('Resposta de posicao() inválida (sem campos obrigatórios).');
    }
    return parsed.posicao;
  }
}
