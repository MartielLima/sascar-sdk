"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSoapEnvelope = buildSoapEnvelope;
const fast_xml_parser_1 = require("fast-xml-parser");
const SOAP_NS = 'http://schemas.xmlsoap.org/soap/envelope/';
const WEB_NS = 'http://webservice.web.integracao.sascar.com.br/';
const builder = new fast_xml_parser_1.XMLBuilder({
    ignoreAttributes: false,
    format: false,
    suppressEmptyNode: true
});
/**
 * Constrói um envelope SOAP XML para a operação informada.
 * Inclui as credenciais (usuario, senha) no body conforme o WSDL SasIntegra.
 */
function buildSoapEnvelope(methodName, body, usuario, senha) {
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
