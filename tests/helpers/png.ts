import { readFileSync } from "node:fs";
import zlib from "node:zlib";

export interface DecodedPng {
  width: number;
  height: number;
  pixels: Buffer;
}

/**
 * Decodificador minimo de PNG (RGB ou RGBA, sem interlace) usado apenas nos
 * testes para verificar dimensoes e conteudo dos icones gerados.
 */
export function readPng(path: string): DecodedPng {
  const buf = readFileSync(path);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf.readUInt8(24);
  const colorType = buf.readUInt8(25);
  const interlace = buf.readUInt8(28);

  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6) || interlace !== 0) {
    throw new Error(
      `readPng so suporta PNG 8-bit RGB/RGBA sem interlace (recebido bitDepth=${bitDepth}, colorType=${colorType}, interlace=${interlace})`,
    );
  }

  const channels = colorType === 6 ? 4 : 3;

  let offset = 8;
  const idatChunks: Buffer[] = [];
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);
    if (type === "IDAT") idatChunks.push(data);
    offset += 12 + length;
  }

  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);

  let rawOffset = 0;
  let prevRow = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filterType = raw[rawOffset];
    rawOffset += 1;
    const row = raw.subarray(rawOffset, rawOffset + stride);
    rawOffset += stride;
    const outRow = Buffer.alloc(stride);

    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? outRow[x - channels] : 0;
      const b = prevRow[x];
      const c = x >= channels ? prevRow[x - channels] : 0;
      let value = row[x];
      if (filterType === 1) value = (value + a) & 0xff;
      else if (filterType === 2) value = (value + b) & 0xff;
      else if (filterType === 3) value = (value + Math.floor((a + b) / 2)) & 0xff;
      else if (filterType === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        value = (value + pred) & 0xff;
      }
      outRow[x] = value;
    }

    outRow.copy(pixels, y * stride);
    prevRow = outRow;
  }

  return { width, height, pixels };
}

export function countDistinctPixels(png: DecodedPng, channels = 3): number {
  const seen = new Set<string>();
  for (let i = 0; i < png.pixels.length; i += channels) {
    seen.add(png.pixels.subarray(i, i + channels).toString("hex"));
  }
  return seen.size;
}
