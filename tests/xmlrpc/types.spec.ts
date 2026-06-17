import type {
  SascarXmlRpcCommandResult,
  SascarXmlRpcOperacaoResult,
  SascarXmlRpcPosicaoResult,
  SascarXmlRpcSenhaResult,
  SascarComandoEnviado,
  SascarComandoStatus,
  SascarComandoStatusFinal
} from '../../src/xmlrpc/types';

describe('xmlrpc types - shape compile-time', () => {
  it('SascarXmlRpcCommandResult aceita os campos obrigatórios', () => {
    const r: SascarXmlRpcCommandResult = {
      ticketServidor: '12132678',
      ticketCliente: 12345
    };
    expect(r.ticketServidor).toBe('12132678');
    expect(r.ticketCliente).toBe(12345);
  });

  it('SascarXmlRpcOperacaoResult estende CommandResult com mensagens', () => {
    const r: SascarXmlRpcOperacaoResult = {
      ticketServidor: '999',
      ticketCliente: 1,
      mensagens: { AAA1111: 'Veiculo nao pertence a gerenciadora' }
    };
    expect(r.mensagens.AAA1111).toContain('gerenciadora');
  });

  it('SascarXmlRpcPosicaoResult aceita campos variáveis em extras', () => {
    const r: SascarXmlRpcPosicaoResult = {
      idVeiculo: 'THF0G38',
      dataPosicao: '2026-06-17 12:00:00',
      dataPacote: '2026-06-17 12:00:00',
      latitude: -23.5,
      longitude: -46.6,
      direcao: 4,
      velocidade: 80,
      ignicao: 1,
      extras: { saida1: 240, tensao: 24 }
    };
    expect(r.extras.saida1).toBe(240);
  });

  it('SascarXmlRpcSenhaResult tem senha e ticketCliente', () => {
    const r: SascarXmlRpcSenhaResult = {
      senha: '123456',
      ticketCliente: 999
    };
    expect(r.senha).toHaveLength(6);
  });

  it('SascarComandoEnviado tem todos os campos', () => {
    const c: SascarComandoEnviado = {
      dataEnvio: '06/17/2026 12:00',
      methodName: 'bloqueio',
      parametros: { placa: 'THF0G38' },
      status: 1,
      statusDescricao: 'COMANDO_EXECUTADO',
      ticketServidor: '12132678'
    };
    expect(c.statusDescricao).toBe('COMANDO_EXECUTADO');
  });

  it('SascarComandoStatus permite mensagem opcional', () => {
    const s: SascarComandoStatus = {
      ticket: '12132678',
      dataExecucao: '06/17/2026 12:00',
      status: 2,
      statusDescricao: 'COMANDO_RECUSADO',
      mensagem: 'falhou'
    };
    expect(s.mensagem).toBe('falhou');
  });

  it('SascarComandoStatusFinal aceita apenas status 1 ou 2', () => {
    const ok: SascarComandoStatusFinal = {
      ticket: '12132678',
      status: 1,
      statusDescricao: 'COMANDO_EXECUTADO',
      tentativas: 3,
      duracaoMs: 5500
    };
    expect(ok.status).toBe(1);

    const fail: SascarComandoStatusFinal = {
      ticket: '12132678',
      status: 2,
      statusDescricao: 'COMANDO_RECUSADO',
      tentativas: 5,
      duracaoMs: 15000
    };
    expect(fail.status).toBe(2);
  });
});
