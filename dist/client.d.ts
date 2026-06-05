import * as T from './types';
export declare class SascarClient {
    private usuario;
    private senha;
    private wsdlUrl;
    private positionsQueue;
    private parser;
    constructor(credentials?: T.SascarCredentials);
    private buildSoapEnvelope;
    private request;
    atualizarSenha(senhaAtual: string, novaSenha: string): Promise<string[]>;
    obterAlertasAVDVinculados(veiplaca?: string, veioid?: string): Promise<T.AlertaAVD[]>;
    obterGrupoAtuadores(): Promise<T.GrupoAtuador[]>;
    obterCadastroAlertasAVD(dataInicio?: string): Promise<T.CadastroAlertaAVD[]>;
    obterClientes(quantidade?: number, idCliente?: number): Promise<T.Cliente[]>;
    obterClientesV2(quantidade?: number, idCliente?: number): Promise<T.ClienteV2[]>;
    obterVeiculos(quantidade?: number, idVeiculo?: number): Promise<T.Veiculo[]>;
    obterVeiculosJson(quantidade?: number, idVeiculo?: number): Promise<T.Veiculo[]>;
    obterVeiculosRFNacional(quantidade?: number, idVeiculo?: number): Promise<T.VeiculoRFNacional[]>;
    obterDadosAdicionais(idVeiculo?: number): Promise<T.DadosAdicionais[]>;
    obterDadosAdicionaisCliente(idVeiculo?: number): Promise<T.DadosAdicionais[]>;
    obterPontosReferencia(): Promise<T.PontoReferencia[]>;
    obterSequenciamentoEvento(): Promise<T.SequenciamentoEvento[]>;
    obterMotoristas(quantidade?: number, idMotorista?: number): Promise<T.Motorista[]>;
    obterMotoristasVeiculos(quantidade?: number, idMotoristaVeiculo?: number): Promise<T.MotoristaVeiculo[]>;
    obterLayoutTecladoVeiculos(): Promise<T.LayoutTecladoVeiculo[]>;
    obterLayoutGrupoPontos(): Promise<T.LayoutGrupoPonto[]>;
    obterRotas(data?: string): Promise<T.Rota[]>;
    obterStatusComando(ticket: number): Promise<T.StatusComando[]>;
    obterStatusComandoTicketSascar(ticket: number): Promise<T.StatusComando[]>;
    obterTipoComando(): Promise<T.TipoComando[]>;
    obterMacroTd50Tmcd(tipoTeclado: string): Promise<T.MacroTd50Tmcd[]>;
    obterMacroTd50TmcdDetalhado(tipoTeclado: string, idLayout?: number, dataReferencia?: string): Promise<T.MacroTd50TmcdDetalhado[]>;
    obterMascaraDispositivo(idVeiculo: number): Promise<T.MascaraDispositivo[]>;
    obterMacroTd40(satelital: boolean): Promise<T.MacroTd40[]>;
    obterLayout(layout: string): Promise<T.Layout[]>;
    obterLayoutDetalhado(layout: string, idLayout?: number, dataReferencia?: string): Promise<T.ObterLayoutData[]>;
    obterLayoutAcaoEmbarcadaAVD(): Promise<T.LayoutAcaoEmbarcadaAVD[]>;
    comandoEmbarquePontoDiario(idVeiculo: number, pontosRef: string): Promise<T.LogComando[]>;
    enviarParametrizacaoTelemetria(idVeiculo: number, params: T.ParametrizacaoTelemetria): Promise<any[]>;
    obterMacroTms3(): Promise<T.MacroTms3[]>;
    obterPacotePosicoes(quantidade?: number): Promise<T.PacotePosicaoXML[]>;
    obterPacotePosicoesJSON(quantidade?: number): Promise<T.PacotePosicaoJSON[]>;
    obterPacotePosicoesMotorista(quantidade?: number): Promise<T.PacotePosicaoXML[]>;
    obterPacotePosicoesMotoristaJSON(quantidade?: number): Promise<T.PacotePosicaoJSON[]>;
    obterPacotePosicoesMotoristaComPlaca(quantidade?: number): Promise<T.PacotePosicaoXML[]>;
    obterPacotePosicoesJSONComPlaca(quantidade?: number): Promise<T.PacotePosicaoJSON[]>;
    obterPacotePosicoesRestricao(quantidade?: number): Promise<T.PacotePosicaoXML[]>;
    obterPacotePosicoesMotoristaRestricao(quantidade?: number, idVeiculo?: number): Promise<T.PacotePosicaoXML[]>;
    obterPacotePosicaoMotoristaPorRange(idInicio: number, idFinal: number, quantidade?: number): Promise<T.PacotePosicaoXML[]>;
    obterPacotePosicaoMotoristaPorRangeJSON(idInicio: number, idFinal: number, quantidade?: number): Promise<T.PacotePosicaoJSON[]>;
    obterPacotePosicaoHistorico(dataInicio: string, dataFinal: string, idVeiculo?: number): Promise<T.PacotePosicaoXML[]>;
    obterPacotePosicaoPorRange(idInicio: number, idFinal: number, quantidade?: number): Promise<T.PacotePosicaoXML[]>;
    obterPacotePosicaoPorRangeJSON(idInicio: number, idFinal: number, quantidade?: number): Promise<T.PacotePosicaoJSON[]>;
    obterPacoteLocalizacao(quantidade?: number): Promise<T.PacoteLocalizacao[]>;
    getPositionsPacketJSON(quantity?: number): Promise<T.PositionPacketJSON[]>;
    getDriverPositionPacketJSON(quantity?: number): Promise<T.PositionPacketJSON[]>;
    getPositionPacketByRangeJSON(startId: number, endId: number, quantity?: number): Promise<T.PositionPacketJSON[]>;
    getDriverPositionPacketByRangeJSON(startId: number, endId: number, quantity?: number): Promise<T.PositionPacketJSON[]>;
    getPositionPacketWithLicensePlateJSON(quantity?: number): Promise<T.PositionPacketJSON[]>;
    /**
     * @deprecated Descontinuado. Use obterDeltaTelemetriaIntegracaoInercia
     */
    obterDeltaTelemetriaIntegracao(dataInicio: string, dataFinal: string, idVeiculo: number, pagina?: number): Promise<T.DeltaTelemetria[]>;
    obterDeltaTelemetriaIntegracaoInercia(dataInicio: string, dataFinal: string, idVeiculo: number, pagina?: number): Promise<T.DeltaTelemetria[]>;
    obterDeltaTelemetriaIntegracaoDataChegada(dataInicio: string, dataFinal: string, idVeiculo: number, dataChegadaInicio: string, dataChegadaFinal: string): Promise<T.DeltaTelemetria[]>;
    obterDeltaTelemetriaIntegracaoInerciaDataChegada(dataInicio: string, dataFinal: string, idVeiculo: number, dataChegadaInicio: string, dataChegadaFinal: string): Promise<T.DeltaTelemetria[]>;
    obterEventoTelemetriaIntegracao(dataInicio: string, dataFinal: string, idVeiculo: number, idEventoList?: string): Promise<T.EventoTelemetria[]>;
    obterEventoTelemetriaDescricao(): Promise<T.TipoEventoTelemetriaDescricao[]>;
    obterEventosTempoDirecao(quantidade?: number, idMotorista?: number, dataInicio?: string, dataFim?: string): Promise<T.EventoTempoDirecao[]>;
    obterEventosTempoDirecaoDataChegada(quantidade?: number, idMotorista?: number, dataInicio?: string, dataFim?: string, dataChegadaInicial?: string, dataChegadaFinal?: string): Promise<T.EventoTempoDirecao[]>;
    /**
     * @deprecated Método desativado sem previsão de liberação pela Sascar.
     */
    solicitarEventosCaixaPreta(idVeiculo?: number, placa?: string, dataPosicaoInicial?: string, dataPosicaoFinal?: string): Promise<any>;
    recuperarEventosCaixaPreta(idVeiculo?: number, placa?: string, dataPosicao?: string): Promise<T.CaixaPretaList[]>;
}
