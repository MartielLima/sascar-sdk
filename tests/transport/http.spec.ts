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
