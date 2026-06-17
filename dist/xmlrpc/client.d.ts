import { type SascarComandoEnviado, type SascarComandoStatus, type SascarComandoStatusFinal, type SascarXmlRpcCommandResult, type SascarXmlRpcOperacaoResult, type SascarXmlRpcPosicaoResult, type SascarXmlRpcSenhaResult } from './types';
import type { SascarCredentials } from '../types';
export interface SascarXmlRpcClientOptions {
    timeoutMs?: number;
    maxRetries?: number;
    enviarComandoUrl?: string;
    operacaoUrl?: string;
    /** Mutex para comandos de posição. Default true (manual seção 3.2.2). */
    positionMutex?: boolean;
}
export declare class SascarXmlRpcClient {
    private readonly login;
    private readonly password;
    private readonly enviarComandoUrl;
    private readonly operacaoUrl;
    private readonly timeoutMs;
    private readonly maxRetries;
    private readonly positionMutex;
    private readonly positionsQueue;
    constructor(credentials?: SascarCredentials, options?: SascarXmlRpcClientOptions);
    private send;
    private toCommandResult;
    bloqueio(placa: string): Promise<SascarXmlRpcCommandResult>;
    desbloqueio(placa: string): Promise<SascarXmlRpcCommandResult>;
    reset_undo_alarme(placa: string): Promise<SascarXmlRpcCommandResult>;
    atuador(placa: string, idsAtuadores: number[], estado: 'on' | 'off'): Promise<SascarXmlRpcCommandResult>;
    texto(placa: string, mensagem: string, ticket?: number): Promise<SascarXmlRpcCommandResult>;
    transmissao_ignicao_desligada(placa: string, estado: 'on' | 'off'): Promise<SascarXmlRpcCommandResult>;
    inibir_sensor(placa: string, ids: number[], acao: 0 | 1): Promise<SascarXmlRpcCommandResult>;
    modoSeguro(placa: string, ativar: boolean): Promise<SascarXmlRpcCommandResult>;
    analise_satelital(placa: string, intervaloSegundos: number): Promise<SascarXmlRpcCommandResult>;
    relatorio_satelital(placa: string, intervaloSegundos: number): Promise<SascarXmlRpcCommandResult>;
    relatorio(placa: string, tempoSegundos: number): Promise<SascarXmlRpcCommandResult>;
    gerar_contra_senha_mtc600(placa: string): Promise<SascarXmlRpcSenhaResult>;
    gerar_contra_senha(placa: string): Promise<SascarXmlRpcSenhaResult>;
    posicao(placa: string): Promise<SascarXmlRpcPosicaoResult>;
    status_ticket(ticketConsulta: number, ticketServidor: string): Promise<SascarComandoStatus[]>;
    listar_comandos(placa: string, quantidade: number, dataInicial: string, dataFinal: string): Promise<SascarComandoEnviado[]>;
    vincular_alerta_avd(placa: string, idAlertaAvd: number): Promise<SascarXmlRpcCommandResult>;
    desvincular_alerta_avd(placa: string, idAlertaAvd: number): Promise<SascarXmlRpcCommandResult>;
    inicializar_operacao(placas: string[]): Promise<SascarXmlRpcOperacaoResult>;
    finalizar_operacao(placas: string[]): Promise<SascarXmlRpcOperacaoResult>;
    vincular_rota(placas: string[], idRota: number): Promise<SascarXmlRpcOperacaoResult>;
    embarcar_layout_acao_embarcada_avd(placa: string, idLayout: number): Promise<SascarXmlRpcCommandResult>;
    embarcar_layout_grupo_ponto(placa: string, idLayout: number): Promise<SascarXmlRpcCommandResult>;
    embarcar_motorista(placa: string, idMotorista: number): Promise<SascarXmlRpcCommandResult>;
    embarcar_layout_tmcd(placa: string, idLayout: number): Promise<SascarXmlRpcCommandResult>;
    embarcar_layout_td40(placa: string, idLayout: number): Promise<SascarXmlRpcCommandResult>;
    embarcar_layout_td50(placa: string, idLayout: number): Promise<SascarXmlRpcCommandResult>;
    embarcar_sequenciamento_td50(placa: string, idLayout: number): Promise<SascarXmlRpcCommandResult>;
    embarcar_sequenciamento_macro_sasmdt(placa: string, idLayout: number): Promise<SascarXmlRpcCommandResult>;
    embarcar_layout_grupo_area_avd(placa: string, idLayout: number): Promise<SascarXmlRpcCommandResult>;
    desembarcar_layout_acao_embarcada_avd(placa: string): Promise<SascarXmlRpcCommandResult>;
    desembarcar_layout_grupo_ponto(placa: string): Promise<SascarXmlRpcCommandResult>;
    desembarcar_layout_grupo_area_avd(placa: string): Promise<SascarXmlRpcCommandResult>;
    /** Helper: envia comando de bloqueio. */
    bloquearVeiculo(placa: string): Promise<SascarXmlRpcCommandResult>;
    /** Helper: envia comando de desbloqueio. */
    desbloquearVeiculo(placa: string): Promise<SascarXmlRpcCommandResult>;
    /** Helper: envia texto para o display do veículo. */
    enviarMensagem(placa: string, mensagem: string, ticket?: number): Promise<SascarXmlRpcCommandResult>;
    /** Helper: alterna estado de um atuador. */
    alternarAtuador(placa: string, idAtuador: number, estado: 'on' | 'off'): Promise<SascarXmlRpcCommandResult>;
    /**
     * Aguarda a execução (ou recusa) de um comando via polling em status_ticket.
     * Retorna apenas quando status converge para 1 (executado) ou 2 (recusado),
     * ou lança timeout se `timeoutMs` for atingido.
     */
    aguardarComando(ticketServidor: string, placa: string, opts?: {
        timeoutMs?: number;
        pollIntervalMs?: number;
        ticketCliente?: number;
    }): Promise<SascarComandoStatusFinal>;
}
