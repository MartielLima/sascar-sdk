import { sendSoapRequest, type SendSoapOptions } from '../../src/transport/http';

global.fetch = jest.fn();

describe('sendSoapRequest - timeout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lança SascarTimeoutError quando fetch excede timeoutMs', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        })
    );

    const opts: SendSoapOptions = { url: 'https://x', timeoutMs: 50 };
    await expect(sendSoapRequest('<xml/>', opts)).rejects.toThrow(/timeout/i);
  });

  it('retorna texto da resposta em caso de sucesso', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => '<ok/>'
    });
    const result = await sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000 });
    expect(result).toBe('<ok/>');
  });

  it('lança SascarAuthError em HTTP 401', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => ''
    });
    await expect(sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000 })).rejects.toThrow(/auth|401/i);
  });

  it('lança SascarAuthError em HTTP 403', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => ''
    });
    await expect(sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000 })).rejects.toThrow(/auth|403/i);
  });

  it('lança SascarRateLimitError em HTTP 429', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => ''
    });
    await expect(sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000 })).rejects.toThrow(/rate|429/i);
  });
});

describe('sendSoapRequest - retry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retenta em HTTP 503 até sucesso', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => '' })
      .mockResolvedValueOnce({ ok: false, status: 502, text: async () => '' })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '<ok/>' });

    const result = await sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000, maxRetries: 3 });
    expect(result).toBe('<ok/>');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('desiste após maxRetries e lança SascarApiError', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => ''
    });

    await expect(sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000, maxRetries: 2 })).rejects.toThrow(
      /HTTP 503/
    );
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('chama onRetry entre tentativas', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => '' })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '<ok/>' });

    const onRetry = jest.fn();
    await sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000, maxRetries: 3, onRetry });
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Number));
  });

  it('retenta em erro de rede até sucesso', async () => {
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '<ok/>' });

    const result = await sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000, maxRetries: 3 });
    expect(result).toBe('<ok/>');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('lança SascarConnectionError quando maxRetries é zero', async () => {
    await expect(sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000, maxRetries: 0 })).rejects.toThrow(
      /Falha após 0 tentativas/
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('lança SascarConnectionError após esgotar retries em erro de rede', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('connection refused'));
    await expect(sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000, maxRetries: 2 })).rejects.toThrow(
      /Erro de rede em https:\/\/x: connection refused/
    );
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('lança SascarConnectionError para erro desconhecido não-Error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(42);
    await expect(sendSoapRequest('<xml/>', { url: 'https://x', timeoutMs: 1000, maxRetries: 1 })).rejects.toThrow(
      /Erro desconhecido em https:\/\/x: 42/
    );
  });
});
