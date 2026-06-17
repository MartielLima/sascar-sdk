# 🚛 Sascar Integra SDK v2.07 — TypeScript

SDK corporativo em TypeScript para integração com o Web Service SOAP da **SASCAR / Michelin ConnectedFleet (SasIntegra v2.07)**.
Este documento lista **100% dos métodos e atributos** que podem ser consumidos da API através desta biblioteca.

> **Status:** SDK auditado em 2026-06-09. Cobertura 100% do manual SasIntegra v2.07 (seções 4.1–4.63). 94 testes, 0 `any` em produção, erros tipados, timeout, retry, transport isolado.

## Instalação

```bash
npm install github:MartielLima/sascar-sdk
# ou
bun add github:MartielLima/sascar-sdk
```

## Uso Básico

```typescript
import { SascarClient } from 'sascar-sdk';

// Opção 1: credenciais explícitas
const client = new SascarClient({ usuario: 'seu_usuario', senha: 'sua_senha' });

// Opção 2: variáveis de ambiente SASCAR_USUARIO e SASCAR_SENHA (recomendado)
const client = new SascarClient();
```

### Opções avançadas (timeout, retry, URL customizada)

```typescript
import { SascarClient } from 'sascar-sdk';

const client = new SascarClient(
  { usuario: 'seu_usuario', senha: 'sua_senha' },
  {
    timeoutMs: 30_000, // default; timeout por requisição HTTP
    maxRetries: 3, // default; retry em 5xx e erros de rede
    wsdlUrl: 'https://sasintegra.sascar.com.br/SasIntegra/SasIntegraWSService'
  }
);
```

### Tratamento de erros tipados

```typescript
import {
  SascarApiError,
  SascarAuthError,
  SascarConnectionError,
  SascarRateLimitError,
  SascarTimeoutError
} from 'sascar-sdk';

try {
  const veiculos = await client.obterVeiculos();
} catch (err) {
  if (err instanceof SascarAuthError) {
    console.error('Credenciais inválidas:', err.statusCode);
  } else if (err instanceof SascarRateLimitError) {
    console.error('Rate limit. Aguarde antes de tentar de novo.');
  } else if (err instanceof SascarTimeoutError) {
    console.error(`Timeout após ${err.timeoutMs}ms`);
  } else if (err instanceof SascarConnectionError) {
    console.error('Erro de rede:', err.message);
  } else if (err instanceof SascarApiError) {
    console.error('SOAP Fault:', err.fault?.faultstring, err.fault?.faultcode);
  } else {
    throw err;
  }
}
```

### Variáveis de ambiente

```bash
# .env
SASCAR_USUARIO=seu_usuario
SASCAR_SENHA=sua_senha
```

Veja `.env.example` no repositório.

---

## 📚 Referência Completa da API

Abaixo estão listados todos os `74` métodos suportados pelo SDK (63 do manual SasIntegra v2.07 + 11 descobertos no WSDL ao vivo + 2 helpers de mapeamento).
_Clique no nome do método para expandir e visualizar todos os atributos de retorno e o exemplo de código._

### 🛠️ Cadastros e Entidades

<details>
<summary><code><b>atualizarSenha(senhaAtual: string, novaSenha: string)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.atualizarSenha(null, null);
console.log(resultado);
```

**Retorno Esperado:** `string[]` (Array de strings)

</details>

<details>
<summary><code><b>obterAlertasAVDVinculados(veiplaca?: string, veioid?: string)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterAlertasAVDVinculados('ABC1D23', null);
console.log(resultado);
```

**Retorno Esperado (`T.AlertaAVD[]`):**

```typescript
interface AlertaAVD {
  acoes: string;
  idAlerta: string;
  login: string;
  nomeAlerta: string;
}
```

</details>

<details>
<summary><code><b>obterGrupoAtuadores()</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterGrupoAtuadores();
console.log(resultado);
```

**Retorno Esperado (`T.GrupoAtuador[]`):**

```typescript
interface GrupoAtuador {
  idAtuador: number;
  descricao: string;
  tipoPorta: string;
}
```

</details>

<details>
<summary><code><b>obterCadastroAlertasAVD(dataInicio?: string)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterCadastroAlertasAVD('2023-10-01 00:00:00');
console.log(resultado);
```

**Retorno Esperado (`T.CadastroAlertaAVD[]`):**

```typescript
interface CadastroAlertaAVD {
  evento: string;
  id: string;
  login: string;
  timezone: string;
}
```

</details>

<details>
<summary><code><b>obterClientes(quantidade = 1000, idCliente?: number)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterClientes(100, null);
console.log(resultado);
```

**Retorno Esperado (`T.Cliente[]`):**

```typescript
interface Cliente {
  idCliente: number;
  nome: string;
  cpf?: number;
  cnpj?: number | string;
}
```

</details>

<details>
<summary><code><b>obterClientesV2(quantidade = 1000, idCliente?: number)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterClientesV2(100, null);
console.log(resultado);
```

**Retorno Esperado (`T.ClienteV2[]`):**

```typescript
interface ClienteV2 {
  cnpj: string;
  cpf: string;
  idCliente: number;
  nome: string;
}
```

</details>

<details>
<summary><code><b>obterVeiculos(quantidade = 1000, idVeiculo?: number)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterVeiculos(100, 12345);
console.log(resultado);
```

**Retorno Esperado (`T.Veiculo[]`):**

```typescript
interface Veiculo {
  idVeiculo: number;
  placa: string;
  idCliente: number;
  descricao: string;
  idEquipamento: number;
  idEquipamentoDesc: string;
  idSensor1: number;
  idSensor2: number;
  idSensor3: number;
  idSensor4: number;
  idAtuador1: number;
  idAtuador2: number;
  idAtuador3: number;
  idAtuador4: number;
  portaPanico: number;
  portaBloqueio: number;
  idSerial0: number;
  idSerial1: number | null;
  satelital: boolean;
  idSensor5: number;
  idSensor6: number;
  idSensor7: number;
  idSensor8: number;
  idAtuador5: number;
  idAtuador6: number;
  idAtuador7: number;
  idAtuador8: number;
  esn?: string | null;
  idProjeto?: number | null;
  telemetria: boolean;
}
```

</details>

<details>
<summary><code><b>obterVeiculosJson(quantidade = 1000, startIdVeiculo = 0)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterVeiculosJson(100, null);
console.log(resultado);
```

**Retorno Esperado (`T.Veiculo[]`):**

```typescript
interface Veiculo {
  idVeiculo: number;
  placa: string;
  idCliente: number;
  descricao: string;
  idEquipamento: number;
  idEquipamentoDesc: string;
  idSensor1: number;
  idSensor2: number;
  idSensor3: number;
  idSensor4: number;
  idAtuador1: number;
  idAtuador2: number;
  idAtuador3: number;
  idAtuador4: number;
  portaPanico: number;
  portaBloqueio: number;
  idSerial0: number;
  idSerial1: number | null;
  satelital: boolean;
  idSensor5: number;
  idSensor6: number;
  idSensor7: number;
  idSensor8: number;
  idAtuador5: number;
  idAtuador6: number;
  idAtuador7: number;
  idAtuador8: number;
  esn?: string | null;
  idProjeto?: number | null;
  telemetria: boolean;
}
```

</details>

<details>
<summary><code><b>obterVeiculosRFNacional(quantidade = 1000, idVeiculo?: number)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterVeiculosRFNacional(100, 12345);
console.log(resultado);
```

**Retorno Esperado (`T.VeiculoRFNacional[]`):**

```typescript
interface VeiculoRFNacional {
  ccid: string;
  descricao: string;
  idCliente: number;
  idVeiculo: number;
  placa: string;
  satelital: boolean;
  telemetria: boolean;
}
```

</details>

<details>
<summary><code><b>obterDadosAdicionais(idVeiculo?: number)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterDadosAdicionais(12345);
console.log(resultado);
```

**Retorno Esperado (`T.DadosAdicionais[]`):**

```typescript
interface DadosAdicionais {
  dataAlteracao: string;
  descricaoDois: string;
  descricaoUm: string;
  frota: string;
  grupo: string;
  idCliente: number;
  idVeiculo: number;
  notaDois: string;
  notaUm: string;
  placa: string;
}
```

</details>

<details>
<summary><code><b>obterDadosAdicionaisCliente(idVeiculo?: number)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterDadosAdicionaisCliente(12345);
console.log(resultado);
```

**Retorno Esperado (`T.DadosAdicionais[]`):**

```typescript
interface DadosAdicionais {
  dataAlteracao: string;
  descricaoDois: string;
  descricaoUm: string;
  frota: string;
  grupo: string;
  idCliente: number;
  idVeiculo: number;
  notaDois: string;
  notaUm: string;
  placa: string;
}
```

</details>

<details>
<summary><code><b>obterPontosReferencia()</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPontosReferencia();
console.log(resultado);
```

**Retorno Esperado (`T.PontoReferencia[]`):**

```typescript
interface PontoReferencia {
  IdPontoReferencia: number;
  codigo: string;
  descricao: string;
  latitudes: number;
  longitudes: number;
  latitudei: number;
  longitudei: number;
  endereco: string;
  data: string;
  nome: string;
}
```

</details>

<details>
<summary><code><b>obterSequenciamentoEvento()</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterSequenciamentoEvento();
console.log(resultado);
```

**Retorno Esperado (`T.SequenciamentoEvento[]`):**

```typescript
interface SequenciamentoEvento {
  idSequenciamentoEvento: number;
  atuador: number;
  descricao: string;
}
```

</details>

<details>
<summary><code><b>obterMotoristas(quantidade = 1000, idMotorista?: number)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterMotoristas(100, 12345);
console.log(resultado);
```

**Retorno Esperado (`T.Motorista[]`):**

```typescript
interface Motorista {
  idMotorista: number;
  nome: string;
  tipoMotorista: string;
  dataContratacao: string;
  tipoDocumento: string;
  numeroDocumento: string;
  tipoCNH: string;
  vencimentoCNH: string;
  telefone: string;
  celular: string;
  login: string;
  senha?: string;
  generico: boolean;
}
```

</details>

