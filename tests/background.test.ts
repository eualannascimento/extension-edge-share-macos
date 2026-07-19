import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadBackgroundWithChromeMock(chromeMock: unknown) {
  vi.resetModules();
  // @ts-expect-error stub minimo de chrome.* usado pelo background
  globalThis.chrome = chromeMock;
  const [background, share] = await Promise.all([import("../src/background"), import("../src/share")]);
  return { background, shareCurrentTab: share.shareCurrentTab };
}

function makeChromeMock() {
  const listeners: Array<(tab: chrome.tabs.Tab) => void> = [];
  return {
    mock: {
      action: {
        onClicked: {
          addListener: (fn: (tab: chrome.tabs.Tab) => void) => listeners.push(fn),
        },
      },
      scripting: {
        executeScript: vi.fn(),
      },
      notifications: {
        create: vi.fn(),
      },
    },
    trigger: (tab: chrome.tabs.Tab) => listeners[0](tab),
  };
}

describe("background: handleActionClick", () => {
  let chromeMock: ReturnType<typeof makeChromeMock>["mock"];
  let handleActionClick: (tab: chrome.tabs.Tab) => Promise<void>;

  let shareCurrentTab: (title: string, url: string) => Promise<unknown>;

  beforeEach(async () => {
    const built = makeChromeMock();
    chromeMock = built.mock;
    const loaded = await loadBackgroundWithChromeMock(chromeMock);
    handleActionClick = loaded.background.handleActionClick;
    shareCurrentTab = loaded.shareCurrentTab;
  });

  it("CA01: injeta shareCurrentTab na aba ativa com titulo e url", async () => {
    chromeMock.scripting.executeScript.mockResolvedValue([{ result: { ok: true } }]);

    await handleActionClick({ id: 7, url: "https://example.com/artigo", title: "Artigo" } as chrome.tabs.Tab);

    expect(chromeMock.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 7 },
      func: shareCurrentTab,
      args: ["Artigo", "https://example.com/artigo"],
    });
    expect(chromeMock.notifications.create).not.toHaveBeenCalled();
  });

  it("CA02: nao injeta script e notifica pagina nao suportada para chrome://", async () => {
    await handleActionClick({ id: 7, url: "chrome://extensions", title: "Extensoes" } as chrome.tabs.Tab);

    expect(chromeMock.scripting.executeScript).not.toHaveBeenCalled();
    expect(chromeMock.notifications.create).toHaveBeenCalledTimes(1);
  });

  it("CA03: nao injeta script e notifica pagina nao suportada quando nao ha url na aba", async () => {
    await handleActionClick({ id: 7, url: undefined, title: undefined } as chrome.tabs.Tab);

    expect(chromeMock.scripting.executeScript).not.toHaveBeenCalled();
    expect(chromeMock.notifications.create).toHaveBeenCalledTimes(1);
  });

  it("CA04: notifica erro tecnico quando o resultado injetado falha por reason 'unsupported'", async () => {
    chromeMock.scripting.executeScript.mockResolvedValue([{ result: { ok: false, reason: "unsupported" } }]);

    await handleActionClick({ id: 7, url: "https://example.com", title: "Ex" } as chrome.tabs.Tab);

    expect(chromeMock.notifications.create).toHaveBeenCalledTimes(1);
  });

  it("CA05: notifica erro tecnico quando o resultado injetado falha por reason 'error'", async () => {
    chromeMock.scripting.executeScript.mockResolvedValue([
      { result: { ok: false, reason: "error", message: "falhou" } },
    ]);

    await handleActionClick({ id: 7, url: "https://example.com", title: "Ex" } as chrome.tabs.Tab);

    expect(chromeMock.notifications.create).toHaveBeenCalledTimes(1);
  });

  it("CA06: nao notifica quando o resultado injetado e reason 'aborted'", async () => {
    chromeMock.scripting.executeScript.mockResolvedValue([{ result: { ok: false, reason: "aborted" } }]);

    await handleActionClick({ id: 7, url: "https://example.com", title: "Ex" } as chrome.tabs.Tab);

    expect(chromeMock.notifications.create).not.toHaveBeenCalled();
  });

  it("CA07: nao notifica quando o resultado injetado e sucesso", async () => {
    chromeMock.scripting.executeScript.mockResolvedValue([{ result: { ok: true } }]);

    await handleActionClick({ id: 7, url: "https://example.com", title: "Ex" } as chrome.tabs.Tab);

    expect(chromeMock.notifications.create).not.toHaveBeenCalled();
  });

  it("notifica erro tecnico quando chrome.scripting.executeScript rejeita (ex.: pagina bloqueia injecao)", async () => {
    chromeMock.scripting.executeScript.mockRejectedValue(new Error("Cannot access contents of the page"));

    await handleActionClick({ id: 7, url: "https://example.com", title: "Ex" } as chrome.tabs.Tab);

    expect(chromeMock.notifications.create).toHaveBeenCalledTimes(1);
  });
});
