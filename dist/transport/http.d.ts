export interface SendSoapOptions {
    url: string;
    timeoutMs: number;
    maxRetries?: number;
    onRetry?: (attempt: number, delayMs: number) => void;
}
/**
 * Envia uma requisição SOAP e retorna o corpo da resposta como string.
 *
 * Comportamento:
 *  - Aplica timeout via AbortController.
 *  - Em status 401/403 lança SascarAuthError.
 *  - Em status 429 lança SascarRateLimitError.
 *  - Em status 5xx transiente, faz retry com backoff exponencial (até maxRetries).
 *    EXCEÇÃO: se o corpo da resposta 5xx contém um SOAP Fault, NÃO retenta —
 *    o fault é aplicacional (ex.: permissão negada) e seria perpetuado. O
 *    fault é parseado e propagado em SascarApiError.fault.
 *  - Em outros status não-ok, lança SascarApiError (também tenta extrair fault).
 *  - Em erro de rede, lança SascarConnectionError.
 *  - Em timeout, lança SascarTimeoutError.
 */
export declare function sendSoapRequest(xml: string, options: SendSoapOptions): Promise<string>;
