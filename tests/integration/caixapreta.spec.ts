import nock from 'nock';
import { SascarClient } from '../../src/client';
import { makeClient, mockSoapSuccess } from './_helpers';

describe('Caixa Preta (integration)', () => {
  let client: SascarClient;

  beforeEach(() => {
    client = makeClient();
  });

  afterEach(() => nock.cleanAll());

  it('solicitarEventosCaixaPreta envia params opcionais', async () => {
    const scope = mockSoapSuccess('solicitarEventosCaixaPreta', '<return><protocolo>P123</protocolo></return>');
    expect(await client.solicitarEventosCaixaPreta(5, 'ABC1D23', '2023-10-01', '2023-10-02')).toMatchObject([
      { protocolo: 'P123' }
    ]);
    expect(scope.isDone()).toBe(true);
  });

  it('recuperarEventosCaixaPreta envia params opcionais', async () => {
    const scope = mockSoapSuccess('recuperarEventosCaixaPreta', '<return><dataEvento>2023-10-01</dataEvento></return>');
    expect(await client.recuperarEventosCaixaPreta(5, 'ABC1D23', '2023-10-01')).toMatchObject([
      { dataEvento: '2023-10-01' }
    ]);
    expect(scope.isDone()).toBe(true);
  });
});
