export { SascarClient } from './client';
export { AsyncQueue } from './queue';
export * from './types';
export * from './errors';

// Re-exporta o módulo XML-RPC para `import { SascarXmlRpcClient } from 'sascar-sdk'`
export {
  SascarXmlRpcClient,
  type SascarXmlRpcClientOptions,
  SascarXmlRpcError,
  type SascarXmlRpcFault,
  type SascarXmlRpcCommandResult,
  type SascarXmlRpcOperacaoResult,
  type SascarXmlRpcPosicaoResult,
  type SascarXmlRpcSenhaResult,
  type SascarComandoEnviado,
  type SascarComandoStatus,
  type SascarComandoStatusFinal,
  type SascarXmlRpcParam,
  SASCAR_XMLRPC_URLS
} from './xmlrpc';
