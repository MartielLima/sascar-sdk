import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({ ignoreAttributes: true, removeNSPrefix: true });

export interface SascarSoapFault {
  faultcode: string;
  faultstring: string;
  detail?: string;
}

/**
 * Faz o parse de uma resposta XML SOAP procurando um Fault.
 * Retorna null se não houver Fault, ou um SascarSoapFault com os
 * campos extraídos. Em caso de Fault malformado, retorna o que
 * conseguir extrair com faultcode 'unknown'.
 */
export function parseSoapFault(xml: string): SascarSoapFault | null {
  const parsed = parser.parse(xml);
  const fault = parsed?.Envelope?.Body?.Fault;
  if (!fault) return null;

  return {
    faultcode: typeof fault.faultcode === 'string' ? fault.faultcode : 'unknown',
    faultstring: typeof fault.faultstring === 'string' ? fault.faultstring : '',
    detail: typeof fault.detail === 'string' ? fault.detail : undefined
  };
}
