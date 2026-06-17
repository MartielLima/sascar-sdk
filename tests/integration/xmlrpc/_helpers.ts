import nock, { type Scope } from 'nock';
import { SASCAR_XMLRPC_URLS } from '../../../src/xmlrpc/types';

export const COMANDO_URL = SASCAR_XMLRPC_URLS.comando;
export const OPERACAO_URL = SASCAR_XMLRPC_URLS.operacao;

/**
 * Mocka resposta XML-RPC bem-sucedida (methodResponse com struct) para `methodName`.
 * O `innerStructXml` é o conteúdo do nó <struct>...</struct>.
 */
export function mockXmlRpcSuccess(methodName: string, innerStructXml: string): Scope {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<methodResponse>
  <params>
    <param>
      <value>
        <struct>
          ${innerStructXml}
        </struct>
      </value>
    </param>
  </params>
</methodResponse>`;
  return nock(COMANDO_URL).post(/.*/).reply(200, xml, { 'Content-Type': 'text/xml;charset=UTF-8' });
}

/**
 * Valida o corpo de uma request XML-RPC:
 * - contém <methodName>X</methodName>
 * - contém <name>login</name><value><string>test_user</string></value>
 * - contém <name>password</name><value><string>test_pass</string></value>
 * - contém <name>placa</name> com o valor esperado
 * - contém tags customizadas esperadas (em `expectParams`)
 */
export function assertXmlRpcBody(
  body: string,
  methodName: string,
  expectedPlaca: string,
  expectParams: string[] = []
): void {
  expect(body).toContain(`<methodName>${methodName}</methodName>`);
  expect(body).toContain('<name>login</name>');
  expect(body).toContain('<value><string>test_user</string></value>');
  expect(body).toContain('<name>password</name>');
  expect(body).toContain('<value><string>test_pass</string></value>');
  expect(body).toContain(`<name>placa</name>`);
  expect(body).toContain(expectedPlaca);
  for (const p of expectParams) {
    expect(body).toContain(p);
  }
}
