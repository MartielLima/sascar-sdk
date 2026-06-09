import nock from 'nock';
import { SascarClient } from '../../src/client';
import { makeClient, mockSoapSuccess } from './_helpers';

describe('Telemetria (integration)', () => {
  let client: SascarClient;

  beforeEach(() => {
    client = makeClient();
  });

  afterEach(() => nock.cleanAll());

  it('obterDeltaTelemetriaIntegracao envia dataInicio, dataFinal, idVeiculo, pagina', async () => {
    const scope = mockSoapSuccess('obterDeltaTelemetriaIntegracao', '<return><idVeiculo>1</idVeiculo></return>');
    expect(await client.obterDeltaTelemetriaIntegracao('2023-10-01', '2023-10-02', 5, 1)).toMatchObject([
      { idVeiculo: 1 }
    ]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterDeltaTelemetriaIntegracaoInercia envia mesmos params', async () => {
    const scope = mockSoapSuccess('obterDeltaTelemetriaIntegracaoInercia', '<return><idVeiculo>1</idVeiculo></return>');
    expect(await client.obterDeltaTelemetriaIntegracaoInercia('2023-10-01', '2023-10-02', 5)).toMatchObject([
      { idVeiculo: 1 }
    ]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterDeltaTelemetriaIntegracaoDataChegada envia 5 params', async () => {
    const scope = mockSoapSuccess(
      'obterDeltaTelemetriaIntegracaoDataChegada',
      '<return><idVeiculo>1</idVeiculo></return>'
    );
    expect(
      await client.obterDeltaTelemetriaIntegracaoDataChegada('2023-10-01', '2023-10-02', 5, '2023-10-01', '2023-10-02')
    ).toMatchObject([{ idVeiculo: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterDeltaTelemetriaIntegracaoInerciaDataChegada envia 5 params', async () => {
    const scope = mockSoapSuccess(
      'obterDeltaTelemetriaIntegracaoInerciaDataChegada',
      '<return><idVeiculo>1</idVeiculo></return>'
    );
    expect(
      await client.obterDeltaTelemetriaIntegracaoInerciaDataChegada(
        '2023-10-01',
        '2023-10-02',
        5,
        '2023-10-01',
        '2023-10-02'
      )
    ).toMatchObject([{ idVeiculo: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterEventoTelemetriaIntegracao envia 4 params', async () => {
    const scope = mockSoapSuccess('obterEventoTelemetriaIntegracao', '<return><idVeiculo>1</idVeiculo></return>');
    expect(await client.obterEventoTelemetriaIntegracao('2023-10-01', '2023-10-02', 5, '1,2')).toMatchObject([
      { idVeiculo: 1 }
    ]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterEventoTelemetriaDescricao retorna lista', async () => {
    const scope = mockSoapSuccess('obterEventoTelemetriaDescricao', '<return><id>1</id></return>');
    expect(await client.obterEventoTelemetriaDescricao()).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterEventosTempoDirecao envia quantidade, idMotorista, datas', async () => {
    const scope = mockSoapSuccess('obterEventosTempoDirecao', '<return><id>1</id></return>');
    expect(await client.obterEventosTempoDirecao(100, 5, '2023-10-01', '2023-10-02')).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterEventosTempoDirecaoDataChegada envia 6 params', async () => {
    const scope = mockSoapSuccess('obterEventosTempoDirecaoDataChegada', '<return><id>1</id></return>');
    expect(
      await client.obterEventosTempoDirecaoDataChegada(100, 5, '2023-10-01', '2023-10-02', '2023-10-01', '2023-10-02')
    ).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });
});
