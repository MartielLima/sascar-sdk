import { XMLParser } from 'fast-xml-parser';
import { AsyncQueue } from './queue';
import { SascarApiError, SascarConnectionError } from './errors';
import { buildSoapEnvelope } from './transport/envelope';
import * as T from './types';

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
  private wsdlUrl = 'https://sasintegra.sascar.com.br/SasIntegra/SasIntegraWSService';
  private positionsQueue = new AsyncQueue();
  private parser = new XMLParser({ ignoreAttributes: true, removeNSPrefix: true });

  constructor(credentials?: T.SascarCredentials) {
    this.usuario = credentials?.usuario || process.env.SASCAR_USUARIO || '';
    this.senha = credentials?.senha || process.env.SASCAR_SENHA || '';

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

    const execute = async () => {
      let response: Response;
      try {
        response = await fetch(this.wsdlUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml;charset=UTF-8',
            SOAPAction: `""`
          },
          body: xml
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new SascarConnectionError(`Erro de conexão com a Sascar: ${message}`);
      }

      const text = await response.text();
      const parsed = this.parser.parse(text);

      if (parsed.Envelope?.Body?.Fault) {
        throw new SascarApiError(`Erro SOAP da Sascar: ${parsed.Envelope.Body.Fault.faultstring}`);
      }

      const responseNode = parsed.Envelope?.Body?.[`${methodName}Response`];
      if (responseNode === undefined) {
        throw new SascarApiError('Resposta inválida do servidor Sascar.');
      }

      let result = responseNode.return;

      if (!result) return [] as unknown as TReturn;

      // JSON parses nested strings
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
        result = [parseItem(result)]; // Force array for multiple returns
      }

      // Se for método não-lista, podemos extrair dps. Mas a maioria é lista.
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
    return this.request<T.AlertaAVD[]>('ObterAlertasAVDVinculados', { veiplaca, veioid });
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
}
