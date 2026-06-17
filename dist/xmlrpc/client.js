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
    enviarComandoUrl;
    operacaoUrl;
    timeoutMs;
    maxRetries;
    positionMutex;
    positionsQueue = new queue_1.AsyncQueue();
    constructor(credentials, options) {
        this.login = credentials?.usuario || process.env.SASCAR_USUARIO || '';
        this.password = credentials?.senha || process.env.SASCAR_SENHA || '';
        this.enviarComandoUrl = options?.enviarComandoUrl || types_1.SASCAR_XMLRPC_URLS.enviarComando;
        this.operacaoUrl = options?.operacaoUrl || types_1.SASCAR_XMLRPC_URLS.operacao;
        this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
        this.positionMutex = options?.positionMutex ?? true;
        if (!this.login || !this.password) {
            throw new Error('Credenciais da SASCAR não fornecidas.');
        }
    }
    async send(methodName, params, isPosition = false, ticketCliente) {
        // Apenas 5 comandos do manual v3.5 vão para /xmlrpc/operacao (seções 2.5.30–2.5.34).
        // Todos os outros (incluindo embarcar_*/desembarcar_*) vão para /xmlrpc/enviar_comando.
        const isOperacao = methodName === 'vincular_alerta_avd'
            || methodName === 'desvincular_alerta_avd'
            || methodName === 'inicializar_operacao'
            || methodName === 'finalizar_operacao'
            || methodName === 'vincular_rota';
        const url = isOperacao ? this.operacaoUrl : this.enviarComandoUrl;
        // Gera ticket cliente se não foi fornecido (manual seção 2.5: "ticket" vai no request).
        const ticket = ticketCliente ?? Math.floor(Math.random() * 2_147_483_647);
        const xml = (0, envelope_1.buildMethodCall)(methodName, params, this.login, this.password, [
            { name: 'ticket', value: ticket }
        ]);
        const execute = async () => {
            const text = await (0, transport_1.sendXmlRpcRequest)(xml, {
                url,
                timeoutMs: this.timeoutMs,
                maxRetries: this.maxRetries
            });
            return { ...(await (0, parser_1.parseMethodResponse)(text)), ticketCliente: ticket };
        };
        if (isPosition && this.positionMutex) {
            return this.positionsQueue.enqueue(execute);
        }
        return execute();
    }
    toCommandResult(parsed) {
        return {
            ticketServidor: parsed.ticketServidor ?? '',
            statusComando: parsed.statusComando ?? undefined,
            ticketCliente: parsed.ticketCliente
        };
    }
    // ====== 2.5.2 BLOQUEIO ======
    async bloqueio(placa) {
        return this.toCommandResult(await this.send('bloqueio', [placa]));
    }
    // ====== 2.5.3 DESBLOQUEIO ======
    async desbloqueio(placa) {
        return this.toCommandResult(await this.send('desbloqueio', [placa]));
    }
    // ====== 2.5.8 RESET DE ALARME ======
    async reset_undo_alarme(placa) {
        return this.toCommandResult(await this.send('reset_undo_alarme', [placa]));
    }
    // ====== 2.5.4 ATUAÇÃO DE SAÍDAS ======
    async atuador(placa, idsAtuadores, estado) {
        return this.toCommandResult(await this.send('atuador', [placa, idsAtuadores, estado]));
    }
    // ====== 2.5.5 ENVIO DE MENSAGEM DE TEXTO ======
    async texto(placa, mensagem, ticket) {
        const params = [placa, mensagem];
        if (ticket !== undefined)
            params.push(ticket);
        return this.toCommandResult(await this.send('texto', params));
    }
    // ====== 2.5.6 TRANSMISSÃO COM IGNIÇÃO DESLIGADA ======
    async transmissao_ignicao_desligada(placa, estado) {
        return this.toCommandResult(await this.send('transmissao_ignicao_desligada', [placa, estado]));
    }
    // ====== 2.5.14 INIBIÇÃO DE SENSORES ======
    async inibir_sensor(placa, ids, acao) {
        return this.toCommandResult(await this.send('inibir_sensor', [placa, ids, acao]));
    }
    // ====== 2.5.15 MODO SEGURO ======
    async modoSeguro(placa, ativar) {
        return this.toCommandResult(await this.send('modoSeguro', [placa, ativar]));
    }
    // ====== 2.5.11 INTERVALO DE ANÁLISE SATELITAL ======
    async analise_satelital(placa, intervaloSegundos) {
        return this.toCommandResult(await this.send('analise_satelital', [placa, intervaloSegundos]));
    }
    // ====== 2.5.12 INTERVALO DE TRANSMISSÃO SATELITAL ======
    async relatorio_satelital(placa, intervaloSegundos) {
        return this.toCommandResult(await this.send('relatorio_satelital', [placa, intervaloSegundos]));
    }
    // ====== 2.5.13 TEMPO DE TRANSMISSÃO GPRS ======
    async relatorio(placa, tempoSegundos) {
        return this.toCommandResult(await this.send('relatorio', [placa, tempoSegundos]));
    }
    // ====== 2.5.10 GERAR CONTRA SENHA MTC600 ======
    async gerar_contra_senha_mtc600(placa) {
        const parsed = await this.send('gerar_contra_senha_mtc600', [placa]);
        return { senha: parsed.senha ?? '', ticketCliente: parsed.ticketCliente };
    }
    // ====== 2.5.9 GERAR CONTRA SENHA TD40/TMCD ======
    async gerar_contra_senha(placa) {
        const parsed = await this.send('gerar_contra_senha', [placa]);
        return { senha: parsed.senha ?? '', ticketCliente: parsed.ticketCliente };
    }
    // ====== 2.5.1 POSIÇÃO (usa mutex) ======
    async posicao(placa) {
        const parsed = await this.send('posicao', [placa], true);
        if (!parsed.posicao) {
            throw new Error('Resposta de posicao() inválida (sem campos obrigatórios).');
        }
        return parsed.posicao;
    }
    // ====== 2.5.29 STATUS TICKET ======
    async status_ticket(ticketConsulta, ticketServidor) {
        const parsed = await this.send('status_ticket', [ticketConsulta, ticketServidor]);
        return parsed.comandos.map((c) => ({
            ticket: c.ticketServidor,
            dataExecucao: c.dataEnvio,
            status: c.status,
            statusDescricao: c.statusDescricao
        }));
    }
    // ====== 2.5.7 LISTAGEM DE COMANDOS ENVIADOS ======
    async listar_comandos(placa, quantidade, dataInicial, dataFinal) {
        const parsed = await this.send('listar_comandos', [placa, quantidade, dataInicial, dataFinal]);
        return parsed.comandos;
    }
    // ====== 2.5.30 VINCULAR ALERTA AVD ======
    async vincular_alerta_avd(placa, idAlertaAvd) {
        return this.toCommandResult(await this.send('vincular_alerta_avd', [placa, idAlertaAvd]));
    }
    // ====== 2.5.31 DESVINCULAR ALERTA AVD ======
    async desvincular_alerta_avd(placa, idAlertaAvd) {
        return this.toCommandResult(await this.send('desvincular_alerta_avd', [placa, idAlertaAvd]));
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
    async embarcar_layout_acao_embarcada_avd(placa, idLayout) {
        return this.toCommandResult(await this.send('embarcar_layout_acao_embarcada_avd', [placa, idLayout]));
    }
    async embarcar_layout_grupo_ponto(placa, idLayout) {
        return this.toCommandResult(await this.send('embarcar_layout_grupo_ponto', [placa, idLayout]));
    }
    async embarcar_motorista(placa, idMotorista) {
        return this.toCommandResult(await this.send('embarcar_motorista', [placa, idMotorista]));
    }
    async embarcar_layout_tmcd(placa, idLayout) {
        return this.toCommandResult(await this.send('embarcar_layout_tmcd', [placa, idLayout]));
    }
    async embarcar_layout_td40(placa, idLayout) {
        return this.toCommandResult(await this.send('embarcar_layout_td40', [placa, idLayout]));
    }
    async embarcar_layout_td50(placa, idLayout) {
        return this.toCommandResult(await this.send('embarcar_layout_td50', [placa, idLayout]));
    }
    async embarcar_sequenciamento_td50(placa, idLayout) {
        return this.toCommandResult(await this.send('embarcar_sequenciamento_td50', [placa, idLayout]));
    }
    async embarcar_sequenciamento_macro_sasmdt(placa, idLayout) {
        return this.toCommandResult(await this.send('embarcar_sequenciamento_macro_sasmdt', [placa, idLayout]));
    }
    async embarcar_layout_grupo_area_avd(placa, idLayout) {
        return this.toCommandResult(await this.send('embarcar_layout_grupo_area_avd', [placa, idLayout]));
    }
    // ====== 2.5.17/19/28 DESEMBARCAR LAYOUTS ======
    async desembarcar_layout_acao_embarcada_avd(placa) {
        return this.toCommandResult(await this.send('desembarcar_layout_acao_embarcada_avd', [placa]));
    }
    async desembarcar_layout_grupo_ponto(placa) {
        return this.toCommandResult(await this.send('desembarcar_layout_grupo_ponto', [placa]));
    }
    async desembarcar_layout_grupo_area_avd(placa) {
        return this.toCommandResult(await this.send('desembarcar_layout_grupo_area_avd', [placa]));
    }
    // ====== HELPERS DE ALTO NÍVEL ======
    /** Helper: envia comando de bloqueio. */
    async bloquearVeiculo(placa) {
        return this.bloqueio(placa);
    }
    /** Helper: envia comando de desbloqueio. */
    async desbloquearVeiculo(placa) {
        return this.desbloqueio(placa);
    }
    /** Helper: envia texto para o display do veículo. */
    async enviarMensagem(placa, mensagem, ticket) {
        return this.texto(placa, mensagem, ticket);
    }
    /** Helper: alterna estado de um atuador. */
    async alternarAtuador(placa, idAtuador, estado) {
        return this.atuador(placa, [idAtuador], estado);
    }
    /**
     * Aguarda a execução (ou recusa) de um comando via polling em status_ticket.
     * Retorna apenas quando status converge para 1 (executado) ou 2 (recusado),
     * ou lança timeout se `timeoutMs` for atingido.
     */
    async aguardarComando(ticketServidor, placa, opts) {
        const timeoutMs = opts?.timeoutMs ?? 60_000;
        const pollIntervalMs = opts?.pollIntervalMs ?? 3_000;
        const start = Date.now();
        let tentativas = 0;
        const ticketCliente = opts?.ticketCliente ?? 0;
        while (Date.now() - start < timeoutMs) {
            tentativas++;
            const statuses = await this.status_ticket(ticketCliente, ticketServidor);
            const match = statuses.find((s) => s.ticket === ticketServidor) ?? statuses[0];
            if (!match) {
                await new Promise((res) => setTimeout(res, pollIntervalMs));
                continue;
            }
            if (match.status === 1 || match.status === 2) {
                return {
                    ticket: match.ticket,
                    status: match.status,
                    statusDescricao: match.statusDescricao,
                    tentativas,
                    duracaoMs: Date.now() - start
                };
            }
            await new Promise((res) => setTimeout(res, pollIntervalMs));
        }
        throw new Error(`Timeout aguardando ticket ${ticketServidor} após ${timeoutMs}ms (${tentativas} tentativas).`);
    }
}
exports.SascarXmlRpcClient = SascarXmlRpcClient;
