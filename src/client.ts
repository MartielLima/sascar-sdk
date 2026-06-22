import { XMLParser } from 'fast-xml-parser';
import { AsyncQueue } from './queue';
import { SascarApiError } from './errors';
import { buildSoapEnvelope } from './transport/envelope';
import { sendSoapRequest } from './transport/http';
import { parseSoapFault } from './transport/fault';
import * as T from './types';

/**
 * Opções de configuração do cliente. Todos os campos são opcionais.
 */
export interface SascarClientOptions {
  /** Timeout em ms para cada requisição HTTP. Default: 30000. */
  timeoutMs?: number;
  /** Número máximo de tentativas (incluindo a primeira). Default: 3. */
  maxRetries?: number;
  /** URL alternativa do WebService SasIntegra. */
  wsdlUrl?: string;
}

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
export class SascarClient {
  private usuario: string;
  private senha: string;
  private wsdlUrl: string;
  private timeoutMs: number;
  private maxRetries: number;
  private positionsQueue = new AsyncQueue();
  private parser = new XMLParser({ ignoreAttributes: true, removeNSPrefix: true });

  constructor(credentials?: T.SascarCredentials, options?: SascarClientOptions) {
    this.usuario = credentials?.usuario || process.env.SASCAR_USUARIO || '';
    this.senha = credentials?.senha || process.env.SASCAR_SENHA || '';
    this.wsdlUrl = options?.wsdlUrl || DEFAULT_WSDL_URL;
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;

    if (!this.usuario || !this.senha) {
      throw new Error('Credenciais da SASCAR não fornecidas.');
    }
  }

  private async request<TReturn>(
    methodName: string,
    params: T.SoapBody = {},
    isPositionMethod = false
  ): Promise<TReturn> {
    const xml = buildSoapEnvelope(methodName, params, this.usuario, this.senha);

    const execute = async (): Promise<TReturn> => {
      const text = await sendSoapRequest(xml, {
        url: this.wsdlUrl,
        timeoutMs: this.timeoutMs,
        maxRetries: this.maxRetries
      });

      const fault = parseSoapFault(text);
      if (fault) {
        throw new SascarApiError(`[${methodName}] SOAP Fault: ${fault.faultstring} (${fault.faultcode})`, fault);
      }

      const parsed = this.parser.parse(text);
      const responseNode = parsed.Envelope?.Body?.[`${methodName}Response`];
      if (responseNode === undefined) {
        throw new SascarApiError(`[${methodName}] Resposta inválida do servidor Sascar.`);
      }

      let result = responseNode.return;
      if (!result) return [] as unknown as TReturn;

      const parseItem = (item: unknown): unknown => {
        if (typeof item === 'string' && (item.trim().startsWith('{') || item.trim().startsWith('['))) {
          try {
            return JSON.parse(item);
          } catch {
            // intentionally ignored — fallback to original string
          }
        }
        return item;
      };

      if (Array.isArray(result)) {
        result = result.map(parseItem);
      } else {
        result = [parseItem(result)];
      }

      return result as unknown as TReturn;
    };

    if (isPositionMethod) {
      return this.positionsQueue.enqueue(execute);
    }
    return execute();
  }

  // --- MÉTODOS DE DADOS CADASTRAIS / CONFIGURAÇÕES ---

  async atualizarSenha(senhaAtual: string, novaSenha: string): Promise<string[]> {
    return this.request<string[]>('atualizarSenha', { senhaAtual, novaSenha });
  }

  async obterAlertasAVDVinculados(veiplaca?: string, veioid?: string): Promise<T.AlertaAVD[]> {
    return this.request<T.AlertaAVD[]>('obterAlertasAVDVinculados', { veiplaca, veioid });
  }

  async obterGrupoAtuadores(): Promise<T.GrupoAtuador[]> {
    return this.request<T.GrupoAtuador[]>('obterGrupoAtuadores');
  }

  async obterCadastroAlertasAVD(dataInicio?: string): Promise<T.CadastroAlertaAVD[]> {
    return this.request<T.CadastroAlertaAVD[]>('obterCadastroAlertasAvd', { dataInicio });
  }