<details>
<summary><code><b>obterMotoristasVeiculos(quantidade = 1000, idMotoristaVeiculo?: number)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterMotoristasVeiculos(100, 12345);
console.log(resultado);
```

**Retorno Esperado (`T.MotoristaVeiculo[]`):**

```typescript
interface MotoristaVeiculo {
  idMotoristaVeiculo: number;
  idMotorista: number;
  idVeiculo: string;
}
```

</details>

<details>
<summary><code><b>obterLayoutTecladoVeiculos()</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterLayoutTecladoVeiculos();
console.log(resultado);
```

**Retorno Esperado (`T.LayoutTecladoVeiculo[]`):**

```typescript
interface LayoutTecladoVeiculo {
  idVeiculo: number;
  idLayout: number;
  tipoLayout: string;
}
```

</details>

<details>
<summary><code><b>obterLayoutGrupoPontos()</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterLayoutGrupoPontos();
console.log(resultado);
```

**Retorno Esperado (`T.LayoutGrupoPonto[]`):**

```typescript
interface LayoutGrupoPonto {
  idLayoutGrupoPonto: number;
  nome: string;
}
```

</details>

<details>
<summary><code><b>obterRotas(data?: string)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterRotas('2023-10-01 00:00:00');
console.log(resultado);
```

**Retorno Esperado (`T.Rota[]`):**

```typescript
interface Rota {
  Login: string;
  Id: string;
  NomeRota: string;
}
```

</details>

<details>
<summary><code><b>obterEnderecoPosicao(latitude: string, longitude: string)</b></code></summary>

Reverse geocoding: a partir de coordenadas lat/long, retorna o endereço correspondente (rua, cidade, UF).

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterEnderecoPosicao('-23.5', '-46.6');
console.log(resultado);
```

**Retorno Esperado (`T.EnderecoPosicao[]`):**

```typescript
interface EnderecoPosicao {
  cidade: string;
  Rua: string;
  uf: string;
}
```

</details>

</details>

### 📍 Posições e Rastreamento

<details>
<summary><code><b>obterPacotePosicoes(quantidade = 3000)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPacotePosicoes(100);
console.log(resultado);
```

**Retorno Esperado (`T.PacotePosicaoXML[]`):**

```typescript
interface PacotePosicaoXML {
  idVeiculo: number;
  idPacote: number;
  dataPosicao: string;
  dataPacote: string;
  latitude: number;
  longitude: number;
  direcao: number;
  velocidade: number;
  ignicao: number;
  horimetro: number;
  odometro: number;
  tensao: number;
  saida1: number;
  saida2: number;
  saida3: number;
  saida4: number;
  entrada1: number;
  entrada2: number;
  entrada3: number;
  entrada4: number;
  satelite: number;
  memoria: number;
  idReferencia: number;
  bloqueio: number;
  gps: number;
  uf: string;
  cidade: string;
  rua: string;
  pontoReferencia: string;
  anguloReferencia: number;
  distanciaReferencia: number;
  rpm: number;
  temperatura1: number;
  temperatura2: number;
  temperatura3: number;
  saida5?: number;
  saida6?: number;
  saida7?: number;
  saida8?: number;
  entrada5?: number;
  entrada6?: number;
  entrada7?: number;
  entrada8?: number;
  pontoEntrada?: number;
  pontoSaida?: number;
  codigoMacro?: number;
  conteudoMensagem?: string;
  textoMensagem?: string;
  tipoTeclado?: number;
  eventoSequenciamento?: any[];
  evento?: any[];
  jamming?: number;
  statusAncora?: number;
  idMotorista?: number;
  nomeMotorista?: string;
  nivelCombustivel?: number;
  litrometro?: number;
  estadoLimpadorParabrisa?: number;
  eventosTelemetria?: any[];
  acessorios?: any;
  placa?: string;
  integradoraId?: number;
  nomeMensagem?: string;
  eventoFormatado?: string;
  eventoSeqFormatado?: string;
  temperaturaSerial?: number;
  umidadeSerial?: number;
}
```

</details>

<details>
<summary><code><b>obterPacotePosicoesJSON(quantidade = 3000)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPacotePosicoesJSON(100);
console.log(resultado);
```

**Retorno Esperado (`T.PacotePosicaoJSON[]`):**

```typescript
interface PacotePosicaoJSON {
  idVeiculo: number;
  dataPosicao: string;
  dataPacote: string;
  latitude: number;
  longitude: number;
  direcao: number;
  velocidade: number;
  ignicao: number;
  odometro: number;
  horimetro: number;
  tensao: number;
  saida1: number;
  saida2: number;
  saida3: number;
  saida4: number;
  entrada1: number;
  entrada2: number;
  entrada3: number;
  entrada4: number;
  satelite: number;
  memoria: number;
  idReferencia: number;
  bloqueio: number;
  gps: number;
  uf: string;
  cidade: string;
  rua: string;
  pais: string;
  pontoReferencia: string;
  anguloReferencia: number;
  distanciaReferencia: number;
  rpm: number;
  temperatura1: number;
  temperatura2: number;
  temperatura3: number;
  saida5: number;
  saida6: number;
  saida7: number;
  saida8: number;
  entrada5: number;
  entrada6: number;
  entrada7: number;
  entrada8: number;
  pontoEntrada: number;
  pontoSaida: number;
  codigoMacro: number;
  nomeMensagem: string;
  conteudoMensagem: string;
  textoMensagem: string;
  tipoTeclado: number;
  eventoSequenciamento: any[];
  eventos: { codigo: number }[];
  jamming: number;
  statusAncora: number;
  idPacote: number;
  integradoraId: number;
  idMotorista: number;
  nomeMotorista: string;
  nivelCombustivel: string;
  litrometro: string;
  estadoLimpadorParabrisa: number | null;
  umidadeSerial: number;
  temperaturaSerial: number;
  odometroExato?: number;
  eventosTelemetria?: any[];
  placa?: string;
}
```

</details>

<details>
<summary><code><b>obterPacotePosicoesMotorista(quantidade = 3000)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPacotePosicoesMotorista(100);
console.log(resultado);
```

**Retorno Esperado (`T.PacotePosicaoXML[]`):**

```typescript
interface PacotePosicaoXML {
  idVeiculo: number;
  idPacote: number;
  dataPosicao: string;
  dataPacote: string;
  latitude: number;
  longitude: number;
  direcao: number;
  velocidade: number;
  ignicao: number;
  horimetro: number;
  odometro: number;
  tensao: number;
  saida1: number;
  saida2: number;
  saida3: number;
  saida4: number;
  entrada1: number;
  entrada2: number;
  entrada3: number;
  entrada4: number;
  satelite: number;
  memoria: number;
  idReferencia: number;
  bloqueio: number;
  gps: number;
  uf: string;
  cidade: string;
  rua: string;
  pontoReferencia: string;
  anguloReferencia: number;
  distanciaReferencia: number;
  rpm: number;
  temperatura1: number;
  temperatura2: number;
  temperatura3: number;
  saida5?: number;
  saida6?: number;
  saida7?: number;
  saida8?: number;
  entrada5?: number;
  entrada6?: number;
  entrada7?: number;
  entrada8?: number;
  pontoEntrada?: number;
  pontoSaida?: number;
  codigoMacro?: number;
  conteudoMensagem?: string;
  textoMensagem?: string;
  tipoTeclado?: number;
  eventoSequenciamento?: any[];
  evento?: any[];
  jamming?: number;
  statusAncora?: number;
  idMotorista?: number;
  nomeMotorista?: string;
  nivelCombustivel?: number;
  litrometro?: number;
  estadoLimpadorParabrisa?: number;
  eventosTelemetria?: any[];
  acessorios?: any;
  placa?: string;
  integradoraId?: number;
  nomeMensagem?: string;
  eventoFormatado?: string;
  eventoSeqFormatado?: string;
  temperaturaSerial?: number;
  umidadeSerial?: number;
}
```

</details>

<details>
<summary><code><b>obterPacotePosicoesMotoristaJSON(quantidade = 3000)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPacotePosicoesMotoristaJSON(100);
console.log(resultado);
```

**Retorno Esperado (`T.PacotePosicaoJSON[]`):**

```typescript
interface PacotePosicaoJSON {
  idVeiculo: number;
  dataPosicao: string;
  dataPacote: string;
  latitude: number;
  longitude: number;
  direcao: number;
  velocidade: number;
  ignicao: number;
  odometro: number;
  horimetro: number;
  tensao: number;
  saida1: number;
  saida2: number;
  saida3: number;
  saida4: number;
  entrada1: number;
  entrada2: number;
  entrada3: number;
  entrada4: number;
  satelite: number;
  memoria: number;
  idReferencia: number;
  bloqueio: number;
  gps: number;
  uf: string;
  cidade: string;
  rua: string;
  pais: string;
  pontoReferencia: string;
  anguloReferencia: number;
  distanciaReferencia: number;
  rpm: number;
  temperatura1: number;
  temperatura2: number;
  temperatura3: number;
  saida5: number;
  saida6: number;
  saida7: number;
  saida8: number;
  entrada5: number;
  entrada6: number;
  entrada7: number;
  entrada8: number;
  pontoEntrada: number;
  pontoSaida: number;
  codigoMacro: number;
  nomeMensagem: string;
  conteudoMensagem: string;
  textoMensagem: string;
  tipoTeclado: number;
  eventoSequenciamento: any[];
  eventos: { codigo: number }[];
  jamming: number;
  statusAncora: number;
  idPacote: number;
  integradoraId: number;
  idMotorista: number;
  nomeMotorista: string;
  nivelCombustivel: string;
  litrometro: string;
  estadoLimpadorParabrisa: number | null;
  umidadeSerial: number;
  temperaturaSerial: number;
  odometroExato?: number;
  eventosTelemetria?: any[];
  placa?: string;
}
```

</details>

<details>
<summary><code><b>obterPacotePosicoesMotoristaComPlaca(quantidade = 3000)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPacotePosicoesMotoristaComPlaca(100);
console.log(resultado);
```

**Retorno Esperado (`T.PacotePosicaoXML[]`):**

