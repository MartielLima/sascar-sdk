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
