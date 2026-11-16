# 📡 VizinhançaAlerta

> **Tecnologia comunitária que antecipa enchentes de rua em rua.**

![HTML5](https://img.shields.io/badge/HTML5-semântico-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-Flexbox%20%2B%20Grid-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES6%2B-F7DF1E?logo=javascript&logoColor=black)
![Dependências](https://img.shields.io/badge/dependências-zero-00F0FF)
![ODS](https://img.shields.io/badge/ODS-11%20%7C%2013-3F7E44)

**Global Solution 2026/2 · FIAP · Engenharia de Software · Tema: CitizenTech**

| | |
|---|---|
| 🌐 **Deploy (GitHub Pages / Vercel)** | `[INSERIR LINK DO DEPLOY]` |
| 🎬 **Vídeo Pitch (até 3 min)** | `[INSERIR LINK PÚBLICO DO VÍDEO PITCH]` |
| 💻 **Repositório** | `[INSERIR LINK DO REPOSITÓRIO]` |

---

## 📑 Sumário

1. [O problema raiz](#-o-problema-raiz)
2. [A solução CitizenTech](#-a-solução-citizentech)
3. [Conexão com os ODS](#-conexão-com-os-ods-da-onu)
4. [Funcionalidades](#-funcionalidades)
5. [Diferenciais técnicos](#-diferenciais-técnicos)
6. [Estrutura de pastas](#-estrutura-de-pastas)
7. [Como executar](#-como-executar)
8. [Atendimento à rubrica](#-atendimento-à-rubrica-de-avaliação)
9. [Integrantes do grupo](#-integrantes-do-grupo)
10. [Declaração de uso de IA generativa](#-declaração-transparente-de-uso-de-ia-generativa)

---

## 🌧️ O problema raiz

Nas regiões de várzea da **Zona Leste de São Paulo** — **Jardim Romano, Itaim Paulista, Vila Jacuí, São Miguel Paulista e Ermelino Matarazzo** — a água sobe em minutos.

Os alertas oficiais (Defesa Civil / CGE-SP) são essenciais, mas cobrem **macro-regiões ou subprefeituras inteiras**. Já a enchente urbana acontece em **ruas específicas**, muitas vezes porque **um bueiro está obstruído**. Sem essa informação micro-local, ninguém sabe *qual* rua vai alagar — e a evacuação antecipada não acontece.

> 📊 **Dado oficial:** 482 pontos de alagamento e vias intransitáveis monitorados pelo CGE-SP durante a Operação Chuvas de Verão. Fonte: [CGE-SP / Prefeitura de São Paulo](https://www.cgesp.org/v3/alagamentos.jsp), acesso em 13 nov. 2026.

### 👥 Cidadão-alvo (persona)

Moradores de bairros periféricos sujeitos a alagamentos micro-locais rápidos, com **foco prioritário** em quem não consegue sair correndo:

- 👵 **Idosos** — precisam de mais tempo e, muitas vezes, de apoio de vizinhos;
- 🤰 **Gestantes** — maior risco com quedas e água contaminada;
- ♿ **Pessoas com deficiência (PcD) e mobilidade reduzida** — dependem de rotas acessíveis e de aviso antecipado.

---

## 💡 A solução CitizenTech

O **VizinhançaAlerta** é um aplicativo web leve que junta, em um só lugar, o **canal de socorro**, os **alertas de alagamento rua a rua** e as **rotas de fuga e de resgate**. Quem mora na rua vê o bueiro entupido antes de qualquer sistema — a plataforma transforma essa observação em informação pública, organizada e acionável:

1. **O morador reporta** um bueiro obstruído, água acumulando, rota bloqueada ou um pedido de apoio (ex.: idoso, PcD ou família que precisa sair de casa);
2. **O mapa localiza** a rua no mapa real da Zona Leste, com a cor do nível de risco;
3. **As rotas orientam**: o **morador** vê para onde fugir (ponto de apoio em área mais alta) e o **socorrista** vê por onde chegar com a viatura e quantas pessoas vulneráveis estão no raio.

**Ecossistema:** cidadãos e líderes comunitários · comércio local (pontos de apoio) · Defesa Civil e poder público (dados micro-locais para priorizar limpeza e atendimento).

---

## 🎯 Conexão com os ODS da ONU

| ODS | Como o projeto contribui |
|---|---|
| **ODS 11 — Cidades e Comunidades Sustentáveis** | Meta 11.5: reduzir mortes e pessoas afetadas por catástrofes, incluindo as relacionadas à água, protegendo pessoas em situação de vulnerabilidade. |
| **ODS 13 — Ação Contra a Mudança Global do Clima** | Meta 13.1: reforçar a resiliência e a capacidade de adaptação a riscos climáticos, a partir da própria comunidade. |

---

## ⚙️ Funcionalidades

| Página | O que tem |
|---|---|
| `index.html` (Início) | **Canal de socorro** logo na abertura (ligar 193, 192, 199 e 190 com um toque), atalhos para pedir apoio, **alertas do bairro**, **unidades de socorro perto** e, no fim, o problema, o cidadão-alvo, o dado oficial com fonte e os ODS 11 e 13. |
| `solucao.html` (Mapa e rotas) | **Simulação interativa**: contadores, **mapa urbano real** com **painel de rotas** (morador × socorrista), filtros (bairro, risco e busca por rua), cards das ruas e **Formulário de Reporte e Solicitação de Suporte**. |
| `impacto.html` (Como funciona) | Passo a passo, quem participa, inclusão digital em celular simples e a seção **O que os moradores relatam**: relatos de moradores publicados em reportagens (Agência Pública, Brasil de Fato e TVT News), cada um com link para a fonte. |
| `equipe.html` (Equipe) | Nome, RM e foto de cada integrante do grupo. |

### Destaques da página inicial (`index.html`)

- **Canal de socorro primeiro**: quatro botões grandes que ligam direto (`tel:`) para Bombeiros (193), SAMU (192), Defesa Civil (199) e Polícia Militar (190), e um botão **Emergência** fixo no topo de todas as páginas;
- **Pedir apoio sem ser emergência**: atalhos que abrem o formulário já com o tipo escolhido (`solucao.html?tipo=suporte`);
- **Alertas perto de você**: ruas de risco alto e médio do bairro escolhido (o bairro fica salvo no aparelho), com link que abre a rua direto no mapa (`solucao.html?ponto=3`);
- **Unidades de socorro perto**: pronto-socorro/UPA, hospitais, Bombeiros, delegacias, UBS e subprefeitura. Cada botão abre uma busca no Google Maps pela localização atual ou pelo bairro escolhido. **Nenhum endereço é inventado**: quem encontra as unidades reais é o próprio mapa;
- Dicas úteis de verdade: alertas da Defesa Civil por SMS (CEP para **40199**) e pedido de limpeza de bueiro pelo **156**.

### Destaques da simulação (`solucao.html`)

- **12 pontos monitorados** (array de objetos em `js/dados.js`) exibidos como **cards filtráveis** — com o selo visível *"Dados simulados para demonstração do MVP"*;
- **Mapa urbano real** (OpenStreetMap em `<iframe>` nativo): ao clicar em um card, o mapa dá zoom na rua, mostra o marcador e enquadra também o ponto de apoio; ao filtrar por bairro, o mapa mostra o bairro inteiro;
- **Painel de rotas** com abas acessíveis (setas do teclado, `role="tab"`):
  - **Sou morador — Rota de fuga segura**: ponto de apoio, distância e tempo a pé estimados, instruções para não enfrentar a enxurrada e botão **"Abrir Rota de Evacuação no GPS"** (rota a pé);
  - **Sou socorrista — Rota de resgate**: corredor de acesso sugerido, idosos/PcD em risco no raio, status do bueiro e botão **"Traçar Acesso de Resgate no GPS"** (rota de carro);
- **Filtros em tempo real** por bairro, nível de risco e nome da rua (busca sem diferenciar acentos);
- **Contadores dinâmicos**: ruas monitoradas, risco alto, bueiros entupidos e avisos da vizinhança;
- Botão **"Pedir apoio para esta rua"** só na aba *Sou morador* do painel de rotas (um por rua, para evitar pedidos repetidos; some para o socorrista conectado): rola até o formulário, preenche rua e bairro, seleciona *Pedido de Apoio* e leva o foco para a descrição;
- **Formulário com validação em JavaScript puro** (6 campos obrigatórios), mensagens de erro específicas abaixo de cada campo e mensagem de sucesso acessível (`role="status"`) — **sem nenhum `alert()`**;
- Cada reporte enviado ganha uma **posição dentro do bairro escolhido** e as rotas padrão do bairro, tem a urgência convertida em risco (`Crítica → Alto`, `Moderada → Médio`, `Preventiva → Baixo`), é **salvo no `localStorage`** e aparece imediatamente na lista, no mapa e nos contadores.

> ⚠️ **Coordenadas, pontos de apoio e rotas são simulados** para demonstração. Coordenadas são aproximadas e os pontos de apoio não são abrigos oficiais: antes de qualquer uso real, precisam ser validados com a Defesa Civil (199) e a CET.

---

## 🚀 Diferenciais técnicos

### 1. Arquitetura 100% nativa
- **HTML5, CSS3 e JavaScript Vanilla (ES6+)** — sem frameworks (nada de Bootstrap, Tailwind, React ou Leaflet), sem bibliotecas e **sem CDN**;
- **Sem ES Modules** (`import`/`export`): os scripts são carregados como `<script>` clássicos, por isso o site **abre direto do disco** (`file://`), sem servidor e sem erro de CORS;
- `js/dados.js` concentra os dados (constantes globais) e `js/app.js` concentra a lógica, com **execução segura em várias páginas**: a simulação e o formulário só iniciam se os elementos existirem na página — nenhum erro de console no `index`, `impacto` ou `equipe`.

### 2. Otimizado para redes 3G periféricas
- **Tipografia do sistema** (`system-ui, -apple-system, "Segoe UI", Roboto…`) — zero download de fontes;
- **Mapa sem biblioteca**: nenhum script de mapas é baixado; o mapa é só um `<iframe>` com `loading="lazy"`, presente apenas na página de simulação;
- O `src` do mapa **só muda quando a rua muda** (sem recarregar à toa);
- **Funciona sem o mapa**: lista de ruas, filtros e rotas continuam funcionando se o mapa não carregar, e um aviso aparece quando o aparelho fica sem internet;
- Imagens em **SVG** leves e locais.

### 3. Mapa urbano real + motor de rotas duplas
- **OpenStreetMap via `<iframe>` nativo** (HTML5 puro, sem Leaflet, Mapbox ou Google Maps JS API): o JavaScript monta a URL `export/embed.html` com a área (`bbox`) e o marcador da rua selecionada;
- **Etiqueta em CSS** por cima do mapa com a rua selecionada e o indicador "Ao vivo"; borda do mapa colorida pelo risco (`data-risco`);
- **Rotas duplas** calculadas a partir de `lat`/`lng` de cada ponto e do seu ponto de apoio:
  - distância em linha reta pela **fórmula de Haversine** e tempo a pé estimado a 3 km/h;
  - links diretos de navegação GPS (Google Maps): **a pé** para o cidadão (rua → ponto de apoio) e **de carro** para o socorrista (posição atual → rua);
- Logotipo em **SVG**.

### 4. Persistência via `localStorage`
| Chave | O que guarda |
|---|---|
| `va_letra_grande` | Botão "Letra maior" ligado/desligado |
| `va_reportes_usuario` | Reportes enviados pelo formulário |
| `va_perfil_rota` | Última aba usada no painel de rotas (morador ou socorrista) |
| `va_bairro_usuario` | Bairro escolhido na página inicial (alertas e unidades) |

Os dados lidos do `localStorage` são **validados antes de entrar na tela** (valores desconhecidos são descartados e coordenadas fora do bairro voltam para o centro do bairro).

### 5. Acessibilidade avançada (WCAG)
- **Visual claro e calmo**, pensado para todas as idades: branco com azul claro, verde para o que é seguro, texto grande (17 px na base), botões com pelo menos 48 px de altura e cores de risco que também aparecem em texto (nunca só pela cor);
- **Botão "Letra maior"** no menu de todas as páginas (diferencial *"ajuste do tamanho da fonte"* do edital): alterna o texto entre 16 px e 20 px, com `aria-pressed`, e a escolha fica salva no aparelho. Todo o layout usa `rem`, então a página inteira cresce junto;
- **`prefers-reduced-motion`**: desativa todas as animações e transições (o indicador "Ao vivo" para de piscar e a rolagem deixa de ser suave);
- HTML5 semântico (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `figure`), **link "Pular para o conteúdo"** e hierarquia de títulos;
- **Navegação 100% por teclado** com `:focus-visible` bem visível; abas do painel de rotas no padrão ARIA (setas, Home e End); mapa com `title` descritivo que muda com a rua selecionada;
- Todo `<label>` com `for`, erros ligados aos campos por `aria-describedby` e `aria-invalid`;
- `alt` descritivo nas imagens de conteúdo; cores com contraste legível;
- Alvos de toque com pelo menos **44 px**.

### 6. Segurança
- **Prevenção de XSS**: tudo o que vem do usuário ou do `localStorage` entra no DOM **somente via `textContent`** (`document.createElement`) — nunca via `innerHTML`;
- **URLs do mapa e do GPS montadas só com números** (latitude/longitude): nenhum texto digitado pelo usuário e nenhum dado pessoal vai para serviços externos.

### 7. Responsivo e mobile-first
- CSS escrito primeiro para celular, com **Flexbox**, **CSS Grid** e **Media Queries** em 480 px, 640 px, 900 px e 1200 px;
- Menu hambúrguer acessível no celular (`aria-expanded`, fecha com `Esc`).

---

## 📁 Estrutura de pastas

```
vizinhanca-alerta/
├── index.html              # Início: canal de socorro, alertas, unidades e ODS
├── solucao.html            # Mapa e rotas: mapa real, rotas duplas, filtros e formulário
├── impacto.html            # Como funciona: passos, participantes e validação
├── equipe.html             # Equipe: nome, RM e foto dos integrantes
├── css/
│   └── style.css           # Estilos (visual claro, responsivo)
├── js/
│   ├── dados.js            # Dados globais: zonasBairros, pontosMonitorados…
│   └── app.js              # Lógica: acessibilidade, mapa, filtros e formulário
├── img/
│   ├── logo.svg            # Logotipo
│   └── avatar-placeholder.svg  # Foto provisória dos integrantes
├── ENTREGA.txt             # Grupo, integrantes (nome e RM) e link do pitch
└── README.md
```

---

## ▶️ Como executar

**Não precisa instalar nada nem rodar servidor.**

1. Baixe o projeto (botão **Code → Download ZIP** no GitHub) ou extraia o `.zip` de entrega;
2. Abra a pasta `vizinhanca-alerta`;
3. Dê **dois cliques no `index.html`** — ele abre no navegador (Chrome, Edge, Firefox ou Safari);
4. A página inicial já mostra o canal de socorro; vá em **Mapa e rotas** para testar a simulação.

> 🌐 O mapa do OpenStreetMap precisa de internet. Sem conexão, o resto da simulação (lista, filtros, rotas e formulário) continua funcionando.

### Roteiro rápido de teste
1. Na **página inicial**, escolha um bairro em *Alertas perto de você* e toque em **Ver rota de fuga**: a rua abre direto no mapa;
2. Em **Mapa e rotas**, mude o filtro de **Bairro** para *Itaim Paulista* e veja o mapa e os cards mudarem juntos;
3. Clique em um **card de rua**: o mapa dá zoom na rua e o **painel de rotas** é preenchido;
4. Alterne entre as abas **Sou morador** e **Sou socorrista** e abra uma rota no GPS;
5. Na aba **Sou morador**, clique em **"Pedir apoio para esta rua"** e veja o formulário ser preenchido;
6. Clique em **Enviar aviso** com campos vazios para ver as mensagens de erro;
7. Preencha tudo e envie: o novo ponto aparece na lista, no mapa e nos contadores, já com rotas;
8. Abra o menu, toque em **Letra maior**, recarregue a página e veja que a escolha continua.

> 💡 Para apagar os reportes de teste, limpe os dados do site no navegador (DevTools → Application → Local Storage).

### 🔗 Links da entrega

| | Link |
|---|---|
| 🌐 Deploy (GitHub Pages / Vercel) | `[INSERIR LINK DO DEPLOY]` |
| 🎬 Vídeo Pitch público (até 3 min) | `[INSERIR LINK PÚBLICO DO VÍDEO PITCH]` |

---

## ✅ Atendimento à rubrica de avaliação

| Critério | Onde está |
|---|---|
| Página inicial: cidadão, problema com dado + fonte, proposta e ODS | `index.html` (canal de socorro no topo; problema, cidadão, dado e ODS na seção *Por que o VizinhançaAlerta existe*) |
| Navegação: 4 páginas, menu idêntico, HTML5 semântico | `header` e `nav` iguais nas 4 páginas (Início, Mapa e rotas, Como funciona, Equipe), com `aria-current="page"` |
| Simulação interativa com array de 10+ objetos filtráveis | `js/dados.js` (12 pontos) + `js/app.js` → `solucao.html` |
| Formulário com validação em JS, mensagens no DOM, sem `alert()` | `#form-reporte` em `solucao.html` |
| Responsividade: mobile-first, Flexbox, Grid e Media Queries | `css/style.css` (seção 27) |
| Acessibilidade: tags semânticas, `alt`, `label`, contraste legível e teclado | Todas as páginas; diferencial: botão "Letra maior" salvo no `localStorage` |
| Código organizado (`css/`, `js/`, `img/`), sem `style="..."` inline, README | Este repositório |

---

## 👨‍💻 Integrantes do grupo

**Turma:** 1ESOB

| Foto | Nome completo | RM | Papel no projeto |
|:---:|---|---|---|
| — | Edgard Fernandes da Costa | 569538 | `[PAPEL NO PROJETO]` |
| — | Lucca Miranda Rodrigues | 571057 | `[PAPEL NO PROJETO]` |
| — | Otávio Miguel Rocha | 570739 | `[PAPEL NO PROJETO]` |

---

## 🤖 Declaração transparente de uso de IA generativa

Em conformidade com o edital da Global Solution FIAP, declaramos que **ferramentas de Inteligência Artificial generativa foram utilizadas como apoio** no desenvolvimento deste projeto.

**Ferramenta(s) utilizada(s):** Claude (Anthropic), usado como assistente de programação.

**Em quais etapas a IA apoiou:**
- **Estruturação arquitetural:** organização das pastas, divisão entre `dados.js` e `app.js` e definição do contrato de classes, IDs e atributos `data-` entre HTML, CSS e JavaScript;
- **Geração e revisão de código:** apoio na escrita e na revisão do HTML, do CSS e do JavaScript;
- **Acessibilidade:** revisão de boas práticas WCAG (rótulos, foco visível, ARIA, contraste, tamanho da fonte e movimento reduzido).

**O que foi feito pela equipe:**
- Definição do problema, da persona, do território e da proposta de valor;
- Pesquisa e inserção dos **dados oficiais e suas fontes**;
- Escolha das reportagens usadas na seção *O que os moradores relatam* e conferência de cada relato na fonte original;
- **Leitura, compreensão, teste e validação de todo o código** gerado com apoio da IA, com ajustes quando necessário;
- Gravação do vídeo pitch.

> A IA foi usada como ferramenta de apoio. **Todo o código foi auditado, compreendido e validado pela equipe**, que responde integralmente pelas decisões técnicas e pelo conteúdo entregue. Nenhum dado estatístico ou depoimento foi inventado: o número do CGE-SP e os relatos de moradores vêm de fontes públicas, com link e data; a busca das reportagens teve apoio da IA, e a equipe conferiu cada uma. Os pontos de monitoramento do mapa são **dados simulados**, identificados na interface pelo selo *"Dados simulados para demonstração do MVP"*.

---

<p align="center">
  <strong>VizinhançaAlerta</strong> · Global Solution 2026/2 · FIAP · ODS 11 · ODS 13
</p>
