import nock from 'nock';
import { sendXmlRpcRequest } from '../../src/xmlrpc/transport';
import { SascarApiError, SascarAuthError, SascarConnectionError, SascarRateLimitError, SascarTimeoutError } from '../../src/errors';

const URL = 'https://xmlrpc.sascar.com.br/xmlrpc/comando';

describe('sendXmlRpcRequest', () => {
  afterEach(() => nock.cleanAll());

  it('retorna texto em caso de sucesso (HTTP 200)', async () => {
    nock(URL).post(/.*/).reply(200, '<ok/>', { 'Content-Type': 'text/xml' });
    const result = await sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000 });
    expect(result).toBe('<ok/>');
  });

  it('envia Content-Type text/xml e sem SOAPAction', async () => {
    let headers: Record<string, string> = {};
    nock(URL)
      .post(/.*/)
      .reply(function (_uri, _body) {
        headers = this.req.headers as Record<string, string>;
        return [200, '<ok/>'];
      });
    await sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000 });
    expect(headers['content-type']).toContain('text/xml');
    expect(headers['soapaction']).toBeUndefined();
  });

  it('lança SascarAuthError em HTTP 401', async () => {
    nock(URL).post(/.*/).reply(401, '');
    await expect(sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000 })).rejects.toBeInstanceOf(SascarAuthError);
  });

  it('lança SascarAuthError em HTTP 403', async () => {
    nock(URL).post(/.*/).reply(403, '');
    await expect(sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000 })).rejects.toBeInstanceOf(SascarAuthError);
  });

  it('lança SascarRateLimitError em HTTP 429', async () => {
    nock(URL).post(/.*/).reply(429, '');
    await expect(sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000 })).rejects.toBeInstanceOf(SascarRateLimitError);
  });

  it('retenta em HTTP 503 até sucesso', async () => {
    nock(URL).post(/.*/).reply(503, '').post(/.*/).reply(200, '<ok/>');
    const result = await sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000, maxRetries: 3 });
    expect(result).toBe('<ok/>');
  });

  it('desiste após maxRetries e lança SascarApiError', async () => {
    nock(URL).post(/.*/).times(2).reply(503, '');
    await expect(
      sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000, maxRetries: 2 })
    ).rejects.toBeInstanceOf(SascarApiError);
  });

  it('lança SascarConnectionError após esgotar retries em erro de rede', async () => {
    nock(URL).post(/.*/).times(2).replyWithError(new Error('connection refused'));
    await expect(
      sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000, maxRetries: 2 })
    ).rejects.toBeInstanceOf(SascarConnectionError);
  });

  it('lança SascarTimeoutError em timeout (AbortController)', async () => {
    const realFetch = global.fetch;
    global.fetch = jest.fn((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      })
    ) as unknown as typeof fetch;
    try {
      await expect(
        sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 50, maxRetries: 1 })
      ).rejects.toBeInstanceOf(SascarTimeoutError);
    } finally {
      global.fetch = realFetch;
    }
  });

  it('NÃO retenta em fault XML-RPC (5xx com <fault> no corpo)', async () => {
    nock(URL)
      .post(/.*/)
      .reply(500, '<?xml version="1.0"?><methodResponse><fault><value><struct><member><name>faultCode</name><value><int>4</int></value></member><member><name>faultString</name><value><string>Erro</string></value></member></struct></value></fault></methodResponse>');
    await expect(
      sendXmlRpcRequest('<xml/>', { url: URL, timeoutMs: 1000, maxRetries: 3 })
    ).rejects.toBeInstanceOf(SascarApiError);
  });
});
