import { XMLBuilder } from 'fast-xml-parser';
import type { SoapBody } from '../types';

const SOAP_NS = 'http://schemas.xmlsoap.org/soap/envelope/';
const WEB_NS = 'http://webservice.web.integracao.sascar.com.br/';

const builder = new XMLBuilder({
  ignoreAttributes: false,
  format: false,
  suppressEmptyNode: true
});

/**
 * Constrói um envelope SOAP XML para a operação informada.
 * Inclui as credenciais (usuario, senha) no body conforme o WSDL SasIntegra.
 */
export function buildSoapEnvelope(methodName: string, body: SoapBody, usuario: string, senha: string): string {
  const envelope = {
    'soapenv:Envelope': {
      '@_xmlns:soapenv': SOAP_NS,
      '@_xmlns:web': WEB_NS,
      'soapenv:Header': '',
      'soapenv:Body': {
        [`web:${methodName}`]: {
          usuario,
          senha,
          ...body
        }
      }
    }
  };
  return builder.build(envelope);
}
