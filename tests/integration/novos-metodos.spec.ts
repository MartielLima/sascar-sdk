import nock from 'nock';
import { SascarClient } from '../../src/client';
import { callAndAssert, makeClient, mockSoapSuccess } from './_helpers';

describe('Métodos descobertos no WSDL ao vivo (integration)', () => {
  let client: SascarClient;

  beforeEach(() => {
    client = makeClient();
  });

  afterEach(() => nock.cleanAll());

  it('consultaQuantidadePacotesPosicoesPendentes retorna fila', async () => {
    await callAndAssert(
      'consultaQuantidadePacotesPosicoesPendentes',
      (c) => c.consultaQuantidadePacotesPosicoesPendentes(),
      '<return><dtUltimaRequisicao>2026-06-17 10:00:00</dtUltimaRequisicao><qtdPacotesPendentes>42</qtdPacotesPendentes></return>',
      [{ dtUltimaRequisicao: '2026-06-17 10:00:00', qtdPacotesPendentes: 42 }]
    );
  });

  it('getSmartCamerasEvents envia agrupador + filtros', async () => {
    const scope = mockSoapSuccess(
      'getSmartCamerasEvents',
      '<return><id>evt-1</id><plate>NTO7934</plate><eventType>3</eventType></return>'
    );
    const result = await client.getSmartCamerasEvents({
      agrupador: 'cliente-123',
      offset: 0,
      limit: 50,
      dataInicio: '2026-06-16 00:00:00',
      dataFim: '2026-06-17 00:00:00'
    });
    expect(result).toMatchObject([{ id: 'evt-1', plate: 'NTO7934', eventType: 3 }]);
    expect(scope.isDone()).toBe(true);
  });

  it('obterMotoristasPorVeiculo envia idVeiculo', async () => {
    await callAndAssert(
      'obterMotoristasPorVeiculo',
      (c) => c.obterMotoristasPorVeiculo(2248181),
      '<return><idMotorista>3917967</idMotorista><idVeiculo>2248181</idVeiculo></return>',
      [{ idMotorista: 3917967 }]
    );
  });

  it('obterLayoutAreaAvd retorna lista com auditoria', async () => {
    await callAndAssert(
      'obterLayoutAreaAvd',
      (c) => c.obterLayoutAreaAvd(),
      '<return><id>1</id><nome>Area Frota</nome><clienteId>202977</clienteId></return>',
      [{ id: 1, nome: 'Area Frota', clienteId: 202977 }]
    );
  });

  it('obterLayoutData envia layout', async () => {
    await callAndAssert(
      'obterLayoutData',
      (c) => c.obterLayoutData('TD50'),
      '<return><idLayout>54378</idLayout><descricao>TD50 padrão</descricao></return>',
      [{ idLayout: 54378, descricao: 'TD50 padrão' }]
    );
  });

  it('obterMensagemPortal envia idVeiculo', async () => {
    await callAndAssert(
      'obterMensagemPortal',
      (c) => c.obterMensagemPortal(2248181),
      '<return><mensagem>Veículo entregue na base</mensagem></return>',
      [{ mensagem: 'Veículo entregue na base' }]
    );
  });

  it('obterPacoteIntegracaoDeltatelemetria envia quantidade', async () => {
    await callAndAssert(
      'obterPacoteIntegracaoDeltatelemetria',
      (c) => c.obterPacoteIntegracaoDeltatelemetria(100),
      '<return><idVeiculo>2248181</idVeiculo></return>',
      [{ idVeiculo: 2248181 }]
    );
  });

  it('obterPacotePosicoesComPlaca envia quantidade', async () => {
    await callAndAssert(
      'obterPacotePosicoesComPlaca',
      (c) => c.obterPacotePosicoesComPlaca(100),
      '<return><idVeiculo>2248181</idVeiculo><placa>THF0G38</placa></return>',
      [{ idVeiculo: 2248181, placa: 'THF0G38' }]
    );
  });

  it('obterTelemetriaPortal envia idVeiculo', async () => {
    await callAndAssert(
      'obterTelemetriaPortal',
      (c) => c.obterTelemetriaPortal(2248181),
      '<return><motorFuncionando>1</motorFuncionando><freio>0</freio><embreagem>0</embreagem><estadoLimpadorParabrisa>0</estadoLimpadorParabrisa></return>',
      [{ motorFuncionando: 1, freio: 0, embreagem: 0, estadoLimpadorParabrisa: 0 }]
    );
  });

  it('obterEventoTelemetriaIntegracaoDataChegada envia todos os ranges', async () => {
    const scope = mockSoapSuccess(
      'obterEventoTelemetriaIntegracaoDataChegada',
      '<return><dataChegada>2026-06-16 12:00:00</dataChegada></return>'
    );
    const result = await client.obterEventoTelemetriaIntegracaoDataChegada(
      '2026-06-16 00:00:00',
      '2026-06-16 23:59:59',
      '2026-06-16 00:00:00',
      '2026-06-16 23:59:59',
      2248181
    );
    expect(result).toMatchObject([{ dataChegada: '2026-06-16 12:00:00' }]);
    expect(scope.isDone()).toBe(true);
  });

  it('verificarVeiculoIntegrado retorna boolean true', async () => {
    const scope = mockSoapSuccess('verificarVeiculoIntegrado', '<return>true</return>');
    const result = await client.verificarVeiculoIntegrado(2248181);
    expect(result).toBe(true);
    expect(scope.isDone()).toBe(true);
  });

  it('verificarVeiculoIntegrado retorna boolean false', async () => {
    const scope = mockSoapSuccess('verificarVeiculoIntegrado', '<return>false</return>');
    const result = await client.verificarVeiculoIntegrado(999999);
    expect(result).toBe(false);
    expect(scope.isDone()).toBe(true);
  });
});

