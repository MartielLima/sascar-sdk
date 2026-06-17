"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SascarXmlRpcClient = void 0;
const queue_1 = require("../queue");
const envelope_1 = require("./envelope");
const parser_1 = require("./parser");
const transport_1 = require("./transport");
const types_1 = require("./types");
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 3;
class SascarXmlRpcClient {
    login;
    password;
    comandoUrl;
    operacaoUrl;
    timeoutMs;
    maxRetries;
    positionMutex;
    positionsQueue = new queue_1.AsyncQueue();
    constructor(credentials, options) {
        this.login = credentials?.usuario || process.env.SASCAR_USUARIO || '';
        this.password = credentials?.senha || process.env.SASCAR_SENHA || '';
        this.comandoUrl = options?.comandoUrl || types_1.SASCAR_XMLRPC_URLS.comando;
        this.operacaoUrl = options?.operacaoUrl || types_1.SASCAR_XMLRPC_URLS.operacao;
        this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
        this.positionMutex = options?.positionMutex ?? true;
        if (!this.login || !this.password) {
            throw new Error('Credenciais da SASCAR não fornecidas.');
        }
    }
    async send(methodName, params, isPosition = false) {
        const isOperacao = methodName === 'inicializar_operacao'
            || methodName === 'finalizar_operacao'
            || methodName === 'vincular_rota'
            || methodName.startsWith('embarcar_')
            || methodName.startsWith('desembarcar_')
            || methodName === 'vincular_alerta_avd'
            || methodName === 'desvincular_alerta_avd';
        const url = isOperacao ? this.operacaoUrl : this.comandoUrl;
        const xml = (0, envelope_1.buildMethodCall)(methodName, params, this.login, this.password);
        const execute = async () => {
            const text = await (0, transport_1.sendXmlRpcRequest)(xml, {
                url,
                timeoutMs: this.timeoutMs,
                maxRetries: this.maxRetries
            });
            return (0, parser_1.parseMethodResponse)(text);
        };
        if (isPosition && this.positionMutex) {
            return this.positionsQueue.enqueue(execute);
        }
        return execute();
    }
    toCommandResult(parsed) {
        return {
            resultados: parsed.resultados,
            ticketServidor: parsed.ticketServidor ?? 0,
            placasProcessadas: Object.keys(parsed.resultados).map((k) => `idVeiculo=${k}`)
        };
    }
    // ====== 2.5.2 BLOQUEIO ======
    async bloqueio(idVeiculo) {
        return this.toCommandResult(await this.send('bloqueio', [idVeiculo]));
    }
    // ====== 2.5.3 DESBLOQUEIO ======
    async desbloqueio(idVeiculo) {
        return this.toCommandResult(await this.send('desbloqueio', [idVeiculo]));
    }
    // ====== 2.5.8 RESET DE ALARME ======
    async reset_undo_alarme(idVeiculo) {
        return this.toCommandResult(await this.send('reset_undo_alarme', [idVeiculo]));
    }
    // ====== 2.5.4 ATUAÇÃO DE SAÍDAS ======
    async atuador(idVeiculo, idsAtuadores, estado) {
        return this.toCommandResult(await this.send('atuador', [idVeiculo, idsAtuadores, estado]));
    }
    // ====== 2.5.5 ENVIO DE MENSAGEM DE TEXTO ======
    async texto(idVeiculo, mensagem, ticket) {
        const params = [idVeiculo, mensagem];
        if (ticket !== undefined)
            params.push(ticket);
        return this.toCommandResult(await this.send('texto', params));
    }
    // ====== 2.5.6 TRANSMISSÃO COM IGNIÇÃO DESLIGADA ======
    async transmissao_ignicao_desligada(idVeiculo, estado) {
        return this.toCommandResult(await this.send('transmissao_ignicao_desligada', [idVeiculo, estado]));
    }
    // ====== 2.5.14 INIBIÇÃO DE SENSORES ======
    async inibir_sensor(idVeiculo, ids, acao) {
        return this.toCommandResult(await this.send('inibir_sensor', [idVeiculo, ids, acao]));
    }
    // ====== 2.5.15 MODO SEGURO ======
    async modoSeguro(idVeiculo, ativar) {
        return this.toCommandResult(await this.send('modoSeguro', [idVeiculo, ativar]));
    }
    // ====== 2.5.11 INTERVALO DE ANÁLISE SATELITAL ======
    async analise_satelital(idVeiculo, intervaloSegundos) {
        return this.toCommandResult(await this.send('analise_satelital', [idVeiculo, intervaloSegundos]));
    }
    // ====== 2.5.12 INTERVALO DE TRANSMISSÃO SATELITAL ======
    async relatorio_satelital(idVeiculo, intervaloSegundos) {
        return this.toCommandResult(await this.send('relatorio_satelital', [idVeiculo, intervaloSegundos]));
    }
    // ====== 2.5.13 TEMPO DE TRANSMISSÃO GPRS ======
    async relatorio(idVeiculo, tempoSegundos) {
        return this.toCommandResult(await this.send('relatorio', [idVeiculo, tempoSegundos]));
    }
    // ====== 2.5.10 GERAR CONTRA SENHA MTC600 ======
    async gerar_contra_senha_mtc600(idVeiculo) {
        const parsed = await this.send('gerar_contra_senha_mtc600', [idVeiculo]);
        return { ...this.toCommandResult(parsed), senha: parsed.senha ?? '' };
    }
    // ====== 2.5.9 GERAR CONTRA SENHA TD40/TMCD ======
    async gerar_contra_senha(idVeiculo) {
        const parsed = await this.send('gerar_contra_senha', [idVeiculo]);
        return { ...this.toCommandResult(parsed), senha: parsed.senha ?? '' };
    }
    // ====== 2.5.1 POSIÇÃO (usa mutex) ======
    async posicao(idVeiculo) {
        const parsed = await this.send('posicao', [idVeiculo], true);
        if (!parsed.posicao) {
            throw new Error('Resposta de posicao() inválida (sem campos obrigatórios).');
        }
        return parsed.posicao;
    }
    // ====== 2.5.29 STATUS TICKET ======
    async status_ticket(ticketConsulta, ticketInterno) {
        const parsed = await this.send('status_ticket', [ticketConsulta, ticketInterno]);
        return parsed.comandos;
    }
    // ====== 2.5.7 LISTAGEM DE COMANDOS ENVIADOS ======
    async listar_comandos(idVeiculo, quantidade, dataInicial, dataFinal) {
        const parsed = await this.send('listar_comandos', [idVeiculo, quantidade, dataInicial, dataFinal]);
        return parsed.comandos;
    }
    // ====== 2.5.30 VINCULAR ALERTA AVD ======
    async vincular_alerta_avd(idVeiculo, idAlertaAvd) {
        return this.toCommandResult(await this.send('vincular_alerta_avd', [idVeiculo, idAlertaAvd]));
    }
    // ====== 2.5.31 DESVINCULAR ALERTA AVD ======
    async desvincular_alerta_avd(idVeiculo, idAlertaAvd) {
        return this.toCommandResult(await this.send('desvincular_alerta_avd', [idVeiculo, idAlertaAvd]));
    }
    // ====== 2.5.32 INICIALIZAR OPERAÇÃO ======
    async inicializar_operacao(placas) {
        const parsed = await this.send('inicializar_operacao', [placas]);
        return { ...this.toCommandResult(parsed), mensagens: parsed.mensagens };
    }
    // ====== 2.5.33 FINALIZAR OPERAÇÃO ======
    async finalizar_operacao(placas) {
        const parsed = await this.send('finalizar_operacao', [placas]);
        return { ...this.toCommandResult(parsed), mensagens: parsed.mensagens };
    }
    // ====== 2.5.34 VINCULAR ROTA ======
    async vincular_rota(placas, idRota) {
        const parsed = await this.send('vincular_rota', [placas, idRota]);
        return { ...this.toCommandResult(parsed), mensagens: parsed.mensagens };
    }
    // ====== 2.5.16–2.5.27 EMBARCAR LAYOUTS ======
    async embarcar_layout_acao_embarcada_avd(idVeiculo, idLayout) {
        return this.toCommandResult(await this.send('embarcar_layout_acao_embarcada_avd', [idVeiculo, idLayout]));
    }
    async embarcar_layout_grupo_ponto(idVeiculo, idLayout) {
        return this.toCommandResult(await this.send('embarcar_layout_grupo_ponto', [idVeiculo, idLayout]));
    }
    async embarcar_motorista(idVeiculo, idMotorista) {
        return this.toCommandResult(await this.send('embarcar_motorista', [idVeiculo, idMotorista]));
    }
    async embarcar_layout_tmcd(idVeiculo, idLayout) {
        return this.toCommandResult(await this.send('embarcar_layout_tmcd', [idVeiculo, idLayout]));
    }
    async embarcar_layout_td40(idVeiculo, idLayout) {
        return this.toCommandResult(await this.send('embarcar_layout_td40', [idVeiculo, idLayout]));
    }
    async embarcar_layout_td50(idVeiculo, idLayout) {
        return this.toCommandResult(await this.send('embarcar_layout_td50', [idVeiculo, idLayout]));
    }
    async embarcar_sequenciamento_td50(idVeiculo, idLayout) {
        return this.toCommandResult(await this.send('embarcar_sequenciamento_td50', [idVeiculo, idLayout]));
    }
    async embarcar_sequenciamento_macro_sasmdt(idVeiculo, idLayout) {
        return this.toCommandResult(await this.send('embarcar_sequenciamento_macro_sasmdt', [idVeiculo, idLayout]));
    }
    async embarcar_layout_grupo_area_avd(idVeiculo, idLayout) {
        return this.toCommandResult(await this.send('embarcar_layout_grupo_area_avd', [idVeiculo, idLayout]));
    }
    // ====== 2.5.17/19/28 DESEMBARCAR LAYOUTS ======
    async desembarcar_layout_acao_embarcada_avd(idVeiculo) {
        return this.toCommandResult(await this.send('desembarcar_layout_acao_embarcada_avd', [idVeiculo]));
    }
    async desembarcar_layout_grupo_ponto(idVeiculo) {
        return this.toCommandResult(await this.send('desembarcar_layout_grupo_ponto', [idVeiculo]));
    }
    async desembarcar_layout_grupo_area_avd(idVeiculo) {
        return this.toCommandResult(await this.send('desembarcar_layout_grupo_area_avd', [idVeiculo]));
    }
    // ====== HELPERS DE ALTO NÍVEL ======
    /** Helper: envia comando de bloqueio. */
    async bloquearVeiculo(idVeiculo) {
        return this.bloqueio(idVeiculo);
    }
    /** Helper: envia comando de desbloqueio. */
    async desbloquearVeiculo(idVeiculo) {
        return this.desbloqueio(idVeiculo);
    }
    /** Helper: envia texto para o display do veículo. */
    async enviarMensagem(idVeiculo, mensagem, ticket) {
        return this.texto(idVeiculo, mensagem, ticket);
    }
    /** Helper: alterna estado de um atuador. */
    async alternarAtuador(idVeiculo, idAtuador, estado) {
        return this.atuador(idVeiculo, [idAtuador], estado);
    }
    /**
     * Aguarda a execução (ou recusa) de um comando via polling em status_ticket.
     * Retorna apenas quando status converge para 1 (executado) ou 2 (recusado),
     * ou lança timeout se `timeoutMs` for atingido.
     */
    async aguardarComando(ticket, idVeiculo, opts) {
        const timeoutMs = opts?.timeoutMs ?? 60_000;
        const pollIntervalMs = opts?.pollIntervalMs ?? 3_000;
        const start = Date.now();
        let tentativas = 0;
        while (Date.now() - start < timeoutMs) {
            tentativas++;
            const statuses = await this.status_ticket(ticket, ticket);
            const match = statuses.find((s) => s.ticketServidor === ticket) ?? statuses[0];
            if (!match) {
                await new Promise((res) => setTimeout(res, pollIntervalMs));
                continue;
            }
            if (match.status === 1 || match.status === 2) {
                return {
                    ticket: match.ticketServidor,
                    status: match.status,
                    statusDescricao: match.statusDescricao,
                    tentativas,
                    duracaoMs: Date.now() - start
                };
            }
            await new Promise((res) => setTimeout(res, pollIntervalMs));
        }
        throw new Error(`Timeout aguardando ticket ${ticket} após ${timeoutMs}ms (${tentativas} tentativas).`);
    }
}
exports.SascarXmlRpcClient = SascarXmlRpcClient;
