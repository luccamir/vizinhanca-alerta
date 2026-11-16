/* ==========================================================================
   VizinhançaAlerta — js/dados.js
   Base de dados da simulação (MVP).
   ATENÇÃO: arquivo carregado via <script src> clássico (sem ES Modules),
   para funcionar abrindo o index.html direto no navegador (file://).
   Todas as declarações são globais (const no escopo do script).

   DADOS SIMULADOS PARA DEMONSTRAÇÃO DO MVP:
   - As coordenadas (lat/lng) são APROXIMADAS, apenas para posicionar o mapa
     na região correta de cada bairro.
   - Pontos de apoio e rotas são SUGESTÕES SIMULADAS. Antes de qualquer uso
     real, precisam ser validados com a Defesa Civil (199) e a CET.
   ========================================================================== */

"use strict";

/* --------------------------------------------------------------------------
   1. Textos dos selos de simulação
   -------------------------------------------------------------------------- */
const SELO_SIMULACAO = "Dados simulados para demonstração do MVP";
const AVISO_ROTAS = "Rotas e pontos de apoio simulados para demonstração. Em emergência real, siga a Defesa Civil (199) e o Corpo de Bombeiros (193).";

/* --------------------------------------------------------------------------
   2. Mapa geral da Zona Leste (visão inicial do iframe do OpenStreetMap)
   -------------------------------------------------------------------------- */
const MAPA_ZONA_LESTE = {
  centro: { lat: -23.4990, lng: -46.4380 },
  limites: { minLat: -23.5200, maxLat: -23.4780, minLng: -46.5000, maxLng: -46.3800 }
};

/* --------------------------------------------------------------------------
   3. Zonas geográficas dos bairros
   - slug: valor ASCII para classes/atributos
   - centro / limites: usados para enquadrar o mapa e para gerar a posição
     de novos reportes criados no formulário (sempre dentro do bairro)
   - pontoApoio + rotas padrão: usados pelos reportes da comunidade
   -------------------------------------------------------------------------- */
const zonasBairros = {
  "Ermelino Matarazzo": {
    slug: "ermelino-matarazzo",
    centro: { lat: -23.5005, lng: -46.4830 },
    limites: { minLat: -23.5090, maxLat: -23.4930, minLng: -46.4930, maxLng: -46.4730 },
    pontoApoio: { nome: "Ponto de apoio EM (simulado)", lat: -23.5060, lng: -46.4815 },
    rotaCidadaoPadrao: "Afaste-se da várzea do Rio Tietê seguindo sentido sul pelas ruas mais altas. Não atravesse trechos com água corrente.",
    rotaSocorristaPadrao: "Aproximação pela Av. São Miguel, entrando no bairro pelo lado sul, de cota mais alta."
  },
  "São Miguel Paulista": {
    slug: "sao-miguel-paulista",
    centro: { lat: -23.4960, lng: -46.4440 },
    limites: { minLat: -23.5030, maxLat: -23.4890, minLng: -46.4540, maxLng: -46.4340 },
    pontoApoio: { nome: "Ponto de apoio SM (simulado)", lat: -23.5010, lng: -46.4430 },
    rotaCidadaoPadrao: "Siga sentido sul, afastando-se das baixadas próximas ao rio. Prefira ruas largas e iluminadas até o ponto de apoio.",
    rotaSocorristaPadrao: "Aproximação pela Av. Marechal Tito e acesso às ruas locais pelo lado sul."
  },
  "Vila Jacuí": {
    slug: "vila-jacui",
    centro: { lat: -23.5080, lng: -46.4560 },
    limites: { minLat: -23.5160, maxLat: -23.5010, minLng: -46.4650, maxLng: -46.4470 },
    pontoApoio: { nome: "Ponto de apoio VJ (simulado)", lat: -23.5125, lng: -46.4545 },
    rotaCidadaoPadrao: "Evite a baixada do córrego mais próximo e suba pelas ruas transversais até o ponto de apoio.",
    rotaSocorristaPadrao: "Aproximação pela Av. Jacu-Pêssego, entrando no bairro pelas vias mais altas."
  },
  "Jardim Romano": {
    slug: "jardim-romano",
    centro: { lat: -23.4870, lng: -46.3930 },
    limites: { minLat: -23.4940, maxLat: -23.4810, minLng: -46.4010, maxLng: -46.3850 },
    pontoApoio: { nome: "Ponto de apoio JR (simulado)", lat: -23.4925, lng: -46.3915 },
    rotaCidadaoPadrao: "Saia sentido sul, afastando-se da várzea do Rio Tietê. Não use as ruas mais baixas, próximas ao rio.",
    rotaSocorristaPadrao: "Aproximação pela Av. Marechal Tito e acesso ao bairro pelo lado sul, longe da margem do rio."
  },
  "Itaim Paulista": {
    slug: "itaim-paulista",
    centro: { lat: -23.4995, lng: -46.3980 },
    limites: { minLat: -23.5070, maxLat: -23.4930, minLng: -46.4080, maxLng: -46.3880 },
    pontoApoio: { nome: "Ponto de apoio IP (simulado)", lat: -23.5045, lng: -46.3970 },
    rotaCidadaoPadrao: "Siga sentido sul pelas ruas mais altas até o ponto de apoio, evitando baixadas e córregos.",
    rotaSocorristaPadrao: "Aproximação pela Av. Marechal Tito, com entrada pelas transversais do lado sul."
  }
};

