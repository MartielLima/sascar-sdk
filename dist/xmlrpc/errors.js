"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SascarXmlRpcError = void 0;
const errors_1 = require("../errors");
/**
 * Lançado para erros específicos do XML-RPC (fault, método desconhecido, etc).
 * Estende SascarApiError para permitir `try/catch` unificado entre SOAP e XML-RPC.
 */
class SascarXmlRpcError extends errors_1.SascarApiError {
    methodName;
    rawFault;
    constructor(message, methodName, rawFault) {
        super(message);
        this.name = 'SascarXmlRpcError';
        this.methodName = methodName;
        this.rawFault = rawFault;
    }
}
exports.SascarXmlRpcError = SascarXmlRpcError;