```typescript
interface PacotePosicaoXML {
  idVeiculo: number;
  idPacote: number;
  dataPosicao: string;
  dataPacote: string;
  latitude: number;
  longitude: number;
  direcao: number;
  velocidade: number;
  ignicao: number;
  horimetro: number;
  odometro: number;
  tensao: number;
  saida1: number;
  saida2: number;
  saida3: number;
  saida4: number;
  entrada1: number;
  entrada2: number;
  entrada3: number;
  entrada4: number;
  satelite: number;
  memoria: number;
  idReferencia: number;
  bloqueio: number;
  gps: number;
  uf: string;
  cidade: string;
  rua: string;
  pontoReferencia: string;
  anguloReferencia: number;
  distanciaReferencia: number;
  rpm: number;
  temperatura1: number;
  temperatura2: number;
  temperatura3: number;
  saida5?: number;
  saida6?: number;
  saida7?: number;
  saida8?: number;
  entrada5?: number;
  entrada6?: number;
  entrada7?: number;
  entrada8?: number;
  pontoEntrada?: number;
  pontoSaida?: number;
  codigoMacro?: number;
  conteudoMensagem?: string;
  textoMensagem?: string;
  tipoTeclado?: number;
  eventoSequenciamento?: any[];
  evento?: any[];
  jamming?: number;
  statusAncora?: number;
  idMotorista?: number;
  nomeMotorista?: string;
  nivelCombustivel?: number;
  litrometro?: number;
  estadoLimpadorParabrisa?: number;
  eventosTelemetria?: any[];
  acessorios?: any;
  placa?: string;
  integradoraId?: number;
  nomeMensagem?: string;
  eventoFormatado?: string;
  eventoSeqFormatado?: string;
  temperaturaSerial?: number;
  umidadeSerial?: number;
}
```

</details>

<details>
<summary><code><b>obterPacotePosicoesJSONComPlaca(quantidade = 3000)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPacotePosicoesJSONComPlaca(100);
console.log(resultado);
```

**Retorno Esperado (`T.PacotePosicaoJSON[]`):**

```typescript
interface PacotePosicaoJSON {
  idVeiculo: number;
  dataPosicao: string;
  dataPacote: string;
  latitude: number;
  longitude: number;
  direcao: number;
  velocidade: number;
  ignicao: number;
  odometro: number;
  horimetro: number;
  tensao: number;
  saida1: number;
  saida2: number;
  saida3: number;
  saida4: number;
  entrada1: number;
  entrada2: number;
  entrada3: number;
  entrada4: number;
  satelite: number;
  memoria: number;
  idReferencia: number;
  bloqueio: number;
  gps: number;
  uf: string;
  cidade: string;
  rua: string;
  pais: string;
  pontoReferencia: string;
  anguloReferencia: number;
  distanciaReferencia: number;
  rpm: number;
  temperatura1: number;
  temperatura2: number;
  temperatura3: number;
  saida5: number;
  saida6: number;
  saida7: number;
  saida8: number;
  entrada5: number;
  entrada6: number;
  entrada7: number;
  entrada8: number;
  pontoEntrada: number;
  pontoSaida: number;
  codigoMacro: number;
  nomeMensagem: string;
  conteudoMensagem: string;
  textoMensagem: string;
  tipoTeclado: number;
  eventoSequenciamento: any[];
  eventos: { codigo: number }[];
  jamming: number;
  statusAncora: number;
  idPacote: number;
  integradoraId: number;
  idMotorista: number;
  nomeMotorista: string;
  nivelCombustivel: string;
  litrometro: string;
  estadoLimpadorParabrisa: number | null;
  umidadeSerial: number;
  temperaturaSerial: number;
  odometroExato?: number;
  eventosTelemetria?: any[];
  placa?: string;
}
```

</details>

<details>
<summary><code><b>obterPacotePosicoesRestricao(quantidade = 300)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPacotePosicoesRestricao(100);
console.log(resultado);
```

**Retorno Esperado (`T.PacotePosicaoXML[]`):**

```typescript
interface PacotePosicaoXML {
  idVeiculo: number;
  idPacote: number;
  dataPosicao: string;
  dataPacote: string;
  latitude: number;
  longitude: number;
  direcao: number;
  velocidade: number;
  ignicao: number;
  horimetro: number;
  odometro: number;
  tensao: number;
  saida1: number;
  saida2: number;
  saida3: number;
  saida4: number;
  entrada1: number;
  entrada2: number;
  entrada3: number;
  entrada4: number;
  satelite: number;
  memoria: number;
  idReferencia: number;
  bloqueio: number;
  gps: number;
  uf: string;
  cidade: string;
  rua: string;
  pontoReferencia: string;
  anguloReferencia: number;
  distanciaReferencia: number;
  rpm: number;
  temperatura1: number;
  temperatura2: number;
  temperatura3: number;
  saida5?: number;
  saida6?: number;
  saida7?: number;
  saida8?: number;
  entrada5?: number;
  entrada6?: number;
  entrada7?: number;
  entrada8?: number;
  pontoEntrada?: number;
  pontoSaida?: number;
  codigoMacro?: number;
  conteudoMensagem?: string;
  textoMensagem?: string;
  tipoTeclado?: number;
  eventoSequenciamento?: any[];
  evento?: any[];
  jamming?: number;
  statusAncora?: number;
  idMotorista?: number;
  nomeMotorista?: string;
  nivelCombustivel?: number;
  litrometro?: number;
  estadoLimpadorParabrisa?: number;
  eventosTelemetria?: any[];
  acessorios?: any;
  placa?: string;
  integradoraId?: number;
  nomeMensagem?: string;
  eventoFormatado?: string;
  eventoSeqFormatado?: string;
  temperaturaSerial?: number;
  umidadeSerial?: number;
}
```

</details>

<details>
<summary><code><b>obterPacotePosicoesMotoristaRestricao(quantidade = 300, idVeiculo?: number)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPacotePosicoesMotoristaRestricao(100, 12345);
console.log(resultado);
```

**Retorno Esperado (`T.PacotePosicaoXML[]`):**

```typescript
interface PacotePosicaoXML {
  idVeiculo: number;
  idPacote: number;
  dataPosicao: string;
  dataPacote: string;
  latitude: number;
  longitude: number;
  direcao: number;
  velocidade: number;
  ignicao: number;
  horimetro: number;
  odometro: number;
  tensao: number;
  saida1: number;
  saida2: number;
  saida3: number;
  saida4: number;
  entrada1: number;
  entrada2: number;
  entrada3: number;
  entrada4: number;
  satelite: number;
  memoria: number;
  idReferencia: number;
  bloqueio: number;
  gps: number;
  uf: string;
  cidade: string;
  rua: string;
  pontoReferencia: string;
  anguloReferencia: number;
  distanciaReferencia: number;
  rpm: number;
  temperatura1: number;
  temperatura2: number;
  temperatura3: number;
  saida5?: number;
  saida6?: number;
  saida7?: number;
  saida8?: number;
  entrada5?: number;
  entrada6?: number;
  entrada7?: number;
  entrada8?: number;
  pontoEntrada?: number;
  pontoSaida?: number;
  codigoMacro?: number;
  conteudoMensagem?: string;
  textoMensagem?: string;
  tipoTeclado?: number;
  eventoSequenciamento?: any[];
  evento?: any[];
  jamming?: number;
  statusAncora?: number;
  idMotorista?: number;
  nomeMotorista?: string;
  nivelCombustivel?: number;
  litrometro?: number;
  estadoLimpadorParabrisa?: number;
  eventosTelemetria?: any[];
  acessorios?: any;
  placa?: string;
  integradoraId?: number;
  nomeMensagem?: string;
  eventoFormatado?: string;
  eventoSeqFormatado?: string;
  temperaturaSerial?: number;
  umidadeSerial?: number;
}
```

</details>

<details>
<summary><code><b>obterPacotePosicaoMotoristaPorRange(idInicio: number, idFinal: number, quantidade = 3000)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPacotePosicaoMotoristaPorRange(null, null, 100);
console.log(resultado);
```

**Retorno Esperado (`T.PacotePosicaoXML[]`):**

```typescript
interface PacotePosicaoXML {
  idVeiculo: number;
  idPacote: number;
  dataPosicao: string;
  dataPacote: string;
  latitude: number;
  longitude: number;
  direcao: number;
  velocidade: number;
  ignicao: number;
  horimetro: number;
  odometro: number;
  tensao: number;
  saida1: number;
  saida2: number;
  saida3: number;
  saida4: number;
  entrada1: number;
  entrada2: number;
  entrada3: number;
  entrada4: number;
  satelite: number;
  memoria: number;
  idReferencia: number;
  bloqueio: number;
  gps: number;
  uf: string;
  cidade: string;
  rua: string;
  pontoReferencia: string;
  anguloReferencia: number;
  distanciaReferencia: number;
  rpm: number;
  temperatura1: number;
  temperatura2: number;
  temperatura3: number;
  saida5?: number;
  saida6?: number;
  saida7?: number;
  saida8?: number;
  entrada5?: number;
  entrada6?: number;
  entrada7?: number;
  entrada8?: number;
  pontoEntrada?: number;
  pontoSaida?: number;
  codigoMacro?: number;
  conteudoMensagem?: string;
  textoMensagem?: string;
  tipoTeclado?: number;
  eventoSequenciamento?: any[];
  evento?: any[];
  jamming?: number;
  statusAncora?: number;
  idMotorista?: number;
  nomeMotorista?: string;
  nivelCombustivel?: number;
  litrometro?: number;
  estadoLimpadorParabrisa?: number;
  eventosTelemetria?: any[];
  acessorios?: any;
  placa?: string;
  integradoraId?: number;
  nomeMensagem?: string;
  eventoFormatado?: string;
  eventoSeqFormatado?: string;
  temperaturaSerial?: number;
  umidadeSerial?: number;
}
```

</details>

