import { SascarClient } from '../src/client';

global.fetch = jest.fn();

describe('SascarClient - orquestração', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SASCAR_USUARIO = 'test_user';
    process.env.SASCAR_SENHA = 'test_password';
  });

  afterEach(() => {
    delete process.env.SASCAR_USUARIO;
    delete process.env.SASCAR_SENHA;
  });

  const mockFetchSuccess = (xmlBody: string) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => xmlBody
    });
  };

  it('lança erro ao ser instanciado sem credenciais', () => {
    delete process.env.SASCAR_USUARIO;
    delete process.env.SASCAR_SENHA;
    expect(() => new SascarClient()).toThrow(/Credenciais da SASCAR/);
  });

  it('lê credenciais de SASCAR_USUARIO/SASCAR_SENHA', () => {
    expect(() => new SascarClient()).not.toThrow();
  });

  it('aceita credenciais explícitas no construtor', () => {
    expect(() => new SascarClient({ usuario: 'u', senha: 'p' })).not.toThrow();
  });

  it('aceita SascarClientOptions com wsdlUrl customizado', () => {
    const client = new SascarClient({ usuario: 'u', senha: 'p' }, { wsdlUrl: 'https://custom.example/' });
    expect(client).toBeInstanceOf(SascarClient);
  });

  it('inclui credenciais no envelope SOAP', async () => {
    mockFetchSuccess(
      '<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><ns0:obterClientesResponse></ns0:obterClientesResponse></S:Body></S:Envelope>'
    );
    const client = new SascarClient();
    await client.obterClientes();
    const body = (global.fetch as jest.Mock).mock.calls[0][1].body;
    expect(body).toContain('<usuario>test_user</usuario>');
    expect(body).toContain('<senha>test_password</senha>');
  });

  it('lança SascarApiError com faultcode quando resposta é SOAP Fault', async () => {
    mockFetchSuccess(`
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <soapenv:Fault>
            <faultcode>soap-env:Client</faultcode>
            <faultstring>Credenciais inválidas</faultstring>
          </soapenv:Fault>
        </soapenv:Body>
      </soapenv:Envelope>
    `);
    const client = new SascarClient();
    await expect(client.obterClientes()).rejects.toMatchObject({
      name: 'SascarApiError',
      fault: { faultcode: 'soap-env:Client', faultstring: 'Credenciais inválidas' }
    });
  });

  it('lança SascarApiError quando resposta não tem nó de retorno esperado', async () => {
    mockFetchSuccess(`
      <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
        <S:Body>
          <InvalidResponse></InvalidResponse>
        </S:Body>
      </S:Envelope>
    `);
    const client = new SascarClient();
    await expect(client.obterClientes()).rejects.toThrow(/Resposta inválida/);
  });
});
