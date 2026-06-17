import { SascarXmlRpcError } from '../../src/xmlrpc/errors';
import { SascarApiError } from '../../src/errors';

describe('SascarXmlRpcError', () => {
  it('estende SascarApiError para catching unificado', () => {
    const err = new SascarXmlRpcError('falhou', 'bloqueio', {
      faultCode: -1,
      faultString: 'erro'
    });
    expect(err).toBeInstanceOf(SascarApiError);
    expect(err.name).toBe('SascarXmlRpcError');
    expect(err.message).toBe('falhou');
    expect(err.methodName).toBe('bloqueio');
    expect(err.rawFault).toEqual({ faultCode: -1, faultString: 'erro' });
  });

  it('aceita rawFault undefined', () => {
    const err = new SascarXmlRpcError('falhou', 'desbloqueio');
    expect(err.rawFault).toBeUndefined();
    expect(err.methodName).toBe('desbloqueio');
  });
});
