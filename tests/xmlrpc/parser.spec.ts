import { parseMethodResponse, parseMethodFault } from '../../src/xmlrpc/parser';
import { SascarXmlRpcError } from '../../src/xmlrpc/errors';
import * as fs from 'fs';
import * as path from 'path';

const FIXTURES = path.resolve(__dirname, '../__fixtures__/xmlrpc');
const read = (f: string) => fs.readFileSync(path.join(FIXTURES, f), 'utf-8');

describe('parseMethodResponse', () => {
  it('extrai ticketServidor de uma resposta de sucesso', () => {
    const r = parseMethodResponse(read('bloqueio-success.xml'));
    expect(r.ticketServidor).toBe('99999');
  });

  it('extrai array de structs para listar_comandos', () => {
    const r = parseMethodResponse(read('listar-comandos.xml'));
    expect(r.comandos).toHaveLength(1);
    expect(r.comandos[0]).toMatchObject({
      methodName: 'bloqueio',
      status: 1,
      statusDescricao: 'COMANDO_EXECUTADO',
      ticketServidor: '12345'
    });
  });

  it('extrai senha quando presente (gerar_contra_senha)', () => {
    const xml = `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>ticketServidor</name><value><string>1</string></value></member>
  <member><name>senha</name><value><string>123456</string></value></member>
</struct></value></param></params></methodResponse>`;
    const r = parseMethodResponse(xml);
    expect(r.senha).toBe('123456');
  });

  it('extrai mapa de mensagens (inicializar_operacao recusado)', () => {
    const xml = `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>ticketServidor</name><value><string>2</string></value></member>
  <member><name>mensagens</name><value><struct>
    <member><name>AAA1111</name><value><string>Veiculo nao pertence a gerenciadora</string></value></member>
  </struct></value></member>
</struct></value></param></params></methodResponse>`;
    const r = parseMethodResponse(xml);
    expect(r.mensagens.AAA1111).toContain('gerenciadora');
  });

  it('extrai idVeiculo/dataPosicao/lat/long para posicao()', () => {
    const xml = `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>idVeiculo</name><value><string>THF0G38</string></value></member>
  <member><name>dataPosicao</name><value><string>2026-06-17 12:00:00</string></value></member>
  <member><name>dataPacote</name><value><string>2026-06-17 12:00:00</string></value></member>
  <member><name>latitude</name><value><double>-23.5</double></value></member>
  <member><name>longitude</name><value><double>-46.6</double></value></member>
  <member><name>direcao</name><value><int>4</int></value></member>
  <member><name>velocidade</name><value><int>80</int></value></member>
  <member><name>ignicao</name><value><int>1</int></value></member>
  <member><name>saida1</name><value><int>240</int></value></member>
</struct></value></param></params></methodResponse>`;
    const p = parseMethodResponse(xml);
    expect(p.posicao).toMatchObject({
      idVeiculo: 'THF0G38',
      dataPosicao: '2026-06-17 12:00:00',
      dataPacote: '2026-06-17 12:00:00',
      latitude: -23.5,
      longitude: -46.6,
      direcao: 4,
      velocidade: 80,
      ignicao: 1
    });
    expect(p.posicao?.extras.saida1).toBe(240);
  });

  it('lança SascarXmlRpcError se a resposta contém <fault>', () => {
    expect(() => parseMethodResponse(read('fault.xml'))).toThrow(SascarXmlRpcError);
  });

  it('retorna ticketServidor null quando ausente', () => {
    const xml = `<?xml version="1.0"?>
<methodResponse><params><param><value><struct>
  <member><name>outro</name><value><int>1</int></value></member>
</struct></value></param></params></methodResponse>`;
    const r = parseMethodResponse(xml);
    expect(r.ticketServidor).toBeNull();
  });
});

describe('parseMethodFault', () => {
  it('lança SascarXmlRpcError ao detectar <fault>', () => {
    expect(() => parseMethodFault(read('fault.xml'))).toThrow(SascarXmlRpcError);
  });

  it('não lança quando resposta é válida', () => {
    expect(() => parseMethodFault(read('bloqueio-success.xml'))).not.toThrow();
  });
});
