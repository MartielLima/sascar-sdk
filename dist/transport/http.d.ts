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
 *  - Em outros status não-ok, lança SascarApiError.
 *  - Em erro de rede, lança SascarConnectionError.
 *  - Em timeout, lança SascarTimeoutError.
 */
export declare function sendSoapRequest(xml: string, options: SendSoapOptions): Promise<string>;
