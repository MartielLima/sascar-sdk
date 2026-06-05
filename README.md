# Sascar Integra SDK v2.07

SDK completo e fortemente tipado em TypeScript para integração com o Web Service SOAP da **SASCAR (SasIntegra v2.07)**.
Desenvolvido focado em alta performance e segurança de execução no ambiente Node.js / Bun.

## Principais Features

- **Cobertura de 100% da API:** Mapeamento completo dos cerca de 60 métodos disponíveis no manual da SasIntegra, incluindo posições, telemetria (Deltas e Inércia), Comandos, Teclados e Dados Cadastrais.
- **Performance Extrema:** Utiliza a Web API nativa \`fetch\` (sem dependências pesadas de bibliotecas SOAP antigas) e \`fast-xml-parser\` para parsing ágil. *Atenção: Requer Node.js >= 18.0 ou Bun para suporte nativo ao \`fetch\`.*
- **Controle de Concorrência Embutido:** O Manual da Sascar é claro: as requisições de posições são limitadas a **1 consulta simultânea** por integrador. Este SDK possui um controle de fila (*AsyncQueue Mutex*) interno. Você pode disparar `client.obterPacotePosicoesJSON()` em *Promise.all()* livremente que o SDK irá enfileirar por debaixo dos panos, impedindo que a Sascar recuse sua conexão.
- **JSON e TypeScript:** Consumo focado nos métodos da Sascar, provendo tipagem 100% estrita e conversão robusta de XML-to-JSON.

## Instalação e Distribuição

A biblioteca já está empacotada no padrão para ser distribuída. Você pode usá-la instalando localmente ou publicando em um registry.

```bash
# Para instalar as dependências
bun install # ou npm install

# Para buildar (gera a pasta dist/ para Node.js)
bun run build # ou npm run build
```

## Configuração (Variáveis de Ambiente)

A classe `SascarClient` irá inicializar buscando primeiramente as variáveis de ambiente. Defina no seu arquivo `.env`:

```env
SASCAR_USUARIO=seu_login_aqui
SASCAR_SENHA=sua_senha_aqui
```

Alternativamente, você pode repassar as credenciais via construtor:

```typescript
const client = new SascarClient({ usuario: "foo", senha: "bar" });
```

## Exemplos de Uso Focados em Cenários Reais

### 1. Sincronizando toda a Frota do Integrador

```typescript
import { SascarClient } from './sascar-sdk';

async function sincronizarFrota() {
  const client = new SascarClient();
  
  try {
    const frota = await client.obterVeiculosJson();
    console.log(`Foram sincronizados ${frota.length} veículos.`);
  } catch (error) {
    console.error("Falha ao sincronizar", error);
  }
}
```

### 2. Consumindo Telemetria (Freadas, Consumo, etc)

O SDK permite acesso facilitado aos dados ricos de telemetria da Sascar.

```typescript
import { SascarClient } from './sascar-sdk';

async function obterTelemetria(idVeiculo: number) {
  const client = new SascarClient();
  const hoje = '2023-10-10 00:00:00';
  const fim = '2023-10-10 23:59:59';
  
  const deltas = await client.obterDeltaTelemetriaIntegracaoInercia(hoje, fim, idVeiculo);

  for (const delta of deltas) {
      console.log(\`Consumo: \${delta.consumoCombustivel} ml\`);
      console.log(\`Freada brusca (\${delta.tipoDelta}): \${delta.distPercorridaDescendenteFxPerigo} km\`);
  }
}
```

### 3. Posições Massivas e Fila de Concorrência

Não se preocupe com o limite de 1 requisição concorrente da SASCAR. O \`AsyncQueue\` do SDK trava as requisições extras e as enfileira:

```typescript
import { SascarClient } from './sascar-sdk';

async function lerPosicoesMultiplas() {
  const client = new SascarClient();
  
  const [lote1, lote2] = await Promise.all([
     client.obterPacotePosicoesJSON(3000), // Método sujeito a trava
     client.obterPacotePosicaoMotoristaPorRangeJSON(100, 500, 3000) // Também sujeito a trava, vai aguardar o anterior terminar!
  ]);

  console.log(\`Total de pacotes: \${lote1.length + lote2.length}\`);
}
```

### 4. Gestão da Jornada do Motorista

```typescript
import { SascarClient } from './sascar-sdk';

async function obterJornada() {
  const client = new SascarClient();
  const eventos = await client.obterEventosTempoDirecao();
  
  eventos.forEach(ev => {
      console.log(\`Motorista: \${ev.nomeMotorista} | Status Atual: \${ev.descricaoEventoTempoDirecao}\`);
  });
}
```

## Como rodar os testes

Desenvolvido em ambiente `Jest` garantindo 100% de cobertura do código e simulação (mock) do webservice SOAP da SASCAR (evitando sobrecargas).

```bash
bun run test
bun run test:coverage
```
