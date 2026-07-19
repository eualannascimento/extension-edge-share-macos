import { isRestrictedUrl } from "./restricted-url";
import { notifyError, notifyUnsupportedPage } from "./notify";
import { shareCurrentTab } from "./share";
import { iconPathsForTheme } from "./theme";

export async function handleActionClick(tab: chrome.tabs.Tab): Promise<void> {
  if (isRestrictedUrl(tab.url) || tab.id === undefined) {
    notifyUnsupportedPage();
    return;
  }

  try {
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: shareCurrentTab,
      args: [tab.title ?? "", tab.url ?? ""],
    });

    const result = injectionResults[0]?.result;
    if (result && !result.ok && result.reason !== "aborted") {
      if (result.reason === "error") console.error("Falha ao compartilhar:", result.message);
      notifyError();
    }
  } catch (err) {
    console.error("Falha ao compartilhar:", err);
    notifyError();
  }
}

chrome.action.onClicked.addListener(handleActionClick);

async function applyIconForTheme(isDark: boolean): Promise<void> {
  await chrome.action.setIcon({ path: iconPathsForTheme(isDark) });
}

function isThemeDetectedMessage(message: unknown): message is { type: "theme-detected"; isDark: boolean } {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as { type?: unknown }).type === "theme-detected" &&
    typeof (message as { isDark?: unknown }).isDark === "boolean"
  );
}

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (isThemeDetectedMessage(message)) void applyIconForTheme(message.isDark);
});

let themeDetectionInFlight: Promise<void> | null = null;

export function initThemeDetection(): Promise<void> {
  if (!themeDetectionInFlight) {
    themeDetectionInFlight = (async () => {
      try {
        const hasDocument = await chrome.offscreen.hasDocument();
        if (hasDocument) return;
        await chrome.offscreen.createDocument({
          url: "offscreen.html",
          reasons: [chrome.offscreen.Reason.MATCH_MEDIA],
          justification: "Detectar o tema claro/escuro do sistema para atualizar o icone da toolbar.",
        });
      } catch (err) {
        console.error("Falha ao iniciar deteccao de tema, mantendo o icone padrao:", err);
      } finally {
        themeDetectionInFlight = null;
      }
    })();
  }
  return themeDetectionInFlight;
}

chrome.runtime.onInstalled.addListener(() => void initThemeDetection());
chrome.runtime.onStartup.addListener(() => void initThemeDetection());
