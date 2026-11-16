/* ==========================================================================
   VizinhançaAlerta — js/app.js
   Lógica da interface em JavaScript puro (ES6+), sem frameworks.

   COMO ESTE ARQUIVO ESTÁ ORGANIZADO
   0. Utilidades (storage seguro, criação de elementos, textos, geografia)
   1. Botão "Letra maior"     → roda em TODAS as páginas
   2. Menu mobile              → roda em TODAS as páginas
   3. Simulação + Mapa real + Painel Tático de Rotas
                               → roda SÓ se a página tiver #lista-pontos
   4. Formulário de reporte    → roda SÓ se a página tiver #form-reporte
   5. Inicialização

   REGRAS DE SEGURANÇA ADOTADAS
   - Nada de import/export: o arquivo é um <script> clássico para funcionar
     abrindo o index.html direto do disco (file://).
   - Nenhuma biblioteca de mapas: o mapa é um <iframe> nativo do
     OpenStreetMap, e o JavaScript só troca o endereço (src) dele.
   - Os dados globais vêm do js/dados.js (carregado antes deste arquivo).
   - Prevenção de XSS: todo texto vindo do usuário ou do localStorage entra
     no DOM SOMENTE via .textContent (ou setAttribute). Nunca innerHTML.
   - URLs do mapa e do GPS são montadas só com números (latitude/longitude),
     nunca com texto digitado pelo usuário.
   - Nada de alert(): toda mensagem aparece no próprio DOM.
   ========================================================================== */