describe('Helpers de mapeamento (integration)', () => {
  let client: SascarClient;

  beforeEach(() => {
    client = makeClient();
  });

  afterEach(() => nock.cleanAll());

  const veiculoXml = `<return>
    <idVeiculo>2248181</idVeiculo>
    <placa>THF0G38</placa>
    <idCliente>202977</idCliente>
    <descricao>TESTE</descricao>
    <idEquipamento>1</idEquipamento>
    <idEquipamentoDesc>MSC830</idEquipamentoDesc>
    <idSensor1>0</idSensor1><idSensor2>0</idSensor2><idSensor3>231</idSensor3><idSensor4>247</idSensor4>
    <idSensor5>0</idSensor5><idSensor6>0</idSensor6><idSensor7>0</idSensor7><idSensor8>0</idSensor8>
    <idAtuador1>0</idAtuador1><idAtuador2>240</idAtuador2><idAtuador3>254</idAtuador3><idAtuador4>0</idAtuador4>
    <idAtuador5>0</idAtuador5><idAtuador6>0</idAtuador6><idAtuador7>232</idAtuador7><idAtuador8>0</idAtuador8>
    <portaPanico>9</portaPanico>
    <portaBloqueio>1</portaBloqueio>
    <idSerial0>202</idSerial0>
    <idSerial1>0</idSerial1>
    <satelital>true</satelital>
    <telemetria>true</telemetria>
  </return>`;

  const atuadoresCatalogoXml = `
    <return><idAtuador>240</idAtuador><descricao>Sirene</descricao><tipoPorta>S</tipoPorta></return>
    <return><idAtuador>254</idAtuador><descricao>Trava Bau Traseiro</descricao><tipoPorta>S</tipoPorta></return>
    <return><idAtuador>232</idAtuador><descricao>Buzzer</descricao><tipoPorta>S</tipoPorta></return>
    <return><idAtuador>231</idAtuador><descricao>Violacao Painel</descricao><tipoPorta>E</tipoPorta></return>
    <return><idAtuador>247</idAtuador><descricao>Sensor Porta Motorista</descricao><tipoPorta>E</tipoPorta></return>
  `;

  it('getMapeamentoVeiculo cruza cadastro + catalogo', async () => {
    mockSoapSuccess('obterVeiculos', veiculoXml);
    mockSoapSuccess('obterGrupoAtuadores', atuadoresCatalogoXml);

    const map = await client.getMapeamentoVeiculo(2248181);

    expect(map.portaBloqueio).toBe(1);
    expect(map.portaPanico).toBe(9);
    expect(map.atuadores[2]).toEqual({ slot: 2, idAtuador: 240, descricao: 'Sirene', tipoPorta: 'S' });
    expect(map.atuadores[3]).toEqual({ slot: 3, idAtuador: 254, descricao: 'Trava Bau Traseiro', tipoPorta: 'S' });
    expect(map.atuadores[7]).toEqual({ slot: 7, idAtuador: 232, descricao: 'Buzzer', tipoPorta: 'S' });
    expect(map.atuadores[1]).toBeUndefined();
    expect(map.sensores[3]).toEqual({ slot: 3, idSensor: 231, descricao: 'Violacao Painel', tipoPorta: 'E' });
    expect(map.sensores[4]).toEqual({ slot: 4, idSensor: 247, descricao: 'Sensor Porta Motorista', tipoPorta: 'E' });
  });

  it('getMapeamentoVeiculo aceita veiculos+atuadores pre-carregados (sem HTTP)', async () => {
    const veiculo = {
      idVeiculo: 2248181,
      placa: 'THF0G38',
      idCliente: 202977,
      descricao: 'PRE',
      idEquipamento: 1,
      idEquipamentoDesc: 'MSC830',
      idSensor1: 0, idSensor2: 0, idSensor3: 231, idSensor4: 247,
      idSensor5: 0, idSensor6: 0, idSensor7: 0, idSensor8: 0,
      idAtuador1: 0, idAtuador2: 240, idAtuador3: 254, idAtuador4: 0,
      idAtuador5: 0, idAtuador6: 0, idAtuador7: 232, idAtuador8: 0,
      portaPanico: 9, portaBloqueio: 1, idSerial0: 202, idSerial1: 0,
      satelital: true, telemetria: true
    };
    const atuadores = [
      { idAtuador: 240, descricao: 'Sirene', tipoPorta: 'S' },
      { idAtuador: 254, descricao: 'Trava Bau Traseiro', tipoPorta: 'S' }
    ];

    const map = await client.getMapeamentoVeiculo(2248181, { veiculos: [veiculo], atuadores });
    expect(map.atuadores[2].descricao).toBe('Sirene');
    expect(map.atuadores[3].descricao).toBe('Trava Bau Traseiro');
    expect(map.atuadores[7].descricao).toContain('fora do catálogo');
  });

  it('getMapeamentoVeiculo lança quando veiculo nao existe', async () => {
    await expect(
      client.getMapeamentoVeiculo(99999, { veiculos: [], atuadores: [] })
    ).rejects.toThrow(/não encontrado/);
  });

  it('findAtuador resolve por substring case-insensitive', async () => {
    mockSoapSuccess('obterVeiculos', veiculoXml);
    mockSoapSuccess('obterGrupoAtuadores', atuadoresCatalogoXml);

    const sirene = await client.findAtuador(2248181, 'sirene');
    expect(sirene).toEqual({ slot: 2, idAtuador: 240, descricao: 'Sirene', tipoPorta: 'S' });
  });

  it('findAtuador resolve por slot numerico', async () => {
    mockSoapSuccess('obterVeiculos', veiculoXml);
    mockSoapSuccess('obterGrupoAtuadores', atuadoresCatalogoXml);

    const slot7 = await client.findAtuador(2248181, 7);
    expect(slot7?.descricao).toBe('Buzzer');
  });

  it('findAtuador retorna null quando nao encontra', async () => {
    mockSoapSuccess('obterVeiculos', veiculoXml);
    mockSoapSuccess('obterGrupoAtuadores', atuadoresCatalogoXml);

    const inexistente = await client.findAtuador(2248181, 'inexistente');
    expect(inexistente).toBeNull();
  });

  it('findAtuador resolve "bloqueio" via portaBloqueio (porta dedicada)', async () => {
    mockSoapSuccess('obterVeiculos', veiculoXml);
    mockSoapSuccess('obterGrupoAtuadores', atuadoresCatalogoXml);

    const blq = await client.findAtuador(2248181, 'bloqueio');
    expect(blq).toEqual({
      slot: 1,
      idAtuador: 0,
      descricao: 'Bloqueio (porta dedicada)',
      tipoPorta: 'S'
    });
  });

  it('findAtuador resolve "panico" via portaPanico (porta dedicada)', async () => {
    mockSoapSuccess('obterVeiculos', veiculoXml);
    mockSoapSuccess('obterGrupoAtuadores', atuadoresCatalogoXml);

    const pan = await client.findAtuador(2248181, 'panico');
    expect(pan).toEqual({
      slot: 9,
      idAtuador: 0,
      descricao: 'Pânico (porta dedicada)',
      tipoPorta: 'S'
    });
  });

  it('findAtuador "bloqueio" retorna null quando portaBloqueio=0', async () => {
    const semBloqueio = {
      idVeiculo: 1, placa: 'X', idCliente: 1, descricao: '',
      idEquipamento: 1, idEquipamentoDesc: '',
      idSensor1: 0, idSensor2: 0, idSensor3: 0, idSensor4: 0,
      idSensor5: 0, idSensor6: 0, idSensor7: 0, idSensor8: 0,
      idAtuador1: 0, idAtuador2: 0, idAtuador3: 0, idAtuador4: 0,
      idAtuador5: 0, idAtuador6: 0, idAtuador7: 0, idAtuador8: 0,
      portaPanico: 0, portaBloqueio: 0, idSerial0: 0, idSerial1: 0,
      satelital: false, telemetria: false
    };
    const r = await client.findAtuador(1, 'bloqueio', { veiculos: [semBloqueio], atuadores: [] });
    expect(r).toBeNull();
  });

  it('findAtuador retorna null para string vazia', async () => {
    const veiculo = {
      idVeiculo: 2248181, placa: 'X', idCliente: 1, descricao: '',
      idEquipamento: 1, idEquipamentoDesc: '',
      idSensor1: 0, idSensor2: 0, idSensor3: 0, idSensor4: 0,
      idSensor5: 0, idSensor6: 0, idSensor7: 0, idSensor8: 0,
      idAtuador1: 0, idAtuador2: 0, idAtuador3: 0, idAtuador4: 0,
      idAtuador5: 0, idAtuador6: 0, idAtuador7: 0, idAtuador8: 0,
      portaPanico: 0, portaBloqueio: 0, idSerial0: 0, idSerial1: 0,
      satelital: false, telemetria: false
    };
    const r = await client.findAtuador(2248181, '   ', { veiculos: [veiculo], atuadores: [] });
    expect(r).toBeNull();
  });
});
