import { describe, expect, it } from "vitest";
import { iconPathsForTheme } from "../src/theme";

describe("iconPathsForTheme", () => {
  it("CA04: retorna os caminhos brancos quando isDark e true", () => {
    expect(iconPathsForTheme(true)).toEqual({
      16: "icons/white/icon-16.png",
      48: "icons/white/icon-48.png",
      128: "icons/white/icon-128.png",
    });
  });

  it("CA05: retorna os caminhos escuros quando isDark e false", () => {
    expect(iconPathsForTheme(false)).toEqual({
      16: "icons/dark/icon-16.png",
      48: "icons/dark/icon-48.png",
      128: "icons/dark/icon-128.png",
    });
  });
});
