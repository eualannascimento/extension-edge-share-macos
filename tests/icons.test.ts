import { describe, expect, it } from "vitest";
import { readPng } from "./helpers/png";

const SIZES = [16, 48, 128];

function foregroundColors(png: ReturnType<typeof readPng>): [number, number, number][] {
  const channels = 4;
  const colors: [number, number, number][] = [];
  for (let i = 0; i < png.pixels.length; i += channels) {
    const [r, g, b, a] = png.pixels.subarray(i, i + channels);
    if (a !== 0) colors.push([r, g, b]);
  }
  return colors;
}

describe("icones brancos (icons/white) - toolbar em tema escuro", () => {
  it.each(SIZES)("CA01: icons/white/icon-%i.png tem %i x %i pixels", (size) => {
    const png = readPng(`icons/white/icon-${size}.png`);
    expect(png.width).toBe(size);
    expect(png.height).toBe(size);
  });

  it.each(SIZES)("CA01: icons/white/icon-%i.png e branco solido (255,255,255) no glifo", (size) => {
    const png = readPng(`icons/white/icon-${size}.png`);
    const colors = foregroundColors(png);
    expect(colors.length).toBeGreaterThan(0);
    for (const color of colors) expect(color).toEqual([255, 255, 255]);
  });
});

describe("icones escuros (icons/dark) - toolbar em tema claro", () => {
  it.each(SIZES)("CA02: icons/dark/icon-%i.png tem %i x %i pixels", (size) => {
    const png = readPng(`icons/dark/icon-${size}.png`);
    expect(png.width).toBe(size);
    expect(png.height).toBe(size);
  });

  it.each(SIZES)("CA02: icons/dark/icon-%i.png usa o tom neutro (60,60,67) no glifo", (size) => {
    const png = readPng(`icons/dark/icon-${size}.png`);
    const colors = foregroundColors(png);
    expect(colors.length).toBeGreaterThan(0);
    for (const color of colors) expect(color).toEqual([60, 60, 67]);
  });
});
