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
