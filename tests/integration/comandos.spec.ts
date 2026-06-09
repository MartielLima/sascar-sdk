import nock from 'nock';
import { makeClient, mockSoapSuccess } from './_helpers';

describe('Comandos e Macros (integration)', () => {
  afterEach(() => nock.cleanAll());

  it('obterStatusComando envia ticket', async () => {
    const client = makeClient();
    const scope = mockSoapSuccess('obterStatusComando', '<return><id>1</id></return>');
    const result = await client.obterStatusComando(42);
    expect(result).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterStatusComandoTicketSascar envia ticket', async () => {
    const client = makeClient();
    const scope = mockSoapSuccess('obterStatusComandoTicketSascar', '<return><id>1</id></return>');
    const result = await client.obterStatusComandoTicketSascar(42);
    expect(result).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterTipoComando retorna lista', async () => {
    const client = makeClient();
    const scope = mockSoapSuccess('obterTipoComando', '<return><id>1</id></return>');
    expect(await client.obterTipoComando()).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterMacroTd50Tmcd envia tipoTeclado', async () => {
    const client = makeClient();
    const scope = mockSoapSuccess('obterMacroTd50Tmcd', '<return><id>1</id></return>');
    expect(await client.obterMacroTd50Tmcd('TD50')).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterMacroTd50TmcdDetalhado envia tipoTeclado, idLayout, dataReferencia', async () => {
    const client = makeClient();
    const scope = mockSoapSuccess('obterMacroTd50TmcdDetalhado', '<return><id>1</id></return>');
    expect(await client.obterMacroTd50TmcdDetalhado('TD50', 1, '2023-10-01')).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterMascaraDispositivo envia idVeiculo', async () => {
    const client = makeClient();
    const scope = mockSoapSuccess('obterMascaraDispositivos', '<return><atuadores><item>1</item></atuadores></return>');
    expect(await client.obterMascaraDispositivo(5)).toMatchObject([{ atuadores: { item: 1 } }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterMacroTd40 envia satelital', async () => {
    const client = makeClient();
    const scope = mockSoapSuccess('obterMacroTd40', '<return><id>1</id></return>');
    expect(await client.obterMacroTd40(true)).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterLayout envia layout', async () => {
    const client = makeClient();
    const scope = mockSoapSuccess('obterLayout', '<return><id>1</id></return>');
    expect(await client.obterLayout('main')).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterLayoutDetalhado envia layout, idLayout, dataReferencia', async () => {
    const client = makeClient();
    const scope = mockSoapSuccess('obterLayoutDetalhado', '<return><idLayout>1</idLayout></return>');
    expect(await client.obterLayoutDetalhado('main', 1, '2023-10-01')).toMatchObject([{ idLayout: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterLayoutAcaoEmbarcadaAVD retorna lista', async () => {
    const client = makeClient();
    const scope = mockSoapSuccess('obterLayoutAcaoEmbarcadaAVD', '<return><id>1</id></return>');
    expect(await client.obterLayoutAcaoEmbarcadaAVD()).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('comandoEmbarquePontoDiario envia idVeiculo e pontosRef', async () => {
    const client = makeClient();
    const scope = mockSoapSuccess('comandoEmbarquePontoDiario', '<return><mensagem>OK</mensagem></return>');
    expect(await client.comandoEmbarquePontoDiario(5, 'PR1')).toMatchObject([{ mensagem: 'OK' }]);
    expect(scope.isDone()).toBe(true);
  });

  it('enviarParametrizacaoTelemetria envia idVeiculo e telemetriaParametrizacao', async () => {
    const client = makeClient();
    const scope = mockSoapSuccess('enviarParametrizacaoTelemetria', '<return><mensagem>OK</mensagem></return>');
    expect(await client.enviarParametrizacaoTelemetria(5, { tipoVeiculo: 1 })).toMatchObject([{ mensagem: 'OK' }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterMacroTms3 retorna lista', async () => {
    const client = makeClient();
    const scope = mockSoapSuccess('obterMacroTms3', '<return><id>1</id></return>');
    expect(await client.obterMacroTms3()).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });
});