<details>
<summary><code><b>obterPacotePosicaoMotoristaPorRangeJSON(idInicio: number, idFinal: number, quantidade = 3000)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPacotePosicaoMotoristaPorRangeJSON(null, null, 100);
console.log(resultado);
```

**Retorno Esperado (`T.PacotePosicaoJSON[]`):**

```typescript
interface PacotePosicaoJSON {
  idVeiculo: number;
  dataPosicao: string;
  dataPacote: string;
  latitude: number;
  longitude: number;
  direcao: number;
  velocidade: number;
  ignicao: number;
  odometro: number;
  horimetro: number;
  tensao: number;
  saida1: number;
  saida2: number;
  saida3: number;
  saida4: number;
  entrada1: number;
  entrada2: number;
  entrada3: number;
  entrada4: number;
  satelite: number;
  memoria: number;
  idReferencia: number;
  bloqueio: number;
  gps: number;
  uf: string;
  cidade: string;
  rua: string;
  pais: string;
  pontoReferencia: string;
  anguloReferencia: number;
  distanciaReferencia: number;
  rpm: number;
  temperatura1: number;
  temperatura2: number;
  temperatura3: number;
  saida5: number;
  saida6: number;
  saida7: number;
  saida8: number;
  entrada5: number;
  entrada6: number;
  entrada7: number;
  entrada8: number;
  pontoEntrada: number;
  pontoSaida: number;
  codigoMacro: number;
  nomeMensagem: string;
  conteudoMensagem: string;
  textoMensagem: string;
  tipoTeclado: number;
  eventoSequenciamento: any[];
  eventos: { codigo: number }[];
  jamming: number;
  statusAncora: number;
  idPacote: number;
  integradoraId: number;
  idMotorista: number;
  nomeMotorista: string;
  nivelCombustivel: string;
  litrometro: string;
  estadoLimpadorParabrisa: number | null;
  umidadeSerial: number;
  temperaturaSerial: number;
  odometroExato?: number;
  eventosTelemetria?: any[];
  placa?: string;
}
```

</details>

<details>
<summary><code><b>obterPacotePosicaoHistorico(dataInicio: string, dataFinal: string, idVeiculo?: number)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPacotePosicaoHistorico('2023-10-01 00:00:00', '2023-10-01 00:00:00', 12345);
console.log(resultado);
```

**Retorno Esperado (`T.PacotePosicaoXML[]`):**

```typescript
interface PacotePosicaoXML {
  idVeiculo: number;
  idPacote: number;
  dataPosicao: string;
  dataPacote: string;
  latitude: number;
  longitude: number;
  direcao: number;
  velocidade: number;
  ignicao: number;
  horimetro: number;
  odometro: number;
  tensao: number;
  saida1: number;
  saida2: number;
  saida3: number;
  saida4: number;
  entrada1: number;
  entrada2: number;
  entrada3: number;
  entrada4: number;
  satelite: number;
  memoria: number;
  idReferencia: number;
  bloqueio: number;
  gps: number;
  uf: string;
  cidade: string;
  rua: string;
  pontoReferencia: string;
  anguloReferencia: number;
  distanciaReferencia: number;
  rpm: number;
  temperatura1: number;
  temperatura2: number;
  temperatura3: number;
  saida5?: number;
  saida6?: number;
  saida7?: number;
  saida8?: number;
  entrada5?: number;
  entrada6?: number;
  entrada7?: number;
  entrada8?: number;
  pontoEntrada?: number;
  pontoSaida?: number;
  codigoMacro?: number;
  conteudoMensagem?: string;
  textoMensagem?: string;
  tipoTeclado?: number;
  eventoSequenciamento?: any[];
  evento?: any[];
  jamming?: number;
  statusAncora?: number;
  idMotorista?: number;
  nomeMotorista?: string;
  nivelCombustivel?: number;
  litrometro?: number;
  estadoLimpadorParabrisa?: number;
  eventosTelemetria?: any[];
  acessorios?: any;
  placa?: string;
  integradoraId?: number;
  nomeMensagem?: string;
  eventoFormatado?: string;
  eventoSeqFormatado?: string;
  temperaturaSerial?: number;
  umidadeSerial?: number;
}
```

</details>

<details>
<summary><code><b>obterPacotePosicaoPorRange(idInicio: number, idFinal: number, quantidade = 3000)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPacotePosicaoPorRange(null, null, 100);
console.log(resultado);
```

**Retorno Esperado (`T.PacotePosicaoXML[]`):**

```typescript
interface PacotePosicaoXML {
  idVeiculo: number;
  idPacote: number;
  dataPosicao: string;
  dataPacote: string;
  latitude: number;
  longitude: number;
  direcao: number;
  velocidade: number;
  ignicao: number;
  horimetro: number;
  odometro: number;
  tensao: number;
  saida1: number;
  saida2: number;
  saida3: number;
  saida4: number;
  entrada1: number;
  entrada2: number;
  entrada3: number;
  entrada4: number;
  satelite: number;
  memoria: number;
  idReferencia: number;
  bloqueio: number;
  gps: number;
  uf: string;
  cidade: string;
  rua: string;
  pontoReferencia: string;
  anguloReferencia: number;
  distanciaReferencia: number;
  rpm: number;
  temperatura1: number;
  temperatura2: number;
  temperatura3: number;
  saida5?: number;
  saida6?: number;
  saida7?: number;
  saida8?: number;
  entrada5?: number;
  entrada6?: number;
  entrada7?: number;
  entrada8?: number;
  pontoEntrada?: number;
  pontoSaida?: number;
  codigoMacro?: number;
  conteudoMensagem?: string;
  textoMensagem?: string;
  tipoTeclado?: number;
  eventoSequenciamento?: any[];
  evento?: any[];
  jamming?: number;
  statusAncora?: number;
  idMotorista?: number;
  nomeMotorista?: string;
  nivelCombustivel?: number;
  litrometro?: number;
  estadoLimpadorParabrisa?: number;
  eventosTelemetria?: any[];
  acessorios?: any;
  placa?: string;
  integradoraId?: number;
  nomeMensagem?: string;
  eventoFormatado?: string;
  eventoSeqFormatado?: string;
  temperaturaSerial?: number;
  umidadeSerial?: number;
}
```

</details>

<details>
<summary><code><b>obterPacotePosicaoPorRangeJSON(idInicio: number, idFinal: number, quantidade = 3000)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPacotePosicaoPorRangeJSON(null, null, 100);
console.log(resultado);
```

**Retorno Esperado (`T.PacotePosicaoJSON[]`):**

```typescript
interface PacotePosicaoJSON {
  idVeiculo: number;
  dataPosicao: string;
  dataPacote: string;
  latitude: number;
  longitude: number;
  direcao: number;
  velocidade: number;
  ignicao: number;
  odometro: number;
  horimetro: number;
  tensao: number;
  saida1: number;
  saida2: number;
  saida3: number;
  saida4: number;
  entrada1: number;
  entrada2: number;
  entrada3: number;
  entrada4: number;
  satelite: number;
  memoria: number;
  idReferencia: number;
  bloqueio: number;
  gps: number;
  uf: string;
  cidade: string;
  rua: string;
  pais: string;
  pontoReferencia: string;
  anguloReferencia: number;
  distanciaReferencia: number;
  rpm: number;
  temperatura1: number;
  temperatura2: number;
  temperatura3: number;
  saida5: number;
  saida6: number;
  saida7: number;
  saida8: number;
  entrada5: number;
  entrada6: number;
  entrada7: number;
  entrada8: number;
  pontoEntrada: number;
  pontoSaida: number;
  codigoMacro: number;
  nomeMensagem: string;
  conteudoMensagem: string;
  textoMensagem: string;
  tipoTeclado: number;
  eventoSequenciamento: any[];
  eventos: { codigo: number }[];
  jamming: number;
  statusAncora: number;
  idPacote: number;
  integradoraId: number;
  idMotorista: number;
  nomeMotorista: string;
  nivelCombustivel: string;
  litrometro: string;
  estadoLimpadorParabrisa: number | null;
  umidadeSerial: number;
  temperaturaSerial: number;
  odometroExato?: number;
  eventosTelemetria?: any[];
  placa?: string;
}
```

</details>

<details>
<summary><code><b>obterPacoteLocalizacao(quantidade = 2000)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPacoteLocalizacao(100);
console.log(resultado);
```

**Retorno Esperado (`T.PacoteLocalizacao[]`):**

```typescript
interface PacoteLocalizacao {
  dataPacote: string;
  direcao: number;
  gps: number;
  idVeiculo: number;
  ignicao: number;
  latitude: number;
  longitude: number;
  velocidade: number;
}
```

</details>

<details>
<summary><code><b>getPositionsPacketJSON(quantity = 3000)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.getPositionsPacketJSON(null);
console.log(resultado);
```

**Retorno Esperado (`T.PositionPacketJSON[]`):**

```typescript
interface PositionPacketJSON {
  vehicleId: number;
  positionDateUtc: string;
  packetDateUtc: string;
  latitude: number;
  longitude: number;
  direction: number;
  speed: number;
  ignition: number;
  odometer: number;
  horimeter: number;
  power: number;
  output1: number;
  output2: number;
  output3: number;
  output4: number;
  input1: number;
  input2: number;
  input3: number;
  input4: number;
  satellite: number;
  memory: number;
  referenceId: number;
  blocking: number;
  gps: number;
  state: string;
  city: string;
  country: string;
  street: string;
  referencePoint: string;
  referenceAngle: number;
  referenceDistance: number;
  rpm: number;
  temperature1: number;
  temperature2: number;
  temperature3: number;
  output5?: number;
  output6?: number;
  output7?: number;
  output8?: number;
  input5?: number;
  input6?: number;
  input7?: number;
  input8?: number;
  entryPoint?: number;
  exitPoint?: number;
  macroCode?: number;
  messageName?: string;
  messageContent?: string;
  messageText?: string;
  mdtType?: number;
  sequencingEvent?: any[];
  events?: any[];
  jamming?: number;
  anchorStatus?: number;
  packetId?: number;
  integratorId?: number;
  driverId?: number;
  driverName?: string;
  fuelLevel?: number;
  lithometer?: number;
  windshieldWiperState?: number;
  telemetryEvents?: any[];
  humiditySerial?: number;
  temperatureSerial?: number;
  licensePlate?: string;
}
```

</details>