  async obterClientes(quantidade = 1000, idCliente?: number): Promise<T.Cliente[]> {
    return this.request<T.Cliente[]>('obterClientes', { quantidade, idCliente });
  }

  async obterClientesV2(quantidade = 1000, idCliente?: number): Promise<T.ClienteV2[]> {
    return this.request<T.ClienteV2[]>('obterClientesV2', { quantidade, idCliente });
  }

  async obterVeiculos(quantidade = 1000, idVeiculo?: number): Promise<T.Veiculo[]> {
    return this.request<T.Veiculo[]>('obterVeiculos', { quantidade, idVeiculo });
  }

  async obterVeiculosJson(quantidade = 1000, startIdVeiculo = 0): Promise<T.Veiculo[]> {
    let allVehicles: T.Veiculo[] = [];
    let currentId = startIdVeiculo;
    let keepPaginating = true;

    while (keepPaginating) {
      const result = await this.request<T.Veiculo[]>('getVehiclesJSON', {
        quantidade,
        ...(currentId > 0 ? { vehicleId: currentId } : {})
      });

      const vehicles = Array.isArray(result) ? result : result ? [result] : [];

      if (vehicles.length === 0 || Object.keys(vehicles[0]).length === 0) {
        keepPaginating = false;
      } else {
        allVehicles = allVehicles.concat(vehicles);

        if (vehicles.length < quantidade) {
          keepPaginating = false;
        } else {
          currentId = vehicles[vehicles.length - 1].idVeiculo;
        }
      }
    }

    return allVehicles;
  }

  async obterVeiculosRFNacional(quantidade = 1000, idVeiculo?: number): Promise<T.VeiculoRFNacional[]> {
    return this.request<T.VeiculoRFNacional[]>('obterVeiculosRFNacional', { quantidade, idVeiculo });
  }

  async obterDadosAdicionais(idVeiculo?: number): Promise<T.DadosAdicionais[]> {
    return this.request<T.DadosAdicionais[]>('obterDadosAdicionais', { idVeiculo });
  }

  async obterDadosAdicionaisCliente(idVeiculo?: number): Promise<T.DadosAdicionais[]> {
    return this.request<T.DadosAdicionais[]>('obterDadosAdicionaisCliente', { idVeiculo });
  }

  async obterPontosReferencia(): Promise<T.PontoReferencia[]> {
    return this.request<T.PontoReferencia[]>('obterPontosReferencia');
  }

  async obterSequenciamentoEvento(): Promise<T.SequenciamentoEvento[]> {
    return this.request<T.SequenciamentoEvento[]>('obterSequenciamentoEvento');
  }

  async obterMotoristas(quantidade = 1000, idMotorista?: number): Promise<T.Motorista[]> {
    return this.request<T.Motorista[]>('obterMotoristas', { quantidade, idMotorista });
  }

  async obterMotoristasVeiculos(quantidade = 1000, idMotoristaVeiculo?: number): Promise<T.MotoristaVeiculo[]> {
    return this.request<T.MotoristaVeiculo[]>('obterMotoristasVeiculos', { quantidade, idMotoristaVeiculo });
  }

  async obterLayoutTecladoVeiculos(): Promise<T.LayoutTecladoVeiculo[]> {
    return this.request<T.LayoutTecladoVeiculo[]>('obterLayoutTecladoVeiculos');
  }

  async obterLayoutGrupoPontos(): Promise<T.LayoutGrupoPonto[]> {
    return this.request<T.LayoutGrupoPonto[]>('obterLayoutGrupoPontos');
  }

  async obterRotas(data?: string): Promise<T.Rota[]> {
    return this.request<T.Rota[]>('obterRotas', { dataInicio: data });
  }

  /**
   * Consulta dados de endereço (rua, cidade, UF) a partir de coordenadas
   * latitude/longitude. Útil para mapear pacotes de posição sem endereço.
   */
  async obterEnderecoPosicao(latitude: string, longitude: string): Promise<T.EnderecoPosicao[]> {
    return this.request<T.EnderecoPosicao[]>('obterEnderecoPosicao', { latitude, longitude });
  }

