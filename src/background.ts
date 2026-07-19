import { isRestrictedUrl } from "./restricted-url";
import { notifyError, notifyUnsupportedPage } from "./notify";
import { shareCurrentTab } from "./share";

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
