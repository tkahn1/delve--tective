// Generates the toolbar icons (open eye, white stroke on #18181B rounded square) as PNGs.
// No dependencies: SDF rasterizer + minimal PNG encoder using node:zlib.
// Usage: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const BG = [0x18, 0x18, 0x1b];
const FG = [0xff, 0xff, 0xff];

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Shapes in a unit square [0,1]^2.
function sdRoundRect(x, y, r) {
  const qx = Math.abs(x - 0.5) - (0.5 - r);
  const qy = Math.abs(y - 0.5) - (0.5 - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}
function sdCircle(x, y, cx, cy, r) {
  return Math.hypot(x - cx, y - cy) - r;
}

function render(size) {
  const ss = 4; // supersampling
  const stroke = size <= 16 ? 0.1 : size <= 32 ? 0.08 : 0.065;
  // Eye outline = intersection of two circles (a lens).
  const halfW = 0.34; // half eye width
  const halfH = 0.2; // half eye height
  const R = (halfW * halfW + halfH * halfH) / (2 * halfH);
  const d = R - halfH;
  const pupilR = size <= 16 ? 0.1 : 0.085;
  const rgba = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let bgCov = 0;
      let fgCov = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const x = (px + (sx + 0.5) / ss) / size;
          const y = (py + (sy + 0.5) / ss) / size;
          if (sdRoundRect(x, y, 0.22) > 0) continue;
          bgCov++;
          const lens = Math.max(sdCircle(x, y, 0.5, 0.5 + d, R), sdCircle(x, y, 0.5, 0.5 - d, R));
          const onOutline = Math.abs(lens) < stroke / 2;
          const onPupil = sdCircle(x, y, 0.5, 0.5, pupilR) < 0;
          if (onOutline || onPupil) fgCov++;
        }
      }
      const n = ss * ss;
      const a = bgCov / n;
      const f = bgCov ? fgCov / bgCov : 0;
      const i = (py * size + px) * 4;
      for (let c = 0; c < 3; c++) rgba[i + c] = Math.round(BG[c] * (1 - f) + FG[c] * f);
      rgba[i + 3] = Math.round(a * 255);
    }
  }
  return encodePng(size, rgba);
}

for (const size of [16, 32, 48, 128]) {
  writeFileSync(join(outDir, `icon-${size}.png`), render(size));
}
console.log('icons written to', outDir);
