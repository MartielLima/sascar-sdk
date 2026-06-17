"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SASCAR_XMLRPC_URLS = void 0;
/** URL dos endpoints XML-RPC (manual Sascar v3.5 seção 2.3). */
exports.SASCAR_XMLRPC_URLS = {
    /** Default: usado pela maioria dos comandos (seções 2.5.1–2.5.29). */
    enviarComando: 'https://xmlrpc.sascar.com.br/xmlrpc/enviar_comando',
    /** Usado apenas pelas seções 2.5.30–2.5.34 (AVD, inicializar/finalizar operacao, vincular rota). */
    operacao: 'https://xmlrpc.sascar.com.br/xmlrpc/operacao'
};
