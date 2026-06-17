import { SascarApiError } from '../errors';

/** Estrutura de fault retornada por respostas <methodResponse><fault>...</fault></methodResponse>. */
export interface SascarXmlRpcFault {
  faultCode: number;
  faultString: string;
}

/**
 * Lançado para erros específicos do XML-RPC (fault, método desconhecido, etc).
 * Estende SascarApiError para permitir `try/catch` unificado entre SOAP e XML-RPC.
 */
export class SascarXmlRpcError extends SascarApiError {
  readonly methodName: string;
  readonly rawFault?: SascarXmlRpcFault;

  constructor(message: string, methodName: string, rawFault?: SascarXmlRpcFault) {
    super(message);
    this.name = 'SascarXmlRpcError';
    this.methodName = methodName;
    this.rawFault = rawFault;
  }
}
