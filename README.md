# Workflow de Desenvolvimento Guiado por IA (SDD + TDD)

Este repositório é um *template* estruturado para guiar o desenvolvimento de software auxiliado por Inteligência Artificial (Claude Code, Cursor, Windsurf, Copilot, ChatGPT).

O objetivo deste template não é ser código, mas sim atuar como **a máquina de estados e o contrato** que a IA deve respeitar para não alucinar, não criar débitos técnicos e desenvolver código com previsibilidade.

## 🚀 Estrutura de Pastas e Fases

O workflow é dividido nas seguintes fases e pastas. A IA **sempre** deve respeitar a ordem deste fluxo:

| Fase | Pasta / Arquivo | Descrição |
|------|-----------------|-----------|
| 0 | `.rules/` | Regras de ouro do repositório: arquitetura, segurança, economia de tokens, versionamento e estilo anti-IA (`anti-ai-style.md`, critérios E01-E25). Carregadas automaticamente via `.cursorrules`, `CLAUDE.md` e `AGENTS.md`. |
| 1 | `.prompts/1-grilling.md` | **Grilling (Descoberta):** interrogatório da ideia para extrair regras de negócio e edge cases. |
| 1b | `.prompts/1b-grilling-voz.md` | **Grilling por voz (variante):** mesmo interrogatório, adaptado para conversa falada (ChatGPT/Gemini em modo de voz); o documento gerado é importado no `/sdd`. |
| 2 | `.docs/specs/` | **Especificação:** a "Fonte da Verdade". Nenhum código é escrito sem um Spec aprovado. Use o `_TEMPLATE.md`. |
| 3 | `.prompts/3-loop-tdd.md` | **TDD + Loop autônomo:** testes primeiro (Red), depois código mínimo (Green). |
| 4 | `.prompts/4-review.md` | **Auditoria:** code review agressivo de segurança, performance e Clean Code. |
| 5 | `.prompts/5-commits.md` | **Micro-commits:** versionamento em entregas lógicas com Conventional Commits. |
| 6 | `.prompts/6-deploy.md` | **Deploy / PR:** checklist final, changelog e abertura de Pull Request. |
| - | `tests/` | Onde os testes automatizados residem. O desenvolvimento só avança após a criação do teste. |

## 🔁 O Ciclo em Resumo

```
Ideia → Grilling (1) → Spec aprovado (2) → Testes falhando (3-Red)
     → Código mínimo (3-Green) → Review (4) → Micro-commits (5) → Deploy/PR (6)
```

## ⚡ Skill `/sdd` (Claude Code)

No Claude Code, o fluxo inteiro é orquestrado pela skill `/sdd` (em `.claude/skills/sdd/`):

- `/sdd <descrição da ideia>` - inicia uma nova feature na Fase 1 (Grilling).
- `/sdd continue` - detecta em que fase a feature parou (pelo campo `Status` do spec) e retoma.
- `/sdd status` - reporta a fase atual de cada spec.

A skill avança de fase somente com sua aprovação explícita (gates), mas atua com autonomia total dentro de cada fase (ex.: o loop Red/Green da Fase 3). Em outras ferramentas (Cursor, Windsurf), use os prompts de `.prompts/` manualmente na ordem numérica.

## 🔧 Skill `/sdd-adopt`: projetos que já existem

O `/sdd` parte de uma ideia nova. Para aplicar o workflow a um sistema que já está rodando, use `/sdd-adopt` (em `.claude/skills/sdd-adopt/`):

1. **Inventário:** varre o projeto e levanta stack, arquitetura, domínios funcionais e estado dos testes.
2. **Engenharia reversa:** extrai as regras de negócio do código e gera specs baseline (`.docs/specs/baseline-*.md`) e um `architecture.md`, marcando incertezas como `[INCERTO]` em vez de presumir.
3. **Instalação:** monta a estrutura do template no projeto e adapta `.rules/global.md` às convenções reais detectadas.
4. **Handoff:** resolve as incertezas com você (estilo Grilling), commita a baseline e libera o `/sdd` para a primeira feature nova.

## 🛡️ Gates automáticos e revisor independente

Regras verificáveis não dependem da obediência da IA:

- **Hook local** (`.claude/hooks/check-style.sh`, ligado via `.claude/settings.json`): bloqueia na hora qualquer edição que introduza travessão, meia-risca ou aspas curvas.
- **CI** (`.github/workflows/style-gate.yml`): falha o push/PR se algum arquivo versionado contiver esses caracteres.
- **Subagent `reviewer`** (`.claude/agents/reviewer.md`): a Fase 4 roda em um revisor de contexto limpo, sem o viés de quem escreveu o código; ele reporta tudo (com severidade e confiança) e a sessão principal faz a triagem e aplica as correções.

No `/sdd-adopt`, codebases grandes são varridos em paralelo por subagents (um por domínio), protegendo a janela de contexto da sessão principal.

## 🧠 Resiliência à janela de contexto

Qualquer fase pode ser interrompida por estouro de contexto, compactação de conversa ou troca de sessão. O protocolo de `.rules/context-management.md` torna isso imperceptível:

- **Diário de execução** (`.docs/journal/<feature>.md`): snapshot com fase, último passo, próxima ação executável e decisões da sessão, atualizado em checkpoints obrigatórios (C1 a C5).
- **Recuperação silenciosa:** ao retomar, a IA lê spec + diário, valida contra o `git status` e continua pela "Próxima ação" anunciando 1 linha, sem pedir que você re-explique nada.
- **Economia preventiva:** leitura seletiva de arquivos, stacktraces resumidos e processamento em lotes nas fases longas.

A pasta `.docs/journal/` é git-ignorada (estado transitório) e o diário é apagado quando a feature chega a `Concluído`.

## 📌 Como usar em um projeto novo

1. Clone/copie este template para o seu projeto.
2. Ajuste `.rules/global.md` com particularidades da sua stack (linguagem, framework, banco).
3. Siga os arquivos da pasta `.prompts/` na ordem numérica para cada nova funcionalidade.
4. Nunca pule a Fase 2: se não existe Spec em `.docs/specs/`, não existe código.
