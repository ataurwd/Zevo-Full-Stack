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

// Target background color:
// Top left corner is around rgb(235, 235, 233)
// We want to calculate alpha based on color distance from background texture.
// For any pixel, if it matches background luminance and low saturation, alpha = 0.
// If it transitions, calculate alpha smoothly and unmultiply foreground.

function createTransparentCopy(x0, y0, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcIdx = ((y0 + y) * width + (x0 + x)) * 4;
      const dstIdx = (y * w + x) * 4;
      const r = pixels[srcIdx];
      const g = pixels[srcIdx + 1];
      const b = pixels[srcIdx + 2];

      // Background estimated at this position:
      // Texture is roughly neutral gray/white: R~234-236, G~234-236, B~232-234
      const bgR = 235, bgG = 235, bgB = 233;
      
      // Color difference from background
      const dR = r - bgR;
      const dG = g - bgG;
      const dB = b - bgB;
      const dist = Math.sqrt(dR*dR + dG*dG + dB*dB);

      // Chroma / saturation
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const chroma = maxC - minC;

      let alpha = 0;
      if (dist < 12 && chroma < 6) {
        alpha = 0;
      } else if (dist < 28 && chroma < 12) {
        alpha = Math.floor(255 * ((dist - 12) / 16));
      } else {
        alpha = 255;
      }

      if (alpha === 0) {
        out[dstIdx] = 0;
        out[dstIdx+1] = 0;
        out[dstIdx+2] = 0;
        out[dstIdx+3] = 0;
      } else {
        // Un-premultiply background to prevent faint halo
        const aFactor = alpha / 255;
        let fgR = Math.max(0, Math.min(255, Math.round((r - bgR * (1 - aFactor)) / aFactor)));
        let fgG = Math.max(0, Math.min(255, Math.round((g - bgG * (1 - aFactor)) / aFactor)));
        let fgB = Math.max(0, Math.min(255, Math.round((b - bgB * (1 - aFactor)) / aFactor)));
        out[dstIdx] = fgR;
        out[dstIdx+1] = fgG;
        out[dstIdx+2] = fgB;
        out[dstIdx+3] = alpha;
      }
    }
  }
  return out;
}

// 1. Full logo (minX: 20, maxX: 393, minY: 12, maxY: 117)
// Add 4px padding
const fullX = 16, fullY = 8, fullW = 382, fullH = 114;
const fullRGBA = createTransparentCopy(fullX, fullY, fullW, fullH);
const fullPNG = encodePNG(fullW, fullH, fullRGBA);

// 2. Icon only (minX: 20, maxX: 161, minY: 12, maxY: 117)
const iconX = 16, iconY = 8, iconW = 148, iconH = 114;
const iconRGBA = createTransparentCopy(iconX, iconY, iconW, iconH);
const iconPNG = encodePNG(iconW, iconH, iconRGBA);

const targetDir = path.resolve(__dirname, '../apps/frontend/public/images/branding');
fs.mkdirSync(targetDir, { recursive: true });

fs.writeFileSync(path.join(targetDir, 'zevo-logo.png'), fullPNG);
fs.writeFileSync(path.join(targetDir, 'zevo-icon.png'), iconPNG);
fs.copyFileSync(inputPath, path.join(targetDir, 'zevo-logo-original.png'));

console.log('Saved PNG assets to', targetDir);
