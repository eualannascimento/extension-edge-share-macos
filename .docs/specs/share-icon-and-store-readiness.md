# Icone de Compartilhamento e Preparacao para Publicacao em Loja

**Status:** Concluído
**Data:** 2026-07-19

## 1. Resumo e Objetivo
Segunda rodada de ajustes sobre a extensao ja validada manualmente no Edge (spec `share-toolbar-button.md`, Concluido): troca do icone placeholder por um glifo reconhecivel de "compartilhar" e preparacao tecnica do pacote para uma futura submissao a lojas de extensao (Chrome Web Store / Microsoft Edge Add-ons), sem realizar a submissao nesta entrega.

## 2. User Stories (Requisitos Funcionais)
* **US01:** Como usuario, quero que o icone da extensao na toolbar remeta visualmente a "compartilhar", para reconhecer a funcao sem precisar do tooltip.
* **US02:** Como mantenedor, quero que o manifest e os artefatos do projeto estejam tecnicamente prontos para uma submissao futura a lojas, para nao precisar refazer trabalho de empacotamento quando decidir publicar.

## 3. Regras de Negocio e Casos de Falha (Edge Cases)
* **Regra 01:** O icone da extensao (`icons/icon-16.png`, `icons/icon-48.png`, `icons/icon-128.png`) e substituido por um glifo do simbolo nativo de compartilhamento do macOS/iOS (retangulo com seta apontando para cima saindo por cima), em tom neutro (cinza escuro), legivel em toolbar clara ou escura, mantendo os mesmos tres tamanhos e os mesmos caminhos ja referenciados em `manifest.json` e `src/notify.ts`.
* **Regra 02:** `manifest.json` passa a incluir os campos `author` e `homepage_url` (apontando para o repositorio no GitHub).
* **Regra 03:** Um script `npm run package` gera um arquivo `.zip` de distribuicao contendo exclusivamente `manifest.json`, `dist/background.js` e a pasta `icons/` (nada de `src/`, `tests/`, `node_modules/`, arquivos de configuracao ou o proprio scaffolding do workflow SDD). O script roda o build (`npm run build`) antes de empacotar, garantindo que o `.zip` nunca contenha um `dist/background.js` desatualizado.
* **Limite 01 (documentado, sem correcao):** O Share Sheet nativo do macOS, ao ser aberto via `navigator.share()` chamado por `chrome.scripting.executeScript` (sem popup), abre ancorado ao centro da janela/aba, e nao proximo ao icone da extensao na toolbar. Nao existe API publica do Chromium para controlar essa ancoragem quando a chamada nao se origina de um clique real dentro de uma janela de popup da extensao. Decisao explicita: manter o comportamento atual sem popup; este limite fica documentado e fora de correcao nesta entrega.

## 4. Estrutura de Dados e Componentes
* **Modelos:** Nenhum.
* **APIs:** Nenhuma nova API de extensao alem das ja usadas (`chrome.action`, `chrome.scripting`, `chrome.notifications`).
* **Arquitetura:**
  * `scripts/generate-icons.mjs`: gerador reproduzivel (Node, sem dependencias externas) que desenha o glifo por segmentos de linha e escreve os PNGs RGBA; `npm run generate-icons` regenera `icons/icon-16.png`, `icons/icon-48.png` e `icons/icon-128.png`.
  * `manifest.json`: adicao dos campos `author` e `homepage_url`.
  * `package.json`: novo script `package` (empacotamento) que depende do script `build` existente.
  * Nenhuma mudanca em `src/background.ts`, `src/share.ts`, `src/restricted-url.ts` ou `src/notify.ts` (o Limite 01 nao gera alteracao de codigo).

## 5. Criterios de Aceite (verificaveis por teste)
* [ ] CA01: Os arquivos `icons/icon-16.png`, `icons/icon-48.png` e `icons/icon-128.png` existem, tem as dimensoes corretas (16x16, 48x48, 128x128) e nao sao mais o placeholder solido azul anterior.
* [ ] CA02: `manifest.json` contem as chaves `author` (string nao vazia) e `homepage_url` (string iniciando com `https://github.com/`).
* [ ] CA03: Rodar `npm run package` gera um arquivo `.zip` em `dist-package/` cujo conteudo e exatamente `manifest.json`, `background.js` (dentro de uma pasta `dist/` ou na raiz do zip, a definir na implementacao) e a pasta `icons/` com os tres PNGs - nenhum outro arquivo do repositorio.
* [ ] CA04: `npm run package` falha (nao gera o zip) se o `npm run build` falhar, evitando empacotar um `dist/background.js` ausente ou desatualizado.

## 6. Fora de Escopo
* Submissao de fato a Chrome Web Store ou Microsoft Edge Add-ons.
* Textos de listing (descricao curta/longa, categoria, screenshots, politica de privacidade).
* Qualquer mudanca de arquitetura para ancorar o Share Sheet perto do icone (ex.: reintroduzir popup) - avaliado e descartado nesta rodada (Limite 01).
* Suporte a temas de icone dinamicos (variantes claro/escuro automaticas) - o icone escolhido e neutro o suficiente para funcionar nos dois casos sem variantes separadas.
