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

describe('SascarXmlRpcClient - atuadores e mensagens', () => {
  let client: SascarXmlRpcClient;
  beforeEach(() => {
    nock.cleanAll();
    client = new SascarXmlRpcClient(
      { usuario: 'test_user', senha: 'test_pass' },
      { maxRetries: 1, timeoutMs: 1000 }
    );
  });
  afterEach(() => nock.cleanAll());

  const successStruct = `<member><name>2248181</name><value><int>1</int></value></member>
  <member><name>ticketServidor</name><value><int>1</int></value></member>`;
  const successBody = `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>${successStruct}</struct></value></param></params></methodResponse>`;

  it('atuador() envia array de ids + estado on/off', async () => {
    let body = '';
    nock(URL).post(/.*/, (b) => { body = b; return true; }).reply(200, successBody);
    await client.atuador(2248181, [240, 241], 'on');
    expect(body).toContain('<methodName>atuador</methodName>');
    expect(body).toContain('<value><int>240</int></value>');
    expect(body).toContain('<value><int>241</int></value>');
    expect(body).toContain('<value><string>on</string></value>');
  });

  it('texto() envia mensagem como string', async () => {
    let body = '';
    nock(URL).post(/.*/, (b) => { body = b; return true; }).reply(200, successBody);
    await client.texto(2248181, 'Olá motorista');
    expect(body).toContain('<methodName>texto</methodName>');
    expect(body).toContain('<value><string>Olá motorista</string></value>');
  });

  it('texto() inclui ticket quando fornecido', async () => {
    let body = '';
    nock(URL).post(/.*/, (b) => { body = b; return true; }).reply(200, successBody);
    await client.texto(2248181, 'msg', 99999);
    expect(body).toContain('<value><int>99999</int></value>');
  });

  it('transmissao_ignicao_desligada() envia estado', async () => {
    let body = '';
    nock(URL).post(/.*/, (b) => { body = b; return true; }).reply(200, successBody);
    await client.transmissao_ignicao_desligada(2248181, 'off');
    expect(body).toContain('<methodName>transmissao_ignicao_desligada</methodName>');
    expect(body).toContain('<value><string>off</string></value>');
  });

  it('inibir_sensor() envia array de ids + acao (0 ou 1)', async () => {
    let body = '';
    nock(URL).post(/.*/, (b) => { body = b; return true; }).reply(200, successBody);
    await client.inibir_sensor(2248181, [231, 241, 248], 1);
    expect(body).toContain('<methodName>inibir_sensor</methodName>');
    expect(body).toContain('<value><int>231</int></value>');
    expect(body).toContain('<value><int>1</int></value>');
  });

  it('modoSeguro() serializa ativar=true como <boolean>1</boolean>', async () => {
    let body = '';
    nock(URL).post(/.*/, (b) => { body = b; return true; }).reply(200, successBody);
    await client.modoSeguro(2248181, true);
    expect(body).toContain('<methodName>modoSeguro</methodName>');
    expect(body).toContain('<value><boolean>1</boolean></value>');
  });
});