  // --- MÉTODOS DE COMANDOS E MACROS ---

  async obterStatusComando(ticket: number): Promise<T.StatusComando[]> {
    return this.request<T.StatusComando[]>('obterStatusComando', { ticket });
  }

  async obterStatusComandoTicketSascar(ticket: number): Promise<T.StatusComando[]> {
    return this.request<T.StatusComando[]>('obterStatusComandoTicketSascar', { ticket });
  }

  async obterTipoComando(): Promise<T.TipoComando[]> {
    return this.request<T.TipoComando[]>('obterTipoComando');
  }

  async obterMacroTd50Tmcd(tipoTeclado: string): Promise<T.MacroTd50Tmcd[]> {
    return this.request<T.MacroTd50Tmcd[]>('obterMacroTd50Tmcd', { tipoTeclado });
  }

  async obterMacroTd50TmcdDetalhado(
    tipoTeclado: string,
    idLayout?: number,
    dataReferencia?: string
  ): Promise<T.MacroTd50TmcdDetalhado[]> {
    return this.request<T.MacroTd50TmcdDetalhado[]>('obterMacroTd50TmcdDetalhado', {
      tipoTeclado,
      idLayout,
      dataReferencia
    });
  }

  async obterMascaraDispositivo(idVeiculo: number): Promise<T.MascaraDispositivo[]> {
    return this.request<T.MascaraDispositivo[]>('obterMascaraDispositivos', { idVeiculo });
  }

  async obterMacroTd40(satelital: boolean): Promise<T.MacroTd40[]> {
    return this.request<T.MacroTd40[]>('obterMacroTd40', { satelital });
  }

  async obterLayout(layout: string): Promise<T.Layout[]> {
    return this.request<T.Layout[]>('obterLayout', { layout });
  }

  async obterLayoutDetalhado(layout: string, idLayout?: number, dataReferencia?: string): Promise<T.ObterLayoutData[]> {
    return this.request<T.ObterLayoutData[]>('obterLayoutDetalhado', { layout, idLayout, dataReferencia });
  }

  async obterLayoutAcaoEmbarcadaAVD(): Promise<T.LayoutAcaoEmbarcadaAVD[]> {
    return this.request<T.LayoutAcaoEmbarcadaAVD[]>('obterLayoutAcaoEmbarcadaAVD');
  }

  async comandoEmbarquePontoDiario(idVeiculo: number, pontosRef: string): Promise<T.LogComando[]> {
    return this.request<T.LogComando[]>('comandoEmbarquePontoDiario', { idVeiculo, pontosRef });
  }

  async enviarParametrizacaoTelemetria(idVeiculo: number, params: T.ParametrizacaoTelemetria): Promise<T.LogComando[]> {
    return this.request<T.LogComando[]>('enviarParametrizacaoTelemetria', {
      idVeiculo,
      telemetriaParametrizacao: params
    });
  }

  async obterMacroTms3(): Promise<T.MacroTms3[]> {
    return this.request<T.MacroTms3[]>('obterMacroTms3');
  }

  // --- MÉTODOS DE POSIÇÕES (MUTEX ATIVADO) ---

  async obterPacotePosicoes(quantidade = 3000): Promise<T.PacotePosicaoXML[]> {
    return this.request<T.PacotePosicaoXML[]>('obterPacotePosicoes', { quantidade }, true);
  }

  async obterPacotePosicoesJSON(quantidade = 3000): Promise<T.PacotePosicaoJSON[]> {
    return this.request<T.PacotePosicaoJSON[]>('obterPacotePosicoesJSON', { quantidade }, true);
  }

  async obterPacotePosicoesMotorista(quantidade = 3000): Promise<T.PacotePosicaoXML[]> {
    return this.request<T.PacotePosicaoXML[]>('obterPacotePosicoesMotorista', { quantidade }, true);
  }

  async obterPacotePosicoesMotoristaJSON(quantidade = 3000): Promise<T.PacotePosicaoJSON[]> {
    return this.request<T.PacotePosicaoJSON[]>('obterPacotePosicoesMotoristaJSON', { quantidade }, true);
  }

