import { AsyncQueue } from '../queue';
import { buildMethodCall } from './envelope';
import { parseMethodResponse, type ParsedResponse } from './parser';
import { sendXmlRpcRequest } from './transport';
import { SASCAR_XMLRPC_URLS, type SascarComandoEnviado, type SascarComandoStatus, type SascarComandoStatusFinal, type SascarXmlRpcCommandResult, type SascarXmlRpcOperacaoResult, type SascarXmlRpcParam, type SascarXmlRpcPosicaoResult, type SascarXmlRpcSenhaResult } from './types';
import type { SascarCredentials } from '../types';

export interface SascarXmlRpcClientOptions {
  timeoutMs?: number;
  maxRetries?: number;
  enviarComandoUrl?: string;
  operacaoUrl?: string;
  /** Mutex para comandos de posição. Default true (manual seção 3.2.2). */
  positionMutex?: boolean;
}

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 3;

export class SascarXmlRpcClient {
  private readonly login: string;
  private readonly password: string;
  private readonly enviarComandoUrl: string;
  private readonly operacaoUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly positionMutex: boolean;
  private readonly positionsQueue = new AsyncQueue();

  constructor(credentials?: SascarCredentials, options?: SascarXmlRpcClientOptions) {
    this.login = credentials?.usuario || process.env.SASCAR_USUARIO || '';
    this.password = credentials?.senha || process.env.SASCAR_SENHA || '';
    this.enviarComandoUrl = options?.enviarComandoUrl || SASCAR_XMLRPC_URLS.enviarComando;
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
    isPosition = false,
    ticketCliente?: number
  ): Promise<ParsedResponse & { ticketCliente: number }> {
    // Apenas 5 comandos do manual v3.5 vão para /xmlrpc/operacao (seções 2.5.30–2.5.34).
    // Todos os outros (incluindo embarcar_*/desembarcar_*) vão para /xmlrpc/enviar_comando.
    const isOperacao = methodName === 'vincular_alerta_avd'
      || methodName === 'desvincular_alerta_avd'
      || methodName === 'inicializar_operacao'
      || methodName === 'finalizar_operacao'
      || methodName === 'vincular_rota';
    const url = isOperacao ? this.operacaoUrl : this.enviarComandoUrl;

    // Gera ticket cliente se não foi fornecido (manual seção 2.5: "ticket" vai no request).
    const ticket = ticketCliente ?? Math.floor(Math.random() * 2_147_483_647);

    const xml = buildMethodCall(methodName, params, this.login, this.password, [
      { name: 'ticket', value: ticket }
    ]);
    const execute = async (): Promise<ParsedResponse & { ticketCliente: number }> => {
      const text = await sendXmlRpcRequest(xml, {
        url,
        timeoutMs: this.timeoutMs,
        maxRetries: this.maxRetries
      });
      return { ...(await parseMethodResponse(text)), ticketCliente: ticket };
    };

    if (isPosition && this.positionMutex) {
      return this.positionsQueue.enqueue(execute);
    }
    return execute();
  }

  private toCommandResult(parsed: ParsedResponse & { ticketCliente: number }): SascarXmlRpcCommandResult {
    return {
      ticketServidor: parsed.ticketServidor ?? '',
      statusComando: parsed.statusComando ?? undefined,
      ticketCliente: parsed.ticketCliente
    };
  }

