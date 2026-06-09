import { parseSoapFault } from '../../src/transport/fault';

describe('parseSoapFault', () => {
  it('extrai faultcode e faultstring de um Fault bem-formado', () => {
    const xml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <soapenv:Fault>
            <faultcode>soap-env:Client</faultcode>
            <faultstring>Credenciais inválidas</faultstring>
          </soapenv:Fault>
        </soapenv:Body>
      </soapenv:Envelope>
    `;
    const fault = parseSoapFault(xml);
    expect(fault).not.toBeNull();
    expect(fault?.faultcode).toBe('soap-env:Client');
    expect(fault?.faultstring).toBe('Credenciais inválidas');
  });

  it('extrai detail quando presente', () => {
    const xml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <soapenv:Fault>
            <faultcode>soap-env:Server</faultcode>
            <faultstring>Internal error</faultstring>
            <detail>Stack trace here</detail>
          </soapenv:Fault>
        </soapenv:Body>
      </soapenv:Envelope>
    `;
    const fault = parseSoapFault(xml);
    expect(fault?.detail).toBe('Stack trace here');
  });

  it('retorna null quando não há Fault', () => {
    const xml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <obterVeiculosResponse></obterVeiculosResponse>
        </soapenv:Body>
      </soapenv:Envelope>
    `;
    expect(parseSoapFault(xml)).toBeNull();
  });

  it('lida com Fault malformado retornando faultstring parcial', () => {
    const xml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <soapenv:Fault>
            <faultstring>Apenas string</faultstring>
          </soapenv:Fault>
        </soapenv:Body>
      </soapenv:Envelope>
    `;
    const fault = parseSoapFault(xml);
    expect(fault?.faultstring).toBe('Apenas string');
    expect(fault?.faultcode).toBe('unknown');
  });
});