  async obterPacotePosicoesMotoristaComPlaca(quantidade = 3000): Promise<T.PacotePosicaoXML[]> {
    return this.request<T.PacotePosicaoXML[]>('obterPacotePosicoesMotoristaComPlaca', { quantidade }, true);
  }

  async obterPacotePosicoesJSONComPlaca(quantidade = 3000): Promise<T.PacotePosicaoJSON[]> {
    return this.request<T.PacotePosicaoJSON[]>('obterPacotePosicoesJSONComPlaca', { quantidade }, true);
  }

  async obterPacotePosicoesRestricao(quantidade = 300): Promise<T.PacotePosicaoXML[]> {
    return this.request<T.PacotePosicaoXML[]>('obterPacotePosicoesRestricao', { quantidade }, true);
  }

  async obterPacotePosicoesMotoristaRestricao(quantidade = 300, idVeiculo?: number): Promise<T.PacotePosicaoXML[]> {
    return this.request<T.PacotePosicaoXML[]>('obterPacotePosicoesMotoristaRestricao', { quantidade, idVeiculo }, true);
  }

  async obterPacotePosicaoMotoristaPorRange(
    idInicio: number,
    idFinal: number,
    quantidade = 3000
  ): Promise<T.PacotePosicaoXML[]> {
    return this.request<T.PacotePosicaoXML[]>(
      'obterPacotePosicaoMotoristaPorRange',
      { idInicio, idFinal, quantidade },
      true
    );
  }

  async obterPacotePosicaoMotoristaPorRangeJSON(
    idInicio: number,
    idFinal: number,
    quantidade = 3000
  ): Promise<T.PacotePosicaoJSON[]> {
    return this.request<T.PacotePosicaoJSON[]>(
      'obterPacotePosicaoMotoristaPorRangeJSON',
      { idInicio, idFinal, quantidade },
      true
    );
  }

  async obterPacotePosicaoHistorico(
    dataInicio: string,
    dataFinal: string,
    idVeiculo?: number
  ): Promise<T.PacotePosicaoXML[]> {
    return this.request<T.PacotePosicaoXML[]>(
      'obterPacotePosicaoHistorico',
      { dataInicio, dataFinal, idVeiculo },
      true
    );
  }

  /**
   * Histórico de pacotes de posições com informação extra de motorista
   * e limpador de para-brisa. Versão "motorista" de obterPacotePosicaoHistorico.
   */
  async obterPacotePosicaoMotoristaHistorico(
    dataInicio: string,
    dataFinal: string,
    idVeiculo?: number
  ): Promise<T.PacotePosicaoXML[]> {
    return this.request<T.PacotePosicaoXML[]>(
      'obterPacotePosicaoMotoristaHistorico',
      { dataInicio, dataFinal, idVeiculo },
      true
    );
  }

  async obterPacotePosicaoPorRange(
    idInicio: number,
    idFinal: number,
    quantidade = 3000
  ): Promise<T.PacotePosicaoXML[]> {
    return this.request<T.PacotePosicaoXML[]>('obterPacotePosicaoPorRange', { idInicio, idFinal, quantidade }, true);
  }

  async obterPacotePosicaoPorRangeJSON(
    idInicio: number,
    idFinal: number,
    quantidade = 3000
  ): Promise<T.PacotePosicaoJSON[]> {
    return this.request<T.PacotePosicaoJSON[]>(
      'obterPacotePosicaoPorRangeJSON',
      { idInicio, idFinal, quantidade },
      true
    );
  }

  async obterPacoteLocalizacao(quantidade = 2000): Promise<T.PacoteLocalizacao[]> {
    return this.request<T.PacoteLocalizacao[]>('obterPacoteLocalizacao', { quantidade }, true);
  }

  /**
   * Pacote de posições de rastreadores de cargas (RF Nacional).
   * Versão do `obterPacotePosicoes` para integração com rastreadores
   * de cargas em roaming nacional.
   */
  async obterPacotePosicoesRFNacional(quantidade = 3000): Promise<T.PacotePosicaoXML[]> {
    return this.request<T.PacotePosicaoXML[]>('obterPacotePosicoesRFNacional', { quantidade }, true);
  }

