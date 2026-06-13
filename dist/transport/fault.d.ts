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
export declare function parseSoapFault(xml: string): SascarSoapFault | null;
