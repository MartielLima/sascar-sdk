import { buildSoapEnvelope } from '../../src/transport/envelope';

describe('buildSoapEnvelope', () => {
  it('gera envelope SOAP com header, body e credenciais', () => {
    const xml = buildSoapEnvelope('obterVeiculos', { quantidade: 100 }, 'user', 'pass');
    expect(xml).toContain('http://schemas.xmlsoap.org/soap/envelope/');
    expect(xml).toContain('<soapenv:Header/>');
    expect(xml).toContain('<web:obterVeiculos>');
    expect(xml).toContain('<usuario>user</usuario>');
    expect(xml).toContain('<senha>pass</senha>');
    expect(xml).toContain('<quantidade>100</quantidade>');
  });

  it('omite parâmetros undefined', () => {
    const xml = buildSoapEnvelope('obterVeiculos', { quantidade: 100 }, 'u', 'p');
    expect(xml).not.toContain('<idVeiculo>undefined</idVeiculo>');
  });
});
