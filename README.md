# 🚛 Sascar Integra SDK v2.07 - Documentação Completa

SDK corporativo em TypeScript para integração com o Web Service SOAP da **SASCAR (SasIntegra v2.07)**.
Este documento lista **100% dos métodos e atributos** que podem ser consumidos da API através desta biblioteca.

## Instalação

```bash
npm install github:MartielLima/sascar-sdk
# ou
bun add github:MartielLima/sascar-sdk
```

## Uso Básico

```typescript
import { SascarClient } from 'sascar-sdk';
const client = new SascarClient({ usuario: 'foo', senha: 'bar' });
// Opcional: as credenciais podem ser omitidas se SASCAR_USUARIO e SASCAR_SENHA estiverem no seu .env
```

---

## 📚 Referência Completa da API

Abaixo estão listados todos os `60` métodos suportados pelo SDK.
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
  CPF?: number;
  CNPJ?: number | string;
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
  esn: string | null;
  idProjeto: number | null;
  isTelemetry: boolean;
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
  esn: string | null;
  idProjeto: number | null;
  isTelemetry: boolean;
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