(function () {
  "use strict";

  /* ========================================================================
     0. UTILIDADES
     ======================================================================== */

  /*
   * Valores de segurança caso o js/dados.js não tenha carregado.
   * Assim o botão "Letra maior" continua funcionando em qualquer página.
   */
  const CHAVES = (typeof CHAVES_STORAGE !== "undefined")
    ? CHAVES_STORAGE
    : {
      letraGrande: "va_letra_grande",
      reportes: "va_reportes_usuario",
      perfilRota: "va_perfil_rota",
      bairroUsuario: "va_bairro_usuario",
      atendimentos: "va_atendimentos",
      sessaoSocorrista: "va_sessao_socorrista"
    };

  /* Tamanhos do texto (px) para o botão "Letra maior". */
  const LETRA = (typeof CONFIG_FONTE !== "undefined")
    ? CONFIG_FONTE
    : { normal: 16, grande: 20 };

  /* Lê do localStorage sem quebrar a página (modo privado, bloqueio, etc.). */
  function lerStorage(chave) {
    try {
      return window.localStorage.getItem(chave);
    } catch (erro) {
      return null;
    }
  }

  /* Grava no localStorage. Retorna true se deu certo e false se falhou. */
  function gravarStorage(chave, valor) {
    try {
      window.localStorage.setItem(chave, valor);
      return true;
    } catch (erro) {
      return false;
    }
  }

  /*
   * Cria um elemento com classes e texto.
   * O texto SEMPRE entra por textContent → o navegador trata como texto puro,
   * então "<script>" digitado pelo usuário aparece literalmente e não executa.
   */
  function criarElemento(tag, classes, texto) {
    const elemento = document.createElement(tag);
    if (classes) {
      elemento.className = classes;
    }
    if (texto !== undefined && texto !== null) {
      elemento.textContent = String(texto);
    }
    return elemento;
  }

  /* Remove todos os filhos de um elemento (forma segura de "limpar"). */
  function limparElemento(elemento) {
    elemento.textContent = "";
  }

  /* Escreve um texto em um elemento pelo id, se ele existir na página. */
  function definirTexto(id, texto) {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.textContent = String(texto);
    }
  }

  /* Remove acentos e deixa minúsculo: "São Miguel" → "sao miguel". */
  function normalizarTexto(texto) {
    return String(texto)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
  }

  /* Número decimal aleatório entre min e max. */
  function aleatorioEntre(minimo, maximo) {
    return minimo + Math.random() * (maximo - minimo);
  }

  /* Limita um número a uma faixa. */
  function limitar(valor, minimo, maximo) {
    return Math.min(maximo, Math.max(minimo, valor));
  }

  /* Verifica se um objeto tem a chave (sem herdar do protótipo). */
  function possuiChave(objeto, chave) {
    return Object.prototype.hasOwnProperty.call(objeto, chave);
  }

  /* O usuário pediu menos animações no sistema operacional? */
  function prefereMenosMovimento() {
    return Boolean(window.matchMedia) &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /*
   * Rola a página até um elemento com scrollIntoView.
   * O header é "sticky" (fica grudado no topo), então definimos um
   * scroll-margin-top em tempo de execução (CSSOM, nada de style="" no HTML)
   * para o alvo não ficar escondido atrás dele.
   */
  function rolarAte(elemento) {
    const header = document.querySelector(".site-header");
    const alturaHeader = header ? header.offsetHeight : 0;
    elemento.style.scrollMarginTop = (alturaHeader + 16) + "px";
    elemento.scrollIntoView({
      behavior: prefereMenosMovimento() ? "auto" : "smooth",
      block: "start"
    });
  }

  /* "Há 5 min", "Há 2 h"... a partir de um timestamp. */
  function tempoRelativo(timestamp) {
    const minutos = Math.floor((Date.now() - timestamp) / 60000);
    if (minutos < 1) {
      return "Agora mesmo";
    }
    if (minutos < 60) {
      return "Há " + minutos + " min";
    }
    const horas = Math.floor(minutos / 60);
    if (horas < 24) {
      return "Há " + horas + " h";
    }
    return new Date(timestamp).toLocaleDateString("pt-BR");
  }

  /* ---------- Geografia ---------- */

  /* Coordenada com 5 casas decimais (≈ 1 metro de precisão). */
  function formatarCoordenada(numero) {
    return Number(numero).toFixed(5);
  }

  /*
   * Distância em metros entre dois pontos (fórmula de Haversine).
   * É a distância em LINHA RETA: o caminho real pelas ruas é maior.
   */
  function distanciaMetros(lat1, lng1, lat2, lng2) {
    const raioTerra = 6371000;
    const paraRad = function (graus) { return graus * Math.PI / 180; };
    const dLat = paraRad(lat2 - lat1);
    const dLng = paraRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(paraRad(lat1)) * Math.cos(paraRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * raioTerra * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function formatarDistancia(metros) {
    if (metros < 1000) {
      return "≈ " + (Math.round(metros / 10) * 10) + " m";
    }
    return "≈ " + (metros / 1000).toFixed(1).replace(".", ",") + " km";
  }

  /* Tempo a pé num ritmo cuidadoso de 3 km/h (≈ 50 m por minuto). */
  function tempoCaminhada(metros) {
    return "≈ " + Math.max(1, Math.round(metros / 50)) + " min a pé";
  }

  /* Endereço do mapa embutido do OpenStreetMap para uma área (e um marcador). */
  function urlMapaEmbed(limites, marcador) {
    let url = "https://www.openstreetmap.org/export/embed.html?bbox=" +
      [limites.minLng, limites.minLat, limites.maxLng, limites.maxLat]
        .map(formatarCoordenada).join("%2C") +
      "&layer=mapnik";
    if (marcador) {
      url += "&marker=" + formatarCoordenada(marcador.lat) + "%2C" + formatarCoordenada(marcador.lng);
    }
    return url;
  }

  /* Link para abrir o mesmo local no site do OpenStreetMap (nova aba). */
  function urlMapaAmpliado(centro, zoom, comMarcador) {
    const lat = formatarCoordenada(centro.lat);
    const lng = formatarCoordenada(centro.lng);
    const marcador = comMarcador ? "?mlat=" + lat + "&mlon=" + lng : "";
    return "https://www.openstreetmap.org/" + marcador + "#map=" + zoom + "/" + lat + "/" + lng;
  }

  /* GPS do cidadão: a pé, da rua em risco até o ponto de apoio. */
  function urlGpsCidadao(ponto) {
    return "https://www.google.com/maps/dir/?api=1" +
      "&origin=" + formatarCoordenada(ponto.lat) + "," + formatarCoordenada(ponto.lng) +
      "&destination=" + formatarCoordenada(ponto.pontoSeguroLat) + "," + formatarCoordenada(ponto.pontoSeguroLng) +
      "&travelmode=walking";
  }

  /* GPS do socorrista: de carro, da posição atual da viatura até a rua. */
  function urlGpsSocorrista(ponto) {
    return "https://www.google.com/maps/dir/?api=1" +
      "&destination=" + formatarCoordenada(ponto.lat) + "," + formatarCoordenada(ponto.lng) +
      "&travelmode=driving";
  }

  /* ========================================================================
     1. BOTÃO "LETRA MAIOR" (todas as páginas)
     Alterna o texto do site entre o tamanho normal (16px) e o grande (20px).
     A escolha fica salva no aparelho (localStorage) e vale para todas as
     páginas. Como o CSS usa rem, a página inteira cresce junto.
     ======================================================================== */

  function iniciarLetraMaior() {
    const botao = document.getElementById("btn-letra");

    function aplicarLetra(grande) {
      const tamanho = grande ? LETRA.grande : LETRA.normal;
      const html = document.documentElement;
      html.style.fontSize = tamanho + "px";
      html.setAttribute("data-font-size", String(tamanho));
      if (botao) {
        botao.setAttribute("aria-pressed", String(grande));
      }
    }

    /* Restaura a escolha salva ao abrir qualquer página. */
    aplicarLetra(lerStorage(CHAVES.letraGrande) === "true");

    if (botao) {
      botao.addEventListener("click", function () {
        const grande = botao.getAttribute("aria-pressed") !== "true";
        aplicarLetra(grande);
        gravarStorage(CHAVES.letraGrande, String(grande));
      });
    }
  }

  /* ========================================================================
     2. MENU MOBILE (todas as páginas)
     ======================================================================== */

  function iniciarMenu() {
    const botaoMenu = document.getElementById("menu-toggle");
    const menu = document.getElementById("menu-principal");
    if (!botaoMenu || !menu) {
      return;
    }

    function definirMenuAberto(aberto) {
      menu.classList.toggle("is-open", aberto);
      botaoMenu.setAttribute("aria-expanded", String(aberto));
    }

    botaoMenu.addEventListener("click", function () {
      definirMenuAberto(!menu.classList.contains("is-open"));
    });

    /* Esc fecha o menu e devolve o foco ao botão. */
    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && menu.classList.contains("is-open")) {
        definirMenuAberto(false);
        botaoMenu.focus();
      }
    });
  }

  /* ========================================================================
     3. SIMULAÇÃO + MAPA REAL + PAINEL TÁTICO DE ROTAS (apenas solucao.html)
     ======================================================================== */

  /* Conversões usadas pelos reportes criados no formulário. */
  const RISCO_POR_URGENCIA = {
    "Crítica": "Alto",
    "Moderada": "Médio",
    "Preventiva": "Baixo"
  };

  const NIVEL_AGUA_POR_URGENCIA = {
    "Crítica": "Crítico",
    "Moderada": "Moderado",
    "Preventiva": "Normal"
  };

  /*
   * Status do bueiro conforme o tipo de ocorrência.
   * Quando o tipo não diz nada sobre o bueiro, marcamos "Não verificado"
   * em vez de inventar uma informação.
   */
  const STATUS_POR_TIPO = {
    "Bueiro Obstruído": "Obstruído",
    "Acúmulo de Água na Via": "Parcialmente Obstruído",
    "Pedido de Apoio": "Não verificado",
    "Rota Bloqueada": "Não verificado"
  };

  const TIPOS_OCORRENCIA = Object.keys(STATUS_POR_TIPO);
  const TIPO_SUPORTE = "Pedido de Apoio";
  const LIMITE_REPORTES_SALVOS = 50;

  /* Visão geral usada se o dados.js não trouxer MAPA_ZONA_LESTE. */
  const VISAO_GERAL = (typeof MAPA_ZONA_LESTE !== "undefined")
    ? MAPA_ZONA_LESTE
    : {
      centro: { lat: -23.4990, lng: -46.4380 },
      limites: { minLat: -23.5200, maxLat: -23.4780, minLng: -46.5000, maxLng: -46.3800 }
    };

  /* Os dados do js/dados.js estão disponíveis? */
  function dadosDisponiveis() {
    return typeof pontosMonitorados !== "undefined" &&
      typeof zonasBairros !== "undefined" &&
      typeof SLUG_RISCO !== "undefined" &&
      typeof SLUG_STATUS !== "undefined" &&
      typeof SLUG_NIVEL !== "undefined" &&
      typeof PRIORIDADE_RISCO !== "undefined";
  }

  /* Slugs ASCII usados nas classes CSS / atributos data-. */
  function slugRisco(risco) {
    return possuiChave(SLUG_RISCO, risco) ? SLUG_RISCO[risco] : "baixo";
  }
  function slugStatus(status) {
    return possuiChave(SLUG_STATUS, status) ? SLUG_STATUS[status] : "neutro";
  }
  function slugNivel(nivel) {
    return possuiChave(SLUG_NIVEL, nivel) ? SLUG_NIVEL[nivel] : "neutro";
  }

  function textoVulneraveis(tipoOcorrencia) {
    return tipoOcorrencia === TIPO_SUPORTE
      ? "Pedido de apoio registrado pela vizinhança"
      : "Pessoas vulneráveis no raio ainda não verificadas";
  }

  /*
   * Completa um reporte da comunidade com os dados de rota do bairro.
   * Usado tanto para reportes novos quanto para os lidos do localStorage.
   */
  function montarReporte(base) {
    const zona = zonasBairros[base.bairro];
    return {
      id: base.id,
      rua: base.rua,
      bairro: base.bairro,
      lat: base.lat,
      lng: base.lng,
      statusBueiro: STATUS_POR_TIPO[base.tipoOcorrencia],
      nivelAgua: NIVEL_AGUA_POR_URGENCIA[base.urgencia],
      risco: RISCO_POR_URGENCIA[base.urgencia],
      ultimaAtualizacao: "",
      vulneraveisNoRaio: textoVulneraveis(base.tipoOcorrencia),
      vulneraveisQtd: null, // ainda não verificado no local
      pontoSeguroNome: zona.pontoApoio.nome,
      pontoSeguroLat: zona.pontoApoio.lat,
      pontoSeguroLng: zona.pontoApoio.lng,
      rotaEvacuacaoCidadao: zona.rotaCidadaoPadrao,
      rotaAcessoSocorrista: zona.rotaSocorristaPadrao,
      origem: "comunidade",
      criadoEm: base.criadoEm,
      nome: base.nome,
      tipoOcorrencia: base.tipoOcorrencia,
      urgencia: base.urgencia,
      descricao: base.descricao
    };
  }

  /*
   * Valida um reporte lido do localStorage.
   * O localStorage pode ser editado por qualquer pessoa no DevTools, então
   * só aceitamos objetos com campos e valores conhecidos. Retorna null se inválido.
   */
  function normalizarReporte(bruto) {
    if (!bruto || typeof bruto !== "object") {
      return null;
    }
    /* Avisos salvos antes da troca de nome do tipo continuam válidos. */
    if (bruto.tipoOcorrencia === "Pedido de Suporte para Idoso/PcD") {
      bruto.tipoOcorrencia = TIPO_SUPORTE;
    }
    const textoValido = function (valor, maximo) {
      return typeof valor === "string" && valor.trim() !== "" && valor.length <= maximo;
    };

    if (!Number.isInteger(bruto.id) ||
        !textoValido(bruto.rua, 120) ||
        !possuiChave(zonasBairros, bruto.bairro) ||
        !possuiChave(RISCO_POR_URGENCIA, bruto.urgencia) ||
        TIPOS_OCORRENCIA.indexOf(bruto.tipoOcorrencia) === -1 ||
        !textoValido(bruto.descricao, 500) ||
        !textoValido(bruto.nome, 80) ||
        typeof bruto.criadoEm !== "number") {
      return null;
    }

    /* Coordenadas fora do bairro (ou ausentes) voltam para o centro do bairro. */
    const zona = zonasBairros[bruto.bairro];
    const lat = Number(bruto.lat);
    const lng = Number(bruto.lng);
    const dentroDoBairro = Number.isFinite(lat) && Number.isFinite(lng) &&
      lat >= zona.limites.minLat && lat <= zona.limites.maxLat &&
      lng >= zona.limites.minLng && lng <= zona.limites.maxLng;

    return montarReporte({
      id: bruto.id,
      rua: bruto.rua,
      bairro: bruto.bairro,
      lat: dentroDoBairro ? lat : zona.centro.lat,
      lng: dentroDoBairro ? lng : zona.centro.lng,
      criadoEm: bruto.criadoEm,
      nome: bruto.nome,
      tipoOcorrencia: bruto.tipoOcorrencia,
      urgencia: bruto.urgencia,
      descricao: bruto.descricao
    });
  }

  /* Lê os reportes salvos no navegador (somente os válidos). */
  function carregarReportesSalvos() {
    const texto = lerStorage(CHAVES.reportes);
    if (!texto) {
      return [];
    }
    try {
      const lista = JSON.parse(texto);
      if (!Array.isArray(lista)) {
        return [];
      }
      return lista.map(normalizarReporte).filter(Boolean);
    } catch (erro) {
      return [];
    }
  }

  /* Salva apenas os campos de origem (os derivados são recalculados na leitura). */
  function salvarReportes(reportes) {
    const paraSalvar = reportes.slice(0, LIMITE_REPORTES_SALVOS).map(function (r) {
      return {
        id: r.id,
        rua: r.rua,
        bairro: r.bairro,
        lat: r.lat,
        lng: r.lng,
        criadoEm: r.criadoEm,
        nome: r.nome,
        tipoOcorrencia: r.tipoOcorrencia,
        urgencia: r.urgencia,
        descricao: r.descricao
      };
    });
    return gravarStorage(CHAVES.reportes, JSON.stringify(paraSalvar));
  }

  /* ---------- Atendimento das ocorrências (fluxo do socorrista) ----------
   * Cada rua pode estar: sem atendimento → "em_atendimento" → "finalizada".
   * O estado fica salvo no aparelho (localStorage) e aparece no card, no
   * painel de rotas (para o morador e para o socorrista) e na página inicial.
   */
  const STATUS_ATENDIMENTO = ["em_atendimento", "finalizada"];

  function carregarAtendimentos() {
    const resultado = {};
    try {
      const salvo = JSON.parse(lerStorage(CHAVES.atendimentos) || "{}");
      if (salvo && typeof salvo === "object" && !Array.isArray(salvo)) {
        Object.keys(salvo).forEach(function (chave) {
          const item = salvo[chave];
          /* Só aceita ids numéricos, status conhecidos e datas numéricas. */
          if (/^\d+$/.test(chave) && item && STATUS_ATENDIMENTO.indexOf(item.status) !== -1 &&
              typeof item.inicio === "number") {
            resultado[chave] = {
              status: item.status,
              inicio: item.inicio,
              fim: typeof item.fim === "number" ? item.fim : null,
              responsavel: (typeof item.responsavel === "string" && FORMATO_MATRICULA.test(item.responsavel))
                ? item.responsavel
                : null
            };
          }
        });
      }
    } catch (erro) {
      /* JSON inválido: começa sem atendimentos */
    }
    return resultado;
  }

  /* ---------- Acesso do socorrista ----------
   * IMPORTANTE: isto é uma SIMULAÇÃO de controle de acesso para o protótipo.
   * Num site só com HTML/CSS/JS, qualquer senha fica visível no código-fonte.
   * Na versão real, a matrícula seria validada por um servidor, com cadastro
   * feito pela Defesa Civil e pelos Bombeiros.
   */
  const ACESSO_DEMONSTRACAO = {
    matriculas: ["DC-0001", "DC-0002", "DC-0003"],
    codigo: "SOCORRO2026"
  };
  const FORMATO_MATRICULA = /^DC-\d{4}$/;

  /* A sessão fica no sessionStorage: termina quando o navegador é fechado. */
  function socorristaLogado() {
    try {
      const matricula = window.sessionStorage.getItem(CHAVES.sessaoSocorrista);
      return (matricula && FORMATO_MATRICULA.test(matricula)) ? matricula : null;
    } catch (erro) {
      return null;
    }
  }

  function iniciarSessaoSocorrista(matricula) {
    try {
      window.sessionStorage.setItem(CHAVES.sessaoSocorrista, matricula);
    } catch (erro) {
      /* sessionStorage bloqueado: o acesso vale só até recarregar */
    }
  }

  function encerrarSessaoSocorrista() {
    try {
      window.sessionStorage.removeItem(CHAVES.sessaoSocorrista);
    } catch (erro) {
      /* nada a fazer */
    }
  }

  function salvarAtendimentos(atendimentos) {
    return gravarStorage(CHAVES.atendimentos, JSON.stringify(atendimentos));
  }

  /* "14:32" a partir de um timestamp. */
  function horaCurta(timestamp) {
    return new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  /*
   * Inicia toda a simulação. Retorna um objeto com a função que o formulário
   * usa para adicionar novos reportes (ou null se a página não tem simulação).
   */
  function iniciarSimulacao() {
    const lista = document.getElementById("lista-pontos");
    const estadoVazio = document.getElementById("estado-vazio");
    const contadorResultados = document.getElementById("contador-resultados");
    const formFiltros = document.getElementById("form-filtros");
    const filtroBairro = document.getElementById("filtro-bairro");
    const filtroRisco = document.getElementById("filtro-risco");
    const filtroBusca = document.getElementById("filtro-busca");

    /* Mapa real (iframe) */
    const painelMapa = document.querySelector(".mapa-geo-panel");
    const mapaGeo = document.getElementById("mapa-geo");
    const iframeMapa = document.getElementById("mapa-osm");
    const linkMapa = document.getElementById("mapa-osm-link");
    const avisoOffline = document.getElementById("mapa-offline");

    /* Painel Tático de Rotas */
    const painelRotas = document.getElementById("painel-rotas");
    const rotasTitulo = document.getElementById("rotas-titulo");
    const rotasSubtitulo = document.getElementById("rotas-subtitulo");
    const cidadaoConteudo = document.getElementById("cidadao-conteudo");
    const socorristaConteudo = document.getElementById("socorrista-conteudo");
    const gpsCidadao = document.getElementById("btn-gps-cidadao");
    const gpsSocorrista = document.getElementById("btn-gps-socorrista");
    const rotasAcoes = document.getElementById("rotas-acoes");
    const botaoFinalizadas = document.getElementById("btn-finalizadas");

    /* Área do socorrista (acesso restrito) */
    const caixaLogin = document.getElementById("socorrista-login");
    const areaSocorrista = document.getElementById("socorrista-area");
    const formLogin = document.getElementById("form-login");
    const campoMatricula = document.getElementById("login-matricula");
    const campoCodigo = document.getElementById("login-codigo");
    const feedbackLogin = document.getElementById("login-feedback");
    const botaoSair = document.getElementById("btn-sair");
    const tituloSocorrista = document.getElementById("socorrista-titulo");

    if (!dadosDisponiveis()) {
      if (contadorResultados) {
        contadorResultados.textContent = "Não foi possível carregar os dados da simulação (js/dados.js).";
      }
      return null;
    }

    /* ---------- Estado da simulação ---------- */
    const estado = {
      reportes: carregarReportesSalvos(),   // criados pelo formulário
      filtros: { bairro: "", risco: "", busca: "" },
      selecionadoId: null,
      mostrarFinalizadas: false,            // ocorrências finalizadas ficam fora da lista
      atendimentos: carregarAtendimentos(),
      srcMapaAtual: iframeMapa ? iframeMapa.getAttribute("src") : ""
    };

    /* Pontos oficiais da simulação, marcados com a origem. */
    const pontosBase = pontosMonitorados.map(function (ponto) {
      return Object.assign({}, ponto, { origem: "monitoramento" });
    });

    /* Reportes da comunidade (mais novos primeiro) + pontos monitorados. */
    function todosOsPontos() {
      const reportesOrdenados = estado.reportes.slice().sort(function (a, b) {
        return b.criadoEm - a.criadoEm;
      });
      return reportesOrdenados.concat(pontosBase);
    }

    function buscarPonto(id) {
      return todosOsPontos().find(function (ponto) {
        return ponto.id === id;
      }) || null;
    }

    function proximoId() {
      const ids = todosOsPontos().map(function (ponto) { return ponto.id; });
      return Math.max.apply(null, ids.concat([0])) + 1;
    }

    /* Aplica os filtros e ordena por risco (Alto → Médio → Baixo). */
    function pontosFiltrados() {
      const termo = normalizarTexto(estado.filtros.busca);
      return todosOsPontos()
        .filter(function (ponto) {
          const bairroOk = estado.filtros.bairro === "" || ponto.bairro === estado.filtros.bairro;
          const riscoOk = estado.filtros.risco === "" || ponto.risco === estado.filtros.risco;
          const buscaOk = termo === "" || normalizarTexto(ponto.rua).indexOf(termo) !== -1;
          const finalizadaOk = estado.mostrarFinalizadas || statusAtendimento(ponto.id) !== "finalizada";
          return bairroOk && riscoOk && buscaOk && finalizadaOk;
        })
        .sort(function (a, b) {
          /* Ocorrências finalizadas vão para o fim da lista */
          const fimA = statusAtendimento(a.id) === "finalizada" ? 1 : 0;
          const fimB = statusAtendimento(b.id) === "finalizada" ? 1 : 0;
          return (fimA - fimB) || (PRIORIDADE_RISCO[a.risco] - PRIORIDADE_RISCO[b.risco]);
        });
    }

    /* Situação do atendimento de uma rua: null, "em_atendimento" ou "finalizada". */
    function statusAtendimento(id) {
      const registro = estado.atendimentos[String(id)];
      return registro ? registro.status : null;
    }

    /*
     * Muda a situação do atendimento, salva e redesenha tudo.
     * A mensagem vai para uma região "aria-live", lida por leitores de tela.
     */
    function alterarAtendimento(id, novoStatus, mensagem) {
      const chave = String(id);
      if (novoStatus === null) {
        delete estado.atendimentos[chave];
      } else if (novoStatus === "em_atendimento") {
        estado.atendimentos[chave] = {
          status: "em_atendimento",
          inicio: Date.now(),
          fim: null,
          responsavel: socorristaLogado()
        };
      } else {
        const anterior = estado.atendimentos[chave];
        estado.atendimentos[chave] = {
          status: "finalizada",
          inicio: anterior ? anterior.inicio : Date.now(),
          fim: Date.now(),
          responsavel: (anterior && anterior.responsavel) || socorristaLogado()
        };
      }
      salvarAtendimentos(estado.atendimentos);
      renderizar();
      definirTexto("rotas-retorno", mensagem);
    }

    /* Faixa de situação mostrada nas duas abas do painel de rotas. */
    function criarFaixaSituacao(id, paraMorador) {
      const registro = estado.atendimentos[String(id)];
      if (!registro) {
        return null;
      }
      /* O socorrista vê quem é o responsável; o morador vê só a situação. */
      const porQuem = (!paraMorador && registro.responsavel) ? " por " + registro.responsavel : "";
      if (registro.status === "em_atendimento") {
        return criarElemento("p", "rotas__situacao rotas__situacao--andamento",
          (paraMorador ? "Socorro a caminho" : "Em atendimento" + porQuem) + " desde " + horaCurta(registro.inicio));
      }
      return criarElemento("p", "rotas__situacao rotas__situacao--finalizada",
        "Ocorrência finalizada" + porQuem + " às " + horaCurta(registro.fim || registro.inicio));
    }

    /*
     * Confirmação na própria página (sem alert/confirm do navegador):
     * esconde o botão e mostra a pergunta com "Sim" e "Cancelar".
     */
    function pedirConfirmacao(botao, pergunta, rotuloSim, aoConfirmar) {
      const caixa = criarElemento("div", "confirmacao");
      caixa.setAttribute("role", "group");
      caixa.setAttribute("aria-label", "Confirmação");
      caixa.appendChild(criarElemento("p", "confirmacao__pergunta", pergunta));

      const acoes = criarElemento("div", "form__actions");
      const botaoSim = criarElemento("button", "btn btn--primary btn--sm", rotuloSim);
      botaoSim.type = "button";
      const botaoNao = criarElemento("button", "btn btn--ghost btn--sm", "Cancelar");
      botaoNao.type = "button";

      botaoSim.addEventListener("click", aoConfirmar);
      botaoNao.addEventListener("click", function () {
        caixa.remove();
        botao.hidden = false;
        botao.focus();
      });

      acoes.appendChild(botaoSim);
      acoes.appendChild(botaoNao);
      caixa.appendChild(acoes);
      botao.hidden = true;
      botao.insertAdjacentElement("afterend", caixa);
      botaoSim.focus();
    }

    /* Texto de "última atualização" (reportes calculam a partir da data). */
    function textoAtualizacao(ponto) {
      return ponto.origem === "comunidade" ? tempoRelativo(ponto.criadoEm) : ponto.ultimaAtualizacao;
    }

    /* Cria um botão com texto visível + complemento só para leitores de tela. */
    function criarBotaoAcao(classes, textoVisivel, complementoOculto) {
      const botao = criarElemento("button", classes, textoVisivel);
      botao.type = "button";
      if (complementoOculto) {
        botao.appendChild(criarElemento("span", "visually-hidden", " — " + complementoOculto));
      }
      return botao;
    }

    function adicionarLinhaDefinicao(listaDefinicao, termo, conteudo) {
      listaDefinicao.appendChild(criarElemento("dt", null, termo));
      const definicao = criarElemento("dd");
      if (typeof conteudo === "string") {
        definicao.textContent = conteudo;
      } else {
        definicao.appendChild(conteudo);
      }
      listaDefinicao.appendChild(definicao);
    }

    function criarBadge(classeModificadora, texto) {
      return criarElemento("span", "badge badge--" + classeModificadora, texto);
    }

    /* ---------- Mapa real (iframe do OpenStreetMap) ---------- */

    /* Área que mostra a rua E o ponto de apoio, com uma margem em volta. */
    function limitesDoPonto(ponto) {
      const margem = 0.004; // ≈ 400 m
      return {
        minLat: Math.min(ponto.lat, ponto.pontoSeguroLat) - margem,
        maxLat: Math.max(ponto.lat, ponto.pontoSeguroLat) + margem,
        minLng: Math.min(ponto.lng, ponto.pontoSeguroLng) - margem,
        maxLng: Math.max(ponto.lng, ponto.pontoSeguroLng) + margem
      };
    }

    /*
     * Atualiza o iframe. Só troca o src quando o endereço muda, para não
     * recarregar o mapa à toa (economia de dados em rede 3G).
     */
    function atualizarMapa(opcoes) {
      if (iframeMapa) {
        const novoSrc = urlMapaEmbed(opcoes.limites, opcoes.marcador);
        if (novoSrc !== estado.srcMapaAtual) {
          iframeMapa.setAttribute("src", novoSrc);
          estado.srcMapaAtual = novoSrc;
        }
        iframeMapa.setAttribute("title", opcoes.tituloAcessivel);
      }
      if (linkMapa) {
        linkMapa.setAttribute("href", urlMapaAmpliado(opcoes.centro, opcoes.zoom, Boolean(opcoes.marcador)));
      }
      definirTexto("mapa-hud-texto", opcoes.rotuloHud);
      if (mapaGeo) {
        if (opcoes.risco) {
          mapaGeo.setAttribute("data-risco", slugRisco(opcoes.risco));
        } else {
          mapaGeo.removeAttribute("data-risco");
        }
      }
    }

    function mostrarRuaNoMapa(ponto) {
      atualizarMapa({
        limites: limitesDoPonto(ponto),
        marcador: { lat: ponto.lat, lng: ponto.lng },
        centro: { lat: ponto.lat, lng: ponto.lng },
        zoom: 17,
        rotuloHud: ponto.rua + " · Risco " + ponto.risco,
        tituloAcessivel: "Mapa do OpenStreetMap centralizado em " + ponto.rua + ", " + ponto.bairro,
        risco: ponto.risco
      });
    }

    /* Sem rua selecionada: mostra o bairro filtrado ou a Zona Leste toda. */
    function mostrarVisaoGeralNoMapa() {
      const bairro = estado.filtros.bairro;
      if (bairro !== "") {
        const zona = zonasBairros[bairro];
        atualizarMapa({
          limites: zona.limites,
          marcador: null,
          centro: zona.centro,
          zoom: 15,
          rotuloHud: "Bairro · " + bairro,
          tituloAcessivel: "Mapa do OpenStreetMap com o bairro " + bairro,
          risco: null
        });
        return;
      }
      atualizarMapa({
        limites: VISAO_GERAL.limites,
        marcador: null,
        centro: VISAO_GERAL.centro,
        zoom: 14,
        rotuloHud: "Visão geral · Zona Leste",
        tituloAcessivel: "Mapa do OpenStreetMap com a visão geral da Zona Leste de São Paulo",
        risco: null
      });
    }

    /* Aviso quando o aparelho está sem internet (o mapa não carrega). */
    function atualizarAvisoOffline() {
      if (avisoOffline) {
        avisoOffline.hidden = navigator.onLine !== false;
      }
    }
    window.addEventListener("online", atualizarAvisoOffline);
    window.addEventListener("offline", atualizarAvisoOffline);
    atualizarAvisoOffline();

    /* ---------- Painel Tático de Rotas ---------- */

    function definirLinkGps(link, url) {
      if (!link) {
        return;
      }
      if (url) {
        link.setAttribute("href", url);
        link.hidden = false;
      } else {
        link.removeAttribute("href");
        link.hidden = true;
      }
    }

    function renderizarRotas(ponto) {
      if (!painelRotas || !cidadaoConteudo || !socorristaConteudo) {
        return;
      }
      limparElemento(cidadaoConteudo);
      limparElemento(socorristaConteudo);
      if (rotasAcoes) {
        limparElemento(rotasAcoes);
      }

      /* Estado vazio: nenhuma rua selecionada */
      if (!ponto) {
        painelRotas.removeAttribute("data-risco");
        definirTexto("rotas-titulo", "Escolha uma rua");
        definirTexto("rotas-subtitulo", "Toque em uma rua da lista para ver as rotas.");
        cidadaoConteudo.appendChild(criarElemento("p", "rotas__vazio",
          "Escolha uma rua para ver o ponto de apoio mais perto e como chegar até ele sem passar pela água."));
        socorristaConteudo.appendChild(criarElemento("p", "rotas__vazio",
          "Escolha uma rua para ver o acesso sugerido, quantas pessoas vulneráveis estão perto e a situação do bueiro."));
        definirLinkGps(gpsCidadao, null);
        definirLinkGps(gpsSocorrista, null);
        if (rotasAcoes) {
          rotasAcoes.hidden = true;
        }
        return;
      }

      painelRotas.setAttribute("data-risco", slugRisco(ponto.risco));
      if (rotasTitulo) {
        rotasTitulo.textContent = ponto.rua;
      }
      if (rotasSubtitulo) {
        rotasSubtitulo.textContent = ponto.bairro + " · Risco " + ponto.risco + " · " + textoAtualizacao(ponto);
      }

      /* ----- Aba 1: Sou Cidadão (Rota de Fuga Segura) ----- */
      const faixaMorador = criarFaixaSituacao(ponto.id, true);
      if (faixaMorador) {
        cidadaoConteudo.appendChild(faixaMorador);
      }
      const distancia = distanciaMetros(ponto.lat, ponto.lng, ponto.pontoSeguroLat, ponto.pontoSeguroLng);
      const dadosCidadao = criarElemento("dl", "rotas__dados");
      adicionarLinhaDefinicao(dadosCidadao, "Destino", ponto.pontoSeguroNome);
      adicionarLinhaDefinicao(dadosCidadao, "Distância", formatarDistancia(distancia) + " em linha reta");
      adicionarLinhaDefinicao(dadosCidadao, "Tempo", tempoCaminhada(distancia) + " (ritmo de 3 km/h)");
      adicionarLinhaDefinicao(dadosCidadao, "Água na rua", criarBadge(slugNivel(ponto.nivelAgua), ponto.nivelAgua));
      cidadaoConteudo.appendChild(dadosCidadao);
      cidadaoConteudo.appendChild(criarElemento("p", "rotas__instrucao", ponto.rotaEvacuacaoCidadao));
      definirLinkGps(gpsCidadao, urlGpsCidadao(ponto));

      /*
       * Pedir ajuda é uma ação do morador: fica só nesta aba, um botão por
       * rua, e não aparece para o socorrista conectado nem para ocorrências
       * já finalizadas.
       */
      if (!socorristaLogado() && statusAtendimento(ponto.id) !== "finalizada") {
        const botaoSuporte = criarBotaoAcao("btn btn--ghost btn--block", "Pedir apoio para esta rua", ponto.rua);
        botaoSuporte.addEventListener("click", function () {
          solicitarSuporte(ponto);
        });
        cidadaoConteudo.appendChild(botaoSuporte);
      }

      /* ----- Aba 2: Sou Socorrista (Rota de Resgate) — só com acesso ----- */
      if (!socorristaLogado()) {
        definirLinkGps(gpsSocorrista, null);
      } else {
        const faixaSocorrista = criarFaixaSituacao(ponto.id, false);
        if (faixaSocorrista) {
          socorristaConteudo.appendChild(faixaSocorrista);
        }
        const dadosSocorrista = criarElemento("dl", "rotas__dados");
        const vulneraveis = (typeof ponto.vulneraveisQtd === "number")
          ? ponto.vulneraveisQtd + " idosos/PcD no raio de 200 m"
          : "Não verificado (aviso da vizinhança)";
        adicionarLinhaDefinicao(dadosSocorrista, "Em risco", vulneraveis);
        adicionarLinhaDefinicao(dadosSocorrista, "Detalhe", ponto.vulneraveisNoRaio);
        adicionarLinhaDefinicao(dadosSocorrista, "Bueiro", criarBadge(slugStatus(ponto.statusBueiro), ponto.statusBueiro));
        adicionarLinhaDefinicao(dadosSocorrista, "Risco", criarBadge(slugRisco(ponto.risco), ponto.risco));
        if (ponto.origem === "comunidade") {
          adicionarLinhaDefinicao(dadosSocorrista, "Ocorrência", ponto.tipoOcorrencia);
          adicionarLinhaDefinicao(dadosSocorrista, "Reportado por", ponto.nome);
          adicionarLinhaDefinicao(dadosSocorrista, "Relato", ponto.descricao);
        }
        socorristaConteudo.appendChild(dadosSocorrista);
        socorristaConteudo.appendChild(criarElemento("p", "rotas__instrucao", "Corredor sugerido: " + ponto.rotaAcessoSocorrista));
        definirLinkGps(gpsSocorrista, urlGpsSocorrista(ponto));

        /* Botão do fluxo de atendimento: Iniciar → Finalizar → (Reabrir) */
        const situacao = statusAtendimento(ponto.id);
        let botaoAtendimento;
        if (situacao === null) {
          botaoAtendimento = criarBotaoAcao("btn btn--primary btn--block", "Iniciar atendimento", ponto.rua);
          botaoAtendimento.addEventListener("click", function () {
            pedirConfirmacao(botaoAtendimento,
              "Confirmar: sua equipe está indo agora para " + ponto.rua + "? Os moradores vão ver \"Socorro a caminho\".",
              "Sim, iniciar", function () {
                alterarAtendimento(ponto.id, "em_atendimento",
                  "Atendimento iniciado. Quem mora na rua agora vê: \"Socorro a caminho\".");
              });
          });
        } else if (situacao === "em_atendimento") {
          botaoAtendimento = criarBotaoAcao("btn btn--verde btn--block", "Finalizar ocorrência", ponto.rua);
          botaoAtendimento.addEventListener("click", function () {
            pedirConfirmacao(botaoAtendimento,
              "Confirmar: o atendimento em " + ponto.rua + " terminou e as pessoas estão em segurança?",
              "Sim, finalizar", function () {
                alterarAtendimento(ponto.id, "finalizada",
                  "Ocorrência finalizada e retirada da lista e dos alertas. Para consultar, use \"Ver finalizadas\".");
              });
          });
        } else {
          botaoAtendimento = criarBotaoAcao("btn btn--ghost btn--block", "Reabrir ocorrência", ponto.rua);
          botaoAtendimento.addEventListener("click", function () {
            alterarAtendimento(ponto.id, null, "Ocorrência reaberta.");
          });
        }
        socorristaConteudo.appendChild(botaoAtendimento);
      }

      /* ----- Ações comuns ----- */
      if (rotasAcoes) {
        const botaoLista = criarBotaoAcao("btn btn--ghost btn--sm", "Ver na lista", ponto.rua);
        botaoLista.addEventListener("click", function () {
          const card = lista.querySelector('[data-id="' + ponto.id + '"]');
          if (card) {
            rolarAte(card);
            card.focus({ preventScroll: true });
          }
        });
        rotasAcoes.appendChild(botaoLista);
        rotasAcoes.hidden = false;
      }
    }

    /* ---------- Abas "Sou Cidadão" / "Sou Socorrista" (padrão ARIA tabs) ---------- */
    function iniciarAbas() {
      const abas = Array.prototype.slice.call(document.querySelectorAll('.rotas__tabs [role="tab"]'));
      if (abas.length === 0) {
        return;
      }

      function ativarAba(abaEscolhida, moverFoco) {
        /*
         * As duas abas têm alturas diferentes. Guardamos a posição das abas na
         * tela antes da troca e corrigimos depois, para a página não "pular".
         */
        const barraAbas = abaEscolhida.parentElement;
        const posicaoAntes = barraAbas.getBoundingClientRect().top;
        abas.forEach(function (aba) {
          const ativa = aba === abaEscolhida;
          aba.setAttribute("aria-selected", String(ativa));
          aba.tabIndex = ativa ? 0 : -1; // só a aba ativa entra no Tab
          const painel = document.getElementById(aba.getAttribute("aria-controls"));
          if (painel) {
            painel.hidden = !ativa;
          }
        });
        const deslocamento = barraAbas.getBoundingClientRect().top - posicaoAntes;
        if (Math.abs(deslocamento) > 1) {
          window.scrollBy(0, deslocamento);
        }
        if (moverFoco) {
          abaEscolhida.focus({ preventScroll: true });
        }
        gravarStorage(CHAVES.perfilRota, abaEscolhida.id === "aba-socorrista" ? "socorrista" : "cidadao");
      }

      abas.forEach(function (aba, indice) {
        aba.addEventListener("click", function () {
          ativarAba(aba, false);
        });

        /* Setas, Home e End trocam de aba (navegação por teclado). */
        aba.addEventListener("keydown", function (evento) {
          let destino = null;
          if (evento.key === "ArrowRight") {
            destino = abas[(indice + 1) % abas.length];
          } else if (evento.key === "ArrowLeft") {
            destino = abas[(indice - 1 + abas.length) % abas.length];
          } else if (evento.key === "Home") {
            destino = abas[0];
          } else if (evento.key === "End") {
            destino = abas[abas.length - 1];
          }
          if (destino) {
            evento.preventDefault();
            ativarAba(destino, true);
          }
        });
      });

      /* Restaura o último perfil usado (cidadão ou socorrista). */
      const perfilSalvo = lerStorage(CHAVES.perfilRota);
      const abaSocorrista = document.getElementById("aba-socorrista");
      if (perfilSalvo === "socorrista" && abaSocorrista) {
        ativarAba(abaSocorrista, false);
      }
    }

    /* ---------- Cards das ruas ---------- */
    function criarCard(ponto) {
      const ehComunidade = ponto.origem === "comunidade";
      const card = criarElemento("li", "ponto-card" + (ehComunidade ? " ponto-card--novo" : ""));
      card.setAttribute("data-id", String(ponto.id));
      card.setAttribute("data-risco", slugRisco(ponto.risco));
      card.tabIndex = -1; // permite receber foco via "Ver na lista"

      /* Cabeçalho: id, rua, bairro e badge de risco */
      const cabecalho = criarElemento("div", "ponto-card__header");
      const titulos = criarElemento("div");
      titulos.appendChild(criarElemento("span", "ponto-card__id", "#" + String(ponto.id).padStart(2, "0")));
      titulos.appendChild(criarElemento("h3", "ponto-card__rua", ponto.rua));
      titulos.appendChild(criarElemento("p", "ponto-card__bairro", ponto.bairro));
      cabecalho.appendChild(titulos);
      cabecalho.appendChild(criarBadge(slugRisco(ponto.risco), "Risco " + ponto.risco));
      card.appendChild(cabecalho);

      /* Situação do atendimento (definida pelo socorrista) */
      const situacao = statusAtendimento(ponto.id);
      if (situacao === "em_atendimento") {
        const linha = criarElemento("p");
        linha.appendChild(criarBadge("atendimento", "Socorro a caminho"));
        card.appendChild(linha);
      } else if (situacao === "finalizada") {
        card.classList.add("ponto-card--finalizada");
        const linha = criarElemento("p");
        linha.appendChild(criarBadge("finalizada", "Ocorrência finalizada"));
        card.appendChild(linha);
      }

      if (ehComunidade) {
        const origem = criarElemento("p");
        origem.appendChild(criarBadge("novo", "Aviso da vizinhança"));
        card.appendChild(origem);
      }

      /* Status do bueiro e nível da água */
      const meta = criarElemento("dl", "ponto-card__meta");
      adicionarLinhaDefinicao(meta, "Bueiro", criarBadge(slugStatus(ponto.statusBueiro), ponto.statusBueiro));
      adicionarLinhaDefinicao(meta, "Água", criarBadge(slugNivel(ponto.nivelAgua), ponto.nivelAgua));
      adicionarLinhaDefinicao(meta, "Apoio", ponto.pontoSeguroNome);
      if (ehComunidade) {
        adicionarLinhaDefinicao(meta, "Ocorrência", ponto.tipoOcorrencia);
        adicionarLinhaDefinicao(meta, "Urgência", ponto.urgencia);
      }
      card.appendChild(meta);

      /*
       * Dados sensíveis (quantas pessoas vulneráveis moram ali e o relato de
       * quem pediu ajuda) aparecem só para socorristas: protege essas pessoas
       * de golpes e de exposição.
       */
      if (socorristaLogado()) {
        const vulneraveis = criarElemento("p", "ponto-card__vulneraveis");
        const icone = criarElemento("span", null, "👥");
        icone.setAttribute("aria-hidden", "true");
        vulneraveis.appendChild(icone);
        vulneraveis.appendChild(criarElemento("span", null, ponto.vulneraveisNoRaio));
        card.appendChild(vulneraveis);

        /* Relato digitado pelo morador (sempre via textContent) */
        if (ehComunidade) {
          card.appendChild(criarElemento("p", "text-muted", "Relato: " + ponto.descricao));
        }
      }

      /* Rodapé: horário + ações */
      const rodape = criarElemento("div", "ponto-card__footer");
      rodape.appendChild(criarElemento("span", "ponto-card__time", textoAtualizacao(ponto)));

      const acoes = criarElemento("div", "form__actions");
      const botaoMapa = criarBotaoAcao("btn btn--ghost btn--sm", "Ver no mapa e rotas", ponto.rua);
      botaoMapa.addEventListener("click", function () {
        selecionarPonto(ponto.id);
        if (painelMapa) {
          rolarAte(painelMapa);
        }
        if (rotasTitulo) {
          rotasTitulo.focus({ preventScroll: true });
        }
      });

      /*
       * O card não tem botão de pedir apoio: isso evita vários pedidos
       * repetidos para a mesma rua. O pedido fica num lugar só, na aba
       * "Sou morador" do painel de rotas.
       */
      acoes.appendChild(botaoMapa);
      rodape.appendChild(acoes);
      card.appendChild(rodape);

      /*
       * Clique em qualquer área do card (fora dos botões) seleciona a rua:
       * o mapa centraliza e o painel de rotas é preenchido.
       * Pelo teclado, o mesmo acontece com o botão "Ver no mapa e rotas".
       */
      card.addEventListener("click", function (evento) {
        if (evento.target.closest("button, a")) {
          return;
        }
        selecionarPonto(ponto.id);
      });

      return card;
    }

    function renderizarCards(pontos) {
      limparElemento(lista);
      pontos.forEach(function (ponto) {
        lista.appendChild(criarCard(ponto));
      });
      if (estadoVazio) {
        estadoVazio.hidden = pontos.length > 0;
      }
    }

    /* ---------- Seleção de uma rua (card + mapa + rotas) ---------- */
    function selecionarPonto(id) {
      const ponto = buscarPonto(id);
      if (!ponto) {
        return;
      }
      if (estado.selecionadoId !== id) {
        definirTexto("rotas-retorno", "");
      }
      estado.selecionadoId = id;

      lista.querySelectorAll(".ponto-card").forEach(function (card) {
        card.classList.toggle("is-selected", card.getAttribute("data-id") === String(id));
      });

      mostrarRuaNoMapa(ponto);
      renderizarRotas(ponto);
    }

    /* ---------- Contadores ---------- */
    function atualizarContadores(pontos) {
      const contar = function (condicao) {
        return pontos.filter(condicao).length;
      };
      definirTexto("kpi-total", pontos.length);
      definirTexto("kpi-alto", contar(function (p) { return p.risco === "Alto"; }));
      definirTexto("kpi-obstruidos", contar(function (p) { return p.statusBueiro === "Obstruído"; }));
      definirTexto("kpi-reportes", contar(function (p) { return p.origem === "comunidade"; }));
    }

    function atualizarContadorResultados(visiveis, total) {
      if (!contadorResultados) {
        return;
      }
      limparElemento(contadorResultados);
      contadorResultados.appendChild(document.createTextNode("Exibindo "));
      contadorResultados.appendChild(criarElemento("strong", null, visiveis));
      contadorResultados.appendChild(document.createTextNode(" de "));
      contadorResultados.appendChild(criarElemento("strong", null, total));
      contadorResultados.appendChild(document.createTextNode(" ruas"));
    }

    /* Botão "Ver finalizadas (n)": só aparece quando existe alguma finalizada. */
    function atualizarBotaoFinalizadas(quantidade) {
      if (!botaoFinalizadas) {
        return;
      }
      if (quantidade === 0) {
        estado.mostrarFinalizadas = false;
      }
      botaoFinalizadas.hidden = quantidade === 0;
      botaoFinalizadas.setAttribute("aria-pressed", String(estado.mostrarFinalizadas));
      botaoFinalizadas.textContent = estado.mostrarFinalizadas
        ? "Esconder finalizadas"
        : "Ver finalizadas (" + quantidade + ")";
    }

    /* ---------- Renderização completa ---------- */
    function renderizar() {
      const visiveis = pontosFiltrados();
      renderizarCards(visiveis);
      atualizarContadores(visiveis);
      const quantidadeFinalizadas = todosOsPontos().filter(function (ponto) {
        return statusAtendimento(ponto.id) === "finalizada";
      }).length;
      const total = todosOsPontos().length - (estado.mostrarFinalizadas ? 0 : quantidadeFinalizadas);
      atualizarContadorResultados(visiveis.length, total);
      atualizarBotaoFinalizadas(quantidadeFinalizadas);

      /* Mantém a seleção se a rua continua visível; senão volta à visão geral. */
      const aindaVisivel = visiveis.some(function (ponto) {
        return ponto.id === estado.selecionadoId;
      });
      if (aindaVisivel) {
        selecionarPonto(estado.selecionadoId);
      } else {
        estado.selecionadoId = null;
        renderizarRotas(null);
        mostrarVisaoGeralNoMapa();
      }
    }

    /* ---------- Filtros em tempo real ---------- */
    function lerFiltros() {
      const bairro = filtroBairro ? filtroBairro.value : "";
      const risco = filtroRisco ? filtroRisco.value : "";
      /* Aceita apenas valores conhecidos (protege contra valores forjados). */
      estado.filtros.bairro = possuiChave(zonasBairros, bairro) ? bairro : "";
      estado.filtros.risco = possuiChave(PRIORIDADE_RISCO, risco) ? risco : "";
      estado.filtros.busca = filtroBusca ? filtroBusca.value.slice(0, 100) : "";
    }

    function aoMudarFiltro() {
      lerFiltros();
      renderizar();
    }

    if (filtroBairro) {
      filtroBairro.addEventListener("change", function () {
        /* Trocar de bairro mostra o bairro inteiro no mapa. */
        estado.selecionadoId = null;
        aoMudarFiltro();
      });
    }
    if (filtroRisco) {
      filtroRisco.addEventListener("change", aoMudarFiltro);
    }
    if (filtroBusca) {
      filtroBusca.addEventListener("input", aoMudarFiltro);
    }
    if (formFiltros) {
      /* Enter no campo de busca não recarrega a página. */
      formFiltros.addEventListener("submit", function (evento) {
        evento.preventDefault();
      });
      /* O "reset" limpa os campos DEPOIS do evento; por isso o setTimeout. */
      formFiltros.addEventListener("reset", function () {
        window.setTimeout(aoMudarFiltro, 0);
      });
    }

    if (botaoFinalizadas) {
      botaoFinalizadas.addEventListener("click", function () {
        estado.mostrarFinalizadas = !estado.mostrarFinalizadas;
        renderizar();
      });
    }

    function limparFiltros() {
      if (formFiltros) {
        formFiltros.reset();
      }
      estado.filtros = { bairro: "", risco: "", busca: "" };
    }

    /* ---------- "Solicitar Suporte para esta Rua" ---------- */
    function solicitarSuporte(ponto) {
      const formulario = document.getElementById("form-reporte");
      const campoRua = document.getElementById("campo-rua");
      const campoBairro = document.getElementById("campo-bairro");
      const campoTipo = document.getElementById("campo-tipo");
      const campoDescricao = document.getElementById("campo-descricao");
      if (!formulario || !campoRua || !campoBairro || !campoTipo || !campoDescricao) {
        return;
      }

      campoRua.value = ponto.rua;
      campoBairro.value = ponto.bairro;
      campoTipo.value = TIPO_SUPORTE;

      /* Avisa o formulário que esses campos mudaram (revalida e limpa erros). */
      [campoRua, campoBairro, campoTipo].forEach(function (campo) {
        campo.dispatchEvent(new Event("change", { bubbles: true }));
      });

      rolarAte(formulario);
      campoDescricao.focus({ preventScroll: true });
    }

    /* ---------- API usada pelo formulário ---------- */
    function adicionarReporte(dados) {
      const zona = zonasBairros[dados.bairro];

      /*
       * Posição base do bairro: o centro do bairro com um pequeno desvio
       * aleatório (≈ até 300 m), sempre dentro dos limites do bairro.
       */
      const desvio = 0.003;
      const lat = limitar(aleatorioEntre(zona.centro.lat - desvio, zona.centro.lat + desvio), zona.limites.minLat, zona.limites.maxLat);
      const lng = limitar(aleatorioEntre(zona.centro.lng - desvio, zona.centro.lng + desvio), zona.limites.minLng, zona.limites.maxLng);

      const reporte = montarReporte({
        id: proximoId(),
        rua: dados.rua,
        bairro: dados.bairro,
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
        criadoEm: Date.now(),
        nome: dados.nome,
        tipoOcorrencia: dados.tipoOcorrencia,
        urgencia: dados.urgencia,
        descricao: dados.descricao
      });

      estado.reportes.unshift(reporte);
      if (estado.reportes.length > LIMITE_REPORTES_SALVOS) {
        estado.reportes.length = LIMITE_REPORTES_SALVOS;
      }
      const salvou = salvarReportes(estado.reportes);

      /* Limpa os filtros para o novo ponto aparecer, redesenha tudo e seleciona. */
      limparFiltros();
      estado.selecionadoId = reporte.id;
      renderizar();

      return { reporte: reporte, salvou: salvou };
    }

    /* ---------- Entrar e sair da área do socorrista ---------- */
    function atualizarAcesso() {
      const matricula = socorristaLogado();
      if (caixaLogin) {
        caixaLogin.hidden = Boolean(matricula);
      }
      if (areaSocorrista) {
        areaSocorrista.hidden = !matricula;
      }
      definirTexto("socorrista-matricula", matricula || "—");
    }

    function erroDoCampoLogin(campo, idErro, mensagem) {
      definirTexto(idErro, mensagem);
      const grupo = campo.closest(".form__group");
      if (mensagem) {
        campo.setAttribute("aria-invalid", "true");
        if (grupo) { grupo.classList.add("has-error"); }
      } else {
        campo.removeAttribute("aria-invalid");
        if (grupo) { grupo.classList.remove("has-error"); }
      }
    }

    function feedbackDoLogin(tipo, mensagem) {
      if (!feedbackLogin) {
        return;
      }
      feedbackLogin.className = tipo ? "form-feedback form-feedback--" + tipo : "form-feedback";
      feedbackLogin.textContent = mensagem;
    }

    if (formLogin && campoMatricula && campoCodigo) {
      formLogin.addEventListener("submit", function (evento) {
        evento.preventDefault();
        const matricula = campoMatricula.value.trim().toUpperCase();
        const codigo = campoCodigo.value.trim();

        let erroMatricula = "";
        if (matricula === "") {
          erroMatricula = "Informe a sua matrícula.";
        } else if (!FORMATO_MATRICULA.test(matricula)) {
          erroMatricula = "Use o formato DC-0000 (ex.: DC-0001).";
        }
        const erroCodigo = codigo === "" ? "Informe o código de acesso." : "";
        erroDoCampoLogin(campoMatricula, "erro-login-matricula", erroMatricula);
        erroDoCampoLogin(campoCodigo, "erro-login-codigo", erroCodigo);

        if (erroMatricula || erroCodigo) {
          feedbackDoLogin("", "");
          (erroMatricula ? campoMatricula : campoCodigo).focus();
          return;
        }

        /* Mensagem genérica: não revela se o erro foi a matrícula ou o código. */
        const valido = ACESSO_DEMONSTRACAO.matriculas.indexOf(matricula) !== -1 &&
          codigo === ACESSO_DEMONSTRACAO.codigo;
        if (!valido) {
          feedbackDoLogin("error", "Matrícula ou código incorretos. Confira os dados com a sua equipe.");
          campoCodigo.value = "";
          campoCodigo.focus();
          return;
        }

        iniciarSessaoSocorrista(matricula);
        formLogin.reset();
        feedbackDoLogin("", "");
        atualizarAcesso();
        renderizar();
        definirTexto("rotas-retorno", "Acesso de socorrista liberado. Você já pode iniciar atendimentos.");
        if (tituloSocorrista) {
          tituloSocorrista.focus({ preventScroll: true });
        }
      });
    }

    if (botaoSair) {
      botaoSair.addEventListener("click", function () {
        encerrarSessaoSocorrista();
        atualizarAcesso();
        renderizar();
        definirTexto("rotas-retorno", "Você saiu da área do socorrista.");
        if (campoMatricula) {
          campoMatricula.focus({ preventScroll: true });
        }
      });
    }

    /* Primeira renderização. */
    atualizarAcesso();
    iniciarAbas();
    renderizar();

    /*
     * Link vindo da página inicial: solucao.html?ponto=3 já abre a rua 3
     * selecionada, com mapa e rotas. Só aceita um id inteiro que exista.
     */
    const idDaUrl = parseInt(new URLSearchParams(window.location.search).get("ponto"), 10);
    if (Number.isInteger(idDaUrl) && buscarPonto(idDaUrl)) {
      selecionarPonto(idDaUrl);
      /* Leva a pessoa direto ao painel de rotas da rua escolhida. */
      if (painelRotas) {
        window.setTimeout(function () {
          rolarAte(painelRotas);
        }, 0);
      }
    }

    /* Leva a pessoa até o mapa com o aviso recém-criado já selecionado. */
    function irParaMapa(mensagem) {
      definirTexto("rotas-retorno", mensagem);
      if (painelMapa) {
        rolarAte(painelMapa);
      }
      if (rotasTitulo) {
        rotasTitulo.focus({ preventScroll: true });
      }
    }

    return { adicionarReporte: adicionarReporte, irParaMapa: irParaMapa };
  }

  /* ========================================================================
     4. FORMULÁRIO DE REPORTE E SOLICITAÇÃO DE SUPORTE (apenas solucao.html)
     ======================================================================== */

  function iniciarFormulario(simulacao) {
    const formulario = document.getElementById("form-reporte");
    const feedback = document.getElementById("form-feedback");
    const campoDescricao = document.getElementById("campo-descricao");
    const contadorDescricao = document.getElementById("contador-descricao");

    const MIN_DESCRICAO = 20;
    const MAX_DESCRICAO = 500;

    /* Bairros válidos: do dados.js, ou as opções do próprio <select>. */
    function bairroValido(valor) {
      if (typeof zonasBairros !== "undefined") {
        return possuiChave(zonasBairros, valor);
      }
      return valor !== "";
    }

    /*
     * Cada regra recebe o valor e devolve "" (válido) ou a mensagem de erro.
     * As mensagens dizem exatamente o que corrigir.
     */
    const campos = [
      {
        nome: "nome",
        idCampo: "campo-nome",
        idErro: "erro-nome",
        validar: function (valor) {
          const texto = valor.trim();
          if (texto === "") {
            return "Informe seu nome ou o nome do líder comunitário.";
          }
          if (texto.length < 3) {
            return "O nome precisa ter pelo menos 3 letras.";
          }
          if (texto.length > 80) {
            return "O nome pode ter no máximo 80 caracteres.";
          }
          if (!/^[\p{L}][\p{L}'.\- ]*$/u.test(texto)) {
            return "Use apenas letras, espaços, apóstrofo ou hífen.";
          }
          return "";
        }
      },
      {
        nome: "rua",
        idCampo: "campo-rua",
        idErro: "erro-rua",
        validar: function (valor) {
          const texto = valor.trim();
          if (texto === "") {
            return "Informe a rua e o número.";
          }
          if (texto.length < 5) {
            return "Endereço muito curto. Escreva o nome completo da rua.";
          }
          if (texto.length > 120) {
            return "O endereço pode ter no máximo 120 caracteres.";
          }
          if (!/\d/.test(texto)) {
            return "Inclua o número da casa ou o mais próximo (ex.: Rua Capachós, 180).";
          }
          return "";
        }
      },
      {
        nome: "bairro",
        idCampo: "campo-bairro",
        idErro: "erro-bairro",
        validar: function (valor) {
          if (valor === "") {
            return "Selecione o bairro.";
          }
          return bairroValido(valor) ? "" : "Selecione um dos bairros da lista.";
        }
      },
      {
        nome: "tipoOcorrencia",
        idCampo: "campo-tipo",
        idErro: "erro-tipo",
        validar: function (valor) {
          if (valor === "") {
            return "Selecione o tipo de ocorrência.";
          }
          return TIPOS_OCORRENCIA.indexOf(valor) !== -1 ? "" : "Selecione um tipo de ocorrência da lista.";
        }
      },
      {
        nome: "urgencia",
        idCampo: "campo-urgencia",
        idErro: "erro-urgencia",
        validar: function (valor) {
          if (valor === "") {
            return "Selecione o nível de urgência.";
          }
          return possuiChave(RISCO_POR_URGENCIA, valor) ? "" : "Selecione uma urgência da lista.";
        }
      },
      {
        nome: "descricao",
        idCampo: "campo-descricao",
        idErro: "erro-descricao",
        validar: function (valor) {
          const texto = valor.trim();
          if (texto === "") {
            return "Descreva o ponto ou a necessidade de apoio.";
          }
          if (texto.length < MIN_DESCRICAO) {
            const faltam = MIN_DESCRICAO - texto.length;
            return "Faltam " + faltam + " caractere" + (faltam === 1 ? "" : "s") + " (mínimo de " + MIN_DESCRICAO + ").";
          }
          if (texto.length > MAX_DESCRICAO) {
            return "A descrição pode ter no máximo " + MAX_DESCRICAO + " caracteres.";
          }
          return "";
        }
      }
    ];

    /* Liga cada configuração ao seu elemento real e ignora os que não existem. */
    campos.forEach(function (campo) {
      campo.elemento = document.getElementById(campo.idCampo);
      campo.erro = document.getElementById(campo.idErro);
      campo.tocado = false; // só mostra erro "ao vivo" depois do 1º contato
    });
    const camposAtivos = campos.filter(function (campo) {
      return campo.elemento && campo.erro;
    });

    /* Mostra/limpa o erro de um campo (texto + estado visual + ARIA). */
    function exibirErro(campo, mensagem) {
      const grupo = campo.elemento.closest(".form__group");
      campo.erro.textContent = mensagem;

      if (mensagem) {
        campo.elemento.setAttribute("aria-invalid", "true");
        if (grupo) {
          grupo.classList.add("has-error");
          grupo.classList.remove("is-valid");
        }
      } else {
        campo.elemento.removeAttribute("aria-invalid");
        if (grupo) {
          grupo.classList.remove("has-error");
          grupo.classList.toggle("is-valid", campo.elemento.value.trim() !== "");
        }
      }
    }

    function validarCampo(campo) {
      const mensagem = campo.validar(campo.elemento.value);
      exibirErro(campo, mensagem);
      return mensagem === "";
    }

    function limparEstadoCampo(campo) {
      campo.tocado = false;
      campo.erro.textContent = "";
      campo.elemento.removeAttribute("aria-invalid");
      const grupo = campo.elemento.closest(".form__group");
      if (grupo) {
        grupo.classList.remove("has-error", "is-valid");
      }
    }

    /* Mensagem geral (sucesso ou erro), sempre via textContent. */
    function exibirFeedback(tipo, mensagem) {
      if (!feedback) {
        return;
      }
      feedback.className = "form-feedback form-feedback--" + tipo;
      feedback.textContent = mensagem;
    }

    function limparFeedback() {
      if (!feedback) {
        return;
      }
      feedback.className = "form-feedback";
      feedback.textContent = "";
    }

    function atualizarContadorDescricao() {
      if (campoDescricao && contadorDescricao) {
        contadorDescricao.textContent = campoDescricao.value.length + "/" + MAX_DESCRICAO;
      }
    }

    /* ---------- Validação ao vivo ---------- */
    camposAtivos.forEach(function (campo) {
      /* Ao sair do campo: marca como tocado e valida. */
      campo.elemento.addEventListener("blur", function () {
        campo.tocado = true;
        validarCampo(campo);
      });

      /* Ao digitar/escolher: revalida se o campo já foi tocado. */
      const aoMudar = function () {
        if (campo.tocado || campo.elemento.getAttribute("aria-invalid") === "true") {
          validarCampo(campo);
        }
      };
      campo.elemento.addEventListener("input", aoMudar);
      campo.elemento.addEventListener("change", function () {
        /* <select> e preenchimento automático: considera tocado se tem valor. */
        if (campo.elemento.value !== "") {
          campo.tocado = true;
        }
        aoMudar();
      });
    });

    if (campoDescricao) {
      campoDescricao.addEventListener("input", atualizarContadorDescricao);
    }

    /* Botão "Limpar formulário": tira erros, feedback e zera o contador. */
    formulario.addEventListener("reset", function () {
      camposAtivos.forEach(limparEstadoCampo);
      limparFeedback();
      window.setTimeout(atualizarContadorDescricao, 0);
    });

    /* ---------- Envio ---------- */
    formulario.addEventListener("submit", function (evento) {
      evento.preventDefault(); // nunca recarrega a página

      /* Valida TODOS os campos (não para no primeiro erro). */
      const invalidos = camposAtivos.filter(function (campo) {
        campo.tocado = true;
        return !validarCampo(campo);
      });

      if (invalidos.length > 0) {
        const plural = invalidos.length === 1 ? "1 campo destacado" : invalidos.length + " campos destacados";
        exibirFeedback("error", "Não foi possível enviar. Corrija " + plural + " abaixo.");
        invalidos[0].elemento.focus();
        return;
      }

      /* Coleta os dados já limpos. */
      const dados = {};
      camposAtivos.forEach(function (campo) {
        dados[campo.nome] = campo.elemento.value.trim();
      });

      /* Sem simulação na página, apenas confirma o envio. */
      if (!simulacao) {
        formulario.reset();
        exibirFeedback("success", "Reporte registrado com sucesso. Obrigado por proteger sua vizinhança!");
        if (feedback) {
          feedback.focus();
        }
        return;
      }

      const resultado = simulacao.adicionarReporte(dados);

      /*
       * formulario.reset() dispara o evento "reset" (que limpa o feedback),
       * então a mensagem de sucesso é escrita DEPOIS dele.
       */
      formulario.reset();

      let mensagem = "Aviso enviado! " + resultado.reporte.rua + " (" + resultado.reporte.bairro +
        ") já aparece no mapa com risco " + resultado.reporte.risco +
        ". As rotas de fuga e de resgate estão no painel ao lado do mapa.";
      if (!resultado.salvou) {
        mensagem += " Atenção: o navegador bloqueou o armazenamento local, então o reporte some ao recarregar a página.";
      }
      exibirFeedback("success", mensagem);

      /* Vai direto para o mapa, com o aviso novo já selecionado. */
      simulacao.irParaMapa("Aviso enviado! Ele já aparece no mapa e na lista de ruas.");
    });

    atualizarContadorDescricao();

    /*
     * Atalhos da página inicial: solucao.html?tipo=suporte#reportar já abre o
     * formulário com o tipo escolhido. Só aceita os valores desta lista.
     */
    const TIPO_POR_ATALHO = {
      suporte: TIPO_SUPORTE,
      bueiro: "Bueiro Obstruído",
      agua: "Acúmulo de Água na Via",
      rota: "Rota Bloqueada"
    };
    const atalho = new URLSearchParams(window.location.search).get("tipo");
    const campoTipo = document.getElementById("campo-tipo");
    const campoNome = document.getElementById("campo-nome");
    if (atalho && possuiChave(TIPO_POR_ATALHO, atalho) && campoTipo) {
      campoTipo.value = TIPO_POR_ATALHO[atalho];
      campoTipo.dispatchEvent(new Event("change", { bubbles: true }));
      if (campoNome) {
        campoNome.focus({ preventScroll: true });
      }
    }
  }

  /* ========================================================================
     4.1 PÁGINA INICIAL: ALERTAS PERTO DE VOCÊ (apenas index.html)
     Mostra as ruas de risco alto e médio (incluindo avisos da vizinhança
     salvos no navegador), filtradas pelo bairro escolhido.
     ======================================================================== */

  function iniciarAlertasHome() {
    const lista = document.getElementById("lista-alertas-home");
    const seletor = document.getElementById("home-bairro");
    const vazio = document.getElementById("alertas-vazio");
    if (!dadosDisponiveis()) {
      return;
    }

    const LIMITE_ALERTAS = 5;

    /* Restaura o bairro escolhido na última visita. */
    const bairroSalvo = lerStorage(CHAVES.bairroUsuario);
    if (seletor && bairroSalvo && possuiChave(zonasBairros, bairroSalvo)) {
      seletor.value = bairroSalvo;
    }

    function renderizarAlertas() {
      const bairro = seletor && possuiChave(zonasBairros, seletor.value) ? seletor.value : "";
      const reportes = carregarReportesSalvos().sort(function (a, b) {
        return b.criadoEm - a.criadoEm;
      });

      const atendimentos = carregarAtendimentos();
      const alertas = reportes.concat(pontosMonitorados)
        .filter(function (ponto) {
          const registro = atendimentos[String(ponto.id)];
          const finalizada = Boolean(registro) && registro.status === "finalizada";
          return !finalizada && ponto.risco !== "Baixo" && (bairro === "" || ponto.bairro === bairro);
        })
        .sort(function (a, b) {
          return PRIORIDADE_RISCO[a.risco] - PRIORIDADE_RISCO[b.risco];
        })
        .slice(0, LIMITE_ALERTAS);

      limparElemento(lista);
      alertas.forEach(function (ponto) {
        const item = criarElemento("li", "alerta-item");
        item.setAttribute("data-risco", slugRisco(ponto.risco));

        const textos = criarElemento("div");
        const titulo = criarElemento("h3", "alerta-item__rua", ponto.rua + " ");
        titulo.appendChild(criarElemento("span", "badge badge--" + slugRisco(ponto.risco), "Risco " + ponto.risco));
        const registro = atendimentos[String(ponto.id)];
        if (registro && registro.status === "em_atendimento") {
          titulo.appendChild(document.createTextNode(" "));
          titulo.appendChild(criarElemento("span", "badge badge--atendimento", "Socorro a caminho"));
        }
        textos.appendChild(titulo);

        const atualizacao = ponto.criadoEm ? tempoRelativo(ponto.criadoEm) : ponto.ultimaAtualizacao;
        textos.appendChild(criarElemento("p", "alerta-item__meta",
          ponto.bairro + " · Água: " + ponto.nivelAgua.toLowerCase() + " · Bueiro: " +
          ponto.statusBueiro.toLowerCase() + " · " + atualizacao));
        item.appendChild(textos);

        /* O id é um número validado: seguro para usar na URL. */
        const link = criarElemento("a", "btn btn--ghost btn--sm", "Ver rota de fuga");
        link.setAttribute("href", "solucao.html?ponto=" + Number(ponto.id));
        link.appendChild(criarElemento("span", "visually-hidden", " — " + ponto.rua));
        item.appendChild(link);

        lista.appendChild(item);
      });

      if (vazio) {
        vazio.hidden = alertas.length > 0;
      }
    }

    if (seletor) {
      seletor.addEventListener("change", function () {
        gravarStorage(CHAVES.bairroUsuario, seletor.value);
        renderizarAlertas();
      });
    }
    renderizarAlertas();
  }

  /* ========================================================================
     4.2 PÁGINA INICIAL: UNIDADES DE SOCORRO PERTO (apenas index.html)
     Cada link abre uma busca no Google Maps ("pronto socorro perto de mim"
     ou "pronto socorro Itaim Paulista São Paulo"). Nenhum endereço é
     inventado: quem encontra as unidades reais é o próprio mapa.
     ======================================================================== */

  function iniciarUnidades() {
    const seletor = document.getElementById("unidades-bairro");
    const links = document.querySelectorAll(".unidade-link[data-unidade]");

    function atualizarLinks() {
      const bairro = (seletor && typeof zonasBairros !== "undefined" && possuiChave(zonasBairros, seletor.value))
        ? seletor.value
        : "";
      links.forEach(function (link) {
        const termo = link.getAttribute("data-unidade");
        const busca = bairro ? termo + " " + bairro + " São Paulo" : termo + " perto de mim";
        link.setAttribute("href", "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(busca));
      });
    }

    /* Começa pelo bairro escolhido nos alertas, se houver. */
    const bairroSalvo = lerStorage(CHAVES.bairroUsuario);
    if (seletor && bairroSalvo && typeof zonasBairros !== "undefined" && possuiChave(zonasBairros, bairroSalvo)) {
      seletor.value = bairroSalvo;
    }

    if (seletor) {
      seletor.addEventListener("change", atualizarLinks);
    }
    atualizarLinks();
  }

  /* ========================================================================
     5. INICIALIZAÇÃO
     ======================================================================== */

  function iniciar() {
    /* Roda em todas as páginas. */
    iniciarLetraMaior();
    iniciarMenu();

    /*
     * Execução segura multi-página: a simulação e o formulário só existem em
     * solucao.html. Nas outras páginas esses blocos são simplesmente pulados,
     * sem nenhum erro no console.
     */
    let simulacao = null;
    if (document.getElementById("lista-pontos")) {
      simulacao = iniciarSimulacao();
    }

    if (document.getElementById("form-reporte")) {
      iniciarFormulario(simulacao);
    }

    /* Blocos da página inicial (index.html). */
    if (document.getElementById("lista-alertas-home")) {
      iniciarAlertasHome();
    }
    if (document.getElementById("unidades-bairro")) {
      iniciarUnidades();
    }

    /*
     * Links com âncora (ex.: solucao.html#reportar): a lista de ruas é
     * montada pelo JS e muda a altura da página depois que o navegador já
     * rolou. Por isso rolamos de novo até o alvo, já com tudo desenhado.
     */
    const ancora = window.location.hash.slice(1);
    if (/^[a-z-]+$/.test(ancora)) {
      const alvo = document.getElementById(ancora);
      if (alvo) {
        window.setTimeout(function () {
          rolarAte(alvo);
        }, 0);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