<details>
<summary><code><b>getDriverPositionPacketJSON(quantity = 3000)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.getDriverPositionPacketJSON(null);
console.log(resultado);
```

**Retorno Esperado (`T.PositionPacketJSON[]`):**

```typescript
interface PositionPacketJSON {
  vehicleId: number;
  positionDateUtc: string;
  packetDateUtc: string;
  latitude: number;
  longitude: number;
  direction: number;
  speed: number;
  ignition: number;
  odometer: number;
  horimeter: number;
  power: number;
  output1: number;
  output2: number;
  output3: number;
  output4: number;
  input1: number;
  input2: number;
  input3: number;
  input4: number;
  satellite: number;
  memory: number;
  referenceId: number;
  blocking: number;
  gps: number;
  state: string;
  city: string;
  country: string;
  street: string;
  referencePoint: string;
  referenceAngle: number;
  referenceDistance: number;
  rpm: number;
  temperature1: number;
  temperature2: number;
  temperature3: number;
  output5?: number;
  output6?: number;
  output7?: number;
  output8?: number;
  input5?: number;
  input6?: number;
  input7?: number;
  input8?: number;
  entryPoint?: number;
  exitPoint?: number;
  macroCode?: number;
  messageName?: string;
  messageContent?: string;
  messageText?: string;
  mdtType?: number;
  sequencingEvent?: any[];
  events?: any[];
  jamming?: number;
  anchorStatus?: number;
  packetId?: number;
  integratorId?: number;
  driverId?: number;
  driverName?: string;
  fuelLevel?: number;
  lithometer?: number;
  windshieldWiperState?: number;
  telemetryEvents?: any[];
  humiditySerial?: number;
  temperatureSerial?: number;
  licensePlate?: string;
}
```

</details>

<details>
<summary><code><b>getPositionPacketByRangeJSON(startId: number, endId: number, quantity = 3000)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.getPositionPacketByRangeJSON(null, null, null);
console.log(resultado);
```

**Retorno Esperado (`T.PositionPacketJSON[]`):**

```typescript
interface PositionPacketJSON {
  vehicleId: number;
  positionDateUtc: string;
  packetDateUtc: string;
  latitude: number;
  longitude: number;
  direction: number;
  speed: number;
  ignition: number;
  odometer: number;
  horimeter: number;
  power: number;
  output1: number;
  output2: number;
  output3: number;
  output4: number;
  input1: number;
  input2: number;
  input3: number;
  input4: number;
  satellite: number;
  memory: number;
  referenceId: number;
  blocking: number;
  gps: number;
  state: string;
  city: string;
  country: string;
  street: string;
  referencePoint: string;
  referenceAngle: number;
  referenceDistance: number;
  rpm: number;
  temperature1: number;
  temperature2: number;
  temperature3: number;
  output5?: number;
  output6?: number;
  output7?: number;
  output8?: number;
  input5?: number;
  input6?: number;
  input7?: number;
  input8?: number;
  entryPoint?: number;
  exitPoint?: number;
  macroCode?: number;
  messageName?: string;
  messageContent?: string;
  messageText?: string;
  mdtType?: number;
  sequencingEvent?: any[];
  events?: any[];
  jamming?: number;
  anchorStatus?: number;
  packetId?: number;
  integratorId?: number;
  driverId?: number;
  driverName?: string;
  fuelLevel?: number;
  lithometer?: number;
  windshieldWiperState?: number;
  telemetryEvents?: any[];
  humiditySerial?: number;
  temperatureSerial?: number;
  licensePlate?: string;
}
```

</details>

<details>
<summary><code><b>getDriverPositionPacketByRangeJSON(startId: number, endId: number, quantity = 3000)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.getDriverPositionPacketByRangeJSON(null, null, null);
console.log(resultado);
```

**Retorno Esperado (`T.PositionPacketJSON[]`):**

```typescript
interface PositionPacketJSON {
  vehicleId: number;
  positionDateUtc: string;
  packetDateUtc: string;
  latitude: number;
  longitude: number;
  direction: number;
  speed: number;
  ignition: number;
  odometer: number;
  horimeter: number;
  power: number;
  output1: number;
  output2: number;
  output3: number;
  output4: number;
  input1: number;
  input2: number;
  input3: number;
  input4: number;
  satellite: number;
  memory: number;
  referenceId: number;
  blocking: number;
  gps: number;
  state: string;
  city: string;
  country: string;
  street: string;
  referencePoint: string;
  referenceAngle: number;
  referenceDistance: number;
  rpm: number;
  temperature1: number;
  temperature2: number;
  temperature3: number;
  output5?: number;
  output6?: number;
  output7?: number;
  output8?: number;
  input5?: number;
  input6?: number;
  input7?: number;
  input8?: number;
  entryPoint?: number;
  exitPoint?: number;
  macroCode?: number;
  messageName?: string;
  messageContent?: string;
  messageText?: string;
  mdtType?: number;
  sequencingEvent?: any[];
  events?: any[];
  jamming?: number;
  anchorStatus?: number;
  packetId?: number;
  integratorId?: number;
  driverId?: number;
  driverName?: string;
  fuelLevel?: number;
  lithometer?: number;
  windshieldWiperState?: number;
  telemetryEvents?: any[];
  humiditySerial?: number;
  temperatureSerial?: number;
  licensePlate?: string;
}
```

</details>

<details>
<summary><code><b>getPositionPacketWithLicensePlateJSON(quantity = 3000)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.getPositionPacketWithLicensePlateJSON(null);
console.log(resultado);
```

**Retorno Esperado (`T.PositionPacketJSON[]`):**

```typescript
interface PositionPacketJSON {
  vehicleId: number;
  positionDateUtc: string;
  packetDateUtc: string;
  latitude: number;
  longitude: number;
  direction: number;
  speed: number;
  ignition: number;
  odometer: number;
  horimeter: number;
  power: number;
  output1: number;
  output2: number;
  output3: number;
  output4: number;
  input1: number;
  input2: number;
  input3: number;
  input4: number;
  satellite: number;
  memory: number;
  referenceId: number;
  blocking: number;
  gps: number;
  state: string;
  city: string;
  country: string;
  street: string;
  referencePoint: string;
  referenceAngle: number;
  referenceDistance: number;
  rpm: number;
  temperature1: number;
  temperature2: number;
  temperature3: number;
  output5?: number;
  output6?: number;
  output7?: number;
  output8?: number;
  input5?: number;
  input6?: number;
  input7?: number;
  input8?: number;
  entryPoint?: number;
  exitPoint?: number;
  macroCode?: number;
  messageName?: string;
  messageContent?: string;
  messageText?: string;
  mdtType?: number;
  sequencingEvent?: any[];
  events?: any[];
  jamming?: number;
  anchorStatus?: number;
  packetId?: number;
  integratorId?: number;
  driverId?: number;
  driverName?: string;
  fuelLevel?: number;
  lithometer?: number;
  windshieldWiperState?: number;
  telemetryEvents?: any[];
  humiditySerial?: number;
  temperatureSerial?: number;
  licensePlate?: string;
}
```

</details>

<details>
<summary><code><b>obterPacotePosicoesRFNacional(quantidade = 3000)</b></code></summary>

Pacote de posições de rastreadores de cargas (RF Nacional) em roaming nacional.

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPacotePosicoesRFNacional(100);
console.log(resultado);
```

**Retorno Esperado (`T.PacotePosicaoXML[]`):** ver tipo de `obterPacotePosicoes`.

</details>

<details>
<summary><code><b>obterPacotePosicaoMotoristaHistorico(dataInicio: string, dataFinal: string, idVeiculo?: number)</b></code></summary>

Histórico de pacotes de posições com informação extra de motorista (id/nome) e limpador de para-brisa.

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterPacotePosicaoMotoristaHistorico(
  '2023-10-01 00:00:00',
  '2023-10-02 00:00:00',
  12345
);
console.log(resultado);
```

**Retorno Esperado (`T.PacotePosicaoXML[]`):** mesmo tipo de `obterPacotePosicoes`, com `idMotorista`, `nomeMotorista` e `estadoLimpadorParabrisa` populados.

</details>

### 📈 Telemetria e Jornada

<details>
<summary><code><b>obterDeltaTelemetriaIntegracao(dataInicio: string, dataFinal: string, idVeiculo: number, pagina?: number)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterDeltaTelemetriaIntegracao(
  '2023-10-01 00:00:00',
  '2023-10-01 00:00:00',
  12345,
  null
);
console.log(resultado);
```

**Retorno Esperado (`T.DeltaTelemetria[]`):**

```typescript
interface DeltaTelemetria {
  idVeiculo: number;
  idMotorista: number;
  loginMotorista: number;
  nomeMotorista: string;
  latitude: number;
  longitude: number;
  dataPosicao: string;
  tempoDuracaoGiroMotor: number;
  tempoDuracaoTotal: number;
  tempoDuracaoMovimento: number;
  tempoDuracaoParado: number;
  velocidadeMaximaFaixaAmarela: number;
  tipoDelta: number;
  tempoDuracaoFaixaMarchaLenta: number;
  tempoDuracaoFaixaMarchaLentaComVelocidade: number;
  tempoDuracaoFaixaDeTransicaoComInercia: number;
  tempoDuracaoFaixaDeTransicaoSemInercia: number;
  tempoDuracaoFaixaVerdeEconomicaComInercia: number;
  tempoDuracaoFaixaVerdeEconomicaSemInercia: number;
  tempoDuracaoFaixaVerdeComInercia: number;
  tempoDuracaoFaixaVerdeSemInercia: number;
  tempoDuracaoFaixaAmarerlaSemInercia: number;
  tempoDuracaoFaixaAmarelaComInercia: number;
  tempoDuracaoFaixaDePerigoComInercia: number;
  tempoDuracaoFaixaDePerigoSemInercia: number;
  horimetro: number;
  odometro: number;
  distanciaPercorrida: number;
  velocidadeMedia: number;
  rpmMaximo: number;
  rpmMedia: number;
  tempoDuracaoFreioMotor: number;
  distanciaPercorridaEmbreagemAcionada: number;
  distanciaPercorridaFreioAcionado: number;
  consumoCombustivel?: number;
  distPercorridaAscendenteFxAmarela: number;
  distPercorridaAscendenteFxMarchaLenta: number;
  distPercorridaAscendenteFxPerigo: number;
  distPercorridaAscendenteFxTransic: number;
  distPercorridaAscendenteFxVerde: number;
  distPercorridaAscendenteFxVerde_ext: number;
  distPercorridaDescendenteFxAmarela: number;
  distPercorridaDescendenteFxMarchaLenta: number;
  distPercorridaDescendenteFxPerigo: number;
  distPercorridaDescendenteFxTransic: number;
  distPercorridaDescendenteFxVerde: number;
  distPercorridaDescendenteFxVerde_ext: number;
  distPercorridaEstavelFxAmarela: number;
  distPercorridaEstavelFxMarchaLenta: number;
  distPercorridaEstavelFxPerigo: number;
  distPercorridaEstavelFxTransic: number;
  distPercorridaEstavelFxVerde: number;
  distPercorridaEstavelFxVerde_ext: number;
  distTotalFxAscendente: number;
  distTotalFxDescendente: number;
  distTotalFxEstavel: number;
  pressaoMediaDoOleoDoMotor: number;
  pressaoMediaDoSistemaDeFreioAAr?: number;
  temperaturaMediaDoArrefecimento?: number;
  temperaturaMediaDoCombustivel?: number;
  temperaturaMediaDoOleoDoMotor?: number;
  tempoTotalComCinto?: number;
  tensaoMediaDaBateria?: number;
  dataChegada?: string;
}
```

</details>

<details>
<summary><code><b>obterDeltaTelemetriaIntegracaoInercia(dataInicio: string, dataFinal: string, idVeiculo: number, pagina?: number)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterDeltaTelemetriaIntegracaoInercia(
  '2023-10-01 00:00:00',
  '2023-10-01 00:00:00',
  12345,
  null
);
console.log(resultado);
```

