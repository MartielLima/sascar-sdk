import nock, { type Scope } from 'nock';
import { SascarClient } from '../../src/client';

export const WSDL_URL = 'https://sasintegra.sascar.com.br/SasIntegra/SasIntegraWSService';
export const SOAP_NS = 'http://schemas.xmlsoap.org/soap/envelope/';
export const WEB_NS = 'http://webservice.web.integracao.sascar.com.br/';

export function makeClient(): SascarClient {
  return new SascarClient({ usuario: 'test_user', senha: 'test_pass' }, { maxRetries: 1, timeoutMs: 5000 });
}

/**
 * Monta um mock de resposta SOAP de sucesso para `methodName` com o `innerXml` fornecido
 * como conteúdo do nó `<ns0:${methodName}Response>`.
 */
export function mockSoapSuccess(methodName: string, innerXml: string): Scope {
  return nock(WSDL_URL)
    .post(/.*/)
    .reply(
      200,
      `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="${SOAP_NS}">
  <soapenv:Body>
    <ns0:${methodName}Response xmlns:ns0="${WEB_NS}">${innerXml}</ns0:${methodName}Response>
  </soapenv:Body>
</soapenv:Envelope>`,
      { 'Content-Type': 'text/xml;charset=UTF-8' }
    );
}

/**
 * Faz assertions de que a request SOAP foi construída corretamente:
 * - contém `<web:{methodName}>` (operação)
 * - contém `<usuario>test_user</usuario>` e `<senha>test_pass</senha>` (credenciais)
 * - contém cada par `<chave>valor</chave>` esperado em `params`
 */
export function assertSoapBody(body: string, methodName: string, params: Record<string, unknown> = {}): void {
  expect(body).toContain(`<web:${methodName}>`);
  expect(body).toContain('<usuario>test_user</usuario>');
  expect(body).toContain('<senha>test_pass</senha>');
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    expect(body).toContain(`<${key}>${value}</${key}>`);
  }
}

/**
 * Helper para chamar um método do client dentro de um describe de teste,
 * mockando a resposta SOAP e validando request e retorno.
 *
 * O retorno é checado com `toMatchObject` (subset match) porque a fixture
 * tem apenas 1 campo representativo; em produção a Sascar retorna objetos
 * completos. Isso é proposital para os testes não quebrarem quando um
 * campo é adicionado a um tipo.
 */
export async function callAndAssert(
  methodName: string,
  callFn: (client: SascarClient) => Promise<unknown[]>,
  innerXml: string,
  expected: unknown[]
): Promise<void> {
  const scope = mockSoapSuccess(methodName, innerXml);
  const client = makeClient();
  const result = await callFn(client);
  expect(result).toMatchObject(expected);
  expect(scope.isDone()).toBe(true);
}
