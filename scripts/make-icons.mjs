// Generates the app icons appinfo.json declares: icon.png (80x80) and
// largeIcon.png (130x130). Navy background with a simple football mark.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixelAt) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixelAt(x, y);
      raw.writeUInt8(r, row + 1 + x * 4);
      raw.writeUInt8(g, row + 2 + x * 4);
      raw.writeUInt8(b, row + 3 + x * 4);
      raw.writeUInt8(255, row + 4 + x * 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const NAVY = [1, 51, 105]; // #013369
const BROWN = [130, 87, 54]; // football leather
const WHITE = [255, 255, 255];

function footballPixel(size) {
  const c = size / 2;
  return (x, y) => {
    // Rotate 45° so the football sits diagonally.
    const dx = ((x - c) + (y - c)) / Math.SQRT2;
    const dy = ((y - c) - (x - c)) / Math.SQRT2;
    const a = size * 0.42; // long axis
    const b = size * 0.24; // short axis
    const inside = (dx * dx) / (a * a) + (dy * dy) / (b * b) <= 1;
    if (!inside) return NAVY;
    // Lace: short stroke across the middle, perpendicular to the long axis.
    const lace =
      Math.abs(dx) < size * 0.14 && Math.abs(dy) < size * 0.025;
    const stitch =
      Math.abs(dy) < size * 0.09 && Math.abs(dx) < size * 0.018;
    return lace || stitch ? WHITE : BROWN;
  };
}

writeFileSync('icon.png', png(80, footballPixel(80)));
writeFileSync('largeIcon.png', png(130, footballPixel(130)));
console.log('wrote icon.png (80x80) and largeIcon.png (130x130)');
