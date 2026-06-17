import { SascarApiError } from '../errors';

export interface XmlRpcFault {
  faultCode: number;
  faultString: string;
}

/**
 * Lançado para erros específicos do XML-RPC (fault, método desconhecido, etc).
 * Estende SascarApiError para permitir `try/catch` unificado entre SOAP e XML-RPC.
 */
export class SascarXmlRpcError extends SascarApiError {
  constructor(
    message: string,
    public readonly methodName: string,
    public readonly rawFault?: XmlRpcFault
  ) {
    super(message);
    this.name = 'SascarXmlRpcError';
  }
}
