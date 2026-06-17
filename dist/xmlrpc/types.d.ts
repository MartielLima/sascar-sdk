/** Resultado padrão da maioria dos comandos XML-RPC. */
export interface SascarXmlRpcCommandResult {
    /** Ticket gerado pelo SERVIDOR (string numérica, ex: "12132678"). */
    ticketServidor: string;
    /** Status do comando (apenas para modoSeguro hoje). Vide tabela 2.4.1 do manual. */
    statusComando?: string;
    /** Ticket gerado pelo CLIENTE (o que foi enviado no request). */
    ticketCliente: number;
}
/** Variante para inicializar/finalizar_operacao e vincular_rota. */
export interface SascarXmlRpcOperacaoResult extends SascarXmlRpcCommandResult {
    /** Mensagens de erro por placa (geralmente presentes quando o comando é recusado). */
    mensagens: Record<string, string>;
}
/** Variante do método posicao(). */
export interface SascarXmlRpcPosicaoResult {
    /** Placa do veículo (string). */
    idVeiculo: string;
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
export interface SascarXmlRpcSenhaResult {
    /** Senha gerada (6 dígitos). */
    senha: string;
    ticketCliente: number;
}
/** Item de listar_comandos. */
export interface SascarComandoEnviado {
    dataEnvio: string;
    methodName: string;
    parametros: Record<string, string>;
    status: number;
    statusDescricao: string;
    ticketServidor: string;
}
/** Status de um comando, retornado por status_ticket. */
export interface SascarComandoStatus {
    ticket: string;
    dataExecucao: string;
    status: number;
    statusDescricao: string;
    mensagem?: string;
}
/** Retorno convergente de aguardarComando. */
export interface SascarComandoStatusFinal {
    ticket: string;
    status: 1 | 2;
    statusDescricao: string;
    tentativas: number;
    duracaoMs: number;
}
/** Tipo dos parâmetros aceitos por buildMethodCall. */
export type SascarXmlRpcParam = string | number | boolean | string[] | number[];
/** URL dos endpoints XML-RPC (manual Sascar v3.5 seção 2.3). */
export declare const SASCAR_XMLRPC_URLS: {
    /** Default: usado pela maioria dos comandos (seções 2.5.1–2.5.29). */
    readonly enviarComando: "https://xmlrpc.sascar.com.br/xmlrpc/enviar_comando";
    /** Usado apenas pelas seções 2.5.30–2.5.34 (AVD, inicializar/finalizar operacao, vincular rota). */
    readonly operacao: "https://xmlrpc.sascar.com.br/xmlrpc/operacao";
};
