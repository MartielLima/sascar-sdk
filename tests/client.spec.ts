import { SascarClient } from '../src/client';
import { SascarConnectionError, SascarApiError, SascarRateLimitError } from '../src/errors';

global.fetch = jest.fn();

describe('Errors', () => {
  it('deve exportar SascarRateLimitError corretamente', () => {
    expect(new SascarRateLimitError('rate limit')).toBeInstanceOf(Error);
  });
});

describe('SascarClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SASCAR_USUARIO = 'test_user';
    process.env.SASCAR_SENHA = 'test_password';
  });

  afterEach(() => {
    delete process.env.SASCAR_USUARIO;
    delete process.env.SASCAR_SENHA;
  });

  const mockFetchSuccess = (xmlBody: string) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      text: async () => xmlBody
    });
  };

  const mockFetchError = (errorMessage: string) => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
  };

  it('deve disparar erro se inicializado sem credenciais', () => {
    delete process.env.SASCAR_USUARIO;
    delete process.env.SASCAR_SENHA;
    expect(() => new SascarClient()).toThrow('Credenciais da SASCAR não fornecidas.');
  });

  it('deve tratar erro de falha na conexão (SascarConnectionError)', async () => {
    mockFetchError('Network down');
    const client = new SascarClient();
    await expect(client.obterVeiculosJson()).rejects.toThrow(SascarConnectionError);
  });

  it('deve tratar erro de API (Fault XML da Sascar)', async () => {
    const faultXml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
         <soapenv:Body>
            <soapenv:Fault>
               <faultstring>Usuário ou senha inválidos</faultstring>
            </soapenv:Fault>
         </soapenv:Body>
      </soapenv:Envelope>
    `;
    mockFetchSuccess(faultXml);
    const client = new SascarClient();
    await expect(client.obterVeiculosJson()).rejects.toThrow('Erro SOAP da Sascar: Usuário ou senha inválidos');
  });

  it('deve lançar erro se a resposta não possuir o nó de retorno esperado', async () => {
    const invalidXml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
         <soapenv:Body>
            <InvalidResponse></InvalidResponse>
         </soapenv:Body>
      </soapenv:Envelope>
    `;
    mockFetchSuccess(invalidXml);
    const client = new SascarClient();
    await expect(client.obterVeiculosJson()).rejects.toThrow('Resposta inválida do servidor Sascar.');
  });

  it('deve ignorar erro no parsing de JSON invalido e retornar a string bruta', async () => {
    const responseXml = `
      <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><ns0:obterClientesV2Response>
        <return>{ invalid json }</return>
      </ns0:obterClientesV2Response></S:Body></S:Envelope>
    `;
    mockFetchSuccess(responseXml);
    const client = new SascarClient();
    const result = await client.obterClientesV2();
    expect(result).toEqual(['{ invalid json }']);
  });

  it('deve lidar com retornos vazios graciosamente', async () => {
    const emptyXml = `
      <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
        <S:Body>
          <ns0:obterClientesV2Response xmlns:ns0="http://webservice.web.integracao.sascar.com.br/">
          </ns0:obterClientesV2Response>
        </S:Body>
      </S:Envelope>
    `;
    mockFetchSuccess(emptyXml);
    const client = new SascarClient();
    const result = await client.obterClientesV2();
    expect(result).toEqual([]);
  });

  it('deve realizar paginação recursiva no obterVeiculosJson enviando id do último veículo', async () => {
    const page1 = `
      <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><ns0:getVehiclesJSONResponse>
        <return>{"idVeiculo": 1}</return>
        <return>{"idVeiculo": 2}</return>
      </ns0:getVehiclesJSONResponse></S:Body></S:Envelope>
    `;
    const page2 = `
      <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><ns0:getVehiclesJSONResponse>
        <return>{"idVeiculo": 3}</return>
        <return>{"idVeiculo": 4}</return>
      </ns0:getVehiclesJSONResponse></S:Body></S:Envelope>
    `;
    const page3 = `
      <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><ns0:getVehiclesJSONResponse>
      </ns0:getVehiclesJSONResponse></S:Body></S:Envelope>
    `;
    
    mockFetchSuccess(page1);
    mockFetchSuccess(page2);
    mockFetchSuccess(page3);

    const client = new SascarClient();
    const result = await client.obterVeiculosJson(2);
    
    expect(result).toHaveLength(4);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    const secondCallBody = (global.fetch as jest.Mock).mock.calls[1][1].body;
    expect(secondCallBody).toContain('<vehicleId>2</vehicleId>');
  });

  // Testa a chamada correta para tudos os endpoints básicos delegados a request()
  describe('Cobertura completa de chamadas da API', () => {
    let client: SascarClient;

    beforeEach(() => {
      client = new SascarClient();
      // Criamos um mock genérico que serve para qualquer chamada testando apenas o routing
      (global.fetch as jest.Mock).mockImplementation(async (url, init) => {
        // Encontraremos o methodName procurado no body: <web:methodName>
        const match = /<web:([a-zA-Z0-9_]+)>/i.exec(init.body);
        const method = match ? match[1] : 'unknown';
        const fakeReturn = method.includes('JSON') ? '{"id":1}' : '<id>1</id>';
        return {
          text: async () => `
            <S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
              <S:Body>
                <ns0:${method}Response>
                  <return>${fakeReturn}</return>
                </ns0:${method}Response>
              </S:Body>
            </S:Envelope>
          `
        };
      });
    });

    it('testa todos os métodos geográficos e de telemetria', async () => {
      await expect(client.atualizarSenha('1', '2')).resolves.toBeDefined();
      await expect(client.obterAlertasAVDVinculados('AAA', '1')).resolves.toBeDefined();
      await expect(client.obterGrupoAtuadores()).resolves.toBeDefined();
      await expect(client.obterCadastroAlertasAVD('data')).resolves.toBeDefined();
      await expect(client.obterClientes(1)).resolves.toBeDefined();
      await expect(client.obterVeiculos(1)).resolves.toBeDefined();
      await expect(client.obterVeiculosRFNacional(1)).resolves.toBeDefined();
      await expect(client.obterDadosAdicionais(1)).resolves.toBeDefined();
      await expect(client.obterDadosAdicionaisCliente(1)).resolves.toBeDefined();
      await expect(client.obterPontosReferencia()).resolves.toBeDefined();
      await expect(client.obterSequenciamentoEvento()).resolves.toBeDefined();
      await expect(client.obterMotoristas(1)).resolves.toBeDefined();
      await expect(client.obterMotoristasVeiculos(1)).resolves.toBeDefined();
      await expect(client.obterLayoutTecladoVeiculos()).resolves.toBeDefined();
      await expect(client.obterLayoutGrupoPontos()).resolves.toBeDefined();
      await expect(client.obterRotas('1')).resolves.toBeDefined();
      await expect(client.obterStatusComando(1)).resolves.toBeDefined();
      await expect(client.obterStatusComandoTicketSascar(1)).resolves.toBeDefined();
      await expect(client.obterTipoComando()).resolves.toBeDefined();
      await expect(client.obterMacroTd50Tmcd('t')).resolves.toBeDefined();
      await expect(client.obterMacroTd50TmcdDetalhado('t')).resolves.toBeDefined();
      await expect(client.obterMascaraDispositivo(1)).resolves.toBeDefined();
      await expect(client.obterMacroTd40(true)).resolves.toBeDefined();
      await expect(client.obterLayout('t')).resolves.toBeDefined();
      await expect(client.obterLayoutDetalhado('t')).resolves.toBeDefined();
      await expect(client.obterLayoutAcaoEmbarcadaAVD()).resolves.toBeDefined();
      await expect(client.comandoEmbarquePontoDiario(1, 'ref')).resolves.toBeDefined();
      await expect(client.enviarParametrizacaoTelemetria(1, {})).resolves.toBeDefined();
      await expect(client.obterMacroTms3()).resolves.toBeDefined();
      await expect(client.solicitarEventosCaixaPreta()).resolves.toBeDefined();
      await expect(client.recuperarEventosCaixaPreta()).resolves.toBeDefined();
      await expect(client.obterDeltaTelemetriaIntegracao('1', '2', 3)).resolves.toBeDefined();
      await expect(client.obterDeltaTelemetriaIntegracaoInercia('1', '2', 3)).resolves.toBeDefined();
      await expect(client.obterDeltaTelemetriaIntegracaoDataChegada('1', '2', 3, '4', '5')).resolves.toBeDefined();
      await expect(client.obterDeltaTelemetriaIntegracaoInerciaDataChegada('1', '2', 3, '4', '5')).resolves.toBeDefined();
      await expect(client.obterEventoTelemetriaIntegracao('1', '2', 3)).resolves.toBeDefined();
      await expect(client.obterEventoTelemetriaDescricao()).resolves.toBeDefined();
      await expect(client.obterEventosTempoDirecao()).resolves.toBeDefined();
      await expect(client.obterEventosTempoDirecaoDataChegada()).resolves.toBeDefined();
    });

    it('testa todos os métodos da fila (posições)', async () => {
      await expect(client.obterPacotePosicoes()).resolves.toBeDefined();
      await expect(client.obterPacotePosicoesJSON()).resolves.toBeDefined();
      await expect(client.obterPacotePosicoesMotorista()).resolves.toBeDefined();
      await expect(client.obterPacotePosicoesMotoristaJSON()).resolves.toBeDefined();
      await expect(client.obterPacotePosicoesMotoristaComPlaca()).resolves.toBeDefined();
      await expect(client.obterPacotePosicoesJSONComPlaca()).resolves.toBeDefined();
      await expect(client.obterPacotePosicoesRestricao()).resolves.toBeDefined();
      await expect(client.obterPacotePosicoesMotoristaRestricao()).resolves.toBeDefined();
      await expect(client.obterPacotePosicaoMotoristaPorRange(1, 2)).resolves.toBeDefined();
      await expect(client.obterPacotePosicaoMotoristaPorRangeJSON(1, 2)).resolves.toBeDefined();
      await expect(client.obterPacotePosicaoHistorico('1', '2')).resolves.toBeDefined();
      await expect(client.obterPacotePosicaoPorRange(1, 2)).resolves.toBeDefined();
      await expect(client.obterPacotePosicaoPorRangeJSON(1, 2)).resolves.toBeDefined();
      await expect(client.obterPacoteLocalizacao()).resolves.toBeDefined();
      await expect(client.getPositionsPacketJSON()).resolves.toBeDefined();
      await expect(client.getDriverPositionPacketJSON()).resolves.toBeDefined();
      await expect(client.getPositionPacketByRangeJSON(1, 2)).resolves.toBeDefined();
      await expect(client.getDriverPositionPacketByRangeJSON(1, 2)).resolves.toBeDefined();
      await expect(client.getPositionPacketWithLicensePlateJSON()).resolves.toBeDefined();
    });
  });
});