  // ====== 2.5.2 BLOQUEIO ======
  async bloqueio(placa: string): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('bloqueio', [placa]));
  }

  // ====== 2.5.3 DESBLOQUEIO ======
  async desbloqueio(placa: string): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('desbloqueio', [placa]));
  }

  // ====== 2.5.8 RESET DE ALARME ======
  async reset_undo_alarme(placa: string): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('reset_undo_alarme', [placa]));
  }

  // ====== 2.5.4 ATUAÇÃO DE SAÍDAS ======
  async atuador(
    placa: string,
    idsAtuadores: number[],
    estado: 'on' | 'off'
  ): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('atuador', [placa, idsAtuadores, estado]));
  }

  // ====== 2.5.5 ENVIO DE MENSAGEM DE TEXTO ======
  async texto(
    placa: string,
    mensagem: string,
    ticket?: number
  ): Promise<SascarXmlRpcCommandResult> {
    const params: SascarXmlRpcParam[] = [placa, mensagem];
    if (ticket !== undefined) params.push(ticket);
    return this.toCommandResult(await this.send('texto', params));
  }

  // ====== 2.5.6 TRANSMISSÃO COM IGNIÇÃO DESLIGADA ======
  async transmissao_ignicao_desligada(
    placa: string,
    estado: 'on' | 'off'
  ): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('transmissao_ignicao_desligada', [placa, estado]));
  }

  // ====== 2.5.14 INIBIÇÃO DE SENSORES ======
  async inibir_sensor(
    placa: string,
    ids: number[],
    acao: 0 | 1
  ): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('inibir_sensor', [placa, ids, acao]));
  }

  // ====== 2.5.15 MODO SEGURO ======
  async modoSeguro(placa: string, ativar: boolean): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('modoSeguro', [placa, ativar]));
  }

  // ====== 2.5.11 INTERVALO DE ANÁLISE SATELITAL ======
  async analise_satelital(placa: string, intervaloSegundos: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('analise_satelital', [placa, intervaloSegundos]));
  }

  // ====== 2.5.12 INTERVALO DE TRANSMISSÃO SATELITAL ======
  async relatorio_satelital(placa: string, intervaloSegundos: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('relatorio_satelital', [placa, intervaloSegundos]));
  }

  // ====== 2.5.13 TEMPO DE TRANSMISSÃO GPRS ======
  async relatorio(placa: string, tempoSegundos: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('relatorio', [placa, tempoSegundos]));
  }

  // ====== 2.5.10 GERAR CONTRA SENHA MTC600 ======
  async gerar_contra_senha_mtc600(placa: string): Promise<SascarXmlRpcSenhaResult> {
    const parsed = await this.send('gerar_contra_senha_mtc600', [placa]);
    return { senha: parsed.senha ?? '', ticketCliente: parsed.ticketCliente };
  }

  // ====== 2.5.9 GERAR CONTRA SENHA TD40/TMCD ======
  async gerar_contra_senha(placa: string): Promise<SascarXmlRpcSenhaResult> {
    const parsed = await this.send('gerar_contra_senha', [placa]);
    return { senha: parsed.senha ?? '', ticketCliente: parsed.ticketCliente };
  }

  // ====== 2.5.1 POSIÇÃO (usa mutex) ======
  async posicao(placa: string): Promise<SascarXmlRpcPosicaoResult> {
    const parsed = await this.send('posicao', [placa], true);
    if (!parsed.posicao) {
      throw new Error('Resposta de posicao() inválida (sem campos obrigatórios).');
    }
    return parsed.posicao;
  }

  // ====== 2.5.29 STATUS TICKET ======
  async status_ticket(ticketConsulta: number, ticketServidor: string): Promise<SascarComandoStatus[]> {
    const parsed = await this.send('status_ticket', [ticketConsulta, ticketServidor]);
    return parsed.comandos.map((c): SascarComandoStatus => ({
      ticket: c.ticketServidor,
      dataExecucao: c.dataEnvio,
      status: c.status,
      statusDescricao: c.statusDescricao
    }));
  }

  // ====== 2.5.7 LISTAGEM DE COMANDOS ENVIADOS ======
  async listar_comandos(
    placa: string,
    quantidade: number,
    dataInicial: string,
    dataFinal: string
  ): Promise<SascarComandoEnviado[]> {
    const parsed = await this.send('listar_comandos', [placa, quantidade, dataInicial, dataFinal]);
    return parsed.comandos;
  }

  // ====== 2.5.30 VINCULAR ALERTA AVD ======
  async vincular_alerta_avd(placa: string, idAlertaAvd: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('vincular_alerta_avd', [placa, idAlertaAvd]));
  }

  // ====== 2.5.31 DESVINCULAR ALERTA AVD ======
  async desvincular_alerta_avd(placa: string, idAlertaAvd: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('desvincular_alerta_avd', [placa, idAlertaAvd]));
  }

  // ====== 2.5.32 INICIALIZAR OPERAÇÃO ======
  async inicializar_operacao(placas: string[]): Promise<SascarXmlRpcOperacaoResult> {
    const parsed = await this.send('inicializar_operacao', [placas]);
    return { ...this.toCommandResult(parsed), mensagens: parsed.mensagens };
  }

  // ====== 2.5.33 FINALIZAR OPERAÇÃO ======
  async finalizar_operacao(placas: string[]): Promise<SascarXmlRpcOperacaoResult> {
    const parsed = await this.send('finalizar_operacao', [placas]);
    return { ...this.toCommandResult(parsed), mensagens: parsed.mensagens };
  }

  // ====== 2.5.34 VINCULAR ROTA ======
  async vincular_rota(placas: string[], idRota: number): Promise<SascarXmlRpcOperacaoResult> {
    const parsed = await this.send('vincular_rota', [placas, idRota]);
    return { ...this.toCommandResult(parsed), mensagens: parsed.mensagens };
  }

  // ====== 2.5.16–2.5.27 EMBARCAR LAYOUTS ======
  async embarcar_layout_acao_embarcada_avd(placa: string, idLayout: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_layout_acao_embarcada_avd', [placa, idLayout]));
  }
  async embarcar_layout_grupo_ponto(placa: string, idLayout: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_layout_grupo_ponto', [placa, idLayout]));
  }
  async embarcar_motorista(placa: string, idMotorista: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_motorista', [placa, idMotorista]));
  }
  async embarcar_layout_tmcd(placa: string, idLayout: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_layout_tmcd', [placa, idLayout]));
  }
  async embarcar_layout_td40(placa: string, idLayout: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_layout_td40', [placa, idLayout]));
  }
  async embarcar_layout_td50(placa: string, idLayout: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_layout_td50', [placa, idLayout]));
  }
  async embarcar_sequenciamento_td50(placa: string, idLayout: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_sequenciamento_td50', [placa, idLayout]));
  }
  async embarcar_sequenciamento_macro_sasmdt(placa: string, idLayout: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_sequenciamento_macro_sasmdt', [placa, idLayout]));
  }
  async embarcar_layout_grupo_area_avd(placa: string, idLayout: number): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('embarcar_layout_grupo_area_avd', [placa, idLayout]));
  }

  // ====== 2.5.17/19/28 DESEMBARCAR LAYOUTS ======
  async desembarcar_layout_acao_embarcada_avd(placa: string): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('desembarcar_layout_acao_embarcada_avd', [placa]));
  }
  async desembarcar_layout_grupo_ponto(placa: string): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('desembarcar_layout_grupo_ponto', [placa]));
  }
  async desembarcar_layout_grupo_area_avd(placa: string): Promise<SascarXmlRpcCommandResult> {
    return this.toCommandResult(await this.send('desembarcar_layout_grupo_area_avd', [placa]));
  }

  // ====== HELPERS DE ALTO NÍVEL ======

  /** Helper: envia comando de bloqueio. */
  async bloquearVeiculo(placa: string): Promise<SascarXmlRpcCommandResult> {
    return this.bloqueio(placa);
  }

  /** Helper: envia comando de desbloqueio. */
  async desbloquearVeiculo(placa: string): Promise<SascarXmlRpcCommandResult> {
    return this.desbloqueio(placa);
  }

  /** Helper: envia texto para o display do veículo. */
  async enviarMensagem(placa: string, mensagem: string, ticket?: number): Promise<SascarXmlRpcCommandResult> {
    return this.texto(placa, mensagem, ticket);
  }

  /** Helper: alterna estado de um atuador. */
  async alternarAtuador(
    placa: string,
    idAtuador: number,
    estado: 'on' | 'off'
  ): Promise<SascarXmlRpcCommandResult> {
    return this.atuador(placa, [idAtuador], estado);
  }

  /**
   * Aguarda a execução (ou recusa) de um comando via polling em status_ticket.
   * Retorna apenas quando status converge para 1 (executado) ou 2 (recusado),
   * ou lança timeout se `timeoutMs` for atingido.
   */
  async aguardarComando(
    ticketServidor: string,
    placa: string,
    opts?: { timeoutMs?: number; pollIntervalMs?: number; ticketCliente?: number }
  ): Promise<SascarComandoStatusFinal> {
    const timeoutMs = opts?.timeoutMs ?? 60_000;
    const pollIntervalMs = opts?.pollIntervalMs ?? 3_000;
    const start = Date.now();
    let tentativas = 0;
    const ticketCliente = opts?.ticketCliente ?? 0;

    while (Date.now() - start < timeoutMs) {
      tentativas++;
      const statuses = await this.status_ticket(ticketCliente, ticketServidor);
      const match = statuses.find((s) => s.ticket === ticketServidor) ?? statuses[0];
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
      await new Promise((res) => setTimeout(res, pollIntervalMs));
    }

    throw new Error(`Timeout aguardando ticket ${ticketServidor} após ${timeoutMs}ms (${tentativas} tentativas).`);
  }
}