/* Lista ordenada dos bairros (para popular <select> de filtro e formulário) */
const listaBairros = Object.keys(zonasBairros);

/* --------------------------------------------------------------------------
   4. Domínios válidos (enumerações) + mapeamento para classes CSS (slugs ASCII)
   -------------------------------------------------------------------------- */
const STATUS_BUEIRO = ["Obstruído", "Parcialmente Obstruído", "Limpo"];
const NIVEIS_AGUA = ["Crítico", "Moderado", "Normal"];
const NIVEIS_RISCO = ["Alto", "Médio", "Baixo"];

/* Valor exibido → valor usado em data-risco / classes de badge */
const SLUG_RISCO = {
  "Alto": "alto",
  "Médio": "medio",
  "Baixo": "baixo"
};

const SLUG_STATUS = {
  "Obstruído": "obstruido",
  "Parcialmente Obstruído": "parcial",
  "Limpo": "limpo"
};

const SLUG_NIVEL = {
  "Crítico": "critico",
  "Moderado": "moderado",
  "Normal": "normal"
};

/* Ordem de prioridade para ordenação (Alto primeiro) */
const PRIORIDADE_RISCO = {
  "Alto": 1,
  "Médio": 2,
  "Baixo": 3
};

/* --------------------------------------------------------------------------
   5. Pontos monitorados (12 registros simulados)
   - lat/lng: posição aproximada da rua
   - pontoSeguro*: ponto de apoio simulado em área mais alta (a validar)
   - vulneraveisQtd: nº de idosos/PcD no raio (usado no painel do socorrista)
   -------------------------------------------------------------------------- */
