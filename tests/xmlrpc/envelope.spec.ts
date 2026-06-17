import { buildMethodCall } from '../../src/xmlrpc/envelope';

describe('buildMethodCall', () => {
  it('monta <methodCall> com methodName, params struct, login e password', () => {
    const xml = buildMethodCall('bloqueio', [], 'user', 'pass');
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<methodCall>');
    expect(xml).toContain('<methodName>bloqueio</methodName>');
    expect(xml).toContain('<params>');
    expect(xml).toContain('<name>login</name>');
    expect(xml).toContain('<value><string>user</string></value>');
    expect(xml).toContain('<name>password</name>');
    expect(xml).toContain('<value><string>pass</string></value>');
    // sem params: NÃO inclui <name>placa</name> (comandos sem veículo, ex.: status_ticket)
  });

  it('serializa string em <value><string>', () => {
    const xml = buildMethodCall('texto', ['ABC1D23', 'hello world'], 'u', 'p');
    expect(xml).toContain('<value><string>ABC1D23</string></value>');
    expect(xml).toContain('<value><string>hello world</string></value>');
  });

  it('serializa number em <value><int>', () => {
    const xml = buildMethodCall('bloqueio', [2248181], 'u', 'p');
    expect(xml).toContain('<value><int>2248181</int></value>');
  });

  it('serializa boolean em <value><boolean>', () => {
    const xml = buildMethodCall('modoSeguro', [2248181, true], 'u', 'p');
    expect(xml).toContain('<value><boolean>1</boolean></value>');
  });

  it('serializa array de inteiros em <value><array><data>', () => {
    const xml = buildMethodCall('inibir_sensor', [2248181, [231, 241, 248], 1], 'u', 'p');
    expect(xml).toContain('<value><array><data>');
    expect(xml).toContain('<value><int>231</int></value>');
    expect(xml).toContain('<value><int>241</int></value>');
    expect(xml).toContain('<value><int>248</int></value>');
    expect(xml).toContain('</data></array></value>');
  });

  it('escapa caracteres XML perigosos em strings', () => {
    const xml = buildMethodCall('texto', ['ABC&<>"D23', 'msg'], 'u', 'p');
    expect(xml).toContain('ABC&amp;&lt;&gt;&quot;D23');
  });
});
