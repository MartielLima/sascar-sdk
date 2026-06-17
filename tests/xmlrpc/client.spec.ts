import nock from 'nock';
import { SascarXmlRpcClient } from '../../src/xmlrpc/client';
import { SASCAR_XMLRPC_URLS } from '../../src/xmlrpc/types';
import { assertXmlRpcBody } from '../integration/xmlrpc/_helpers';

const URL = SASCAR_XMLRPC_URLS.comando;

describe('SascarXmlRpcClient - bloqueio/desbloqueio/reset', () => {
  let client: SascarXmlRpcClient;

  beforeEach(() => {
    nock.cleanAll();
    client = new SascarXmlRpcClient(
      { usuario: 'test_user', senha: 'test_pass' },
      { maxRetries: 1, timeoutMs: 1000 }
    );
  });

  afterEach(() => nock.cleanAll());

  it('bloqueio() envia methodName "bloqueio" e placa=idVeiculo', async () => {
    let capturedBody = '';
    nock(URL)
      .post(/.*/, (b) => {
        capturedBody = b;
        return true;
      })
      .reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>ticketServidor</name><value><int>12345</int></value></member>
</struct></value></param></params></methodResponse>`);

    const result = await client.bloqueio(2248181);
    assertXmlRpcBody(capturedBody, 'bloqueio', '2248181');
    expect(result.resultados[2248181]).toBe('1');
    expect(result.ticketServidor).toBe(12345);
  });

  it('desbloqueio() envia methodName "desbloqueio"', async () => {
    let capturedBody = '';
    nock(URL)
      .post(/.*/, (b) => {
        capturedBody = b;
        return true;
      })
      .reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>ticketServidor</name><value><int>67890</int></value></member>
</struct></value></param></params></methodResponse>`);

    const result = await client.desbloqueio(2248181);
    assertXmlRpcBody(capturedBody, 'desbloqueio', '2248181');
    expect(result.resultados[2248181]).toBe('1');
  });

  it('reset_undo_alarme() envia methodName correto', async () => {
    let capturedBody = '';
    nock(URL)
      .post(/.*/, (b) => {
        capturedBody = b;
        return true;
      })
      .reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>ticketServidor</name><value><int>11111</int></value></member>
</struct></value></param></params></methodResponse>`);

    await client.reset_undo_alarme(2248181);
    assertXmlRpcBody(capturedBody, 'reset_undo_alarme', '2248181');
  });

  it('lança erro se credenciais ausentes', () => {
    delete process.env.SASCAR_USUARIO;
    delete process.env.SASCAR_SENHA;
    expect(() => new SascarXmlRpcClient()).toThrow(/Credenciais/);
  });

  it('lê credenciais de SASCAR_USUARIO/SASCAR_SENHA quando ausentes no construtor', () => {
    process.env.SASCAR_USUARIO = 'env_user';
    process.env.SASCAR_SENHA = 'env_pass';
    expect(() => new SascarXmlRpcClient()).not.toThrow();
    delete process.env.SASCAR_USUARIO;
    delete process.env.SASCAR_SENHA;
  });
});
