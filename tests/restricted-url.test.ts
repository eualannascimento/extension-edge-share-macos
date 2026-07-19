import { describe, expect, it } from "vitest";
import { isRestrictedUrl } from "../src/restricted-url";

describe("isRestrictedUrl", () => {
  it("considera pagina http comum como nao restrita", () => {
    expect(isRestrictedUrl("https://example.com/artigo")).toBe(false);
  });

  it("considera http (nao seguro) como nao restrita", () => {
    expect(isRestrictedUrl("http://example.com")).toBe(false);
  });

  it("considera paginas chrome:// como restritas", () => {
    expect(isRestrictedUrl("chrome://extensions")).toBe(true);
  });

  it("considera paginas edge:// como restritas", () => {
    expect(isRestrictedUrl("edge://settings")).toBe(true);
  });

  it("considera a Chrome Web Store (dominio legado) como restrita", () => {
    expect(isRestrictedUrl("https://chrome.google.com/webstore/detail/xyz")).toBe(true);
  });

  it("considera a Chrome Web Store (dominio atual) como restrita", () => {
    expect(isRestrictedUrl("https://chromewebstore.google.com/detail/xyz")).toBe(true);
  });

  it("considera a Microsoft Edge Add-ons como restrita", () => {
    expect(isRestrictedUrl("https://microsoftedge.microsoft.com/addons/detail/xyz")).toBe(true);
  });

  it("considera url ausente como restrita (CA03)", () => {
    expect(isRestrictedUrl(undefined)).toBe(true);
  });

  it("considera url vazia como restrita", () => {
    expect(isRestrictedUrl("")).toBe(true);
  });
});
