export declare class SascarConnectionError extends Error {
    constructor(message: string);
}
export declare class SascarRateLimitError extends Error {
    constructor(message: string);
}
export declare class SascarApiError extends Error {
    readonly fault?: import('./transport/fault').SascarSoapFault;
    constructor(message: string, fault?: import('./transport/fault').SascarSoapFault);
}
/**
 * Lançado quando a requisição HTTP excede o timeout configurado.
 * Herda de SascarConnectionError para permitir catching amplo.
 */
export declare class SascarTimeoutError extends SascarConnectionError {
    readonly timeoutMs: number;
    constructor(message: string, timeoutMs: number);
}
/**
 * Lançado em falhas de autenticação (HTTP 401/403 ou SOAP Fault de auth).
 * Herda de SascarApiError.
 */
export declare class SascarAuthError extends SascarApiError {
    readonly statusCode?: number;
    constructor(message: string, statusCode?: number);
}