const pontosMonitorados = [
  {
    id: 1,
    rua: "Rua Capachós, 180",
    bairro: "Jardim Romano",
    lat: -23.4850,
    lng: -46.3955,
    statusBueiro: "Obstruído",
    nivelAgua: "Crítico",
    risco: "Alto",
    ultimaAtualizacao: "Há 3 min",
    vulneraveisNoRaio: "14 idosos/PcD cadastrados no raio de 200m",
    vulneraveisQtd: 14,
    pontoSeguroNome: "Ponto de apoio JR-1 (simulado)",
    pontoSeguroLat: -23.4905,
    pontoSeguroLng: -46.3930,
    rotaEvacuacaoCidadao: "Saia sentido sul, afastando-se da margem do Rio Tietê. Não desça para as ruas mais baixas e nunca atravesse água em movimento.",
    rotaAcessoSocorrista: "Entrada pela Av. Marechal Tito e aproximação pelo lado sul da rua, de cota mais alta. Evite a aproximação pelo lado do rio."
  },
  {
    id: 2,
    rua: "Travessa Pedra Dourada, 42",
    bairro: "Jardim Romano",
    lat: -23.4878,
    lng: -46.3902,
    statusBueiro: "Parcialmente Obstruído",
    nivelAgua: "Moderado",
    risco: "Médio",
    ultimaAtualizacao: "Há 12 min",
    vulneraveisNoRaio: "6 idosos/PcD e 2 gestantes cadastrados no raio de 200m",
    vulneraveisQtd: 6,
    pontoSeguroNome: "Ponto de apoio JR-2 (simulado)",
    pontoSeguroLat: -23.4925,
    pontoSeguroLng: -46.3890,
    rotaEvacuacaoCidadao: "Suba pela travessa no sentido sul até a primeira rua transversal mais alta e siga até o ponto de apoio. Ajude as gestantes a sair primeiro.",
    rotaAcessoSocorrista: "Acesso pelas transversais ao sul do bairro. A travessa é estreita: prefira viatura leve e aproximação a pé no trecho final."
  },
  {
    id: 3,
    rua: "Rua Tibúrcio de Sousa, 1250",
    bairro: "Itaim Paulista",
    lat: -23.4985,
    lng: -46.4030,
    statusBueiro: "Obstruído",
    nivelAgua: "Crítico",
    risco: "Alto",
    ultimaAtualizacao: "Há 5 min",
    vulneraveisNoRaio: "21 idosos/PcD cadastrados no raio de 200m",
    vulneraveisQtd: 21,
    pontoSeguroNome: "Ponto de apoio IP-1 (simulado)",
    pontoSeguroLat: -23.5035,
    pontoSeguroLng: -46.4010,
    rotaEvacuacaoCidadao: "Siga sentido sul, afastando-se do bueiro obstruído. Use a calçada do lado mais alto da rua e não atravesse cruzamentos alagados.",
    rotaAcessoSocorrista: "Aproximação pela Av. Marechal Tito e entrada na rua pelo lado sul. Alto número de idosos/PcD: priorize equipe com maca."
  },
  {
    id: 4,
    rua: "Avenida Marechal Tito, 6800",
    bairro: "Itaim Paulista",
    lat: -23.5005,
    lng: -46.3965,
    statusBueiro: "Limpo",
    nivelAgua: "Normal",
    risco: "Baixo",
    ultimaAtualizacao: "Há 25 min",
    vulneraveisNoRaio: "3 idosos/PcD cadastrados no raio de 200m",
    vulneraveisQtd: 3,
    pontoSeguroNome: "Ponto de apoio IP-2 (simulado)",
    pontoSeguroLat: -23.5050,
    pontoSeguroLng: -46.3955,
    rotaEvacuacaoCidadao: "Sem alagamento no momento. Se a chuva aumentar, siga sentido sul pela calçada da avenida até o ponto de apoio.",
    rotaAcessoSocorrista: "Via arterial livre no momento: pode servir de corredor de acesso para as ruas vizinhas em risco."
  },
  {
    id: 5,
    rua: "Rua Pedro Soares de Andrade, 310",
    bairro: "Itaim Paulista",
    lat: -23.4970,
    lng: -46.3925,
    statusBueiro: "Parcialmente Obstruído",
    nivelAgua: "Moderado",
    risco: "Médio",
    ultimaAtualizacao: "Há 9 min",
    vulneraveisNoRaio: "9 idosos/PcD e 1 gestante cadastrados no raio de 200m",
    vulneraveisQtd: 9,
    pontoSeguroNome: "Ponto de apoio IP-3 (simulado)",
    pontoSeguroLat: -23.5020,
    pontoSeguroLng: -46.3915,
    rotaEvacuacaoCidadao: "Siga sentido sul até a avenida principal e continue até o ponto de apoio. Evite a esquina com o bueiro parcialmente obstruído.",
    rotaAcessoSocorrista: "Acesso pela Av. Marechal Tito e entrada pelas transversais do lado sul."
  },
  {
    id: 6,
    rua: "Rua Pedro Kelly, 95",
    bairro: "Vila Jacuí",
    lat: -23.5060,
    lng: -46.4590,
    statusBueiro: "Obstruído",
    nivelAgua: "Moderado",
    risco: "Alto",
    ultimaAtualizacao: "Há 8 min",
    vulneraveisNoRaio: "11 idosos/PcD cadastrados no raio de 200m",
    vulneraveisQtd: 11,
    pontoSeguroNome: "Ponto de apoio VJ-1 (simulado)",
    pontoSeguroLat: -23.5110,
    pontoSeguroLng: -46.4575,
    rotaEvacuacaoCidadao: "Afaste-se da baixada do córrego e suba pelas ruas transversais até o ponto de apoio. Não tente passar de carro pelo trecho alagado.",
    rotaAcessoSocorrista: "Aproximação pela Av. Jacu-Pêssego e entrada pelas ruas mais altas do bairro, evitando o fundo de vale."
  },
  {
    id: 7,
    rua: "Travessa Jacuí-Mirim, 27",
    bairro: "Vila Jacuí",
    lat: -23.5100,
    lng: -46.4535,
    statusBueiro: "Limpo",
    nivelAgua: "Normal",
    risco: "Baixo",
    ultimaAtualizacao: "Há 31 min",
    vulneraveisNoRaio: "4 idosos/PcD cadastrados no raio de 200m",
    vulneraveisQtd: 4,
    pontoSeguroNome: "Ponto de apoio VJ-2 (simulado)",
    pontoSeguroLat: -23.5145,
    pontoSeguroLng: -46.4520,
    rotaEvacuacaoCidadao: "Sem alagamento no momento. Em caso de chuva forte, siga pela travessa até a rua de cima e continue ao ponto de apoio.",
    rotaAcessoSocorrista: "Via local livre no momento. Acesso pelas ruas mais altas do bairro."
  },
  {
    id: 8,
    rua: "Avenida Pires do Rio, 2100",
    bairro: "São Miguel Paulista",
    lat: -23.4945,
    lng: -46.4480,
    statusBueiro: "Parcialmente Obstruído",
    nivelAgua: "Crítico",
    risco: "Alto",
    ultimaAtualizacao: "Há 2 min",
    vulneraveisNoRaio: "17 idosos/PcD e 3 gestantes cadastrados no raio de 200m",
    vulneraveisQtd: 17,
    pontoSeguroNome: "Ponto de apoio SM-1 (simulado)",
    pontoSeguroLat: -23.4995,
    pontoSeguroLng: -46.4460,
    rotaEvacuacaoCidadao: "Água em nível crítico: não atravesse a avenida. Saia pelas ruas laterais no sentido sul até o ponto de apoio.",
    rotaAcessoSocorrista: "Avenida com água em nível crítico: aproximação pela Av. Marechal Tito e acesso pelas transversais ao sul."
  },
  {
    id: 9,
    rua: "Rua Dona Ana Flora Pinheiro de Sousa, 430",
    bairro: "São Miguel Paulista",
    lat: -23.4975,
    lng: -46.4410,
    statusBueiro: "Limpo",
    nivelAgua: "Moderado",
    risco: "Médio",
    ultimaAtualizacao: "Há 15 min",
    vulneraveisNoRaio: "8 idosos/PcD cadastrados no raio de 200m",
    vulneraveisQtd: 8,
    pontoSeguroNome: "Ponto de apoio SM-2 (simulado)",
    pontoSeguroLat: -23.5020,
    pontoSeguroLng: -46.4400,
    rotaEvacuacaoCidadao: "Siga sentido sul pela calçada do lado mais alto até o ponto de apoio. Fique atento a novos pontos de acúmulo de água.",
    rotaAcessoSocorrista: "Acesso pela Av. Marechal Tito e entrada pelas vias locais do lado sul."
  },
  {
    id: 10,
    rua: "Avenida Paranaguá, 1500",
    bairro: "Ermelino Matarazzo",
    lat: -23.4975,
    lng: -46.4845,
    statusBueiro: "Obstruído",
    nivelAgua: "Crítico",
    risco: "Alto",
    ultimaAtualizacao: "Há 6 min",
    vulneraveisNoRaio: "12 idosos/PcD cadastrados no raio de 200m",
    vulneraveisQtd: 12,
    pontoSeguroNome: "Ponto de apoio EM-1 (simulado)",
    pontoSeguroLat: -23.5025,
    pontoSeguroLng: -46.4830,
    rotaEvacuacaoCidadao: "Saia sentido sul, afastando-se da várzea do Tietê. Não atravesse a avenida alagada; use as ruas transversais mais altas.",
    rotaAcessoSocorrista: "Aproximação pela Av. São Miguel e entrada pelo lado sul. Avenida com bueiro obstruído: evite o trecho mais baixo."
  },
  {
    id: 11,
    rua: "Rua Abel Tavares, 220",
    bairro: "Ermelino Matarazzo",
    lat: -23.5010,
    lng: -46.4790,
    statusBueiro: "Parcialmente Obstruído",
    nivelAgua: "Normal",
    risco: "Médio",
    ultimaAtualizacao: "Há 19 min",
    vulneraveisNoRaio: "5 idosos/PcD cadastrados no raio de 200m",
    vulneraveisQtd: 5,
    pontoSeguroNome: "Ponto de apoio EM-2 (simulado)",
    pontoSeguroLat: -23.5055,
    pontoSeguroLng: -46.4780,
    rotaEvacuacaoCidadao: "Nível da água normal, mas bueiro parcialmente obstruído. Se a chuva aumentar, siga sentido sul até o ponto de apoio.",
    rotaAcessoSocorrista: "Acesso pela Av. São Miguel e pelas vias locais do lado sul."
  },
  {
    id: 12,
    rua: "Travessa Boturussu, 64",
    bairro: "Ermelino Matarazzo",
    lat: -23.5035,
    lng: -46.4865,
    statusBueiro: "Limpo",
    nivelAgua: "Normal",
    risco: "Baixo",
    ultimaAtualizacao: "Há 40 min",
    vulneraveisNoRaio: "2 idosos/PcD cadastrados no raio de 200m",
    vulneraveisQtd: 2,
    pontoSeguroNome: "Ponto de apoio EM-3 (simulado)",
    pontoSeguroLat: -23.5080,
    pontoSeguroLng: -46.4850,
    rotaEvacuacaoCidadao: "Sem alagamento no momento. Em caso de chuva forte, siga pela travessa até a rua de cima e continue ao ponto de apoio.",
    rotaAcessoSocorrista: "Via local livre no momento. Acesso pela Av. São Miguel."
  }
];

/* --------------------------------------------------------------------------
   6. Chaves do localStorage
   -------------------------------------------------------------------------- */
const CHAVES_STORAGE = {
  letraGrande: "va_letra_grande",       // "true" | "false" (botão "Letra maior")
  reportes: "va_reportes_usuario",      // JSON de reportes criados no formulário
  perfilRota: "va_perfil_rota",         // "cidadao" | "socorrista"
  bairroUsuario: "va_bairro_usuario",   // bairro escolhido na página inicial
  atendimentos: "va_atendimentos",      // situação do atendimento de cada rua (socorrista)
  sessaoSocorrista: "va_sessao_socorrista" // matrícula do socorrista conectado (sessionStorage)
};

/* --------------------------------------------------------------------------
   7. Tamanhos do texto para o botão "Letra maior" (em px)
   -------------------------------------------------------------------------- */
const CONFIG_FONTE = {
  normal: 16,
  grande: 20
};
