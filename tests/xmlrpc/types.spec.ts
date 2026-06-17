import type {
  XmlRpcCommandResult,
  XmlRpcOperacaoResult,
  XmlRpcPosicaoResult,
  XmlRpcSenhaResult,
  ComandoEnviado,
  ComandoStatus,
  ComandoStatusFinal
} from '../../src/xmlrpc/types';

describe('xmlrpc types - shape compile-time', () => {
  it('XmlRpcCommandResult aceita os campos obrigatórios', () => {
    const r: XmlRpcCommandResult = {
      resultados: { 2248181: '1' },
      ticketServidor: 12345,
      placasProcessadas: ['ABC1D23']
    };
    expect(r.ticketServidor).toBe(12345);
    expect(r.resultados[2248181]).toBe('1');
  });

  it('XmlRpcOperacaoResult estende CommandResult com mensagens', () => {
    const r: XmlRpcOperacaoResult = {
      resultados: { 1: '2' },
      ticketServidor: 99,
      placasProcessadas: ['AAA1111'],
      mensagens: { AAA1111: 'Veiculo nao pertence a gerenciadora' }
    };
    expect(r.mensagens.AAA1111).toContain('gerenciadora');
  });

  it('XmlRpcPosicaoResult aceita campos variáveis em extras', () => {
    const r: XmlRpcPosicaoResult = {
      idVeiculo: 2248181,
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

  it('XmlRpcSenhaResult estende CommandResult com senha', () => {
    const r: XmlRpcSenhaResult = {
      resultados: {},
      ticketServidor: 0,
      placasProcessadas: [],
      senha: '123456'
    };
    expect(r.senha).toHaveLength(6);
  });

  it('ComandoEnviado tem todos os campos', () => {
    const c: ComandoEnviado = {
      dataEnvio: '06/17/2026 12:00',
      methodName: 'bloqueio',
      parametros: { placa: 'ABC1D23' },
      status: 1,
      statusDescricao: 'COMANDO_EXECUTADO',
      ticketServidor: 999
    };
    expect(c.statusDescricao).toBe('COMANDO_EXECUTADO');
  });

  it('ComandoStatus permite mensagem opcional', () => {
    const s: ComandoStatus = {
      ticket: 1,
      dataExecucao: '06/17/2026 12:00',
      status: 2,
      statusDescricao: 'COMANDO_RECUSADO',
      mensagem: 'falhou'
    };
    expect(s.mensagem).toBe('falhou');
  });

  it('ComandoStatusFinal aceita apenas status 1 ou 2', () => {
    const ok: ComandoStatusFinal = {
      ticket: 1,
      status: 1,
      statusDescricao: 'COMANDO_EXECUTADO',
      tentativas: 3,
      duracaoMs: 5500
    };
    expect(ok.status).toBe(1);

    const fail: ComandoStatusFinal = {
      ticket: 1,
      status: 2,
      statusDescricao: 'COMANDO_RECUSADO',
      tentativas: 5,
      duracaoMs: 15000
    };
    expect(fail.status).toBe(2);
  });
});
