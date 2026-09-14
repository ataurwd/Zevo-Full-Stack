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

// Target background removal:
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

      const bgR = 235, bgG = 235, bgB = 233;
      const dR = r - bgR;
      const dG = g - bgG;
      const dB = b - bgB;
      const dist = Math.sqrt(dR*dR + dG*dG + dB*dB);

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const chroma = maxC - minC;

      let alpha = 0;
      if (dist < 10 && chroma < 5) {
        alpha = 0;
      } else if (dist < 26 && chroma < 12) {
        alpha = Math.floor(255 * ((dist - 10) / 16));
      } else {
        alpha = 255;
      }

      if (alpha === 0) {
        out[dstIdx] = 0;
        out[dstIdx+1] = 0;
        out[dstIdx+2] = 0;
        out[dstIdx+3] = 0;
      } else {
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

// Resampling helper (bilinear interpolation for high quality downscaling/upscaling)
function resampleRGBA(srcBuf, sw, sh, dw, dh) {
  const dstBuf = Buffer.alloc(dw * dh * 4);
  const xRatio = sw / dw;
  const yRatio = sh / dh;

  for (let dy = 0; dy < dh; dy++) {
    for (let dx = 0; dx < dw; dx++) {
      const gx = dx * xRatio;
      const gy = dy * yRatio;
      const gxi = Math.floor(gx);
      const gyi = Math.floor(gy);
      const xDiff = gx - gxi;
      const yDiff = gy - gyi;

      const idx00 = (gyi * sw + gxi) * 4;
      const idx10 = (gyi * sw + Math.min(sw - 1, gxi + 1)) * 4;
      const idx01 = (Math.min(sh - 1, gyi + 1) * sw + gxi) * 4;
      const idx11 = (Math.min(sh - 1, gyi + 1) * sw + Math.min(sw - 1, gxi + 1)) * 4;

      const dstIdx = (dy * dw + dx) * 4;

      for (let c = 0; c < 4; c++) {
        const val =
          srcBuf[idx00 + c] * (1 - xDiff) * (1 - yDiff) +
          srcBuf[idx10 + c] * xDiff * (1 - yDiff) +
          srcBuf[idx01 + c] * (1 - xDiff) * yDiff +
          srcBuf[idx11 + c] * xDiff * yDiff;
        dstBuf[dstIdx + c] = Math.round(val);
      }
    }
  }
  return dstBuf;
}

const brandingDir = path.resolve(__dirname, '../apps/frontend/public/images/branding');
fs.mkdirSync(brandingDir, { recursive: true });

// 1. Full logo (minX: 18, minY: 10, w: 378, h: 110)
const fullW = 378, fullH = 110;
const fullRGBA = createTransparentSubImage(18, 10, fullW, fullH);
fs.writeFileSync(path.join(brandingDir, 'zevo-logo.png'), encodePNG(fullW, fullH, fullRGBA));

// 2. Icon only (minX: 18, minY: 10, w: 145, h: 110)
const iconW = 145, iconH = 110;
const iconRGBA = createTransparentSubImage(18, 10, iconW, iconH);
fs.writeFileSync(path.join(brandingDir, 'zevo-icon.png'), encodePNG(iconW, iconH, iconRGBA));

// 3. Square Icon (for favicon, app icon, 128x128 centered with slight padding)
const squareIconSize = 128;
const squareIconRGBA = Buffer.alloc(squareIconSize * squareIconSize * 4);
// fit 145x110 into 112x85 centered
const scaledIconW = 112;
const scaledIconH = Math.round(iconH * (scaledIconW / iconW)); // ~85
const scaledIcon = resampleRGBA(iconRGBA, iconW, iconH, scaledIconW, scaledIconH);
const offX = Math.floor((squareIconSize - scaledIconW) / 2);
const offY = Math.floor((squareIconSize - scaledIconH) / 2);

for (let y = 0; y < scaledIconH; y++) {
  for (let x = 0; x < scaledIconW; x++) {
    const srcI = (y * scaledIconW + x) * 4;
    const dstI = ((offY + y) * squareIconSize + (offX + x)) * 4;
    if (scaledIcon[srcI + 3] > 0) {
      squareIconRGBA[dstI] = scaledIcon[srcI];
      squareIconRGBA[dstI+1] = scaledIcon[srcI+1];
      squareIconRGBA[dstI+2] = scaledIcon[srcI+2];
      squareIconRGBA[dstI+3] = scaledIcon[srcI+3];
    }
  }
}
const squarePNG = encodePNG(squareIconSize, squareIconSize, squareIconRGBA);
fs.writeFileSync(path.join(brandingDir, 'zevo-icon-square.png'), squarePNG);

// Copy square icon to Next.js App metadata icons
const appDir = path.resolve(__dirname, '../apps/frontend/app');
fs.writeFileSync(path.join(appDir, 'icon.png'), squarePNG);
fs.writeFileSync(path.join(appDir, 'apple-icon.png'), squarePNG);

// Also generate public/favicon.ico
// Minimal 32x32 ICO header + 32x32 PNG payload (modern ICO format supported by all browsers)
const icon32 = resampleRGBA(squareIconRGBA, squareIconSize, squareIconSize, 32, 32);
const png32 = encodePNG(32, 32, icon32);
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // ICO type
icoHeader.writeUInt16LE(1, 4); // 1 image
const icoDir = Buffer.alloc(16);
icoDir.writeUInt8(32, 0); // width
icoDir.writeUInt8(32, 1); // height
icoDir.writeUInt8(0, 2);  // color count
icoDir.writeUInt8(0, 3);  // reserved
icoDir.writeUInt16LE(1, 4); // planes
icoDir.writeUInt16LE(32, 6); // bpp
icoDir.writeUInt32LE(png32.length, 8); // size
icoDir.writeUInt32LE(6 + 16, 12); // offset
const icoBuf = Buffer.concat([icoHeader, icoDir, png32]);
fs.writeFileSync(path.resolve(__dirname, '../apps/frontend/public/favicon.ico'), icoBuf);

// Copy original upload
fs.copyFileSync(inputPath, path.join(brandingDir, 'zevo-logo-original.png'));

// Also generate vector SVGs
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 145 110" fill="none">
  <defs>
    <linearGradient id="zevoGradBright" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00D084" />
      <stop offset="50%" stop-color="#00A86B" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="zevoGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#073A36" />
      <stop offset="100%" stop-color="#0F3B33" />
    </linearGradient>
    <linearGradient id="zevoGradMint" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A2E4B8" />
      <stop offset="100%" stop-color="#D1E7D8" />
    </linearGradient>
  </defs>
  <!-- Top bar of Z -->
  <polygon points="12,12 88,12 70,30 28,30" fill="url(#zevoGradBright)" />
  <!-- Diagonal ribbon of Z -->
  <polygon points="70,30 88,12 28,98 12,98" fill="url(#zevoGradBright)" />
  <!-- Bottom bar of Z -->
  <polygon points="12,98 28,80 88,80 88,98" fill="url(#zevoGradBright)" />
  <!-- Inner pale facet -->
  <polygon points="28,30 65,75 28,80" fill="url(#zevoGradMint)" opacity="0.85" />
  <!-- Dark green interlocking chevron -->
  <polygon points="62,28 78,14 132,88 116,102" fill="url(#zevoGradDark)" />
  <polygon points="62,28 116,102 100,102 52,38" fill="url(#zevoGradDark)" />
</svg>`;
fs.writeFileSync(path.join(brandingDir, 'zevo-icon.svg'), svgIcon);

console.log('All branding assets generated successfully!');
