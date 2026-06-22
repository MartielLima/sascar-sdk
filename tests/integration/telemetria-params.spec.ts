import nock from 'nock';
import { WSDL_URL } from './_helpers';

/**
 * Testes que capturam e verificam o BODY SOAP enviado pelo SDK.
 *
 * Estes testes existem porque os testes regulares de integração só mockam
 * a resposta — eles não validam quais nomes de parâmetros o SDK envia.
 * O bug histórico (v1.1.1 → v1.1.2) foi exatamente este: o SDK enviava
 * `<dataInicio>` mas o WSDL real da Sascar declara `<dataInicial>` para
 * alguns métodos, e a resposta era SOAP Fault sem que nenhum teste
 * automático pegasse.
 */
describe('Telemetria — nomes de parâmetros SOAP (body assertion)', () => {
  afterEach(() => nock.cleanAll());

  it('obterDeltaTelemetriaIntegracaoInercia envia dataInicio (sem L) conforme WSDL', async () => {
    let capturedBody: string | undefined;
    const scope = nock(WSDL_URL)
      .post(/.*/, (body: string) => {
        capturedBody = body;
        return true;
      })
      .reply(
        200,
        `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <ns0:obterDeltaTelemetriaIntegracaoInerciaResponse xmlns:ns0="http://webservice.web.integracao.sascar.com.br/">
      <return><idVeiculo>1</idVeiculo></return>
    </ns0:obterDeltaTelemetriaIntegracaoInerciaResponse>
  </soapenv:Body>
</soapenv:Envelope>`,
        { 'Content-Type': 'text/xml;charset=UTF-8' }
      );

    const { SascarClient } = await import('../../src/client');
    const client = new SascarClient(
      { usuario: 'test_user', senha: 'test_pass' },
      { maxRetries: 1, timeoutMs: 5000 }
    );
    await client.obterDeltaTelemetriaIntegracaoInercia('2026-06-01', '2026-06-22', 12345, 10);
    expect(scope.isDone()).toBe(true);
    expect(capturedBody).toBeDefined();
    // WSDL SasIntegra v2.07 declara 'dataInicio' (sem L) — NÃO 'dataInicial'
    expect(capturedBody!).toContain('<dataInicio>2026-06-01</dataInicio>');
    expect(capturedBody!).toContain('<dataFinal>2026-06-22</dataFinal>');
    expect(capturedBody!).toContain('<idVeiculo>12345</idVeiculo>');
    // Não enviar dataInicial (com L) — esse é o nome ERRADO
    expect(capturedBody!).not.toContain('<dataInicial>');
  });

  it('obterEventosTempoDirecao envia dataInicio/dataFim (sem L) conforme WSDL', async () => {
    let capturedBody: string | undefined;
    const scope = nock(WSDL_URL)
      .post(/.*/, (body: string) => {
        capturedBody = body;
        return true;
      })
      .reply(
        200,
        `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <ns0:obterEventosTempoDirecaoResponse xmlns:ns0="http://webservice.web.integracao.sascar.com.br/">
      <return><id>1</id></return>
    </ns0:obterEventosTempoDirecaoResponse>
  </soapenv:Body>
</soapenv:Envelope>`,
        { 'Content-Type': 'text/xml;charset=UTF-8' }
      );

    const { SascarClient } = await import('../../src/client');
    const client = new SascarClient(
      { usuario: 'test_user', senha: 'test_pass' },
      { maxRetries: 1, timeoutMs: 5000 }
    );
    await client.obterEventosTempoDirecao(100, 5, '2026-06-01', '2026-06-22');
    expect(scope.isDone()).toBe(true);
    expect(capturedBody).toBeDefined();
    // WSDL SasIntegra v2.07 declara 'dataInicio'/'dataFim' (sem L)
    expect(capturedBody!).toContain('<dataInicio>2026-06-01</dataInicio>');
    expect(capturedBody!).toContain('<dataFim>2026-06-22</dataFim>');
    expect(capturedBody!).toContain('<quantidade>100</quantidade>');
    // Não enviar dataInicial/dataFinal (com L) — esses são os nomes ERRADOS
    expect(capturedBody!).not.toContain('<dataInicial>');
    expect(capturedBody!).not.toContain('<dataFinal>');
  });
});