  /**
   * Alias em inglês do método `obterPacotePosicoesJSON`. Mantido
   * para compatibilidade com a nomenclatura original do WSDL.
   */
  async getPositionsPacketJSON(quantity = 3000): Promise<T.PositionPacketJSON[]> {
    return this.request<T.PositionPacketJSON[]>('getPositionsPacketJSON', { quantity }, true);
  }

  /**
   * Alias em inglês do método `obterPacotePosicoesMotoristaJSON`.
   */
  async getDriverPositionPacketJSON(quantity = 3000): Promise<T.PositionPacketJSON[]> {
    return this.request<T.PositionPacketJSON[]>('getDriverPositionPacketJSON', { quantity }, true);
  }

  /**
   * Alias em inglês do método `obterPacotePosicaoPorRangeJSON`.
   */
  async getPositionPacketByRangeJSON(startId: number, endId: number, quantity = 3000): Promise<T.PositionPacketJSON[]> {
    return this.request<T.PositionPacketJSON[]>('getPositionPacketByRangeJSON', { startId, endId, quantity }, true);
  }

  /**
   * Alias em inglês do método `obterPacotePosicaoMotoristaPorRangeJSON`.
   */
  async getDriverPositionPacketByRangeJSON(
    startId: number,
    endId: number,
    quantity = 3000
  ): Promise<T.PositionPacketJSON[]> {
    return this.request<T.PositionPacketJSON[]>(
      'getDriverPositionPacketByRangeJSON',
      { startId, endId, quantity },
      true
    );
  }

  /**
   * Alias em inglês do método `obterPacotePosicoesJSONComPlaca`.
   */
  async getPositionPacketWithLicensePlateJSON(quantity = 3000): Promise<T.PositionPacketJSON[]> {
    return this.request<T.PositionPacketJSON[]>('getPositionPacketWithLicensePlateJSON', { quantity }, true);
  }

  // --- MÉTODOS DE TELEMETRIA ---

  /**
   * @deprecated Descontinuado. Use obterDeltaTelemetriaIntegracaoInercia
   */
  async obterDeltaTelemetriaIntegracao(
    dataInicio: string,
    dataFinal: string,
    idVeiculo: number,
    pagina?: number
  ): Promise<T.DeltaTelemetria[]> {
    return this.request<T.DeltaTelemetria[]>('obterDeltaTelemetriaIntegracao', {
      dataInicio,
      dataFinal,
      idVeiculo,
      deltmPagina: pagina
    });
  }

  async obterDeltaTelemetriaIntegracaoInercia(
    dataInicio: string,
    dataFinal: string,
    idVeiculo: number,
    pagina?: number
  ): Promise<T.DeltaTelemetria[]> {
    return this.request<T.DeltaTelemetria[]>('obterDeltaTelemetriaIntegracaoInercia', {
      dataInicio,
      dataFinal,
      idVeiculo,
      deltmPagina: pagina
    });
  }

  async obterDeltaTelemetriaIntegracaoDataChegada(
    dataInicio: string,
    dataFinal: string,
    idVeiculo: number,
    dataChegadaInicio: string,
    dataChegadaFinal: string
  ): Promise<T.DeltaTelemetria[]> {
    return this.request<T.DeltaTelemetria[]>('obterDeltaTelemetriaIntegracaoDataChegada', {
      dataInicio,
      dataFinal,
      idVeiculo,
      dataChegadaInicio,
      dataChegadaFinal
    });
  }

  async obterDeltaTelemetriaIntegracaoInerciaDataChegada(
    dataInicio: string,
    dataFinal: string,
    idVeiculo: number,
    dataChegadaInicio: string,
    dataChegadaFinal: string
  ): Promise<T.DeltaTelemetria[]> {
    return this.request<T.DeltaTelemetria[]>('obterDeltaTelemetriaIntegracaoInerciaDataChegada', {
      dataInicio,
      dataFinal,
      idVeiculo,
      dataChegadaInicio,
      dataChegadaFinal
    });
  }

