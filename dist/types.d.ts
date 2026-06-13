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
    CPF?: number;
    CNPJ?: number | string;
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
    eventos: {
        codigo: number;
    }[];
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
    esn: string | null;
    idProjeto: number | null;
    isTelemetry: boolean;
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
