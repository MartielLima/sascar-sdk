"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMethodCall = buildMethodCall;
function escapeXml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
function serializeValue(param) {
    if (typeof param === 'string') {
        return `<value><string>${escapeXml(param)}</string></value>`;
    }
    if (typeof param === 'number') {
        if (Number.isInteger(param)) {
            return `<value><int>${param}</int></value>`;
        }
        return `<value><double>${param}</double></value>`;
    }
    if (typeof param === 'boolean') {
        return `<value><boolean>${param ? 1 : 0}</boolean></value>`;
    }
    if (Array.isArray(param)) {
        const items = param.map((p) => serializeValue(p)).join('');
        return `<value><array><data>${items}</data></array></value>`;
    }
    throw new Error(`Tipo de parâmetro XML-RPC não suportado: ${typeof param}`);
}
/**
 * Constrói um <methodCall>...</methodCall> XML-RPC.
 *
 * O array `params` é serializado como membros de um <struct>:
 * - Posição 0 → `<name>placa</name>`
 * - Demais posições → `<name>param1</name>`, `<name>param2</name>`, etc.
 *
 * O array `named` adiciona membros com nome explícito (para campos como `ticket`,
 * `configuracao`, `acao` que o manual Sascar exige com nome específico).
 *
 * As credenciais `login` e `password` são sempre os primeiros membros do struct.
 */
function buildMethodCall(methodName, params, login, password, named = []) {
    const structMembers = [
        `<member><name>login</name><value><string>${escapeXml(login)}</string></value></member>`,
        `<member><name>password</name><value><string>${escapeXml(password)}</string></value></member>`
    ];
    if (params.length > 0) {
        structMembers.push(`<member><name>placa</name>${serializeValue(params[0])}</member>`);
    }
    for (let i = 1; i < params.length; i++) {
        structMembers.push(`<member><name>param${i}</name>${serializeValue(params[i])}</member>`);
    }
    for (const n of named) {
        structMembers.push(`<member><name>${escapeXml(n.name)}</name>${serializeValue(n.value)}</member>`);
    }
    return `<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
  <methodName>${escapeXml(methodName)}</methodName>
  <params>
    <param>
      <value>
        <struct>
          ${structMembers.join('\n          ')}
        </struct>
      </value>
    </param>
  </params>
</methodCall>`;
}
