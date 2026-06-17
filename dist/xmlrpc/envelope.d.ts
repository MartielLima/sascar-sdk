import type { SascarXmlRpcParam } from './types';
/**
 * Constrói um <methodCall>...</methodCall> XML-RPC.
 *
 * O array `params` é serializado como membros de um <struct> (uma posição por item).
 * As credenciais `login` e `password` são adicionadas como primeiros membros do struct
 * (conforme manual Sascar seção 2.4). O `placa` (primeiro item do params) é incluído
 * como membro nomeado para comandos que esperam esse campo.
 */
export declare function buildMethodCall(methodName: string, params: SascarXmlRpcParam[], login: string, password: string): string;
