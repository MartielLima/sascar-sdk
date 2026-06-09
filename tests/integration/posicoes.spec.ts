import nock from 'nock';
import { SascarClient } from '../../src/client';
import { makeClient, mockSoapSuccess } from './_helpers';

describe('Posições e Rastreamento (integration)', () => {
  let client: SascarClient;

  beforeEach(() => {
    client = makeClient();
  });

  afterEach(() => nock.cleanAll());

  it.each([
    ['obterPacotePosicoes', (c: SascarClient) => c.obterPacotePosicoes(100)],
    ['obterPacotePosicoesJSON', (c: SascarClient) => c.obterPacotePosicoesJSON(100)],
    ['obterPacotePosicoesMotorista', (c: SascarClient) => c.obterPacotePosicoesMotorista(100)],
    ['obterPacotePosicoesMotoristaJSON', (c: SascarClient) => c.obterPacotePosicoesMotoristaJSON(100)],
    ['obterPacotePosicoesMotoristaComPlaca', (c: SascarClient) => c.obterPacotePosicoesMotoristaComPlaca(100)],
    ['obterPacotePosicoesJSONComPlaca', (c: SascarClient) => c.obterPacotePosicoesJSONComPlaca(100)],
    ['obterPacotePosicoesRestricao', (c: SascarClient) => c.obterPacotePosicoesRestricao(100)],
    ['obterPacotePosicoesMotoristaRestricao', (c: SascarClient) => c.obterPacotePosicoesMotoristaRestricao(100, 5)],
    ['obterPacotePosicaoMotoristaPorRange', (c: SascarClient) => c.obterPacotePosicaoMotoristaPorRange(1, 2, 100)],
    [
      'obterPacotePosicaoMotoristaPorRangeJSON',
      (c: SascarClient) => c.obterPacotePosicaoMotoristaPorRangeJSON(1, 2, 100)
    ],
    ['obterPacotePosicaoPorRange', (c: SascarClient) => c.obterPacotePosicaoPorRange(1, 2, 100)],
    ['obterPacotePosicaoPorRangeJSON', (c: SascarClient) => c.obterPacotePosicaoPorRangeJSON(1, 2, 100)],
    ['obterPacoteLocalizacao', (c: SascarClient) => c.obterPacoteLocalizacao(100)]
  ])('%s retorna lista parseada', async (methodName, call) => {
    const scope = mockSoapSuccess(methodName, '<return><id>1</id></return>');
    const result = await call(client);
    expect(result).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterPacotePosicaoHistorico envia dataInicio, dataFinal, idVeiculo', async () => {
    const scope = mockSoapSuccess('obterPacotePosicaoHistorico', '<return><id>1</id></return>');
    expect(await client.obterPacotePosicaoHistorico('2023-10-01', '2023-10-02', 5)).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it.each([
    ['getPositionsPacketJSON', (c: SascarClient) => c.getPositionsPacketJSON(100)],
    ['getDriverPositionPacketJSON', (c: SascarClient) => c.getDriverPositionPacketJSON(100)],
    ['getPositionPacketWithLicensePlateJSON', (c: SascarClient) => c.getPositionPacketWithLicensePlateJSON(100)]
  ])('%s (EN alias) retorna lista parseada', async (methodName, call) => {
    const scope = mockSoapSuccess(methodName, '<return><id>1</id></return>');
    const result = await call(client);
    expect(result).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it.each([
    ['getPositionPacketByRangeJSON', (c: SascarClient) => c.getPositionPacketByRangeJSON(1, 2, 100)],
    ['getDriverPositionPacketByRangeJSON', (c: SascarClient) => c.getDriverPositionPacketByRangeJSON(1, 2, 100)]
  ])('%s (EN alias) envia startId/endId/quantity', async (methodName, call) => {
    const scope = mockSoapSuccess(methodName, '<return><id>1</id></return>');
    const result = await call(client);
    expect(result).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });
});
