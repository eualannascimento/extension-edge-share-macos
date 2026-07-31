# Permissões, mensagens e assinatura

activeTab limita o acesso à aba após ação explícita. scripting executa somente
shareCurrentTab na aba ativa. notifications exibe falhas. offscreen detecta o
tema. Não adicione host permissions sem caso de uso documentado.

Mensagens aceitas pelo service worker são objetos theme-detected com isDark
booleano. Mensagens desconhecidas devem ser ignoradas. O resultado usa estados
ok, unsupported, aborted e error.

Valide em perfil Edge novo: build, carregamento sem pacote, clique em página
HTTPS, página restrita, cancelamento e erro de injeção. Para distribuição,
gere o pacote com npm run package, assine conforme a política da loja e nunca
inclua chaves privadas no repositório.
