import { SascarXmlRpcClient } from '../../src/xmlrpc';

describe('xmlrpc barrel exports', () => {
  it('SascarXmlRpcClient está exportado', () => {
    expect(typeof SascarXmlRpcClient).toBe('function');
  });

  it('SascarXmlRpcClient é instanciável com credenciais explícitas', () => {
    const client = new SascarXmlRpcClient(
      { usuario: 'test_user', senha: 'test_pass' },
      { maxRetries: 1, timeoutMs: 1000 }
    );
    expect(client).toBeInstanceOf(SascarXmlRpcClient);
  });
});