**Retorno Esperado (`T.DeltaTelemetria[]`):**

```typescript
interface DeltaTelemetria {
  idVeiculo: number;
  idMotorista: number;
  loginMotorista: number;
  nomeMotorista: string;
  latitude: number;
  longitude: number;
  dataPosicao: string;
  tempoDuracaoGiroMotor: number;
  tempoDuracaoTotal: number;
  tempoDuracaoMovimento: number;
  tempoDuracaoParado: number;
  velocidadeMaximaFaixaAmarela: number;
  tipoDelta: number;
  tempoDuracaoFaixaMarchaLenta: number;
  tempoDuracaoFaixaMarchaLentaComVelocidade: number;
  tempoDuracaoFaixaDeTransicaoComInercia: number;
  tempoDuracaoFaixaDeTransicaoSemInercia: number;
  tempoDuracaoFaixaVerdeEconomicaComInercia: number;
  tempoDuracaoFaixaVerdeEconomicaSemInercia: number;
  tempoDuracaoFaixaVerdeComInercia: number;
  tempoDuracaoFaixaVerdeSemInercia: number;
  tempoDuracaoFaixaAmarerlaSemInercia: number;
  tempoDuracaoFaixaAmarelaComInercia: number;
  tempoDuracaoFaixaDePerigoComInercia: number;
  tempoDuracaoFaixaDePerigoSemInercia: number;
  horimetro: number;
  odometro: number;
  distanciaPercorrida: number;
  velocidadeMedia: number;
  rpmMaximo: number;
  rpmMedia: number;
  tempoDuracaoFreioMotor: number;
  distanciaPercorridaEmbreagemAcionada: number;
  distanciaPercorridaFreioAcionado: number;
  consumoCombustivel?: number;
  distPercorridaAscendenteFxAmarela: number;
  distPercorridaAscendenteFxMarchaLenta: number;
  distPercorridaAscendenteFxPerigo: number;
  distPercorridaAscendenteFxTransic: number;
  distPercorridaAscendenteFxVerde: number;
  distPercorridaAscendenteFxVerde_ext: number;
  distPercorridaDescendenteFxAmarela: number;
  distPercorridaDescendenteFxMarchaLenta: number;
  distPercorridaDescendenteFxPerigo: number;
  distPercorridaDescendenteFxTransic: number;
  distPercorridaDescendenteFxVerde: number;
  distPercorridaDescendenteFxVerde_ext: number;
  distPercorridaEstavelFxAmarela: number;
  distPercorridaEstavelFxMarchaLenta: number;
  distPercorridaEstavelFxPerigo: number;
  distPercorridaEstavelFxTransic: number;
  distPercorridaEstavelFxVerde: number;
  distPercorridaEstavelFxVerde_ext: number;
  distTotalFxAscendente: number;
  distTotalFxDescendente: number;
  distTotalFxEstavel: number;
  pressaoMediaDoOleoDoMotor: number;
  pressaoMediaDoSistemaDeFreioAAr?: number;
  temperaturaMediaDoArrefecimento?: number;
  temperaturaMediaDoCombustivel?: number;
  temperaturaMediaDoOleoDoMotor?: number;
  tempoTotalComCinto?: number;
  tensaoMediaDaBateria?: number;
  dataChegada?: string;
}
```

</details>

<details>
<summary><code><b>obterDeltaTelemetriaIntegracaoDataChegada(dataInicio: string, dataFinal: string, idVeiculo: number, dataChegadaInicio: string, dataChegadaFinal: string)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterDeltaTelemetriaIntegracaoDataChegada(
  '2023-10-01 00:00:00',
  '2023-10-01 00:00:00',
  12345,
  '2023-10-01 00:00:00',
  '2023-10-01 00:00:00'
);
console.log(resultado);
```

**Retorno Esperado (`T.DeltaTelemetria[]`):**

```typescript
interface DeltaTelemetria {
  idVeiculo: number;
  idMotorista: number;
  loginMotorista: number;
  nomeMotorista: string;
  latitude: number;
  longitude: number;
  dataPosicao: string;
  tempoDuracaoGiroMotor: number;
  tempoDuracaoTotal: number;
  tempoDuracaoMovimento: number;
  tempoDuracaoParado: number;
  velocidadeMaximaFaixaAmarela: number;
  tipoDelta: number;
  tempoDuracaoFaixaMarchaLenta: number;
  tempoDuracaoFaixaMarchaLentaComVelocidade: number;
  tempoDuracaoFaixaDeTransicaoComInercia: number;
  tempoDuracaoFaixaDeTransicaoSemInercia: number;
  tempoDuracaoFaixaVerdeEconomicaComInercia: number;
  tempoDuracaoFaixaVerdeEconomicaSemInercia: number;
  tempoDuracaoFaixaVerdeComInercia: number;
  tempoDuracaoFaixaVerdeSemInercia: number;
  tempoDuracaoFaixaAmarerlaSemInercia: number;
  tempoDuracaoFaixaAmarelaComInercia: number;
  tempoDuracaoFaixaDePerigoComInercia: number;
  tempoDuracaoFaixaDePerigoSemInercia: number;
  horimetro: number;
  odometro: number;
  distanciaPercorrida: number;
  velocidadeMedia: number;
  rpmMaximo: number;
  rpmMedia: number;
  tempoDuracaoFreioMotor: number;
  distanciaPercorridaEmbreagemAcionada: number;
  distanciaPercorridaFreioAcionado: number;
  consumoCombustivel?: number;
  distPercorridaAscendenteFxAmarela: number;
  distPercorridaAscendenteFxMarchaLenta: number;
  distPercorridaAscendenteFxPerigo: number;
  distPercorridaAscendenteFxTransic: number;
  distPercorridaAscendenteFxVerde: number;
  distPercorridaAscendenteFxVerde_ext: number;
  distPercorridaDescendenteFxAmarela: number;
  distPercorridaDescendenteFxMarchaLenta: number;
  distPercorridaDescendenteFxPerigo: number;
  distPercorridaDescendenteFxTransic: number;
  distPercorridaDescendenteFxVerde: number;
  distPercorridaDescendenteFxVerde_ext: number;
  distPercorridaEstavelFxAmarela: number;
  distPercorridaEstavelFxMarchaLenta: number;
  distPercorridaEstavelFxPerigo: number;
  distPercorridaEstavelFxTransic: number;
  distPercorridaEstavelFxVerde: number;
  distPercorridaEstavelFxVerde_ext: number;
  distTotalFxAscendente: number;
  distTotalFxDescendente: number;
  distTotalFxEstavel: number;
  pressaoMediaDoOleoDoMotor: number;
  pressaoMediaDoSistemaDeFreioAAr?: number;
  temperaturaMediaDoArrefecimento?: number;
  temperaturaMediaDoCombustivel?: number;
  temperaturaMediaDoOleoDoMotor?: number;
  tempoTotalComCinto?: number;
  tensaoMediaDaBateria?: number;
  dataChegada?: string;
}
```

</details>

<details>
<summary><code><b>obterDeltaTelemetriaIntegracaoInerciaDataChegada(dataInicio: string, dataFinal: string, idVeiculo: number, dataChegadaInicio: string, dataChegadaFinal: string)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterDeltaTelemetriaIntegracaoInerciaDataChegada(
  '2023-10-01 00:00:00',
  '2023-10-01 00:00:00',
  12345,
  '2023-10-01 00:00:00',
  '2023-10-01 00:00:00'
);
console.log(resultado);
```

**Retorno Esperado (`T.DeltaTelemetria[]`):**

