"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SascarAuthError = exports.SascarTimeoutError = exports.SascarApiError = exports.SascarRateLimitError = exports.SascarConnectionError = void 0;
class SascarConnectionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SascarConnectionError';
    }
}
exports.SascarConnectionError = SascarConnectionError;
class SascarRateLimitError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SascarRateLimitError';
    }
}
exports.SascarRateLimitError = SascarRateLimitError;
class SascarApiError extends Error {
    fault;
    constructor(message, fault) {
        super(message);
        this.name = 'SascarApiError';
        this.fault = fault;
    }
}
exports.SascarApiError = SascarApiError;
/**
 * Lançado quando a requisição HTTP excede o timeout configurado.
 * Herda de SascarConnectionError para permitir catching amplo.
 */
class SascarTimeoutError extends SascarConnectionError {
    timeoutMs;
    constructor(message, timeoutMs) {
        super(message);
        this.name = 'SascarTimeoutError';
        this.timeoutMs = timeoutMs;
    }
}
exports.SascarTimeoutError = SascarTimeoutError;
/**
 * Lançado em falhas de autenticação (HTTP 401/403 ou SOAP Fault de auth).
 * Herda de SascarApiError.
 */
class SascarAuthError extends SascarApiError {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.name = 'SascarAuthError';
        this.statusCode = statusCode;
    }
}
exports.SascarAuthError = SascarAuthError;
