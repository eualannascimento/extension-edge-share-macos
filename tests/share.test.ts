import { afterEach, describe, expect, it, vi } from "vitest";
import { shareCurrentTab } from "../src/share";

describe("shareCurrentTab", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("CA04: retorna reason 'unsupported' quando navigator.share nao existe", async () => {
    vi.stubGlobal("navigator", {});

    const result = await shareCurrentTab("Titulo", "https://example.com");

    expect(result).toEqual({ ok: false, reason: "unsupported" });
  });

  it("CA05: retorna reason 'error' quando navigator.share rejeita com erro tecnico", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("falhou", "NotAllowedError"));
    vi.stubGlobal("navigator", { share });

    const result = await shareCurrentTab("Titulo", "https://example.com");

    expect(share).toHaveBeenCalledWith({ title: "Titulo", url: "https://example.com" });
    expect(result).toEqual({ ok: false, reason: "error", message: "falhou" });
  });

  it("CA06: retorna reason 'aborted' quando o usuario cancela o Share Sheet", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("cancelado", "AbortError"));
    vi.stubGlobal("navigator", { share });

    const result = await shareCurrentTab("Titulo", "https://example.com");

    expect(result).toEqual({ ok: false, reason: "aborted" });
  });

  it("CA07: retorna ok quando navigator.share resolve com sucesso", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });

    const result = await shareCurrentTab("Titulo", "https://example.com");

    expect(result).toEqual({ ok: true });
  });
});