```typescript
interface DeltaTelemetria {
  idVeiculo: number;
  idMotorista: number;
  loginMotorista: number;
  nomeMotorista: string;
  latitude: number;
  longitude: number;
  dataPosicao: string;
  tempoDuracaoGiroMotor: number;
  tempoDuracaoTotal: number;
  tempoDuracaoMovimento: number;
  tempoDuracaoParado: number;
  velocidadeMaximaFaixaAmarela: number;
  tipoDelta: number;
  tempoDuracaoFaixaMarchaLenta: number;
  tempoDuracaoFaixaMarchaLentaComVelocidade: number;
  tempoDuracaoFaixaDeTransicaoComInercia: number;
  tempoDuracaoFaixaDeTransicaoSemInercia: number;
  tempoDuracaoFaixaVerdeEconomicaComInercia: number;
  tempoDuracaoFaixaVerdeEconomicaSemInercia: number;
  tempoDuracaoFaixaVerdeComInercia: number;
  tempoDuracaoFaixaVerdeSemInercia: number;
  tempoDuracaoFaixaAmarerlaSemInercia: number;
  tempoDuracaoFaixaAmarelaComInercia: number;
  tempoDuracaoFaixaDePerigoComInercia: number;
  tempoDuracaoFaixaDePerigoSemInercia: number;
  horimetro: number;
  odometro: number;
  distanciaPercorrida: number;
  velocidadeMedia: number;
  rpmMaximo: number;
  rpmMedia: number;
  tempoDuracaoFreioMotor: number;
  distanciaPercorridaEmbreagemAcionada: number;
  distanciaPercorridaFreioAcionado: number;
  consumoCombustivel?: number;
  distPercorridaAscendenteFxAmarela: number;
  distPercorridaAscendenteFxMarchaLenta: number;
  distPercorridaAscendenteFxPerigo: number;
  distPercorridaAscendenteFxTransic: number;
  distPercorridaAscendenteFxVerde: number;
  distPercorridaAscendenteFxVerde_ext: number;
  distPercorridaDescendenteFxAmarela: number;
  distPercorridaDescendenteFxMarchaLenta: number;
  distPercorridaDescendenteFxPerigo: number;
  distPercorridaDescendenteFxTransic: number;
  distPercorridaDescendenteFxVerde: number;
  distPercorridaDescendenteFxVerde_ext: number;
  distPercorridaEstavelFxAmarela: number;
  distPercorridaEstavelFxMarchaLenta: number;
  distPercorridaEstavelFxPerigo: number;
  distPercorridaEstavelFxTransic: number;
  distPercorridaEstavelFxVerde: number;
  distPercorridaEstavelFxVerde_ext: number;
  distTotalFxAscendente: number;
  distTotalFxDescendente: number;
  distTotalFxEstavel: number;
  pressaoMediaDoOleoDoMotor: number;
  pressaoMediaDoSistemaDeFreioAAr?: number;
  temperaturaMediaDoArrefecimento?: number;
  temperaturaMediaDoCombustivel?: number;
  temperaturaMediaDoOleoDoMotor?: number;
  tempoTotalComCinto?: number;
  tensaoMediaDaBateria?: number;
  dataChegada?: string;
}
```

</details>

<details>
<summary><code><b>obterEventoTelemetriaIntegracao(dataInicio: string, dataFinal: string, idVeiculo: number, idEventoList?: string)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterEventoTelemetriaIntegracao(
  '2023-10-01 00:00:00',
  '2023-10-01 00:00:00',
  12345,
  null
);
console.log(resultado);
```

**Retorno Esperado (`T.EventoTelemetria[]`):**

```typescript
interface EventoTelemetria {
  idVeiculo: number;
  idMotorista: number;
  loginMotorista: number;
  latitude: number;
  longitude: number;
  dataPosicao: string;
  idEvento: number;
  odometro: number;
  horimetro: number;
  tempoDuracao: number;
  velocidadeMaximaEvento: number;
  velocidadeReferencia: number;
}
```

</details>

<details>
<summary><code><b>obterEventoTelemetriaDescricao()</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterEventoTelemetriaDescricao();
console.log(resultado);
```

**Retorno Esperado (`T.TipoEventoTelemetriaDescricao[]`):**

```typescript
interface TipoEventoTelemetriaDescricao {
  eventoDescricao: string;
  eventoTipo: string;
  idEvento: number;
}
```

</details>

<details>
<summary><code><b>obterEventosTempoDirecao(quantidade = 3000, idMotorista?: number, dataInicio?: string, dataFim?: string)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterEventosTempoDirecao(100, 12345, '2023-10-01 00:00:00', '2023-10-01 00:00:00');
console.log(resultado);
```

**Retorno Esperado (`T.EventoTempoDirecao[]`):**

```typescript
interface EventoTempoDirecao {
  cidade: string;
  dataInicio: string;
  descricaoEventoTempoDirecao: string;
  descricaoEventoTempoDirecaoAnterior: string;
  eventoTempoDirecao: number;
  eventoTempoDirecaoAnterior: number;
  idCliente: number;
  idMotorista: number;
  idMotoristaReserva: number;
  idVeiculo: number;
  latitude: number;
  longitude: number;
  nomeCliente: string;
  nomeMotorista: string;
  nomeMotoristaReserva: string;
  odometro: number;
  placa: string;
  rua: string;
  uf: string;
  dataChegada?: string;
}
```

</details>

<details>
<summary><code><b>obterEventosTempoDirecaoDataChegada(quantidade = 3000, idMotorista?: number, dataInicio?: string, dataFim?: string, dataChegadaInicial?: string, dataChegadaFinal?: string)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterEventosTempoDirecaoDataChegada(
  100,
  12345,
  '2023-10-01 00:00:00',
  '2023-10-01 00:00:00',
  '2023-10-01 00:00:00',
  '2023-10-01 00:00:00'
);
console.log(resultado);
```

**Retorno Esperado (`T.EventoTempoDirecao[]`):**

```typescript
interface EventoTempoDirecao {
  cidade: string;
  dataInicio: string;
  descricaoEventoTempoDirecao: string;
  descricaoEventoTempoDirecaoAnterior: string;
  eventoTempoDirecao: number;
  eventoTempoDirecaoAnterior: number;
  idCliente: number;
  idMotorista: number;
  idMotoristaReserva: number;
  idVeiculo: number;
  latitude: number;
  longitude: number;
  nomeCliente: string;
  nomeMotorista: string;
  nomeMotoristaReserva: string;
  odometro: number;
  placa: string;
  rua: string;
  uf: string;
  dataChegada?: string;
}
```

</details>

### ⌨️ Comandos, Macros e Caixa Preta

<details>
<summary><code><b>obterStatusComando(ticket: number)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterStatusComando(12345);
console.log(resultado);
```

**Retorno Esperado (`T.StatusComando[]`):**

```typescript
interface StatusComando {
  idStatusComando: number;
  dataExec: string;
}
```

</details>

<details>
<summary><code><b>obterStatusComandoTicketSascar(ticket: number)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterStatusComandoTicketSascar(12345);
console.log(resultado);
```

**Retorno Esperado (`T.StatusComando[]`):**

```typescript
interface StatusComando {
  idStatusComando: number;
  dataExec: string;
}
```

</details>

<details>
<summary><code><b>obterTipoComando()</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterTipoComando();
console.log(resultado);
```

**Retorno Esperado (`T.TipoComando[]`):**

```typescript
interface TipoComando {
  idTipoComando: number;
  nome: string;
  descricao: string;
}
```

</details>

<details>
<summary><code><b>obterMacroTd50Tmcd(tipoTeclado: string)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterMacroTd50Tmcd(null);
console.log(resultado);
```

**Retorno Esperado (`T.MacroTd50Tmcd[]`):**

```typescript
interface MacroTd50Tmcd {
  idMacroTd50Tmcd: number;
  idVeiculo: number;
  nome: string;
  layout: string;
  layoutDetalhado?: string;
}
```

</details>

<details>
<summary><code><b>obterMacroTd50TmcdDetalhado(tipoTeclado: string, idLayout?: number, dataReferencia?: string)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterMacroTd50TmcdDetalhado(null, null, '2023-10-01 00:00:00');
console.log(resultado);
```

**Retorno Esperado (`T.MacroTd50TmcdDetalhado[]`):**

```typescript
interface MacroTd50TmcdDetalhado {
  idMacroTd50Tmcd: number;
  nome: string;
  listaLayout: any[];
  listaVeiculos: any[];
}
```

</details>

<details>
<summary><code><b>obterMascaraDispositivo(idVeiculo: number)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterMascaraDispositivo(12345);
console.log(resultado);
```

**Retorno Esperado (`T.MascaraDispositivo[]`):**

```typescript
interface MascaraDispositivo {
  atuadores: number[];
}
```

</details>

<details>
<summary><code><b>obterMacroTd40(satelital: boolean)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterMacroTd40(true);
console.log(resultado);
```

**Retorno Esperado (`T.MacroTd40[]`):**

```typescript
interface MacroTd40 {
  idMacroTd40: number;
  idVeiculo: number;
  Mensagem: string;
  tipoMensagem: number;
}
```

</details>

<details>
<summary><code><b>obterLayout(layout: string)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterLayout(null);
console.log(resultado);
```

**Retorno Esperado (`T.Layout[]`):**

```typescript
interface Layout {
  idLayout: number;
  descricao: string;
  tipoTeclado: number;
}
```

</details>

<details>
<summary><code><b>obterLayoutDetalhado(layout: string, idLayout?: number, dataReferencia?: string)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterLayoutDetalhado(null, null, '2023-10-01 00:00:00');
console.log(resultado);
```

**Retorno Esperado (`T.ObterLayoutData[]`):**

```typescript
interface ObterLayoutData {
  dataAlteracao: string;
  dataCriacao: string;
  descricao: string;
  idLayout: number;
  TipoTeclado: number;
}
```

</details>

<details>
<summary><code><b>obterLayoutAcaoEmbarcadaAVD()</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterLayoutAcaoEmbarcadaAVD();
console.log(resultado);
```

**Retorno Esperado (`T.LayoutAcaoEmbarcadaAVD[]`):**

```typescript
interface LayoutAcaoEmbarcadaAVD {
  idLayoutAcaoEmbarcadaAVD: number;
  nome: string;
}
```

</details>

<details>
<summary><code><b>comandoEmbarquePontoDiario(idVeiculo: number, pontosRef: string)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.comandoEmbarquePontoDiario(12345, null);
console.log(resultado);
```

**Retorno Esperado (`T.LogComando[]`):**

```typescript
interface LogComando {
  mensagem: string;
  codigo: string;
}
```

</details>

<details>
<summary><code><b>enviarParametrizacaoTelemetria(idVeiculo: number, params: T.ParametrizacaoTelemetria)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.enviarParametrizacaoTelemetria(12345, null);
console.log(resultado);
```