describe('SascarXmlRpcClient - configuração satelital/GPRS', () => {
  let client: SascarXmlRpcClient;
  beforeEach(() => {
    nock.cleanAll();
    client = new SascarXmlRpcClient({ usuario: 'test_user', senha: 'test_pass' }, { maxRetries: 1, timeoutMs: 1000 });
  });
  afterEach(() => nock.cleanAll());

  const successBody = `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>ticketServidor</name><value><int>1</int></value></member>
</struct></value></param></params></methodResponse>`;

  it('analise_satelital() envia intervalo como int', async () => {
    let body = '';
    nock(URL).post(/.*/, (b) => { body = b; return true; }).reply(200, successBody);
    await client.analise_satelital(2248181, 60);
    expect(body).toContain('<methodName>analise_satelital</methodName>');
    expect(body).toContain('<value><int>60</int></value>');
  });

  it('relatorio_satelital() envia intervalo como int', async () => {
    let body = '';
    nock(URL).post(/.*/, (b) => { body = b; return true; }).reply(200, successBody);
    await client.relatorio_satelital(2248181, 300);
    expect(body).toContain('<methodName>relatorio_satelital</methodName>');
    expect(body).toContain('<value><int>300</int></value>');
  });

  it('relatorio() envia tempo como int', async () => {
    let body = '';
    nock(URL).post(/.*/, (b) => { body = b; return true; }).reply(200, successBody);
    await client.relatorio(2248181, 30);
    expect(body).toContain('<methodName>relatorio</methodName>');
    expect(body).toContain('<value><int>30</int></value>');
  });

  it('gerar_contra_senha_mtc600() retorna senha do parser', async () => {
    nock(URL).post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>senha</name><value><string>654321</string></value></member>
</struct></value></param></params></methodResponse>`);
    const r = await client.gerar_contra_senha_mtc600(2248181);
    expect(r.senha).toBe('654321');
  });
});

describe('SascarXmlRpcClient - posicao e gerar_contra_senha', () => {
  let client: SascarXmlRpcClient;
  beforeEach(() => {
    nock.cleanAll();
    client = new SascarXmlRpcClient({ usuario: 'test_user', senha: 'test_pass' }, { maxRetries: 1, timeoutMs: 1000 });
  });
  afterEach(() => nock.cleanAll());

  it('gerar_contra_senha() retorna senha TD40/TMCD', async () => {
    nock(URL).post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>2248181</name><value><int>1</int></value></member>
  <member><name>senha</name><value><string>987654</string></value></member>
</struct></value></param></params></methodResponse>`);
    const r = await client.gerar_contra_senha(2248181);
    expect(r.senha).toBe('987654');
    expect(r.resultados[2248181]).toBe('1');
  });

  it('posicao() retorna SascarXmlRpcPosicaoResult com extras', async () => {
    nock(URL).post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>idVeiculo</name><value><int>2248181</int></value></member>
  <member><name>dataPosicao</name><value><string>2026-06-17 12:00:00</string></value></member>
  <member><name>dataPacote</name><value><string>2026-06-17 12:00:00</string></value></member>
  <member><name>latitude</name><value><double>-23.5</double></value></member>
  <member><name>longitude</name><value><double>-46.6</double></value></member>
  <member><name>direcao</name><value><int>4</int></value></member>
  <member><name>velocidade</name><value><int>80</int></value></member>
  <member><name>ignicao</name><value><int>1</int></value></member>
  <member><name>saida1</name><value><int>240</int></value></member>
  <member><name>tensao</name><value><int>24</int></value></member>
</struct></value></param></params></methodResponse>`);
    const p = await client.posicao(2248181);
    expect(p.idVeiculo).toBe(2248181);
    expect(p.latitude).toBe(-23.5);
    expect(p.extras.saida1).toBe(240);
    expect(p.extras.tensao).toBe(24);
  });

  it('posicao() usa mutex (execuções sequenciais)', async () => {
    const start = Date.now();
    nock(URL)
      .post(/.*/).delay(100).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>idVeiculo</name><value><int>1</int></value></member>
  <member><name>dataPosicao</name><value><string>x</string></value></member>
  <member><name>dataPacote</name><value><string>x</string></value></member>
  <member><name>latitude</name><value><double>0</double></value></member>
  <member><name>longitude</name><value><double>0</double></value></member>
  <member><name>direcao</name><value><int>0</int></value></member>
  <member><name>velocidade</name><value><int>0</int></value></member>
  <member><name>ignicao</name><value><int>0</int></value></member>
</struct></value></param></params></methodResponse>`)
      .post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>idVeiculo</name><value><int>1</int></value></member>
  <member><name>dataPosicao</name><value><string>y</string></value></member>
  <member><name>dataPacote</name><value><string>y</string></value></member>
  <member><name>latitude</name><value><double>0</double></value></member>
  <member><name>longitude</name><value><double>0</double></value></member>
  <member><name>direcao</name><value><int>0</int></value></member>
  <member><name>velocidade</name><value><int>0</int></value></member>
  <member><name>ignicao</name><value><int>0</int></value></member>
</struct></value></param></params></methodResponse>`);
    await Promise.all([client.posicao(1), client.posicao(1)]);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });
});

describe('SascarXmlRpcClient - status e listagem', () => {
  let client: SascarXmlRpcClient;
  beforeEach(() => {
    nock.cleanAll();
    client = new SascarXmlRpcClient({ usuario: 'test_user', senha: 'test_pass' }, { maxRetries: 1, timeoutMs: 1000 });
  });
  afterEach(() => nock.cleanAll());

  it('status_ticket() retorna SascarComandoStatus[]', async () => {
    nock(URL).post(/.*/).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><array><data>
  <value><struct>
    <member><name>methodName</name><value><string>bloqueio</string></value></member>
    <member><name>dataEnvio</name><value><string>06/17/2026 12:00</string></value></member>
    <member><name>status</name><value><int>1</int></value></member>
    <member><name>statusDescricao</name><value><string>COMANDO_EXECUTADO</string></value></member>
    <member><name>ticketServidor</name><value><int>1</int></value></member>
  </struct></value>
</data></array></value></param></params></methodResponse>`);
    const arr = await client.status_ticket(1, 1);
    expect(arr).toHaveLength(1);
    expect(arr[0].status).toBe(1);
  });

  it('listar_comandos() envia quantidade, dataInicial, dataFinal', async () => {
    let body = '';
    nock(URL).post(/.*/, (b) => { body = b; return true; }).reply(200, `<?xml version="1.0"?>
<methodResponse><params><param><value><array><data></data></array></value></param></params></methodResponse>`);
    await client.listar_comandos(2248181, 100, '06/01/2026 00:00', '06/17/2026 23:59');
    expect(body).toContain('<methodName>listar_comandos</methodName>');
  });
});
