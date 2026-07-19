# Icone Adaptavel ao Tema Claro/Escuro do Edge

**Status:** Pronto para Commit
**Data:** 2026-07-19

## 1. Resumo e Objetivo
Corrige o icone da extensao (entregue na spec `share-icon-and-store-readiness.md`) que ficava ilegivel no tema escuro do Edge: troca o glifo por um estilo mais proximo do icone de compartilhar do Safari, e faz a extensao trocar automaticamente entre uma variante branca (toolbar escura) e uma variante escura (toolbar clara) usando deteccao de tema em tempo real.

## 2. User Stories (Requisitos Funcionais)
* **US01:** Como usuario do Edge no tema escuro, quero que o icone da extensao seja branco e visivel, para nao se confundir com o fundo escuro da toolbar.
* **US02:** Como usuario, quero que o icone se adapte automaticamente se eu trocar entre tema claro e escuro no Edge, sem precisar reiniciar o navegador ou recarregar a extensao.

## 3. Regras de Negocio e Casos de Falha (Edge Cases)
* **Regra 01:** O glifo do icone muda para um estilo mais arredondado, proximo do icone de compartilhar do Safari (quadrado com cantos suaves e uma seta saindo por cima), mantendo os mesmos tres tamanhos (16, 48, 128).
* **Regra 02:** Existem dois conjuntos de icones para o mesmo glifo: `icons/white/icon-{16,48,128}.png` (branco solido, usado quando a toolbar do navegador esta em tema escuro) e `icons/dark/icon-{16,48,128}.png` (tom neutro cinza-escuro 60,60,67, usado quando a toolbar esta em tema claro).
* **Regra 03:** Um documento offscreen (`chrome.offscreen`, nova permissao `"offscreen"` no manifest) usa `matchMedia('(prefers-color-scheme: dark)')` para detectar o tema do sistema/navegador e envia o resultado ao service worker via `chrome.runtime.sendMessage`.
* **Regra 04:** O service worker chama `chrome.action.setIcon()` com o conjunto de icones (branco ou escuro) correspondente ao tema detectado: ao iniciar a extensao (`chrome.runtime.onInstalled` / `onStartup`) e sempre que o offscreen document notificar uma mudanca de tema.
* **Regra 05:** O offscreen document registra um listener `change` no `matchMedia`, permitindo que a troca de tema feita pelo usuario enquanto o navegador esta aberto atualize o icone imediatamente, sem precisar reiniciar nada.
* **Regra 06:** As notificacoes (`chrome.notifications.create`) sempre usam o icone escuro (`icons/dark/icon-128.png`) como `iconUrl`, independente do tema da toolbar, porque o sistema operacional normalmente renderiza notificacoes com fundo claro proprio.
* **Falha 01:** Se a criacao do offscreen document falhar, ou nenhuma mensagem de deteccao de tema for recebida, a extensao mantem o icone branco como padrao (assume tema escuro), coerente com o `default_icon` do manifest.

## 4. Estrutura de Dados e Componentes
* **Modelos:** Nenhum.
* **APIs:** Nova permissao e API `chrome.offscreen`; uso de `chrome.action.setIcon()`.
* **Arquitetura:**
  * `scripts/generate-icons.mjs`: atualizado para desenhar o novo glifo (estilo Safari, cantos arredondados) em duas cores (branco e escuro), gerando `icons/white/icon-{16,48,128}.png` e `icons/dark/icon-{16,48,128}.png`.
  * `src/offscreen.html` + `src/offscreen.ts`: documento offscreen minimo que roda `matchMedia`, envia o resultado inicial e escuta mudancas, repassando cada deteccao ao service worker via mensagem.
  * `src/theme.ts`: funcao pura `iconPathsForTheme(isDark: boolean)` que retorna o conjunto de caminhos de icone (branco ou escuro) para os tres tamanhos - testavel sem navegador.
  * `src/background.ts`: cria o offscreen document na inicializacao, escuta as mensagens de tema e chama `chrome.action.setIcon()`; mantem o fallback branco se a criacao do offscreen document lancar erro.
  * `src/notify.ts`: `iconUrl` fixado em `icons/dark/icon-128.png` (Regra 06).
  * `manifest.json`: adiciona `"offscreen"` a `permissions`; `icons`/`action.default_icon` passam a apontar para `icons/white/icon-{16,48,128}.png` (fallback inicial, coerente com a Falha 01).

## 5. Criterios de Aceite (verificaveis por teste)
* [ ] CA01: `icons/white/icon-{16,48,128}.png` existem, tem as dimensoes corretas e sao brancos solidos (255,255,255) nos pixels de foreground.
* [ ] CA02: `icons/dark/icon-{16,48,128}.png` existem, tem as dimensoes corretas e sao no tom neutro (60,60,67) nos pixels de foreground.
* [ ] CA03: `manifest.json` inclui `"offscreen"` no array `permissions`.
* [ ] CA04: Dado que o service worker recebe uma mensagem de tema com `isDark: true`, `iconPathsForTheme` retorna os caminhos de `icons/white/`.
* [ ] CA05: Dado que o service worker recebe uma mensagem de tema com `isDark: false`, `iconPathsForTheme` retorna os caminhos de `icons/dark/`.
* [ ] CA06: Dado que nenhuma mensagem de tema e recebida (ou a criacao do offscreen document falha), o icone efetivamente ativo continua sendo o conjunto branco (fallback do manifest, sem chamada a `setIcon` que o substitua por outro).
* [ ] CA07: Dado que o offscreen document envia uma segunda mensagem de tema (simulando uma troca de tema em tempo real) com um valor diferente da primeira, o service worker chama `chrome.action.setIcon()` novamente com o conjunto correspondente.

## 6. Fora de Escopo
* Submissao a lojas com o novo icone (a preparacao tecnica generica ja existe da spec anterior; nao ha nova submissao nesta entrega).
* Suporte a temas customizados/coloridos do Edge alem de claro/escuro binario.
* Redesenho do icone usado nas notificacoes alem da escolha fixa do tom escuro (Regra 06).
