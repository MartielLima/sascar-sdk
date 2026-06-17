export interface SascarCredentials {
  usuario?: string;
  senha?: string;
}

/**
 * Tipo para o corpo de uma requisição SOAP.
 * Cada chave é um parâmetro da operação e o valor é o dado enviado.
 */
export type SoapBody = Record<string, unknown>;

export interface AlertaAVD {
  acoes: string;
  idAlerta: string;
  login: string;
  nomeAlerta: string;
}

export interface GrupoAtuador {
  idAtuador: number;
  descricao: string;
  tipoPorta: string;
}

export interface CadastroAlertaAVD {
  evento: string;
  id: string;
  login: string;
  timezone: string;
}

export interface Cliente {
  idCliente: number;
  nome: string;
  /** CPF do cliente (PF). API retorna 0 quando ausente. */
  cpf?: number;
  /** CNPJ do cliente (PJ). Pode vir como número (com zero à esquerda truncado) ou string. */
  cnpj?: number | string;
}

export interface ClienteV2 {
  cnpj: string;
  cpf: string;
  idCliente: number;
  nome: string;
}

export interface StatusComando {
  idStatusComando: number;
  dataExec: string;
}

export interface TipoComando {
  idTipoComando: number;
  nome: string;
  descricao: string;
}

export interface PacotePosicaoXML {
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
  eventoSequenciamento?: SequenciamentoEvento[];
  evento?: PosicaoEvento[];
  jamming?: number;
  statusAncora?: number;
  idMotorista?: number;
  nomeMotorista?: string;
  nivelCombustivel?: number;
  litrometro?: number;
  estadoLimpadorParabrisa?: number;
  eventosTelemetria?: EventoTelemetria[];
  acessorios?: AcessorioVeiculo;
  placa?: string;
  /** ID da integradora/conta na Sascar. Observado em respostas reais, ausente no manual v2.07. */
  integradoraId?: number;
  /** Nome amigável da mensagem (correlato a `codigoMacro`). Observado em respostas reais. */
  nomeMensagem?: string;
  /** Eventos formatados como string (telemetria/sequenciamento). Observado em respostas reais. */
  eventoFormatado?: string;
  /** Sequenciamento formatado como string. Observado em respostas reais. */
  eventoSeqFormatado?: string;
  /** Temperatura do sensor serial. Observado em respostas reais XML, ausente no manual v2.07. */
  temperaturaSerial?: number;
  /** Umidade do sensor serial. Observado em respostas reais XML, ausente no manual v2.07. */
  umidadeSerial?: number;
}

export interface PacotePosicaoJSON {
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
  eventoSequenciamento: SequenciamentoEvento[];
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
  /** Odômetro de alta precisão (acumulado real do veículo). Observado em produção, não documentado no manual v2.07. */
  odometroExato?: number;
  /** Eventos de telemetria detalhados. Observado em variantes "Motorista" da API real. */
  eventosTelemetria?: EventoTelemetria[];
  placa?: string;
}

export interface PositionPacketJSON {
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
  sequencingEvent?: SequenciamentoEvento[];
  events?: PosicaoEvento[];
  jamming?: number;
  anchorStatus?: number;
  packetId?: number;
  integratorId?: number;
  driverId?: number;
  driverName?: string;
  fuelLevel?: number;
  lithometer?: number;
  windshieldWiperState?: number;
  telemetryEvents?: EventoTelemetria[];
  humiditySerial?: number;
  temperatureSerial?: number;
  licensePlate?: string;
}

export interface MacroTd50Tmcd {
  idMacroTd50Tmcd: number;
  idVeiculo: number;
  nome: string;
  layout: string;
  layoutDetalhado?: string;
}

export interface MacroTd50TmcdDetalhado {
  idMacroTd50Tmcd: number;
  nome: string;
  listaLayout: string[];
  listaVeiculos: Veiculo[];
}

export interface MascaraDispositivo {
  atuadores: number[];
}

export interface MacroTd40 {
  idMacroTd40: number;
  idVeiculo: number;
  Mensagem: string;
  tipoMensagem: number;
}

export interface Layout {
  idLayout: number;
  descricao: string;
  tipoTeclado: number;
}

export interface ObterLayoutData {
  dataAlteracao: string;
  dataCriacao: string;
  descricao: string;
  idLayout: number;
  TipoTeclado: number;
}

export interface LayoutAcaoEmbarcadaAVD {
  idLayoutAcaoEmbarcadaAVD: number;
  nome: string;
}

export interface Rota {
  Login: string;
  Id: string;
  NomeRota: string;
}

