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

function createTransparentSubImage(x0, y0, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcX = x0 + x;
      const srcY = y0 + y;
      const dstIdx = (y * w + x) * 4;

      if (srcX < 0 || srcX >= width || srcY < 0 || srcY >= height) {
        out[dstIdx] = 0;
        out[dstIdx+1] = 0;
        out[dstIdx+2] = 0;
        out[dstIdx+3] = 0;
        continue;
      }

      const srcIdx = (srcY * width + srcX) * 4;
      const r = pixels[srcIdx];
      const g = pixels[srcIdx + 1];
      const b = pixels[srcIdx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Dark background is ~25-35
      const bgLum = 32;
      let alpha = 0;
      if (lum <= bgLum) {
        alpha = 0;
      } else if (lum <= bgLum + 40) {
        alpha = Math.floor(255 * ((lum - bgLum) / 40));
      } else {
        alpha = 255;
      }

      if (alpha === 0) {
        out[dstIdx] = 0;
        out[dstIdx+1] = 0;
        out[dstIdx+2] = 0;
        out[dstIdx+3] = 0;
      } else {
        // Un-premultiply black background to produce pure clean white & grey tones
        const aFactor = alpha / 255;
        let fgR = Math.max(0, Math.min(255, Math.round((r - bgLum * (1 - aFactor)) / aFactor)));
        let fgG = Math.max(0, Math.min(255, Math.round((g - bgLum * (1 - aFactor)) / aFactor)));
        let fgB = Math.max(0, Math.min(255, Math.round((b - bgLum * (1 - aFactor)) / aFactor)));

        // Ensure white/light areas are crisp bright
        const maxCh = Math.max(fgR, fgG, fgB);
        if (maxCh > 180) {
          fgR = Math.min(255, Math.round(fgR * 1.15));
          fgG = Math.min(255, Math.round(fgG * 1.15));
          fgB = Math.min(255, Math.round(fgB * 1.15));
        }

        out[dstIdx] = fgR;
        out[dstIdx+1] = fgG;
        out[dstIdx+2] = fgB;
        out[dstIdx+3] = alpha;
      }
    }
  }
  return out;
}

const brandingDir = path.resolve(__dirname, '../apps/frontend/public/images/branding');
fs.mkdirSync(brandingDir, { recursive: true });

// Copy original white upload
fs.copyFileSync(whiteLogoPath, path.join(brandingDir, 'zevo-logo-white-original.png'));

// 1. Full White Logo (bounds: minX: 30, maxX: 615, minY: 10, maxY: 180 -> w: 585, h: 170)
const fullW = 588, fullH = 172;
const fullRGBA = createTransparentSubImage(30, 10, fullW, fullH);
fs.writeFileSync(path.join(brandingDir, 'zevo-logo-white.png'), encodePNG(fullW, fullH, fullRGBA));

// 2. White Icon only (bounds: minX: 30, maxX: 242, minY: 10, maxY: 180 -> w: 215, h: 172)
const iconW = 215, iconH = 172;
const iconRGBA = createTransparentSubImage(30, 10, iconW, iconH);
fs.writeFileSync(path.join(brandingDir, 'zevo-icon-white.png'), encodePNG(iconW, iconH, iconRGBA));

console.log('White logo assets extracted successfully!');
