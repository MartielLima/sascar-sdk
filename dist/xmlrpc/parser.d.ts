import type { SascarComandoEnviado, SascarXmlRpcPosicaoResult } from './types';
export interface ParsedResponse {
    resultados: Record<number, string>;
    ticketServidor: number | null;
    senha: string | null;
    mensagens: Record<string, string>;
    comandos: SascarComandoEnviado[];
    posicao: SascarXmlRpcPosicaoResult | null;
}
/**
 * Detecta e lança SascarXmlRpcError se a resposta for um fault XML-RPC.
 */
export declare function parseMethodFault(xml: string): void;
/**
 * Faz o parse da resposta XML-RPC de um comando.
 * Suporta as 4 formas de retorno do manual:
 *  - struct com idVeiculo→code + ticketServidor (comandos padrão)
 *  - struct com senha (gerar_contra_senha*)
 *  - struct com mensagens (inicializar/finalizar_operacao, vincular_rota)
 *  - struct com campos de posicao (método posicao())
 *  - array de structs (listar_comandos, status_ticket)
 */
export declare function parseMethodResponse(xml: string): ParsedResponse;
