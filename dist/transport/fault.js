"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSoapFault = parseSoapFault;
const fast_xml_parser_1 = require("fast-xml-parser");
const parser = new fast_xml_parser_1.XMLParser({ ignoreAttributes: true, removeNSPrefix: true });
/**
 * Faz o parse de uma resposta XML SOAP procurando um Fault.
 * Retorna null se não houver Fault, ou um SascarSoapFault com os
 * campos extraídos. Em caso de Fault malformado, retorna o que
 * conseguir extrair com faultcode 'unknown'.
 */
function parseSoapFault(xml) {
    const parsed = parser.parse(xml);
    const fault = parsed?.Envelope?.Body?.Fault;
    if (!fault)
        return null;
    return {
        faultcode: typeof fault.faultcode === 'string' ? fault.faultcode : 'unknown',
        faultstring: typeof fault.faultstring === 'string' ? fault.faultstring : '',
        detail: typeof fault.detail === 'string' ? fault.detail : undefined
    };
}
