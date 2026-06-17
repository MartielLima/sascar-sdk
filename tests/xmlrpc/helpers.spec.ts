import nock from 'nock';
import { SascarXmlRpcClient } from '../../src/xmlrpc/client';
import { SASCAR_XMLRPC_URLS } from '../../src/xmlrpc/types';

const URL = SASCAR_XMLRPC_URLS.comando;

describe('helpers de alto nível', () => {
  let client: SascarXmlRpcClient;

  beforeEach(() => {
    nock.cleanAll();
    client = new SascarXmlRpcClient({ usuario: 'u', senha: 'p' }, { maxRetries: 1, timeoutMs: 1000 });
  });
  afterEach(() => nock.cleanAll());

  const ok = `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>ticketServidor</name><value><int>1</int></value></member>
</struct></value></param></params></methodResponse>`;

  it('bloquearVeiculo() delega para bloqueio()', async () => {
    let body = '';
    nock(URL).post(/.*/, (b) => { body = b; return true; }).reply(200, ok);
    await client.bloquearVeiculo(2248181);
    expect(body).toContain('<methodName>bloqueio</methodName>');
  });

  it('desbloquearVeiculo() delega para desbloqueio()', async () => {
    let body = '';
    nock(URL).post(/.*/, (b) => { body = b; return true; }).reply(200, ok);
    await client.desbloquearVeiculo(2248181);
    expect(body).toContain('<methodName>desbloqueio</methodName>');
  });

  it('enviarMensagem() delega para texto()', async () => {
    let body = '';
    nock(URL).post(/.*/, (b) => { body = b; return true; }).reply(200, ok);
    await client.enviarMensagem(2248181, 'oi');
    expect(body).toContain('<methodName>texto</methodName>');
  });

  it('alternarAtuador(id, 240, "on") envia idsAtuadores=[240]', async () => {
    let body = '';
    nock(URL).post(/.*/, (b) => { body = b; return true; }).reply(200, ok);
    await client.alternarAtuador(2248181, 240, 'on');
    expect(body).toContain('<value><int>240</int></value>');
  });
});

describe('aguardarComando()', () => {
  let client: SascarXmlRpcClient;
  beforeEach(() => {
    nock.cleanAll();
    client = new SascarXmlRpcClient({ usuario: 'u', senha: 'p' }, { maxRetries: 1, timeoutMs: 1000 });
  });
  afterEach(() => nock.cleanAll());

  it('retorna status=1 assim que comando converge para executado', async () => {
    nock(URL).post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><array><data>
  <value><struct>
    <member><name>ticketServidor</name><value><int>99999</int></value></member>
    <member><name>dataEnvio</name><value><string>06/17/2026 12:00</string></value></member>
    <member><name>status</name><value><int>1</int></value></member>
    <member><name>statusDescricao</name><value><string>COMANDO_EXECUTADO</string></value></member>
  </struct></value>
</data></array></value></param></params></methodResponse>`);
    const r = await client.aguardarComando(99999, 2248181, { pollIntervalMs: 50 });
    expect(r.status).toBe(1);
    expect(r.statusDescricao).toBe('COMANDO_EXECUTADO');
    expect(r.tentativas).toBe(1);
  });

  it('retorna status=2 quando comando é recusado', async () => {
    nock(URL).post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><array><data>
  <value><struct>
    <member><name>ticketServidor</name><value><int>99999</int></value></member>
    <member><name>dataEnvio</name><value><string>06/17/2026 12:00</string></value></member>
    <member><name>status</name><value><int>2</int></value></member>
    <member><name>statusDescricao</name><value><string>COMANDO_RECUSADO</string></value></member>
  </struct></value>
</data></array></value></param></params></methodResponse>`);
    const r = await client.aguardarComando(99999, 2248181, { pollIntervalMs: 50 });
    expect(r.status).toBe(2);
  });

  it('faz polling até convergir (status 3 → 1)', async () => {
    nock(URL)
      .post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><array><data>
  <value><struct>
    <member><name>ticketServidor</name><value><int>99999</int></value></member>
    <member><name>dataEnvio</name><value><string>x</string></value></member>
    <member><name>status</name><value><int>3</int></value></member>
    <member><name>statusDescricao</name><value><string>NAO_PROCESSADO</string></value></member>
  </struct></value>
</data></array></value></param></params></methodResponse>`)
      .post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><array><data>
  <value><struct>
    <member><name>ticketServidor</name><value><int>99999</int></value></member>
    <member><name>dataEnvio</name><value><string>x</string></value></member>
    <member><name>status</name><value><int>1</int></value></member>
    <member><name>statusDescricao</name><value><string>COMANDO_EXECUTADO</string></value></member>
  </struct></value>
</data></array></value></param></params></methodResponse>`);
    const r = await client.aguardarComando(99999, 2248181, { pollIntervalMs: 30, timeoutMs: 5000 });
    expect(r.status).toBe(1);
    expect(r.tentativas).toBeGreaterThanOrEqual(2);
  });

  it('lança timeout quando comando nunca converge', async () => {
    nock(URL).post(/.*/).times(10).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><array><data>
  <value><struct>
    <member><name>ticketServidor</name><value><int>99999</int></value></member>
    <member><name>dataEnvio</name><value><string>x</string></value></member>
    <member><name>status</name><value><int>3</int></value></member>
    <member><name>statusDescricao</name><value><string>NAO_PROCESSADO</string></value></member>
  </struct></value>
</data></array></value></param></params></methodResponse>`);
    await expect(
      client.aguardarComando(99999, 2248181, { pollIntervalMs: 20, timeoutMs: 200 })
    ).rejects.toThrow(/Timeout/);
  });
});
