"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SascarClient = void 0;
const fast_xml_parser_1 = require("fast-xml-parser");
const queue_1 = require("./queue");
const errors_1 = require("./errors");
const envelope_1 = require("./transport/envelope");
const http_1 = require("./transport/http");
const fault_1 = require("./transport/fault");
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_WSDL_URL = 'https://sasintegra.sascar.com.br/SasIntegra/SasIntegraWSService';
/**
 * Cliente SOAP para o WebService SasIntegra v2.07 da Sascar/Michelin.
 *
 * Nomenclatura: métodos em PT (`obter*`) são a forma canônica.
 * Métodos em inglês (`get*`) são aliases mantidos por compatibilidade
 * com a nomenclatura do WSDL e operações SOAP oficiais.
 */
class SascarClient {
    usuario;
    senha;
    wsdlUrl;
    timeoutMs;
    maxRetries;
    positionsQueue = new queue_1.AsyncQueue();
    parser = new fast_xml_parser_1.XMLParser({ ignoreAttributes: true, removeNSPrefix: true });
    constructor(credentials, options) {
        this.usuario = credentials?.usuario || process.env.SASCAR_USUARIO || '';
        this.senha = credentials?.senha || process.env.SASCAR_SENHA || '';
        this.wsdlUrl = options?.wsdlUrl || DEFAULT_WSDL_URL;
        this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
        if (!this.usuario || !this.senha) {
            throw new Error('Credenciais da SASCAR não fornecidas.');
        }
    }
    async request(methodName, params = {}, isPositionMethod = false) {
        const xml = (0, envelope_1.buildSoapEnvelope)(methodName, params, this.usuario, this.senha);
        const execute = async () => {
            const text = await (0, http_1.sendSoapRequest)(xml, {
                url: this.wsdlUrl,
                timeoutMs: this.timeoutMs,
                maxRetries: this.maxRetries
            });
            const fault = (0, fault_1.parseSoapFault)(text);
            if (fault) {
                throw new errors_1.SascarApiError(`[${methodName}] SOAP Fault: ${fault.faultstring} (${fault.faultcode})`, fault);
            }
            const parsed = this.parser.parse(text);
            const responseNode = parsed.Envelope?.Body?.[`${methodName}Response`];
            if (responseNode === undefined) {
                throw new errors_1.SascarApiError(`[${methodName}] Resposta inválida do servidor Sascar.`);
            }
            let result = responseNode.return;
            if (!result)
                return [];
            const parseItem = (item) => {
                if (typeof item === 'string' && (item.trim().startsWith('{') || item.trim().startsWith('['))) {
                    try {
                        return JSON.parse(item);
                    }
                    catch {
                        // intentionally ignored — fallback to original string
                    }
                }
                return item;
            };
            if (Array.isArray(result)) {
                result = result.map(parseItem);
            }
            else {
                result = [parseItem(result)];
            }
            return result;
        };
        if (isPositionMethod) {
            return this.positionsQueue.enqueue(execute);
        }
        return execute();
    }
    // --- MÉTODOS DE DADOS CADASTRAIS / CONFIGURAÇÕES ---
    async atualizarSenha(senhaAtual, novaSenha) {
        return this.request('atualizarSenha', { senhaAtual, novaSenha });
    }
    async obterAlertasAVDVinculados(veiplaca, veioid) {
        return this.request('obterAlertasAVDVinculados', { veiplaca, veioid });
    }
    async obterGrupoAtuadores() {
        return this.request('obterGrupoAtuadores');
    }
    async obterCadastroAlertasAVD(dataInicio) {
        return this.request('obterCadastroAlertasAvd', { dataInicio });
    }
    async obterClientes(quantidade = 1000, idCliente) {
        return this.request('obterClientes', { quantidade, idCliente });
    }
    async obterClientesV2(quantidade = 1000, idCliente) {
        return this.request('obterClientesV2', { quantidade, idCliente });
    }
    async obterVeiculos(quantidade = 1000, idVeiculo) {
        return this.request('obterVeiculos', { quantidade, idVeiculo });
    }
    async obterVeiculosJson(quantidade = 1000, startIdVeiculo = 0) {
        let allVehicles = [];
        let currentId = startIdVeiculo;
        let keepPaginating = true;
        while (keepPaginating) {
            const result = await this.request('getVehiclesJSON', {
                quantidade,
                ...(currentId > 0 ? { vehicleId: currentId } : {})
            });
            const vehicles = Array.isArray(result) ? result : result ? [result] : [];
            if (vehicles.length === 0 || Object.keys(vehicles[0]).length === 0) {
                keepPaginating = false;
            }
            else {
                allVehicles = allVehicles.concat(vehicles);
                if (vehicles.length < quantidade) {
                    keepPaginating = false;
                }
                else {
                    currentId = vehicles[vehicles.length - 1].idVeiculo;
                }
            }
        }
        return allVehicles;
    }
    async obterVeiculosRFNacional(quantidade = 1000, idVeiculo) {
        return this.request('obterVeiculosRFNacional', { quantidade, idVeiculo });
    }
    async obterDadosAdicionais(idVeiculo) {
        return this.request('obterDadosAdicionais', { idVeiculo });
    }
    async obterDadosAdicionaisCliente(idVeiculo) {
        return this.request('obterDadosAdicionaisCliente', { idVeiculo });
    }
    async obterPontosReferencia() {
        return this.request('obterPontosReferencia');
    }
    async obterSequenciamentoEvento() {
        return this.request('obterSequenciamentoEvento');
    }
    async obterMotoristas(quantidade = 1000, idMotorista) {
        return this.request('obterMotoristas', { quantidade, idMotorista });
    }
    async obterMotoristasVeiculos(quantidade = 1000, idMotoristaVeiculo) {
        return this.request('obterMotoristasVeiculos', { quantidade, idMotoristaVeiculo });
    }
    async obterLayoutTecladoVeiculos() {
        return this.request('obterLayoutTecladoVeiculos');
    }
    async obterLayoutGrupoPontos() {
        return this.request('obterLayoutGrupoPontos');
    }
    async obterRotas(data) {
        return this.request('obterRotas', { dataInicio: data });
    }
    /**
     * Consulta dados de endereço (rua, cidade, UF) a partir de coordenadas
     * latitude/longitude. Útil para mapear pacotes de posição sem endereço.
     */
    async obterEnderecoPosicao(latitude, longitude) {
        return this.request('obterEnderecoPosicao', { latitude, longitude });
    }
    // --- MÉTODOS DE COMANDOS E MACROS ---
    async obterStatusComando(ticket) {
        return this.request('obterStatusComando', { ticket });
    }
    async obterStatusComandoTicketSascar(ticket) {
        return this.request('obterStatusComandoTicketSascar', { ticket });
    }
    async obterTipoComando() {
        return this.request('obterTipoComando');
    }
    async obterMacroTd50Tmcd(tipoTeclado) {
        return this.request('obterMacroTd50Tmcd', { tipoTeclado });
    }
    async obterMacroTd50TmcdDetalhado(tipoTeclado, idLayout, dataReferencia) {
        return this.request('obterMacroTd50TmcdDetalhado', {
            tipoTeclado,
            idLayout,
            dataReferencia
        });
    }
    async obterMascaraDispositivo(idVeiculo) {
        return this.request('obterMascaraDispositivos', { idVeiculo });
    }
    async obterMacroTd40(satelital) {
        return this.request('obterMacroTd40', { satelital });
    }
    async obterLayout(layout) {
        return this.request('obterLayout', { layout });
    }
    async obterLayoutDetalhado(layout, idLayout, dataReferencia) {
        return this.request('obterLayoutDetalhado', { layout, idLayout, dataReferencia });
    }
    async obterLayoutAcaoEmbarcadaAVD() {
        return this.request('obterLayoutAcaoEmbarcadaAVD');
    }
    async comandoEmbarquePontoDiario(idVeiculo, pontosRef) {
        return this.request('comandoEmbarquePontoDiario', { idVeiculo, pontosRef });
    }
    async enviarParametrizacaoTelemetria(idVeiculo, params) {
        return this.request('enviarParametrizacaoTelemetria', {
            idVeiculo,
            telemetriaParametrizacao: params
        });
    }
    async obterMacroTms3() {
        return this.request('obterMacroTms3');
    }
    // --- MÉTODOS DE POSIÇÕES (MUTEX ATIVADO) ---
    async obterPacotePosicoes(quantidade = 3000) {
        return this.request('obterPacotePosicoes', { quantidade }, true);
    }
    async obterPacotePosicoesJSON(quantidade = 3000) {
        return this.request('obterPacotePosicoesJSON', { quantidade }, true);
    }
    async obterPacotePosicoesMotorista(quantidade = 3000) {
        return this.request('obterPacotePosicoesMotorista', { quantidade }, true);
    }
    async obterPacotePosicoesMotoristaJSON(quantidade = 3000) {
        return this.request('obterPacotePosicoesMotoristaJSON', { quantidade }, true);
    }
    async obterPacotePosicoesMotoristaComPlaca(quantidade = 3000) {
        return this.request('obterPacotePosicoesMotoristaComPlaca', { quantidade }, true);
    }
    async obterPacotePosicoesJSONComPlaca(quantidade = 3000) {
        return this.request('obterPacotePosicoesJSONComPlaca', { quantidade }, true);
    }
    async obterPacotePosicoesRestricao(quantidade = 300) {
        return this.request('obterPacotePosicoesRestricao', { quantidade }, true);
    }
    async obterPacotePosicoesMotoristaRestricao(quantidade = 300, idVeiculo) {
        return this.request('obterPacotePosicoesMotoristaRestricao', { quantidade, idVeiculo }, true);
    }
    async obterPacotePosicaoMotoristaPorRange(idInicio, idFinal, quantidade = 3000) {
        return this.request('obterPacotePosicaoMotoristaPorRange', { idInicio, idFinal, quantidade }, true);
    }
    async obterPacotePosicaoMotoristaPorRangeJSON(idInicio, idFinal, quantidade = 3000) {
        return this.request('obterPacotePosicaoMotoristaPorRangeJSON', { idInicio, idFinal, quantidade }, true);
    }
    async obterPacotePosicaoHistorico(dataInicio, dataFinal, idVeiculo) {
        return this.request('obterPacotePosicaoHistorico', { dataInicio, dataFinal, idVeiculo }, true);
    }
    /**
     * Histórico de pacotes de posições com informação extra de motorista
     * e limpador de para-brisa. Versão "motorista" de obterPacotePosicaoHistorico.
     */
    async obterPacotePosicaoMotoristaHistorico(dataInicio, dataFinal, idVeiculo) {
        return this.request('obterPacotePosicaoMotoristaHistorico', { dataInicio, dataFinal, idVeiculo }, true);
    }
    async obterPacotePosicaoPorRange(idInicio, idFinal, quantidade = 3000) {
        return this.request('obterPacotePosicaoPorRange', { idInicio, idFinal, quantidade }, true);
    }
    async obterPacotePosicaoPorRangeJSON(idInicio, idFinal, quantidade = 3000) {
        return this.request('obterPacotePosicaoPorRangeJSON', { idInicio, idFinal, quantidade }, true);
    }
    async obterPacoteLocalizacao(quantidade = 2000) {
        return this.request('obterPacoteLocalizacao', { quantidade }, true);
    }
    /**
     * Pacote de posições de rastreadores de cargas (RF Nacional).
     * Versão do `obterPacotePosicoes` para integração com rastreadores
     * de cargas em roaming nacional.
     */
    async obterPacotePosicoesRFNacional(quantidade = 3000) {
        return this.request('obterPacotePosicoesRFNacional', { quantidade }, true);
    }
    /**
     * Alias em inglês do método `obterPacotePosicoesJSON`. Mantido
     * para compatibilidade com a nomenclatura original do WSDL.
     */
    async getPositionsPacketJSON(quantity = 3000) {
        return this.request('getPositionsPacketJSON', { quantity }, true);
    }
    /**
     * Alias em inglês do método `obterPacotePosicoesMotoristaJSON`.
     */
    async getDriverPositionPacketJSON(quantity = 3000) {
        return this.request('getDriverPositionPacketJSON', { quantity }, true);
    }
    /**
     * Alias em inglês do método `obterPacotePosicaoPorRangeJSON`.
     */
    async getPositionPacketByRangeJSON(startId, endId, quantity = 3000) {
        return this.request('getPositionPacketByRangeJSON', { startId, endId, quantity }, true);
    }
    /**
     * Alias em inglês do método `obterPacotePosicaoMotoristaPorRangeJSON`.
     */
    async getDriverPositionPacketByRangeJSON(startId, endId, quantity = 3000) {
        return this.request('getDriverPositionPacketByRangeJSON', { startId, endId, quantity }, true);
    }
    /**
     * Alias em inglês do método `obterPacotePosicoesJSONComPlaca`.
     */
    async getPositionPacketWithLicensePlateJSON(quantity = 3000) {
        return this.request('getPositionPacketWithLicensePlateJSON', { quantity }, true);
    }
    // --- MÉTODOS DE TELEMETRIA ---
    /**
     * @deprecated Descontinuado. Use obterDeltaTelemetriaIntegracaoInercia
     */
    async obterDeltaTelemetriaIntegracao(dataInicio, dataFinal, idVeiculo, pagina) {
        return this.request('obterDeltaTelemetriaIntegracao', {
            dataInicio,
            dataFinal,
            idVeiculo,
            deltmPagina: pagina
        });
    }
    async obterDeltaTelemetriaIntegracaoInercia(dataInicial, dataFinal, idVeiculo, pagina) {
        return this.request('obterDeltaTelemetriaIntegracaoInercia', {
            dataInicial,
            dataFinal,
            idVeiculo,
            deltmPagina: pagina
        });
    }
    async obterDeltaTelemetriaIntegracaoDataChegada(dataInicio, dataFinal, idVeiculo, dataChegadaInicio, dataChegadaFinal) {
        return this.request('obterDeltaTelemetriaIntegracaoDataChegada', {
            dataInicio,
            dataFinal,
            idVeiculo,
            dataChegadaInicio,
            dataChegadaFinal
        });
    }
    async obterDeltaTelemetriaIntegracaoInerciaDataChegada(dataInicio, dataFinal, idVeiculo, dataChegadaInicio, dataChegadaFinal) {
        return this.request('obterDeltaTelemetriaIntegracaoInerciaDataChegada', {
            dataInicio,
            dataFinal,
            idVeiculo,
            dataChegadaInicio,
            dataChegadaFinal
        });
    }
    async obterEventoTelemetriaIntegracao(dataInicio, dataFinal, idVeiculo, idEventoList) {
        return this.request('obterEventoTelemetriaIntegracao', {
            dataInicio,
            dataFinal,
            idVeiculo,
            idEventoList
        });
    }
    async obterEventoTelemetriaDescricao() {
        return this.request('obterEventoTelemetriaDescricao');
    }
    async obterEventosTempoDirecao(quantidade = 3000, idMotorista, dataInicial, dataFinal) {
        return this.request('obterEventosTempoDirecao', {
            quantidade,
            idMotorista,
            dataInicial,
            dataFinal
        });
    }
    async obterEventosTempoDirecaoDataChegada(quantidade = 3000, idMotorista, dataInicio, dataFim, dataChegadaInicial, dataChegadaFinal) {
        return this.request('obterEventosTempoDirecaoDataChegada', {
            quantidade,
            idMotorista,
            dataInicio,
            dataFim,
            dataChegadaInicial,
            dataChegadaFinal
        });
    }
    // --- CAIXA PRETA ---
    /**
     * @deprecated Método desativado sem previsão de liberação pela Sascar.
     */
    async solicitarEventosCaixaPreta(idVeiculo, placa, dataPosicaoInicial, dataPosicaoFinal) {
        return this.request('solicitarEventosCaixaPreta', {
            idVeiculo,
            placa,
            dataPosicaoInicial,
            dataPosicaoFinal
        });
    }
    async recuperarEventosCaixaPreta(idVeiculo, placa, dataPosicao) {
        return this.request('recuperarEventosCaixaPreta', { idVeiculo, placa, dataPosicao });
    }
    // ==========================================================================
    // MÉTODOS DESCOBERTOS NO WSDL AO VIVO (ausentes do manual v2.07).
    // Auditoria 2026-06-17 contra https://sasintegra.sascar.com.br/...?wsdl
    // ==========================================================================
    /**
     * Consulta quantos pacotes de posição estão pendentes na fila do servidor
     * para consumo. Útil para monitoramento da fila antes de drenar com
     * `obterPacotePosicoes*`.
     */
    async consultaQuantidadePacotesPosicoesPendentes() {
        return this.request('consultaQuantidadePacotesPosicoesPendentes');
    }
    /**
     * Eventos de SmartCameras (câmeras embarcadas Sascar). Operação ampla com
     * múltiplos filtros opcionais. O único campo obrigatório na prática é
     * `agrupador` (identificador do cliente/conta).
     */
    async getSmartCamerasEvents(params) {
        return this.request('getSmartCamerasEvents', { ...params });
    }
    /**
     * Lista motoristas vinculados a um veículo específico.
     */
    async obterMotoristasPorVeiculo(idVeiculo) {
        return this.request('obterMotoristasPorVeiculo', { idVeiculo });
    }
    /**
     * Lista grupos/áreas AVD com metadados de auditoria (criação, alteração,
     * exclusão e logs efetivos).
     */
    async obterLayoutAreaAvd() {
        return this.request('obterLayoutAreaAvd');
    }
    /**
     * Retorna os dados (não detalhado) de um layout específico.
     */
    async obterLayoutData(layout) {
        return this.request('obterLayoutData', { layout });
    }
    /**
     * Mensagens do portal Sascar associadas ao veículo informado.
     */
    async obterMensagemPortal(idVeiculo) {
        return this.request('obterMensagemPortal', { idVeiculo });
    }
    /**
     * Pacote de integração de delta de telemetria (variante do
     * `obterDeltaTelemetriaIntegracao` que aceita apenas `quantidade`).
     */
    async obterPacoteIntegracaoDeltatelemetria(quantidade = 3000) {
        return this.request('obterPacoteIntegracaoDeltatelemetria', { quantidade });
    }
    /**
     * Pacote de posições incluindo placa do veículo (variante do
     * `obterPacotePosicoes` que adiciona o campo `placa`).
     */
    async obterPacotePosicoesComPlaca(quantidade = 3000) {
        return this.request('obterPacotePosicoesComPlaca', { quantidade }, true);
    }
    /**
     * Snapshot mínimo de telemetria do portal para um veículo
     * (embreagem, freio, motor, limpador).
     */
    async obterTelemetriaPortal(idVeiculo) {
        return this.request('obterTelemetriaPortal', { idVeiculo });
    }
    /**
     * Eventos de telemetria filtrados por data de chegada (além do range
     * de data da posição). Variante "DataChegada" do
     * `obterEventoTelemetriaIntegracao`.
     */
    async obterEventoTelemetriaIntegracaoDataChegada(dataInicio, dataFinal, dataChegadaInicio, dataChegadaFinal, idVeiculo, idEventoList) {
        return this.request('obterEventoTelemetriaIntegracaoDataChegada', {
            dataInicio,
            dataFinal,
            dataChegadaInicio,
            dataChegadaFinal,
            idVeiculo,
            idEventoList
        });
    }
    /**
     * Verifica se o veículo está integrado/ativo no sistema. Retorna `true`
     * ou `false` (booleano único, não array).
     */
    async verificarVeiculoIntegrado(idVeiculo) {
        const result = await this.request('verificarVeiculoIntegrado', { idVeiculo });
        if (Array.isArray(result))
            return result[0] === true || String(result[0]) === 'true';
        return result === true || String(result) === 'true';
    }
    // ==========================================================================
    // HELPERS DE MAPEAMENTO (catálogo + cadastro do veículo)
    // ==========================================================================
    /**
     * Retorna o mapeamento completo dos atuadores e sensores de um veículo,
     * cruzando o cadastro (`obterVeiculos`) com o catálogo de atuadores
     * (`obterGrupoAtuadores`).
     *
     * Para casos em que o consumidor já tem essas listas em memória, é
     * possível passá-las nas opções (evita as duas chamadas HTTP).
     *
     * @example
     * const map = await client.getMapeamentoVeiculo(2248181);
     * // map.atuadores[2] === { slot: 2, idAtuador: 240, descricao: "Sirene", tipoPorta: "S" }
     * // map.portaBloqueio === 1
     */
    async getMapeamentoVeiculo(idVeiculo, opts) {
        const [veiculos, atuadores] = await Promise.all([
            opts?.veiculos ? Promise.resolve(opts.veiculos) : this.obterVeiculos(1000),
            opts?.atuadores ? Promise.resolve(opts.atuadores) : this.obterGrupoAtuadores()
        ]);
        const veiculo = veiculos.find((v) => v.idVeiculo === idVeiculo);
        if (!veiculo) {
            throw new Error(`Veículo com idVeiculo=${idVeiculo} não encontrado na frota.`);
        }
        const catalogo = new Map();
        for (const a of atuadores)
            catalogo.set(a.idAtuador, a);
        const atuadoresMapeados = {};
        const sensoresMapeados = {};
        for (let slot = 1; slot <= 8; slot++) {
            const idA = veiculo[`idAtuador${slot}`];
            if (idA && idA !== 0) {
                const cat = catalogo.get(idA);
                atuadoresMapeados[slot] = {
                    slot,
                    idAtuador: idA,
                    descricao: cat?.descricao ?? `(idAtuador=${idA} fora do catálogo)`,
                    tipoPorta: cat?.tipoPorta ?? '?'
                };
            }
            const idS = veiculo[`idSensor${slot}`];
            if (idS && idS !== 0) {
                const cat = catalogo.get(idS);
                sensoresMapeados[slot] = {
                    slot,
                    idSensor: idS,
                    descricao: cat?.descricao ?? `(idSensor=${idS} fora do catálogo)`,
                    tipoPorta: cat?.tipoPorta ?? '?'
                };
            }
        }
        return {
            veiculo,
            atuadores: atuadoresMapeados,
            sensores: sensoresMapeados,
            portaBloqueio: veiculo.portaBloqueio,
            portaPanico: veiculo.portaPanico
        };
    }
    /**
     * Localiza um atuador no veículo pelo nome (busca tolerante por substring
     * case-insensitive na descrição do catálogo) ou pelo slot direto.
     *
     * Casos especiais: "bloqueio" e "panico" são resolvidos via
     * `portaBloqueio`/`portaPanico` (portas dedicadas que não aparecem no
     * catálogo de atuadores). O `idAtuador` retornado nesses casos é `0`
     * para sinalizar que não há entrada no catálogo, mas o `slot` reflete
     * a porta correta.
     *
     * @example
     * await client.findAtuador(2248181, 'sirene')
     * // -> { slot: 2, idAtuador: 240, descricao: "Sirene", tipoPorta: "S" }
     *
     * await client.findAtuador(2248181, 'bloqueio')
     * // -> { slot: 1, idAtuador: 0, descricao: "Bloqueio (porta dedicada)", tipoPorta: "S" }
     *
     * @returns o atuador encontrado ou `null` se nenhum bater.
     */
    async findAtuador(idVeiculo, descricaoOrSlot, opts) {
        const map = await this.getMapeamentoVeiculo(idVeiculo, opts);
        if (typeof descricaoOrSlot === 'number') {
            return map.atuadores[descricaoOrSlot] ?? null;
        }
        const needle = descricaoOrSlot.toLowerCase().trim();
        if (!needle)
            return null;
        // Casos especiais: portas dedicadas fora do catálogo
        if (needle.includes('bloque') && map.portaBloqueio > 0) {
            return {
                slot: map.portaBloqueio,
                idAtuador: 0,
                descricao: 'Bloqueio (porta dedicada)',
                tipoPorta: 'S'
            };
        }
        if (needle.includes('panico') && map.portaPanico > 0) {
            return {
                slot: map.portaPanico,
                idAtuador: 0,
                descricao: 'Pânico (porta dedicada)',
                tipoPorta: 'S'
            };
        }
        for (const atuador of Object.values(map.atuadores)) {
            if (atuador.descricao.toLowerCase().includes(needle))
                return atuador;
        }
        return null;
    }
}
exports.SascarClient = SascarClient;
