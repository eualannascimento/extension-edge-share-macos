export function notifyError(): void {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/dark/icon-128.png",
    title: "Nao foi possivel compartilhar",
    message: "Ocorreu um erro ao tentar compartilhar esta pagina.",
  });
}

export function notifyUnsupportedPage(): void {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/dark/icon-128.png",
    title: "Compartilhamento nao suportado",
    message: "Esta pagina nao permite compartilhar pelo Share Sheet do macOS.",
  });
}