export interface Veiculo {
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
  /** ESN do equipamento. Pode estar ausente em respostas reais. */
  esn?: string | null;
  /** ID de projeto da Sascar. Pode estar ausente em respostas reais. */
  idProjeto?: number | null;
  /** Indica se o veículo tem telemetria habilitada. API real retorna `telemetria` (não `isTelemetry`). */
  telemetria: boolean;
}

export interface VeiculoRFNacional {
  ccid: string;
  descricao: string;
  idCliente: number;
  idVeiculo: number;
  placa: string;
  satelital: boolean;
  telemetria: boolean;
}

export interface DadosAdicionais {
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

export interface PontoReferencia {
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

export interface SequenciamentoEvento {
  idSequenciamentoEvento: number;
  atuador: number;
  descricao: string;
}

export interface EnderecoPosicao {
  cidade: string;
  Rua: string;
  uf: string;
}

export interface EventoTempoDirecao {
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

export interface Motorista {
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

export interface MotoristaVeiculo {
  idMotoristaVeiculo: number;
  idMotorista: number;
  idVeiculo: string;
}

export interface LayoutTecladoVeiculo {
  idVeiculo: number;
  idLayout: number;
  tipoLayout: string;
}

export interface LayoutGrupoPonto {
  idLayoutGrupoPonto: number;
  nome: string;
}

export interface PacoteLocalizacao {
  dataPacote: string;
  direcao: number;
  gps: number;
  idVeiculo: number;
  ignicao: number;
  latitude: number;
  longitude: number;
  velocidade: number;
}

export interface LogComando {
  mensagem: string;
  codigo: string;
}

export interface EventoTelemetria {
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

export interface TipoEventoTelemetriaDescricao {
  eventoDescricao: string;
  eventoTipo: string;
  idEvento: number;
}

export interface DeltaTelemetria {
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
  /** Tempo na faixa amarela (agregado). Observado em respostas reais. */
  tempoDuracaoFaixaAmarela?: number;
  /** Tempo na faixa azul. Observado em respostas reais (não consta no manual v2.07). */
  tempoDuracaoFaixaAzul?: number;
  /** Tempo na faixa verde (agregado). Observado em respostas reais. */
  tempoDuracaoFaixaVerde?: number;
  /** Tempo na faixa vermelha. Observado em respostas reais (não consta no manual v2.07). */
  tempoDuracaoFaixaVermelha?: number;
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

export interface MacroTms3 {
  idMacroTms3: number;
  idVeiculo: number;
  nome: string;
  layout: string;
}

export interface CaixaPretaList {
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

export interface ParametrizacaoTelemetria {
  arrancadaBruscaSensibilidadeInfracao?: number;
  banguelaSensibilidadeInfracao?: number;
  banguelaVelocidadeMinima?: number;
  buzzerEstadoEvento?: number;
  defeitoAlternadorSensibilidadeInfracao?: number;
  defeitoAlternadorTensaoMaxima?: number;
  defeitoAlternadorTensaoMinima?: number;
  defeitoAlternadorTensaoNormalOperacao?: number;
  excessoTempoParadoSensibilidadeInfracao?: number;
  excessoVelocidadeMaximaRodoviarioComChuva?: number;
  excessoVelocidadeMaximaRodoviarioSemChuva?: number;
  excessoVelocidadeMaximaTrechoUrbanoComChuva?: number;
  excessoVelocidadeMaximaTrechoUrbanoSemChuva?: number;
  excessoVelocidadeSensibilidadeInfracao?: number;
  faixaAzulLimitSuperior?: number;
  faixaAzulLimiteInferior?: number;
  faixaVerdeLimiteInferior?: number;
  faixaVerdeLimiteSuperior?: number;
  faixaVermelhaLimite?: number;
  fimChuvaSensibilidadeInfracao?: number;
  freadaBruscaSensibilidadeInfracao?: number;
  freadaPeFreio?: number;
  freadaVelocidadeMinima?: number;
  ignicaoExessivaSensibilidadeInfracao?: number;
  inicioChuvaSensibilidadeInfracao?: number;
  marchaLentaExessivaSensibilidadeInfracao?: number;
  peEmbreagemSensibilidadeInfracao?: number;
  pressaoOleoSensibilidadeInfracao?: number;
  rotacaoSensibilidadeInfracao?: number;
  tipoVeiculo?: number;
}

/**
 * Resposta de `solicitarEventosCaixaPreta`. A Sascar não documenta o
 * formato exato (operação marcada como @deprecated), portanto o tipo
 * é permissivo.
 */
export interface CaixaPretaSolicitacao {
  protocolo?: string;
  mensagem?: string;
  dataSolicitacao?: string;
}

/**
 * Evento atômico registrado em um pacote de posição.
 */
export interface PosicaoEvento {
  codigo: number;
  descricao?: string;
  dataHora?: string;
}

/**
 * Estado de acessórios do veículo no momento da posição.
 * Estrutura flexível porque o manual não padroniza o conteúdo.
 */
export interface AcessorioVeiculo {
  [chave: string]: string | number | boolean | null;
}

// ============================================================================
// Tipos para os métodos descobertos no WSDL ao vivo (não documentados no
// manual v2.07). Adicionados após auditoria do XSD em 2026-06-17.
// ============================================================================

/**
 * Retorno de `consultaQuantidadePacotesPosicoesPendentes`. Indica quantos
 * pacotes de posição estão aguardando consumo na fila do servidor.
 */
export interface PacotePendente {
  dtUltimaRequisicao: string;
  qtdPacotesPendentes: number;
}

/**
 * Identificação do motorista vinculado a um evento de SmartCameras.
 */
export interface SmartCamerasMotorista {
  cpf: string;
  nome: string;
  registration: string;
}

/**
 * Payload do evento de SmartCameras (dados do hardware + arquivo capturado).
 * Todos os campos chegam como string mesmo quando numéricos.
 */
export interface SmartCamerasPayload {
  camera: string;
  data_size: string;
  direction: string;
  driver_id: string;
  event_id: string;
  file: string;
  gps_valid: string;
  lat: string;
  lon: string;
  num_cams: string;
  num_sats: string;
  perclos_id: string;
  perclos_value: string;
  request_id: string;
  resolution: string;
  timestamp: string;
  upload_duration: string;
  vel: string;
  video_duration: string;
}

/**
 * Evento de SmartCameras (câmeras embarcadas Sascar).
 */
export interface SmartCamerasEvento {
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

/**
 * Parâmetros aceitos por `getSmartCamerasEvents`. Quase todos opcionais; a
 * única obrigatoriedade prática é o `agrupador` (cliente/conta).
 */
export interface SmartCamerasEventsParams {
  agrupador: string;
  offset?: number;
  limit?: number;
  motoristas?: string;
  veiculos?: string;
  dataInicio?: string;
  dataFim?: string;
  tipoEvento?: string;
  criticidade?: string;
  turno?: string;
  diaSemana?: string;
  quantidade?: number;
  status?: string;
}

/**
 * Grupo/área AVD retornado por `obterLayoutAreaAvd`. Mantém estrutura
 * detalhada de auditoria (logs de insert/update/delete).
 */
export interface LayoutGrupoAreaAvd {
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

/**
 * Mensagem do portal Sascar associada ao veículo.
 */
export interface MensagemPortal {
  mensagem: string;
}

/**
 * Snapshot de telemetria mínima do portal para um veículo.
 */
export interface TelemetriaPortal {
  embreagem: number;
  estadoLimpadorParabrisa: number;
  freio: number;
  motorFuncionando: number;
}

// ============================================================================
// Tipos para os helpers de mapeamento de atuadores/sensores
// ============================================================================

/**
 * Atuador (saída) mapeado de um veículo: cruza a configuração do veículo
 * (`idAtuador1..8`) com o catálogo (`obterGrupoAtuadores`) para expor a
 * descrição amigável de cada slot.
 */
export interface AtuadorMapeado {
  /** Slot físico no dispositivo (1..8). */
  slot: number;
  /** ID do tipo de atuador no catálogo Sascar. */
  idAtuador: number;
  /** Descrição amigável (ex.: "Sirene", "Trava Bau Traseiro"). */
  descricao: string;
  /** Tipo de porta: "S" (saída/atuador) ou "E" (entrada/sensor). */
  tipoPorta: string;
}

/**
 * Sensor (entrada) mapeado de um veículo: cruza `idSensor1..8` com o catálogo.
 */
export interface SensorMapeado {
  slot: number;
  idSensor: number;
  descricao: string;
  tipoPorta: string;
}

/**
 * Mapeamento completo do veículo: cadastro + atuadores e sensores resolvidos
 * contra o catálogo Sascar. Útil para construir camadas de comando que
 * precisam saber "qual slot é a sirene".
 */
export interface VeiculoMapeado {
  veiculo: Veiculo;
  /** Atuadores ativos, indexados por slot. */
  atuadores: Record<number, AtuadorMapeado>;
  /** Sensores ativos, indexados por slot. */
  sensores: Record<number, SensorMapeado>;
  /** Slot da porta de bloqueio (campo `portaBloqueio` do cadastro). */
  portaBloqueio: number;
  /** Slot da porta de pânico (campo `portaPanico` do cadastro). */
  portaPanico: number;
}
