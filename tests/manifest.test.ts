import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));

describe("manifest.json: campos de preparacao para loja", () => {
  it("CA02: possui author nao vazio", () => {
    expect(typeof manifest.author).toBe("string");
    expect(manifest.author.length).toBeGreaterThan(0);
  });

  it("CA02: possui homepage_url apontando para o GitHub", () => {
    expect(manifest.homepage_url).toMatch(/^https:\/\/github\.com\//);
  });
});

describe("manifest.json: deteccao de tema", () => {
  it("CA03: inclui a permissao offscreen", () => {
    expect(manifest.permissions).toContain("offscreen");
  });

  it("icons/action.default_icon apontam para o conjunto branco (fallback)", () => {
    expect(manifest.icons["128"]).toBe("icons/white/icon-128.png");
    expect(manifest.action.default_icon["128"]).toBe("icons/white/icon-128.png");
  });
});
