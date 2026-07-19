import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadBackgroundWithChromeMock(chromeMock: unknown) {
  vi.resetModules();
  // @ts-expect-error stub minimo de chrome.* usado pelo background
  globalThis.chrome = chromeMock;
  const [background, share] = await Promise.all([import("../src/background"), import("../src/share")]);
  return { background, shareCurrentTab: share.shareCurrentTab };
}

function makeChromeMock() {
  const actionListeners: Array<(tab: chrome.tabs.Tab) => void> = [];
  const messageListeners: Array<(message: unknown) => void> = [];
  const installedListeners: Array<() => void> = [];
  const startupListeners: Array<() => void> = [];

  return {
    mock: {
      action: {
        onClicked: {
          addListener: (fn: (tab: chrome.tabs.Tab) => void) => actionListeners.push(fn),
        },
        setIcon: vi.fn(),
      },
      scripting: {
        executeScript: vi.fn(),
      },
      notifications: {
        create: vi.fn(),
      },
      offscreen: {
        Reason: { MATCH_MEDIA: "MATCH_MEDIA" },
        hasDocument: vi.fn().mockResolvedValue(false),
        createDocument: vi.fn().mockResolvedValue(undefined),
      },
      runtime: {
        onMessage: {
          addListener: (fn: (message: unknown) => void) => messageListeners.push(fn),
        },
        onInstalled: {
          addListener: (fn: () => void) => installedListeners.push(fn),
        },
        onStartup: {
          addListener: (fn: () => void) => startupListeners.push(fn),
        },
      },
    },
    triggerAction: (tab: chrome.tabs.Tab) => actionListeners[0](tab),
    triggerMessage: (message: unknown) => messageListeners.forEach((fn) => fn(message)),
    triggerInstalled: () => installedListeners.forEach((fn) => fn()),
    triggerStartup: () => startupListeners.forEach((fn) => fn()),
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

describe("background: deteccao de tema", () => {
  let chromeMock: ReturnType<typeof makeChromeMock>["mock"];
  let helpers: ReturnType<typeof makeChromeMock>;
  let background: Awaited<ReturnType<typeof loadBackgroundWithChromeMock>>["background"];

  beforeEach(async () => {
    helpers = makeChromeMock();
    chromeMock = helpers.mock;
    const loaded = await loadBackgroundWithChromeMock(chromeMock);
    background = loaded.background;
  });

  it("CA04: aplica os icones brancos quando recebe theme-detected com isDark true", () => {
    helpers.triggerMessage({ type: "theme-detected", isDark: true });

    expect(chromeMock.action.setIcon).toHaveBeenCalledWith({
      path: {
        16: "icons/white/icon-16.png",
        48: "icons/white/icon-48.png",
        128: "icons/white/icon-128.png",
      },
    });
  });

  it("CA05: aplica os icones escuros quando recebe theme-detected com isDark false", () => {
    helpers.triggerMessage({ type: "theme-detected", isDark: false });

    expect(chromeMock.action.setIcon).toHaveBeenCalledWith({
      path: {
        16: "icons/dark/icon-16.png",
        48: "icons/dark/icon-48.png",
        128: "icons/dark/icon-128.png",
      },
    });
  });

  it("CA07: reage a uma segunda mensagem de tema, trocando o icone novamente", () => {
    helpers.triggerMessage({ type: "theme-detected", isDark: true });
    helpers.triggerMessage({ type: "theme-detected", isDark: false });

    expect(chromeMock.action.setIcon).toHaveBeenCalledTimes(2);
    expect(chromeMock.action.setIcon).toHaveBeenNthCalledWith(1, {
      path: expect.objectContaining({ 128: "icons/white/icon-128.png" }),
    });
    expect(chromeMock.action.setIcon).toHaveBeenNthCalledWith(2, {
      path: expect.objectContaining({ 128: "icons/dark/icon-128.png" }),
    });
  });

  it("ignora mensagens que nao sejam theme-detected", () => {
    helpers.triggerMessage({ type: "outra-coisa" });
    helpers.triggerMessage(null);
    helpers.triggerMessage("string qualquer");

    expect(chromeMock.action.setIcon).not.toHaveBeenCalled();
  });

  it("CA06: initThemeDetection cria o offscreen document ao instalar", async () => {
    await background.initThemeDetection();

    expect(chromeMock.offscreen.createDocument).toHaveBeenCalledTimes(1);
    expect(chromeMock.offscreen.createDocument).toHaveBeenCalledWith(
      expect.objectContaining({ url: "offscreen.html" }),
    );
  });

  it("CA06: onInstalled e onStartup ambos disparam a deteccao de tema", async () => {
    helpers.triggerInstalled();
    helpers.triggerStartup();
    await background.initThemeDetection();

    expect(chromeMock.offscreen.createDocument).toHaveBeenCalledWith(
      expect.objectContaining({ url: "offscreen.html" }),
    );
  });

  it("CA06: fallback silencioso quando a criacao do offscreen document falha (icone branco do manifest permanece)", async () => {
    chromeMock.offscreen.createDocument.mockRejectedValue(new Error("offscreen indisponivel"));

    await expect(background.initThemeDetection()).resolves.toBeUndefined();
    expect(chromeMock.action.setIcon).not.toHaveBeenCalled();
  });

  it("nao cria um segundo offscreen document se um ja existir", async () => {
    chromeMock.offscreen.hasDocument.mockResolvedValue(true);

    await background.initThemeDetection();

    expect(chromeMock.offscreen.createDocument).not.toHaveBeenCalled();
  });

  it("condicao de corrida: chamadas concorrentes a initThemeDetection criam apenas um offscreen document", async () => {
    const concurrentCalls = [background.initThemeDetection(), background.initThemeDetection(), background.initThemeDetection()];

    await Promise.all(concurrentCalls);

    expect(chromeMock.offscreen.createDocument).toHaveBeenCalledTimes(1);
  });

  it("apos concluir, uma nova chamada a initThemeDetection roda a deteccao de novo (nao fica travada)", async () => {
    await background.initThemeDetection();
    await background.initThemeDetection();

    expect(chromeMock.offscreen.createDocument).toHaveBeenCalledTimes(2);
  });
});
