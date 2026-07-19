# Botao de Compartilhamento Nativo do macOS na Toolbar

**Status:** Pronto para Commit
**Data:** 2026-07-18

## 1. Resumo e Objetivo
Extensao Manifest V3 para o Microsoft Edge (Chromium) no macOS que adiciona um icone na barra de ferramentas para acionar o Share Sheet nativo do macOS (AirDrop e demais apps) com o titulo e a URL da aba ativa. Resolve a ausencia do botao de compartilhamento do sistema que o Edge nao expoe mais no macOS.

## 2. User Stories (Requisitos Funcionais)
* **US01:** Como usuario do Edge no macOS, quero clicar em um icone na toolbar, para que o Share Sheet nativo do macOS abra com o titulo e a URL da aba atual, permitindo compartilhar via AirDrop ou outro app do sistema.
* **US02:** Como usuario, quero ser avisado por notificacao quando o compartilhamento falhar por um erro tecnico, para que eu saiba que a acao nao foi concluida.
* **US03:** Como usuario, quero ser avisado por notificacao quando clicar no icone em uma pagina onde o compartilhamento nao e suportado (ex.: `edge://extensions`), para que eu entenda por que nada aconteceu.

## 3. Regras de Negocio e Casos de Falha (Edge Cases)
* **Regra 01:** O clique no icone da extensao (`chrome.action.onClicked`) injeta um script na aba ativa via `chrome.scripting.executeScript` que chama `navigator.share({ title, url })` com o titulo e a URL da aba atual.
* **Regra 02:** Nenhum popup e exibido; a acao e direta a partir do clique no icone.
* **Regra 03:** Apenas `title` e `url` sao enviados ao Share Sheet. Nenhum texto selecionado na pagina, arquivo ou imagem e incluido.
* **Regra 04:** Antes de injetar o script, a extensao verifica o protocolo da URL da aba ativa. Se for uma pagina restrita (`chrome://`, `edge://`, dominios de Web Store) ou nao houver aba ativa valida, a injecao nao e tentada e uma notificacao nativa "Nao suportado nesta pagina" e exibida via `chrome.notifications`.
* **Falha 01:** Se `navigator.share` nao existir no contexto da pagina (API indisponivel), uma notificacao nativa de erro e exibida via `chrome.notifications` e a execucao para.
* **Falha 02:** Se `navigator.share` rejeitar com `NotAllowedError` (falta de user gesture herdado do clique no icone) ou qualquer outro erro tecnico que nao seja cancelamento do usuario, uma notificacao nativa de erro e exibida via `chrome.notifications`.
* **Falha 03:** Se o usuario cancelar o Share Sheet nativo (`navigator.share` rejeita com `AbortError`), nenhuma notificacao e exibida; a falha e silenciosa.
* **Risco tecnico 01:** A Regra 01/02 (sem popup) pode nao herdar o "user gesture" do clique no icone ao injetar o script na aba, fazendo `navigator.share` rejeitar sistematicamente com `NotAllowedError` mesmo fora do caso da Falha 02 pontual. Se a Fase 3 (TDD) comprovar essa falha sistemica em teste manual/e2e, o loop autonomo deve parar, reportar o impasse e voltar ao Grilling para decidir a adocao de um popup minimo como fallback, em vez de decidir isso sozinho.

## 4. Estrutura de Dados e Componentes
* **Modelos:** Nao ha persistencia de dados; a extensao e sem estado.
* **APIs:** Nenhuma API HTTP propria. Integra com as Web Extensions APIs (`chrome.action`, `chrome.scripting`, `chrome.notifications`, `chrome.tabs`) e com a Web Share API do navegador (`navigator.share`).
* **Arquitetura:**
  * `manifest.json`: Manifest V3, `permissions: ["activeTab", "scripting", "notifications"]`, sem `host_permissions` amplas, sem `action.default_popup`.
  * `src/background.ts`: service worker; escuta `chrome.action.onClicked`, valida a URL da aba, injeta o script de compartilhamento ou dispara a notificacao de pagina restrita.
  * `src/share.ts`: funcao pura injetada na aba (via `func` do `executeScript`) que chama `navigator.share({ title, url })` e reporta erro/sucesso de volta ao background.
  * `src/restricted-url.ts`: funcao pura que recebe uma URL (string) e retorna se ela e restrita (protocolos `chrome:`, `edge:`, dominios de Web Store) ou invalida.
  * `src/notify.ts`: wrapper fino sobre `chrome.notifications.create` para os dois textos de notificacao (erro tecnico e pagina nao suportada).

## 5. Criterios de Aceite (verificaveis por teste)
* [ ] CA01: Dado que a aba ativa e uma pagina http/https comum, quando o usuario clica no icone da extensao, entao `chrome.scripting.executeScript` e chamado na aba ativa com uma funcao que invoca `navigator.share({ title, url })` usando o titulo e a URL dessa aba.
* [ ] CA02: Dado que a URL da aba ativa comeca com `chrome://`, `edge://` ou e um dominio de Web Store, quando o usuario clica no icone, entao nenhuma injecao de script ocorre e uma notificacao "Nao suportado nesta pagina" e exibida.
* [ ] CA03: Dado que nao ha aba ativa valida (ex.: `tab.url` ausente ou indefinido), quando o usuario clica no icone, entao nenhuma injecao ocorre e a notificacao "Nao suportado nesta pagina" e exibida.
* [ ] CA04: Dado que `navigator.share` nao existe no contexto da pagina, quando a funcao injetada executa, entao uma notificacao de erro tecnico e exibida.
* [ ] CA05: Dado que `navigator.share` rejeita com um erro diferente de `AbortError`, quando a funcao injetada executa, entao uma notificacao de erro tecnico e exibida.
* [ ] CA06: Dado que `navigator.share` rejeita com `AbortError` (cancelamento do usuario), quando a funcao injetada executa, entao nenhuma notificacao e exibida.
* [ ] CA07: Dado que `navigator.share` resolve com sucesso, quando a funcao injetada executa, entao nenhuma notificacao e exibida.

## 6. Fora de Escopo
* Popup visivel, menu de contexto, atalho de teclado ou qualquer gatilho alem do icone da toolbar.
* Compartilhar texto selecionado, imagens, arquivos ou conteudo alem de titulo e URL da aba.
* Suporte a Firefox, Safari ou qualquer navegador que nao seja Chromium (Edge/Chrome).
* Publicacao na Microsoft Edge Add-ons Store (uso apenas via "Carregar sem pacote").
* Qualquer componente nativo auxiliar (app Swift, Native Messaging Host): a Web Share API do proprio Chromium resolve a integracao com o Share Sheet.
* Configuracoes de usuario (ex.: escolher quais campos compartilhar) ou internacionalizacao de textos/notificacoes.
