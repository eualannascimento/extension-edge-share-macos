import { describe, expect, it } from "vitest";
import { countDistinctPixels, readPng } from "./helpers/png";

const ICONS = [
  { path: "icons/icon-16.png", size: 16 },
  { path: "icons/icon-48.png", size: 48 },
  { path: "icons/icon-128.png", size: 128 },
];

describe("icones da extensao", () => {
  it.each(ICONS)("CA01: $path tem $size x $size pixels", ({ path, size }) => {
    const png = readPng(path);
    expect(png.width).toBe(size);
    expect(png.height).toBe(size);
  });

  it.each(ICONS)("CA01: $path nao e mais o placeholder solido (mais de uma cor)", ({ path }) => {
    const png = readPng(path);
    expect(countDistinctPixels(png, 4)).toBeGreaterThan(1);
  });

  it.each(ICONS)("CA01: $path usa o tom neutro cinza-escuro do glifo (60,60,67)", ({ path }) => {
    const png = readPng(path);
    const channels = 4;
    let foregroundFound = false;
    for (let i = 0; i < png.pixels.length; i += channels) {
      const [r, g, b, a] = png.pixels.subarray(i, i + channels);
      if (a === 0) continue;
      expect([r, g, b]).toEqual([60, 60, 67]);
      foregroundFound = true;
    }
    expect(foregroundFound).toBe(true);
  });
});
