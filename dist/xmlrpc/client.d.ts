import { type SascarComandoEnviado, type SascarComandoStatusFinal, type SascarXmlRpcCommandResult, type SascarXmlRpcOperacaoResult, type SascarXmlRpcPosicaoResult, type SascarXmlRpcSenhaResult } from './types';
import type { SascarCredentials } from '../types';
export interface SascarXmlRpcClientOptions {
    timeoutMs?: number;
    maxRetries?: number;
    comandoUrl?: string;
    operacaoUrl?: string;
    /** Mutex para comandos de posição. Default true (manual seção 3.2.2). */
    positionMutex?: boolean;
}
export declare class SascarXmlRpcClient {
    private readonly login;
    private readonly password;
    private readonly comandoUrl;
    private readonly operacaoUrl;
    private readonly timeoutMs;
    private readonly maxRetries;
    private readonly positionMutex;
    private readonly positionsQueue;
    constructor(credentials?: SascarCredentials, options?: SascarXmlRpcClientOptions);
    private send;
    private toCommandResult;
    bloqueio(idVeiculo: number): Promise<SascarXmlRpcCommandResult>;
    desbloqueio(idVeiculo: number): Promise<SascarXmlRpcCommandResult>;
    reset_undo_alarme(idVeiculo: number): Promise<SascarXmlRpcCommandResult>;
    atuador(idVeiculo: number, idsAtuadores: number[], estado: 'on' | 'off'): Promise<SascarXmlRpcCommandResult>;
    texto(idVeiculo: number, mensagem: string, ticket?: number): Promise<SascarXmlRpcCommandResult>;
    transmissao_ignicao_desligada(idVeiculo: number, estado: 'on' | 'off'): Promise<SascarXmlRpcCommandResult>;
    inibir_sensor(idVeiculo: number, ids: number[], acao: 0 | 1): Promise<SascarXmlRpcCommandResult>;
    modoSeguro(idVeiculo: number, ativar: boolean): Promise<SascarXmlRpcCommandResult>;
    analise_satelital(idVeiculo: number, intervaloSegundos: number): Promise<SascarXmlRpcCommandResult>;
    relatorio_satelital(idVeiculo: number, intervaloSegundos: number): Promise<SascarXmlRpcCommandResult>;
    relatorio(idVeiculo: number, tempoSegundos: number): Promise<SascarXmlRpcCommandResult>;
    gerar_contra_senha_mtc600(idVeiculo: number): Promise<SascarXmlRpcSenhaResult>;
    gerar_contra_senha(idVeiculo: number): Promise<SascarXmlRpcSenhaResult>;
    posicao(idVeiculo: number): Promise<SascarXmlRpcPosicaoResult>;
    status_ticket(ticketConsulta: number, ticketInterno: number): Promise<SascarComandoEnviado[]>;
    listar_comandos(idVeiculo: number, quantidade: number, dataInicial: string, dataFinal: string): Promise<SascarComandoEnviado[]>;
    vincular_alerta_avd(idVeiculo: number, idAlertaAvd: number): Promise<SascarXmlRpcCommandResult>;
    desvincular_alerta_avd(idVeiculo: number, idAlertaAvd: number): Promise<SascarXmlRpcCommandResult>;
    inicializar_operacao(placas: string[]): Promise<SascarXmlRpcOperacaoResult>;
    finalizar_operacao(placas: string[]): Promise<SascarXmlRpcOperacaoResult>;
    vincular_rota(placas: string[], idRota: number): Promise<SascarXmlRpcOperacaoResult>;
    embarcar_layout_acao_embarcada_avd(idVeiculo: number, idLayout: number): Promise<SascarXmlRpcCommandResult>;
    embarcar_layout_grupo_ponto(idVeiculo: number, idLayout: number): Promise<SascarXmlRpcCommandResult>;
    embarcar_motorista(idVeiculo: number, idMotorista: number): Promise<SascarXmlRpcCommandResult>;
    embarcar_layout_tmcd(idVeiculo: number, idLayout: number): Promise<SascarXmlRpcCommandResult>;
    embarcar_layout_td40(idVeiculo: number, idLayout: number): Promise<SascarXmlRpcCommandResult>;
    embarcar_layout_td50(idVeiculo: number, idLayout: number): Promise<SascarXmlRpcCommandResult>;
    embarcar_sequenciamento_td50(idVeiculo: number, idLayout: number): Promise<SascarXmlRpcCommandResult>;
    embarcar_sequenciamento_macro_sasmdt(idVeiculo: number, idLayout: number): Promise<SascarXmlRpcCommandResult>;
    embarcar_layout_grupo_area_avd(idVeiculo: number, idLayout: number): Promise<SascarXmlRpcCommandResult>;
    desembarcar_layout_acao_embarcada_avd(idVeiculo: number): Promise<SascarXmlRpcCommandResult>;
    desembarcar_layout_grupo_ponto(idVeiculo: number): Promise<SascarXmlRpcCommandResult>;
    desembarcar_layout_grupo_area_avd(idVeiculo: number): Promise<SascarXmlRpcCommandResult>;
    /** Helper: envia comando de bloqueio. */
    bloquearVeiculo(idVeiculo: number): Promise<SascarXmlRpcCommandResult>;
    /** Helper: envia comando de desbloqueio. */
    desbloquearVeiculo(idVeiculo: number): Promise<SascarXmlRpcCommandResult>;
    /** Helper: envia texto para o display do veículo. */
    enviarMensagem(idVeiculo: number, mensagem: string, ticket?: number): Promise<SascarXmlRpcCommandResult>;
    /** Helper: alterna estado de um atuador. */
    alternarAtuador(idVeiculo: number, idAtuador: number, estado: 'on' | 'off'): Promise<SascarXmlRpcCommandResult>;
    /**
     * Aguarda a execução (ou recusa) de um comando via polling em status_ticket.
     * Retorna apenas quando status converge para 1 (executado) ou 2 (recusado),
     * ou lança timeout se `timeoutMs` for atingido.
     */
    aguardarComando(ticket: number, idVeiculo: number, opts?: {
        timeoutMs?: number;
        pollIntervalMs?: number;
    }): Promise<SascarComandoStatusFinal>;
}
