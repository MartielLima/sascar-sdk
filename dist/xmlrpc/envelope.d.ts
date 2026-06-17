import type { SascarXmlRpcParam } from './types';
/**
 * Um parâmetro nomeado para o método XML-RPC.
 * Use no lugar de positional quando o membro do struct precisa de nome específico
 * (ex: `ticket`, `configuracao`, `acao`).
 */
export interface XmlRpcNamedParam {
    name: string;
    value: SascarXmlRpcParam;
}
/**
 * Constrói um <methodCall>...</methodCall> XML-RPC.
 *
 * O array `params` é serializado como membros de um <struct>:
 * - Posição 0 → `<name>placa</name>`
 * - Demais posições → `<name>param1</name>`, `<name>param2</name>`, etc.
 *
 * O array `named` adiciona membros com nome explícito (para campos como `ticket`,
 * `configuracao`, `acao` que o manual Sascar exige com nome específico).
 *
 * As credenciais `login` e `password` são sempre os primeiros membros do struct.
 */
export declare function buildMethodCall(methodName: string, params: SascarXmlRpcParam[], login: string, password: string, named?: XmlRpcNamedParam[]): string;
