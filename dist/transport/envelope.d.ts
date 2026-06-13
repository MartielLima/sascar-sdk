import type { SoapBody } from '../types';
/**
 * Constrói um envelope SOAP XML para a operação informada.
 * Inclui as credenciais (usuario, senha) no body conforme o WSDL SasIntegra.
 */
export declare function buildSoapEnvelope(methodName: string, body: SoapBody, usuario: string, senha: string): string;
