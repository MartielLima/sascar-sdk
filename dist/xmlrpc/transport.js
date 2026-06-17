"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendXmlRpcRequest = sendXmlRpcRequest;
const errors_1 = require("../errors");
const parser_1 = require("./parser");
const errors_2 = require("./errors");
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
function bodyHasFault(body) {
    if (!body)
        return false;
    return /<fault[\s>]/i.test(body);
}
/**
 * Envia uma requisição XML-RPC e retorna o corpo da resposta.
 * Mesma política de retry/timeout do transport SOAP: 5xx transientes + erros de rede,
 * 401/403/429 imediato, AbortError → timeout.
 * NÃO retenta se o corpo da resposta 5xx contém <fault> (fault aplicacional).
 */
async function sendXmlRpcRequest(xml, options) {
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
                    'Content-Type': 'text/xml;charset=UTF-8'
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
            if (bodyHasFault(body)) {
                try {
                    (0, parser_1.parseMethodFault)(body);
                }
                catch (faultErr) {
                    if (faultErr instanceof errors_2.SascarXmlRpcError) {
                        throw new errors_1.SascarApiError(`HTTP ${status} em ${url} — XML-RPC Fault: ${faultErr.rawFault?.faultString ?? 'unknown'} (code ${faultErr.rawFault?.faultCode ?? 'n/a'})`, { faultcode: String(faultErr.rawFault?.faultCode ?? 0), faultstring: faultErr.rawFault?.faultString ?? '' });
                    }
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
            if (typeof err === 'object' && err !== null && err.name === 'AbortError') {
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
