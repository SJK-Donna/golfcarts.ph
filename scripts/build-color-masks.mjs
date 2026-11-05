// Paint maps for build photos whose body is a strong colour (red), used by the live color preview (recolor.js).
// JPEG photos carry faint colour noise in the white backdrop, the tyres and the chrome, which the preview's colour
// rules would repaint, so the body is mapped here once: pixels near the paint's hue and strong enough in colour,
// gaps closed, and specks smaller than `minArea` dropped. Output: image/Products/builds/masks/<photo>.png at the
// photo's size, red = body (the same format as scripts/build-masks.mjs, with no seat or canopy).
//
//   node scripts/build-color-masks.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// hue: the paint's hue and how far (degrees) a pixel may be; sat / light: [min, max]; close: gap size in pixels
const MASKS = {
    'lifestyle-4-elite': { hue: [355, 22], sat: [0.32, 1], light: [0.06, 0.85], close: 3, minArea: 600 }
};

function hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
}

// Grows (grow = true) or shrinks the set pixels by a square of radius r
function morph(m, w, h, r, grow) {
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let hit = !grow;
        for (let dy = -r; dy <= r && hit !== grow; dy++) for (let dx = -r; dx <= r; dx++) {
            const xx = x + dx, yy = y + dy;
            const v = xx >= 0 && yy >= 0 && xx < w && yy < h ? m[yy * w + xx] : 0;
            if (grow ? v : !v) { hit = grow; break; }
        }
        out[y * w + x] = hit ? 1 : 0;
    }
    return out;
}

// Drops connected areas smaller than minArea
function dropSpecks(m, w, h, minArea) {
    const seen = new Uint8Array(w * h), stack = [];
    for (let i = 0; i < m.length; i++) {
        if (!m[i] || seen[i]) continue;
        const area = [];
        stack.push(i); seen[i] = 1;
        while (stack.length) {
            const p = stack.pop(); area.push(p);
            const x = p % w, y = (p / w) | 0;
            for (const q of [x > 0 && p - 1, x < w - 1 && p + 1, y > 0 && p - w, y < h - 1 && p + w]) {
                if (q !== false && m[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
            }
        }
        if (area.length < minArea) for (const p of area) m[p] = 0;
    }
}

for (const [photo, spec] of Object.entries(MASKS)) {
    const { data, info } = await sharp(path.join(root, 'image/Products/builds', `${photo}.jpg`)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = info;
    let m = new Uint8Array(w * h);
    const [hc, tol] = spec.hue;
    for (let i = 0; i < w * h; i++) {
        const [hh, s, l] = hsl(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
        const dh = Math.min(Math.abs(hh - hc), 360 - Math.abs(hh - hc));
        m[i] = dh <= tol && s >= spec.sat[0] && s <= spec.sat[1] && l >= spec.light[0] && l <= spec.light[1] ? 1 : 0;
    }
    m = morph(morph(m, w, h, spec.close, true), w, h, spec.close, false);
    dropSpecks(m, w, h, spec.minArea);
    const out = Buffer.alloc(w * h * 3);
    for (let i = 0; i < w * h; i++) out[i * 3] = m[i] ? 255 : 0;
    const file = path.join(root, 'image/Products/builds/masks', `${photo}.png`);
    await sharp(out, { raw: { width: w, height: h, channels: 3 } }).png().toFile(file);
    console.log(`${photo}: ${m.reduce((a, v) => a + v, 0)} body pixels -> ${path.relative(root, file)}`);
}
