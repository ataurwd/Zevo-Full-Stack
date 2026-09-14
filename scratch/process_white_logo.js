const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function decodePNG(filePath) {
  const buf = fs.readFileSync(filePath);
  let pos = 8;
  const chunks = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.slice(pos + 4, pos + 8).toString('ascii');
    const data = buf.slice(pos + 8, pos + 8 + len);
    chunks.push({ type, len, data });
    pos += 12 + len;
  }
  const ihdr = chunks.find(c => c.type === 'IHDR').data;
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const idat = Buffer.concat(chunks.filter(c => c.type === 'IDAT').map(c => c.data));
  const raw = zlib.inflateSync(idat);

  const bpp = 4;
  const stride = width * bpp;
  const pixels = Buffer.alloc(width * height * 4);

  function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  }

  let srcPos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[srcPos++];
    const rowOffset = y * stride;
    const prevRowOffset = (y - 1) * stride;

    for (let x = 0; x < stride; x++) {
      const byte = raw[srcPos++];
      const a = (x >= bpp) ? pixels[rowOffset + x - bpp] : 0;
      const bVal = (y > 0) ? pixels[prevRowOffset + x] : 0;
      const c = (y > 0 && x >= bpp) ? pixels[prevRowOffset + x - bpp] : 0;

      let val;
      if (filter === 0) val = byte;
      else if (filter === 1) val = (byte + a) & 0xff;
      else if (filter === 2) val = (byte + bVal) & 0xff;
      else if (filter === 3) val = (byte + Math.floor((a + bVal) / 2)) & 0xff;
      else if (filter === 4) val = (byte + paeth(a, bVal, c)) & 0xff;
      pixels[rowOffset + x] = val;
    }
  }
  return { width, height, pixels };
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff);
}

function encodePNG(width, height, rgbaBuffer) {
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  let dstPos = 0;
  for (let y = 0; y < height; y++) {
    raw[dstPos++] = 0;
    rgbaBuffer.copy(raw, dstPos, y * stride, (y + 1) * stride);
    dstPos += stride;
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.slice(4, 8 + len));
    buf.writeUInt32BE(crc >>> 0, 8 + len);
    return buf;
  }

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

const whiteLogoPath = 'C:/Users/rubel/.gemini/antigravity-ide/brain/e7d49965-19ab-4ef1-8300-828a206409af/.user_uploaded/media_1789277622953.png';
const { width, height, pixels } = decodePNG(whiteLogoPath);
console.log('Decoded white logo dimensions:', width, 'x', height);

// Background check in top 10 rows:
let bgMin = [255, 255, 255], bgMax = [0, 0, 0];
for (let y = 0; y < 10; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    for (let c = 0; c < 3; c++) {
      if (pixels[idx+c] < bgMin[c]) bgMin[c] = pixels[idx+c];
      if (pixels[idx+c] > bgMax[c]) bgMax[c] = pixels[idx+c];
    }
  }
}
console.log('Dark background range in top 10 rows: min =', bgMin, ', max =', bgMax);

// Content bounding box (pixels significantly brighter than background)
let minX = width, maxX = 0, minY = height, maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 40) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
console.log('White logo content bounding box:', { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 });

// Check dividing x between icon and wordmark 'Zevo'
let colDensity = [];
for (let x = minX; x <= maxX; x++) {
  let count = 0;
  for (let y = minY; y <= maxY; y++) {
    const idx = (y * width + x) * 4;
    const lum = 0.299*pixels[idx] + 0.587*pixels[idx+1] + 0.114*pixels[idx+2];
    if (lum > 40) count++;
  }
  colDensity.push({ x, count });
}
const gap = colDensity.filter(c => c.x > 210 && c.x < 270);
console.log('Gap candidates between icon and Zevo (x 210-270):', gap);
