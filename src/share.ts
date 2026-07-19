export type ShareResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" }
  | { ok: false; reason: "aborted" }
  | { ok: false; reason: "error"; message: string };

/**
 * Executada via chrome.scripting.executeScript no contexto da pagina (nao no
 * service worker), por isso nao pode depender de imports externos.
 */
export async function shareCurrentTab(title: string, url: string): Promise<ShareResult> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return { ok: false, reason: "unsupported" };
  }

  try {
    await navigator.share({ title, url });
    return { ok: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, reason: "aborted" };
    }
    return { ok: false, reason: "error", message: err instanceof Error ? err.message : String(err) };
  }
}
