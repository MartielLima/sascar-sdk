export interface SendXmlRpcOptions {
    url: string;
    timeoutMs: number;
    maxRetries?: number;
    onRetry?: (attempt: number, delayMs: number) => void;
}
/**
 * Envia uma requisição XML-RPC e retorna o corpo da resposta.
 * Mesma política de retry/timeout do transport SOAP: 5xx transientes + erros de rede,
 * 401/403/429 imediato, AbortError → timeout.
 * NÃO retenta se o corpo da resposta 5xx contém <fault> (fault aplicacional).
 */
export declare function sendXmlRpcRequest(xml: string, options: SendXmlRpcOptions): Promise<string>;
