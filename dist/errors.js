"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SascarApiError = exports.SascarRateLimitError = exports.SascarConnectionError = void 0;
class SascarConnectionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SascarConnectionError';
    }
}
exports.SascarConnectionError = SascarConnectionError;
class SascarRateLimitError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SascarRateLimitError';
    }
}
exports.SascarRateLimitError = SascarRateLimitError;
class SascarApiError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SascarApiError';
    }
}
exports.SascarApiError = SascarApiError;