**Retorno Esperado:** `any[]`

</details>

<details>
<summary><code><b>obterMacroTms3()</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.obterMacroTms3();
console.log(resultado);
```

**Retorno Esperado (`T.MacroTms3[]`):**

```typescript
interface MacroTms3 {
  idMacroTms3: number;
  idVeiculo: number;
  nome: string;
  layout: string;
}
```

</details>

<details>
<summary><code><b>solicitarEventosCaixaPreta(idVeiculo?: number, placa?: string, dataPosicaoInicial?: string, dataPosicaoFinal?: string)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.solicitarEventosCaixaPreta(
  12345,
  'ABC1D23',
  '2023-10-01 00:00:00',
  '2023-10-01 00:00:00'
);
console.log(resultado);
```

**Retorno Esperado:** `any[]`

</details>

<details>
<summary><code><b>recuperarEventosCaixaPreta(idVeiculo?: number, placa?: string, dataPosicao?: string)</b></code></summary>

**Exemplo de Chamada:**

```typescript
const resultado = await client.recuperarEventosCaixaPreta(12345, 'ABC1D23', '2023-10-01 00:00:00');
console.log(resultado);
```

**Retorno Esperado (`T.CaixaPretaList[]`):**

```typescript
interface CaixaPretaList {
  dataEvento: string;
  latitude: number;
  longitude: number;
  idOperador: number;
  velocidade: number;
  rpm: number;
  ignicao: number;
  freio: number;
  limpador: number;
  buzzer: number;
  embreagem: number;
}
```

</details>

### 🔎 Métodos descobertos no WSDL ao vivo (não documentados no manual v2.07)

Estes métodos foram identificados via auditoria do WSDL `https://sasintegra.sascar.com.br/SasIntegra/SasIntegraWSService?wsdl` em 2026-06-17. **Vários exigem permissões específicas na conta** — testar contra produção retorna `acesso nao permitido a esta operacao!` quando o usuário não tem o role correspondente.

<details>
<summary><code><b>consultaQuantidadePacotesPosicoesPendentes()</b></code></summary>

Consulta a quantidade de pacotes de posição pendentes na fila do servidor. Útil para monitoramento.

**Exemplo de Chamada:**

```typescript
const status = await client.consultaQuantidadePacotesPosicoesPendentes();
// [{ dtUltimaRequisicao: "2026-06-17 11:20:42.616706", qtdPacotesPendentes: 124 }]
```

**Retorno Esperado (`T.PacotePendente[]`):**

```typescript
interface PacotePendente {
  dtUltimaRequisicao: string;
  qtdPacotesPendentes: number;
}
```

</details>

<details>
<summary><code><b>getSmartCamerasEvents(params: SmartCamerasEventsParams)</b></code></summary>

Eventos de SmartCameras (câmeras embarcadas Sascar) com múltiplos filtros.

```typescript
const events = await client.getSmartCamerasEvents({
  agrupador: 'cliente-123',
  offset: 0,
  limit: 50,
  dataInicio: '2026-06-16 00:00:00',
  dataFim: '2026-06-17 00:00:00',
  tipoEvento: 'PERCLOS',
  criticidade: 'ALTA'
});
```

**Retorno (`T.SmartCamerasEvento[]`):**

```typescript
interface SmartCamerasEvento {
  deviceId: string;
  driver: SmartCamerasMotorista;
  eventType: number;
  hwType: string;
  id: string;
  messageId: number;
  ntwkMedium: string;
  payload: SmartCamerasPayload;
  pkDeviceDate: string;
  plate: string;
  shadow: number;
  timestamp: string;
}
```

</details>

<details>
<summary><code><b>obterMotoristasPorVeiculo(idVeiculo: number)</b></code></summary>

Lista motoristas vinculados a um veículo específico.

```typescript
const motoristas = await client.obterMotoristasPorVeiculo(2248181);
```

**Retorno:** `T.MotoristaVeiculo[]`

</details>

<details>
<summary><code><b>obterLayoutAreaAvd()</b></code></summary>

Lista grupos/áreas AVD com metadados de auditoria.

**Retorno (`T.LayoutGrupoAreaAvd[]`):**

```typescript
interface LayoutGrupoAreaAvd {
  clienteId: number;
  dataAlteracao: string;
  dataCriacao: string;
  dataExclusao: string;
  gerenciadoraId: number;
  id: number;
  logEfetivoDelelete: number;
  logEfetivoInsert: number;
  logEfetivoUpdate: number;
  logIdDelelete: number;
  logIdInsert: number;
  logIdUpdate: number;
  nome: string;
}
```

</details>

<details>
<summary><code><b>obterLayoutData(layout: string)</b></code></summary>

Retorna dados (não detalhado) de um layout específico.

**Retorno:** `T.Layout[]`

</details>

<details>
<summary><code><b>obterMensagemPortal(idVeiculo: number)</b></code></summary>

Mensagens do portal Sascar associadas ao veículo.

**Retorno (`T.MensagemPortal[]`):**

```typescript
interface MensagemPortal {
  mensagem: string;
}
```

</details>

<details>
<summary><code><b>obterPacoteIntegracaoDeltatelemetria(quantidade = 3000)</b></code></summary>

Variante do `obterDeltaTelemetriaIntegracao` que recebe apenas `quantidade`. Drena pacotes acumulados da fila do servidor.

```typescript
const deltas = await client.obterPacoteIntegracaoDeltatelemetria(100);
```

**Retorno:** `T.DeltaTelemetria[]`

</details>

<details>
<summary><code><b>obterPacotePosicoesComPlaca(quantidade = 3000)</b></code></summary>

Variante do `obterPacotePosicoes` que adiciona o campo `placa` em cada item.

**Retorno:** `T.PacotePosicaoXML[]` (com `placa` preenchida)

</details>

<details>
<summary><code><b>obterTelemetriaPortal(idVeiculo: number)</b></code></summary>

Snapshot mínimo de telemetria do portal.

**Retorno (`T.TelemetriaPortal[]`):**

```typescript
interface TelemetriaPortal {
  embreagem: number;
  estadoLimpadorParabrisa: number;
  freio: number;
  motorFuncionando: number;
}
```

</details>

<details>
<summary><code><b>obterEventoTelemetriaIntegracaoDataChegada(dataInicio, dataFinal, dataChegadaInicio, dataChegadaFinal, idVeiculo, idEventoList?)</b></code></summary>

Eventos de telemetria filtrados por range de data de chegada (variante do `obterEventoTelemetriaIntegracao`).

```typescript
const eventos = await client.obterEventoTelemetriaIntegracaoDataChegada(
  '2026-06-16 00:00:00', '2026-06-16 23:59:59',
  '2026-06-16 00:00:00', '2026-06-16 23:59:59',
  2248181
);
```

**Retorno:** `T.EventoTelemetria[]` (inclui campo extra `dataChegada`)

</details>

<details>
<summary><code><b>verificarVeiculoIntegrado(idVeiculo: number)</b></code></summary>

Verifica se o veículo está integrado/ativo no sistema. Retorna boolean único, **não array**.

```typescript
const ativo: boolean = await client.verificarVeiculoIntegrado(2248181);
```

</details>

### 🧭 Helpers de mapeamento de atuadores/sensores

Helpers de conveniência que cruzam o cadastro do veículo (`obterVeiculos`) com o catálogo Sascar (`obterGrupoAtuadores`) para expor a descrição amigável de cada slot.

<details>
<summary><code><b>getMapeamentoVeiculo(idVeiculo: number, opts?)</b></code></summary>

Retorna o mapeamento completo do veículo.

```typescript
const map = await client.getMapeamentoVeiculo(2248181);
// map.atuadores[2] === { slot: 2, idAtuador: 240, descricao: "Sirene", tipoPorta: "S" }
// map.atuadores[3] === { slot: 3, idAtuador: 254, descricao: "Trava Bau Traseiro", tipoPorta: "S" }
// map.atuadores[7] === { slot: 7, idAtuador: 232, descricao: "Buzzer", tipoPorta: "S" }
// map.portaBloqueio === 1
// map.portaPanico === 9
// map.sensores[3] === { slot: 3, idSensor: 231, descricao: "Violacao Painel", tipoPorta: "E" }
```

**Otimização:** se você já tem as listas em memória, passe-as em `opts` para evitar HTTP:

```typescript
const map = await client.getMapeamentoVeiculo(2248181, { veiculos, atuadores });
```

**Retorno:** `T.VeiculoMapeado`

</details>

<details>
<summary><code><b>findAtuador(idVeiculo: number, descricaoOrSlot: string | number, opts?)</b></code></summary>

Localiza um atuador pelo nome (substring case-insensitive) ou pelo slot.

```typescript
const sirene = await client.findAtuador(2248181, 'sirene');
// { slot: 2, idAtuador: 240, descricao: "Sirene", tipoPorta: "S" }

const trava = await client.findAtuador(2248181, 'trava');
// { slot: 3, idAtuador: 254, descricao: "Trava Bau Traseiro", tipoPorta: "S" }

// Casos especiais — portas dedicadas fora do catálogo:
const blq = await client.findAtuador(2248181, 'bloqueio');
// { slot: 1, idAtuador: 0, descricao: "Bloqueio (porta dedicada)", tipoPorta: "S" }

const pan = await client.findAtuador(2248181, 'panico');
// { slot: 9, idAtuador: 0, descricao: "Pânico (porta dedicada)", tipoPorta: "S" }
```

Retorna `null` se nenhum atuador bater.

**Retorno:** `T.AtuadorMapeado | null`

</details>

> ⚠ **Nota sobre comandos de bloqueio/sirene/buzzer:** o WS SasIntegra é **somente-leitura** para dados de frota. Não existem endpoints `bloquearVeiculo`, `acionarSirene` etc. no WSDL. Para enviar comandos reais ao veículo, é necessário usar um canal separado da Sascar (UI da plataforma ou API REST distinta). Os helpers acima resolvem **qual slot/porta** corresponde a cada comando — você usa essa informação no canal de comando que tem disponível.
