import {
  SascarApiError,
  SascarAuthError,
  SascarConnectionError,
  SascarRateLimitError,
  SascarTimeoutError
} from '../errors';

export interface SendSoapOptions {
  url: string;
  timeoutMs: number;
  maxRetries?: number;
  onRetry?: (attempt: number, delayMs: number) => void;
}

const TRANSIENT_STATUS = new Set([500, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function isTransientStatus(status: number): boolean {
  return TRANSIENT_STATUS.has(status);
}

function computeBackoffMs(attempt: number): number {
  const base = 250 * 2 ** attempt;
  const jitter = 0.8 + Math.random() * 0.4;
  return Math.round(base * jitter);
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
export async function sendSoapRequest(xml: string, options: SendSoapOptions): Promise<string> {
  const { url, timeoutMs } = options;
  const maxRetries = options.maxRetries ?? 3;
  const onRetry = options.onRetry;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          SOAPAction: '""'
        },
        body: xml,
        signal: controller.signal
      });

      clearTimeout(timer);

      if (response.ok) {
        return await response.text();
      }

      const status = response.status;

      if (status === 401 || status === 403) {
        throw new SascarAuthError(`HTTP ${status} em ${url}`, status);
      }

      if (status === 429) {
        throw new SascarRateLimitError(`HTTP 429 (rate limit) em ${url}`);
      }

      if (isTransientStatus(status) && attempt < maxRetries - 1) {
        lastError = new SascarApiError(`HTTP ${status} transiente em ${url}`);
        const delay = computeBackoffMs(attempt);
        onRetry?.(attempt + 1, delay);
        await sleep(delay);
        continue;
      }

      throw new SascarApiError(`HTTP ${status} em ${url}`);
    } catch (err) {
      clearTimeout(timer);

      if (err instanceof SascarAuthError || err instanceof SascarRateLimitError || err instanceof SascarApiError) {
        throw err;
      }

      if (err instanceof Error && err.name === 'AbortError') {
        throw new SascarTimeoutError(`Timeout (${timeoutMs}ms) em ${url}`, timeoutMs);
      }

      if (err instanceof Error) {
        const isLastAttempt = attempt === maxRetries - 1;
        if (isLastAttempt) {
          throw new SascarConnectionError(`Erro de rede em ${url}: ${err.message}`);
        }
        lastError = err;
        const delay = computeBackoffMs(attempt);
        onRetry?.(attempt + 1, delay);
        await sleep(delay);
        continue;
      }

      throw new SascarConnectionError(`Erro desconhecido em ${url}: ${String(err)}`);
    }
  }

  throw new SascarConnectionError(
    `Falha após ${maxRetries} tentativas em ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}
