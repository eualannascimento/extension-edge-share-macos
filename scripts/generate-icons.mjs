import zlib from "node:zlib";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const outDir = path.join(rootDir, "icons");

const FOREGROUND = [60, 60, 67, 255];
const BACKGROUND = [0, 0, 0, 0];
const SIZES = [16, 48, 128];

function segDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

function shareGlyphSegments(size) {
  const halfT = Math.max(1.1, size * 0.1) / 2;

  const boxTop = size * 0.56;
  const boxBottom = size * 0.82;
  const boxLeft = size * 0.17;
  const boxRight = size * 0.83;
  const gapLeft = size * 0.42;
  const gapRight = size * 0.58;

  const arrowTop = size * 0.14;
  const arrowBottom = boxTop + halfT;
  const cx = size * 0.5;

  const headHalfW = size * 0.16;
  const headY = size * 0.3;

  return {
    halfT,
    segments: [
      [boxLeft, boxBottom, boxRight, boxBottom],
      [boxLeft, boxTop, boxLeft, boxBottom],
      [boxRight, boxTop, boxRight, boxBottom],
      [boxLeft, boxTop, gapLeft, boxTop],
      [gapRight, boxTop, boxRight, boxTop],
      [cx, arrowTop, cx, arrowBottom],
      [cx, arrowTop, cx - headHalfW, headY],
      [cx, arrowTop, cx + headHalfW, headY],
    ],
  };
}

function renderIcon(size) {
  const { halfT, segments } = shareGlyphSegments(size);
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let minDist = Infinity;
      for (const [x1, y1, x2, y2] of segments) {
        const d = segDistance(px, py, x1, y1, x2, y2);
        if (d < minDist) minDist = d;
      }
      const color = minDist <= halfT ? FOREGROUND : BACKGROUND;
      const offset = (y * size + x) * 4;
      pixels.set(color, offset);
    }
  }

  return pixels;
}

function chunk(tag, data) {
  const tagBuf = Buffer.from(tag, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([tagBuf, data])) >>> 0);
  return Buffer.concat([length, tagBuf, data, crc]);
}

function writeRgbaPng(filePath, size, pixels) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // color type RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const stride = size * 4;
  const raw = Buffer.alloc(size * (stride + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter type: none
    pixels.copy(raw, rowStart + 1, y * stride, y * stride + stride);
  }

  const idat = zlib.deflateSync(raw, { level: 9 });
  const png = Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
  writeFileSync(filePath, png);
}

for (const size of SIZES) {
  const pixels = renderIcon(size);
  writeRgbaPng(path.join(outDir, `icon-${size}.png`), size, pixels);
}

console.log(`Icones gerados em ${outDir}`);
