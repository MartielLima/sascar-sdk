"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSoapRequest = sendSoapRequest;
const errors_1 = require("../errors");
const fault_1 = require("./fault");
const TRANSIENT_STATUS = new Set([500, 502, 503, 504]);
function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
}
function isTransientStatus(status) {
    return TRANSIENT_STATUS.has(status);
}
function computeBackoffMs(attempt) {
    const base = 250 * 2 ** attempt;
    const jitter = 0.8 + Math.random() * 0.4;
    return Math.round(base * jitter);
}
/**
 * Detecta rapidamente se um corpo de resposta XML contém um SOAP Fault,
 * sem rodar o parser completo. Usado para decidir se devemos parar de
 * retentar em respostas 5xx que carregam fault aplicacional.
 */
function bodyHasSoapFault(body) {
    if (!body)
        return false;
    return /<(?:[A-Za-z][\w-]*:)?Fault[\s>]/.test(body);
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
async function sendSoapRequest(xml, options) {
    const { url, timeoutMs } = options;
    const maxRetries = options.maxRetries ?? 3;
    const onRetry = options.onRetry;
    let lastError;
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
                throw new errors_1.SascarAuthError(`HTTP ${status} em ${url}`, status);
            }
            if (status === 429) {
                throw new errors_1.SascarRateLimitError(`HTTP 429 (rate limit) em ${url}`);
            }
            const body = await response.text().catch(() => '');
            if (bodyHasSoapFault(body)) {
                const fault = (0, fault_1.parseSoapFault)(body);
                if (fault) {
                    throw new errors_1.SascarApiError(`HTTP ${status} em ${url} — SOAP Fault: ${fault.faultstring} (${fault.faultcode})`, fault);
                }
            }
            if (isTransientStatus(status) && attempt < maxRetries - 1) {
                lastError = new errors_1.SascarApiError(`HTTP ${status} transiente em ${url}`);
                const delay = computeBackoffMs(attempt);
                onRetry?.(attempt + 1, delay);
                await sleep(delay);
                continue;
            }
            throw new errors_1.SascarApiError(`HTTP ${status} em ${url}`);
        }
        catch (err) {
            clearTimeout(timer);
            if (err instanceof errors_1.SascarAuthError || err instanceof errors_1.SascarRateLimitError || err instanceof errors_1.SascarApiError) {
                throw err;
            }
            if (err instanceof Error && err.name === 'AbortError') {
                throw new errors_1.SascarTimeoutError(`Timeout (${timeoutMs}ms) em ${url}`, timeoutMs);
            }
            if (err instanceof Error) {
                const isLastAttempt = attempt === maxRetries - 1;
                if (isLastAttempt) {
                    throw new errors_1.SascarConnectionError(`Erro de rede em ${url}: ${err.message}`);
                }
                lastError = err;
                const delay = computeBackoffMs(attempt);
                onRetry?.(attempt + 1, delay);
                await sleep(delay);
                continue;
            }
            throw new errors_1.SascarConnectionError(`Erro desconhecido em ${url}: ${String(err)}`);
        }
    }
    throw new errors_1.SascarConnectionError(`Falha após ${maxRetries} tentativas em ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}
