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
    raw[dstPos++] = 0; // filter None
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

const inputPath = 'C:/Users/rubel/.gemini/antigravity-ide/brain/e7d49965-19ab-4ef1-8300-828a206409af/.user_uploaded/media_1789277513257.png';
const { width, height, pixels } = decodePNG(inputPath);

// Sample background values across the edges
let bgMin = [255, 255, 255], bgMax = [0, 0, 0];
for (let y = 0; y < 5; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    for (let c = 0; c < 3; c++) {
      if (pixels[idx+c] < bgMin[c]) bgMin[c] = pixels[idx+c];
      if (pixels[idx+c] > bgMax[c]) bgMax[c] = pixels[idx+c];
    }
  }
}
console.log('Background range in top 5 rows: min =', bgMin, ', max =', bgMax);

// Also sample text color
// The text "Zevo" has dark green fill
let textPixels = [];
for (let y = 30; y < 100; y++) {
  for (let x = 200; x < 380; x++) {
    const idx = (y * width + x) * 4;
    const r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2];
    // green is dominant or r, b are low
    if (g > 30 && g > r && g > b && r < 40 && b < 60) {
      textPixels.push([r, g, b]);
    }
  }
}
let avgTR = 0, avgTG = 0, avgTB = 0;
textPixels.forEach(p => { avgTR += p[0]; avgTG += p[1]; avgTB += p[2]; });
avgTR = Math.round(avgTR / textPixels.length);
avgTG = Math.round(avgTG / textPixels.length);
avgTB = Math.round(avgTB / textPixels.length);
console.log('Text color sample count:', textPixels.length, 'Avg Text RGB:', avgTR, avgTG, avgTB, `(#${avgTR.toString(16).padStart(2,'0')}${avgTG.toString(16).padStart(2,'0')}${avgTB.toString(16).padStart(2,'0')})`);

// Also sample icon colors
let iconGreens = [];
for (let y = 20; y < 110; y++) {
  for (let x = 20; x < 160; x++) {
    const idx = (y * width + x) * 4;
    const r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2];
    if (g > 100 && g > r * 1.2 && g > b) {
      iconGreens.push([r, g, b]);
    }
  }
}
console.log('Icon bright green samples count:', iconGreens.length);
if (iconGreens.length > 0) {
  let gMin = [255, 255, 255], gMax = [0, 0, 0];
  iconGreens.forEach(p => {
    for (let c = 0; c < 3; c++) {
      if (p[c] < gMin[c]) gMin[c] = p[c];
      if (p[c] > gMax[c]) gMax[c] = p[c];
    }
  });
  console.log('Icon bright green range: min =', gMin, 'max =', gMax);
}
