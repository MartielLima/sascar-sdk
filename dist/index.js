"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SASCAR_XMLRPC_URLS = exports.SascarXmlRpcError = exports.SascarXmlRpcClient = exports.AsyncQueue = exports.SascarClient = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "SascarClient", { enumerable: true, get: function () { return client_1.SascarClient; } });
var queue_1 = require("./queue");
Object.defineProperty(exports, "AsyncQueue", { enumerable: true, get: function () { return queue_1.AsyncQueue; } });
__exportStar(require("./types"), exports);
__exportStar(require("./errors"), exports);
// Re-exporta o módulo XML-RPC para `import { SascarXmlRpcClient } from 'sascar-sdk'`
var xmlrpc_1 = require("./xmlrpc");
Object.defineProperty(exports, "SascarXmlRpcClient", { enumerable: true, get: function () { return xmlrpc_1.SascarXmlRpcClient; } });
Object.defineProperty(exports, "SascarXmlRpcError", { enumerable: true, get: function () { return xmlrpc_1.SascarXmlRpcError; } });
Object.defineProperty(exports, "SASCAR_XMLRPC_URLS", { enumerable: true, get: function () { return xmlrpc_1.SASCAR_XMLRPC_URLS; } });