  async obterEventoTelemetriaIntegracao(
    dataInicio: string,
    dataFinal: string,
    idVeiculo: number,
    idEventoList?: string
  ): Promise<T.EventoTelemetria[]> {
    return this.request<T.EventoTelemetria[]>('obterEventoTelemetriaIntegracao', {
      dataInicio,
      dataFinal,
      idVeiculo,
      idEventoList
    });
  }

  async obterEventoTelemetriaDescricao(): Promise<T.TipoEventoTelemetriaDescricao[]> {
    return this.request<T.TipoEventoTelemetriaDescricao[]>('obterEventoTelemetriaDescricao');
  }

  async obterEventosTempoDirecao(
    quantidade = 3000,
    idMotorista?: number,
    dataInicio?: string,
    dataFim?: string
  ): Promise<T.EventoTempoDirecao[]> {
    return this.request<T.EventoTempoDirecao[]>('obterEventosTempoDirecao', {
      quantidade,
      idMotorista,
      dataInicio,
      dataFim
    });
  }

  async obterEventosTempoDirecaoDataChegada(
    quantidade = 3000,
    idMotorista?: number,
    dataInicio?: string,
    dataFim?: string,
    dataChegadaInicial?: string,
    dataChegadaFinal?: string
  ): Promise<T.EventoTempoDirecao[]> {
    return this.request<T.EventoTempoDirecao[]>('obterEventosTempoDirecaoDataChegada', {
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
  async solicitarEventosCaixaPreta(
    idVeiculo?: number,
    placa?: string,
    dataPosicaoInicial?: string,
    dataPosicaoFinal?: string
  ): Promise<T.CaixaPretaSolicitacao> {
    return this.request<T.CaixaPretaSolicitacao>('solicitarEventosCaixaPreta', {
      idVeiculo,
      placa,
      dataPosicaoInicial,
      dataPosicaoFinal
    });
  }

  async recuperarEventosCaixaPreta(
    idVeiculo?: number,
    placa?: string,
    dataPosicao?: string
  ): Promise<T.CaixaPretaList[]> {
    return this.request<T.CaixaPretaList[]>('recuperarEventosCaixaPreta', { idVeiculo, placa, dataPosicao });
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
  async consultaQuantidadePacotesPosicoesPendentes(): Promise<T.PacotePendente[]> {
    return this.request<T.PacotePendente[]>('consultaQuantidadePacotesPosicoesPendentes');
  }

  /**
   * Eventos de SmartCameras (câmeras embarcadas Sascar). Operação ampla com
   * múltiplos filtros opcionais. O único campo obrigatório na prática é
   * `agrupador` (identificador do cliente/conta).
   */
  async getSmartCamerasEvents(params: T.SmartCamerasEventsParams): Promise<T.SmartCamerasEvento[]> {
    return this.request<T.SmartCamerasEvento[]>('getSmartCamerasEvents', { ...params });
  }

  /**
   * Lista motoristas vinculados a um veículo específico.
   */
  async obterMotoristasPorVeiculo(idVeiculo: number): Promise<T.MotoristaVeiculo[]> {
    return this.request<T.MotoristaVeiculo[]>('obterMotoristasPorVeiculo', { idVeiculo });
  }

  /**
   * Lista grupos/áreas AVD com metadados de auditoria (criação, alteração,
   * exclusão e logs efetivos).
   */
  async obterLayoutAreaAvd(): Promise<T.LayoutGrupoAreaAvd[]> {
    return this.request<T.LayoutGrupoAreaAvd[]>('obterLayoutAreaAvd');
  }

  /**
   * Retorna os dados (não detalhado) de um layout específico.
   */
  async obterLayoutData(layout: string): Promise<T.Layout[]> {
    return this.request<T.Layout[]>('obterLayoutData', { layout });
  }

  /**
   * Mensagens do portal Sascar associadas ao veículo informado.
   */
  async obterMensagemPortal(idVeiculo: number): Promise<T.MensagemPortal[]> {
    return this.request<T.MensagemPortal[]>('obterMensagemPortal', { idVeiculo });
  }

  /**
   * Pacote de integração de delta de telemetria (variante do
   * `obterDeltaTelemetriaIntegracao` que aceita apenas `quantidade`).
   */
  async obterPacoteIntegracaoDeltatelemetria(quantidade = 3000): Promise<T.DeltaTelemetria[]> {
    return this.request<T.DeltaTelemetria[]>('obterPacoteIntegracaoDeltatelemetria', { quantidade });
  }

  /**
   * Pacote de posições incluindo placa do veículo (variante do
   * `obterPacotePosicoes` que adiciona o campo `placa`).
   */
  async obterPacotePosicoesComPlaca(quantidade = 3000): Promise<T.PacotePosicaoXML[]> {
    return this.request<T.PacotePosicaoXML[]>('obterPacotePosicoesComPlaca', { quantidade }, true);
  }

  /**
   * Snapshot mínimo de telemetria do portal para um veículo
   * (embreagem, freio, motor, limpador).
   */
  async obterTelemetriaPortal(idVeiculo: number): Promise<T.TelemetriaPortal[]> {
    return this.request<T.TelemetriaPortal[]>('obterTelemetriaPortal', { idVeiculo });
  }

  /**
   * Eventos de telemetria filtrados por data de chegada (além do range
   * de data da posição). Variante "DataChegada" do
   * `obterEventoTelemetriaIntegracao`.
   */
  async obterEventoTelemetriaIntegracaoDataChegada(
    dataInicio: string,
    dataFinal: string,
    dataChegadaInicio: string,
    dataChegadaFinal: string,
    idVeiculo: number,
    idEventoList?: string
  ): Promise<T.EventoTelemetria[]> {
    return this.request<T.EventoTelemetria[]>('obterEventoTelemetriaIntegracaoDataChegada', {
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
  async verificarVeiculoIntegrado(idVeiculo: number): Promise<boolean> {
    const result = await this.request<boolean[] | boolean>('verificarVeiculoIntegrado', { idVeiculo });
    if (Array.isArray(result)) return result[0] === true || String(result[0]) === 'true';
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
  async getMapeamentoVeiculo(
    idVeiculo: number,
    opts?: { veiculos?: T.Veiculo[]; atuadores?: T.GrupoAtuador[] }
  ): Promise<T.VeiculoMapeado> {
    const [veiculos, atuadores] = await Promise.all([
      opts?.veiculos ? Promise.resolve(opts.veiculos) : this.obterVeiculos(1000),
      opts?.atuadores ? Promise.resolve(opts.atuadores) : this.obterGrupoAtuadores()
    ]);

    const veiculo = veiculos.find((v) => v.idVeiculo === idVeiculo);
    if (!veiculo) {
      throw new Error(`Veículo com idVeiculo=${idVeiculo} não encontrado na frota.`);
    }

    const catalogo = new Map<number, T.GrupoAtuador>();
    for (const a of atuadores) catalogo.set(a.idAtuador, a);

    const atuadoresMapeados: Record<number, T.AtuadorMapeado> = {};
    const sensoresMapeados: Record<number, T.SensorMapeado> = {};

    for (let slot = 1; slot <= 8; slot++) {
      const idA = (veiculo as unknown as Record<string, number>)[`idAtuador${slot}`];
      if (idA && idA !== 0) {
        const cat = catalogo.get(idA);
        atuadoresMapeados[slot] = {
          slot,
          idAtuador: idA,
          descricao: cat?.descricao ?? `(idAtuador=${idA} fora do catálogo)`,
          tipoPorta: cat?.tipoPorta ?? '?'
        };
      }
      const idS = (veiculo as unknown as Record<string, number>)[`idSensor${slot}`];
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
  async findAtuador(
    idVeiculo: number,
    descricaoOrSlot: string | number,
    opts?: { veiculos?: T.Veiculo[]; atuadores?: T.GrupoAtuador[] }
  ): Promise<T.AtuadorMapeado | null> {
    const map = await this.getMapeamentoVeiculo(idVeiculo, opts);

    if (typeof descricaoOrSlot === 'number') {
      return map.atuadores[descricaoOrSlot] ?? null;
    }

    const needle = descricaoOrSlot.toLowerCase().trim();
    if (!needle) return null;

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
      if (atuador.descricao.toLowerCase().includes(needle)) return atuador;
    }
    return null;
  }
}
