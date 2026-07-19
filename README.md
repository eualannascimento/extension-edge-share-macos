# Compartilhar com o macOS

Extensao para o Microsoft Edge (Manifest V3, compativel com Chrome) que devolve o botao de compartilhamento nativo do macOS dentro do navegador. No macOS, o Edge nao expoe mais um botao de share que abra o Share Sheet do sistema (AirDrop, Mensagens, Lembretes e demais apps); esta extensao adiciona um icone na barra de ferramentas que faz exatamente isso.

## Como funciona

Um clique no icone da toolbar aciona `navigator.share({ title, url })` na aba ativa, abrindo o Share Sheet nativo do macOS com o titulo e a URL da pagina atual. Nao ha popup nem tela intermediaria - o clique vai direto para o compartilhamento do sistema.

O icone se adapta automaticamente ao tema do Edge: branco quando a toolbar esta no tema escuro, cinza-escuro quando esta no tema claro, trocando em tempo real se voce mudar o tema com o navegador aberto.

Paginas onde o navegador nao permite injetar script (`chrome://`, `edge://`, lojas de extensao) mostram uma notificacao explicando que o compartilhamento nao e suportado ali. Falhas tecnicas tambem geram notificacao; cancelar o Share Sheet e silencioso.

## Instalar (uso pessoal, sem loja)

```bash
npm install
npm run build
```

Depois, no Edge: `edge://extensions` → ative o **Modo de desenvolvedor** → **Carregar sem pacote** → selecione a pasta deste repositorio.

## Desenvolvimento

```bash
npm test          # suite de testes (Vitest)
npm run typecheck # checagem de tipos (TypeScript)
npm run build     # gera dist/background.js e dist/offscreen.js
npm run package   # build + gera um .zip pronto para submissao a lojas
```

O icone e gerado programaticamente (sem ferramentas de design externas) por `scripts/generate-icons.mjs`; rode `npm run generate-icons` para regenerar `icons/white/` e `icons/dark/` caso o desenho mude.

## Stack

TypeScript, sem framework de UI (a extensao nao tem popup visivel). Testes com Vitest, bundle com esbuild.

## Workflow deste repositorio

Este projeto segue o fluxo de Spec-Driven Development descrito em `.rules/global.md`: toda funcionalidade nasce de um Spec aprovado em `.docs/specs/` antes de qualquer codigo, com testes escritos primeiro (TDD) e revisao independente antes do merge.

## Licenca

MIT - veja [LICENSE](LICENSE).
