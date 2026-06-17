import nock from 'nock';
import { SascarClient } from '../../src/client';
import { callAndAssert, makeClient, mockSoapSuccess } from './_helpers';

describe('Cadastros e Entidades (integration)', () => {
  let client: SascarClient;

  beforeEach(() => {
    client = makeClient();
  });

  afterEach(() => nock.cleanAll());

  it('atualizarSenha envia senhaAtual/novaSenha', async () => {
    const scope = mockSoapSuccess('atualizarSenha', '<return>OK</return>');
    const result = await client.atualizarSenha('old', 'new');
    expect(result).toEqual(['OK']);
    expect(scope.isDone()).toBe(true);
  });

  it('obterAlertasAVDVinculados envia veiplaca/veioid', async () => {
    const scope = mockSoapSuccess('obterAlertasAVDVinculados', '<return><id>1</id></return>');
    const result = await client.obterAlertasAVDVinculados('ABC1D23', '99');
    expect(result).toMatchObject([{ id: 1 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterGrupoAtuadores retorna lista', async () => {
    await callAndAssert('obterGrupoAtuadores', (c) => c.obterGrupoAtuadores(), '<return><id>1</id></return>', [
      { id: 1 }
    ]);
  });

  it('obterCadastroAlertasAVD envia dataInicio', async () => {
    await callAndAssert(
      'obterCadastroAlertasAvd',
      (c) => c.obterCadastroAlertasAVD('2023-10-01'),
      '<return><id>1</id></return>',
      [{ id: 1 }]
    );
  });

  it('obterClientes envia quantidade e idCliente', async () => {
    await callAndAssert('obterClientes', (c) => c.obterClientes(100, 5), '<return><idCliente>5</idCliente></return>', [
      { idCliente: 5 }
    ]);
  });

  it('obterClientesV2 envia quantidade e idCliente', async () => {
    await callAndAssert('obterClientesV2', (c) => c.obterClientesV2(100), '<return><idCliente>1</idCliente></return>', [
      { idCliente: 1 }
    ]);
  });

  it('obterVeiculos envia quantidade e idVeiculo', async () => {
    await callAndAssert('obterVeiculos', (c) => c.obterVeiculos(50, 99), '<return><idVeiculo>99</idVeiculo></return>', [
      { idVeiculo: 99 }
    ]);
  });

  it('obterVeiculosJson pagina e concatena resultados', async () => {
    const s1 = mockSoapSuccess('getVehiclesJSON', '<return>{"idVeiculo":1}</return><return>{"idVeiculo":2}</return>');
    const s2 = mockSoapSuccess('getVehiclesJSON', '<return>{}</return>');
    const result = await client.obterVeiculosJson(2);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ idVeiculo: 1 });
    expect(result[1]).toMatchObject({ idVeiculo: 2 });
    expect(s1.isDone()).toBe(true);
    expect(s2.isDone()).toBe(true);
  });

  it('obterVeiculosJson envia vehicleId após primeira página cheia', async () => {
    const s1 = mockSoapSuccess('getVehiclesJSON', '<return>{"idVeiculo":10}</return>');
    const s2 = mockSoapSuccess('getVehiclesJSON', '<return>{"idVeiculo":11}</return>');
    const s3 = mockSoapSuccess('getVehiclesJSON', '<return>{}</return>');
    const result = await client.obterVeiculosJson(1);
    expect(result).toHaveLength(2);
    expect(s1.isDone()).toBe(true);
    expect(s2.isDone()).toBe(true);
    expect(s3.isDone()).toBe(true);
  });

  it('obterVeiculosRFNacional envia idVeiculo', async () => {
    await callAndAssert(
      'obterVeiculosRFNacional',
      (c) => c.obterVeiculosRFNacional(10, 5),
      '<return><idVeiculo>5</idVeiculo></return>',
      [{ idVeiculo: 5 }]
    );
  });

  it('obterDadosAdicionais envia idVeiculo', async () => {
    await callAndAssert(
      'obterDadosAdicionais',
      (c) => c.obterDadosAdicionais(7),
      '<return><idVeiculo>7</idVeiculo></return>',
      [{ idVeiculo: 7 }]
    );
  });

  it('obterDadosAdicionaisCliente envia idVeiculo', async () => {
    await callAndAssert(
      'obterDadosAdicionaisCliente',
      (c) => c.obterDadosAdicionaisCliente(8),
      '<return><idVeiculo>8</idVeiculo></return>',
      [{ idVeiculo: 8 }]
    );
  });

  it('obterPontosReferencia retorna lista', async () => {
    await callAndAssert('obterPontosReferencia', (c) => c.obterPontosReferencia(), '<return><id>1</id></return>', [
      { id: 1 }
    ]);
  });

  it('obterSequenciamentoEvento retorna lista', async () => {
    await callAndAssert(
      'obterSequenciamentoEvento',
      (c) => c.obterSequenciamentoEvento(),
      '<return><id>1</id></return>',
      [{ id: 1 }]
    );
  });

  it('obterMotoristas envia idMotorista', async () => {
    await callAndAssert(
      'obterMotoristas',
      (c) => c.obterMotoristas(10, 5),
      '<return><idMotorista>5</idMotorista></return>',
      [{ idMotorista: 5 }]
    );
  });

  it('obterMotoristasVeiculos envia idMotoristaVeiculo', async () => {
    await callAndAssert(
      'obterMotoristasVeiculos',
      (c) => c.obterMotoristasVeiculos(10, 5),
      '<return><idMotorista>5</idMotorista></return>',
      [{ idMotorista: 5 }]
    );
  });

  it('obterLayoutTecladoVeiculos retorna lista', async () => {
    await callAndAssert(
      'obterLayoutTecladoVeiculos',
      (c) => c.obterLayoutTecladoVeiculos(),
      '<return><id>1</id></return>',
      [{ id: 1 }]
    );
  });

  it('obterLayoutGrupoPontos retorna lista', async () => {
    await callAndAssert('obterLayoutGrupoPontos', (c) => c.obterLayoutGrupoPontos(), '<return><id>1</id></return>', [
      { id: 1 }
    ]);
  });

  it('obterRotas envia dataInicio', async () => {
    await callAndAssert('obterRotas', (c) => c.obterRotas('2023-10-01'), '<return><Id>1</Id></return>', [{ Id: 1 }]);
  });

  it('obterEnderecoPosicao envia latitude e longitude', async () => {
    const scope = mockSoapSuccess(
      'obterEnderecoPosicao',
      '<return><cidade>Sao Paulo</cidade><Rua>Av Paulista</Rua><uf>SP</uf></return>'
    );
    const result = await client.obterEnderecoPosicao('-23.5', '-46.6');
    expect(result).toMatchObject([{ cidade: 'Sao Paulo', Rua: 'Av Paulista', uf: 'SP' }]);
    expect(scope.isDone()).toBe(true);
  });
});
