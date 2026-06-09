export class SascarConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SascarConnectionError';
  }
}

export class SascarRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SascarRateLimitError';
  }
}

export class SascarApiError extends Error {
  readonly fault?: import('./transport/fault').SascarSoapFault;

  constructor(message: string, fault?: import('./transport/fault').SascarSoapFault) {
    super(message);
    this.name = 'SascarApiError';
    this.fault = fault;
  }
}

/**
 * Lançado quando a requisição HTTP excede o timeout configurado.
 * Herda de SascarConnectionError para permitir catching amplo.
 */
export class SascarTimeoutError extends SascarConnectionError {
  readonly timeoutMs: number;

  constructor(message: string, timeoutMs: number) {
    super(message);
    this.name = 'SascarTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Lançado em falhas de autenticação (HTTP 401/403 ou SOAP Fault de auth).
 * Herda de SascarApiError.
 */
export class SascarAuthError extends SascarApiError {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'SascarAuthError';
    this.statusCode = statusCode;
  }
}
