"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SascarClient = void 0;
const fast_xml_parser_1 = require("fast-xml-parser");
const queue_1 = require("./queue");
const errors_1 = require("./errors");
class SascarClient {
    usuario;
    senha;
    wsdlUrl = 'https://sasintegra.sascar.com.br/SasIntegra/SasIntegraWSService';
    positionsQueue = new queue_1.AsyncQueue();
    parser = new fast_xml_parser_1.XMLParser({ ignoreAttributes: true, removeNSPrefix: true });
    constructor(credentials) {
        this.usuario = credentials?.usuario || process.env.SASCAR_USUARIO || '';
        this.senha = credentials?.senha || process.env.SASCAR_SENHA || '';
        if (!this.usuario || !this.senha) {
            throw new Error('Credenciais da SASCAR não fornecidas.');
        }
    }
    buildSoapEnvelope(methodName, bodyObj) {
        const builder = new fast_xml_parser_1.XMLBuilder({
            ignoreAttributes: false,
            format: true,
            suppressEmptyNode: true
        });
        const envelope = {
            'soapenv:Envelope': {
                '@_xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
                '@_xmlns:web': 'http://webservice.web.integracao.sascar.com.br/',
                'soapenv:Header': '',
                'soapenv:Body': {
                    [`web:${methodName}`]: {
                        usuario: this.usuario,
                        senha: this.senha,
                        ...bodyObj
                    }
                }
            }
        };
        return builder.build(envelope);
    }
    async request(methodName, params = {}, isPositionMethod = false) {
        const xml = this.buildSoapEnvelope(methodName, params);
        const execute = async () => {
            let response;
            try {
                response = await fetch(this.wsdlUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/xml;charset=UTF-8',
                        'SOAPAction': `""`
                    },
                    body: xml
                });
            }
            catch (err) {
                throw new errors_1.SascarConnectionError(`Erro de conexão com a Sascar: ${err.message}`);
            }
            const text = await response.text();
            const parsed = this.parser.parse(text);
            if (parsed.Envelope?.Body?.Fault) {
                throw new errors_1.SascarApiError(`Erro SOAP da Sascar: ${parsed.Envelope.Body.Fault.faultstring}`);
            }
            const responseNode = parsed.Envelope?.Body?.[`${methodName}Response`];
            if (!responseNode) {
                throw new errors_1.SascarApiError('Resposta inválida do servidor Sascar.');
            }
            let result = responseNode.return;
            if (!result)
                return [];
            // JSON parses nested strings
            const parseItem = (item) => {
                if (typeof item === 'string' && (item.trim().startsWith('{') || item.trim().startsWith('['))) {
                    try {
                        return JSON.parse(item);
                    }
                    catch (e) { }
                }
                return item;
            };
            if (Array.isArray(result)) {
                result = result.map(parseItem);
            }
            else {
                result = [parseItem(result)]; // Force array for multiple returns
            }
            // Se for método não-lista, podemos extrair dps. Mas a maioria é lista.
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
        return this.request('ObterAlertasAVDVinculados', { veiplaca, veioid });
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
    async obterVeiculosJson(quantidade = 1000, idVeiculo) {
        return this.request('getVehiclesJSON', { quantidade, vehicleId: idVeiculo });
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
        return this.request('obterMacroTd50TmcdDetalhado', { tipoTeclado, idLayout, dataReferencia });
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
        return this.request('enviarParametrizacaoTelemetria', { idVeiculo, telemetriaParametrizacao: params });
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
    async obterPacotePosicaoPorRange(idInicio, idFinal, quantidade = 3000) {
        return this.request('obterPacotePosicaoPorRange', { idInicio, idFinal, quantidade }, true);
    }
    async obterPacotePosicaoPorRangeJSON(idInicio, idFinal, quantidade = 3000) {
        return this.request('obterPacotePosicaoPorRangeJSON', { idInicio, idFinal, quantidade }, true);
    }
    async obterPacoteLocalizacao(quantidade = 2000) {
        return this.request('obterPacoteLocalizacao', { quantidade }, true);
    }
    async getPositionsPacketJSON(quantity = 3000) {
        return this.request('getPositionsPacketJSON', { quantity }, true);
    }
    async getDriverPositionPacketJSON(quantity = 3000) {
        return this.request('getDriverPositionPacketJSON', { quantity }, true);
    }
    async getPositionPacketByRangeJSON(startId, endId, quantity = 3000) {
        return this.request('getPositionPacketByRangeJSON', { startId, endId, quantity }, true);
    }
    async getDriverPositionPacketByRangeJSON(startId, endId, quantity = 3000) {
        return this.request('getDriverPositionPacketByRangeJSON', { startId, endId, quantity }, true);
    }
    async getPositionPacketWithLicensePlateJSON(quantity = 3000) {
        return this.request('getPositionPacketWithLicensePlateJSON', { quantity }, true);
    }
    // --- MÉTODOS DE TELEMETRIA ---
    /**
     * @deprecated Descontinuado. Use obterDeltaTelemetriaIntegracaoInercia
     */
    async obterDeltaTelemetriaIntegracao(dataInicio, dataFinal, idVeiculo, pagina) {
        return this.request('obterDeltaTelemetriaIntegracao', { dataInicio, dataFinal, idVeiculo, deltmPagina: pagina });
    }
    async obterDeltaTelemetriaIntegracaoInercia(dataInicio, dataFinal, idVeiculo, pagina) {
        return this.request('obterDeltaTelemetriaIntegracaoInercia', { dataInicio, dataFinal, idVeiculo, deltmPagina: pagina });
    }
    async obterDeltaTelemetriaIntegracaoDataChegada(dataInicio, dataFinal, idVeiculo, dataChegadaInicio, dataChegadaFinal) {
        return this.request('obterDeltaTelemetriaIntegracaoDataChegada', { dataInicio, dataFinal, idVeiculo, dataChegadaInicio, dataChegadaFinal });
    }
    async obterDeltaTelemetriaIntegracaoInerciaDataChegada(dataInicio, dataFinal, idVeiculo, dataChegadaInicio, dataChegadaFinal) {
        return this.request('obterDeltaTelemetriaIntegracaoInerciaDataChegada', { dataInicio, dataFinal, idVeiculo, dataChegadaInicio, dataChegadaFinal });
    }
    async obterEventoTelemetriaIntegracao(dataInicio, dataFinal, idVeiculo, idEventoList) {
        return this.request('obterEventoTelemetriaIntegracao', { dataInicio, dataFinal, idVeiculo, idEventoList });
    }
    async obterEventoTelemetriaDescricao() {
        return this.request('obterEventoTelemetriaDescricao');
    }
    async obterEventosTempoDirecao(quantidade = 3000, idMotorista, dataInicio, dataFim) {
        return this.request('obterEventosTempoDirecao', { quantidade, idMotorista, dataInicio, dataFim });
    }
    async obterEventosTempoDirecaoDataChegada(quantidade = 3000, idMotorista, dataInicio, dataFim, dataChegadaInicial, dataChegadaFinal) {
        return this.request('obterEventosTempoDirecaoDataChegada', { quantidade, idMotorista, dataInicio, dataFim, dataChegadaInicial, dataChegadaFinal });
    }
    // --- CAIXA PRETA ---
    /**
     * @deprecated Método desativado sem previsão de liberação pela Sascar.
     */
    async solicitarEventosCaixaPreta(idVeiculo, placa, dataPosicaoInicial, dataPosicaoFinal) {
        return this.request('solicitarEventosCaixaPreta', { idVeiculo, placa, dataPosicaoInicial, dataPosicaoFinal });
    }
    async recuperarEventosCaixaPreta(idVeiculo, placa, dataPosicao) {
        return this.request('recuperarEventosCaixaPreta', { idVeiculo, placa, dataPosicao });
    }
}
exports.SascarClient = SascarClient;
