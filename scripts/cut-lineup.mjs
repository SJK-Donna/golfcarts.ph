// Cuts a cart photo on a white studio backdrop out for the homepage range photo (image/lineup/), 2026-11-17: the
// backdrop (light, near-neutral pixels joined to the photo's edge, its soft ground shadow included) becomes transparent
// with a one-pixel soft edge, and the result is trimmed to the cart and sized to about 1000 px wide.
//
//   node scripts/cut-lineup.mjs <photo> <out.png>
import sharp from 'sharp';

const [src, out] = process.argv.slice(2);
const W = 1600;
const { data, info } = await sharp(src).resize({ width: W }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info, n = w * h;
// Backdrop: bright and nearly grey (the shadow under the cart is a light neutral grey)
const isBack = i => {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    return min > 196 && max - min < 14;
};
const back = new Uint8Array(n), stack = [];
for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
while (stack.length) {
    const i = stack.pop();
    if (back[i] || !isBack(i)) continue;
    back[i] = 1;
    const x = i % w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (i >= w) stack.push(i - w);
    if (i < n - w) stack.push(i + w);
}
// The backdrop seen between the roof posts is boxed in by the cart: large patches of plain white are backdrop too
const white = i => { const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2]; return Math.min(r, g, b) > 228 && Math.max(r, g, b) - Math.min(r, g, b) < 12; };
const seen = new Uint8Array(n);
for (let s = 0; s < n; s++) {
    if (seen[s] || back[s] || !white(s)) continue;
    const area = [s];
    seen[s] = 1;
    for (let k = 0; k < area.length; k++) {
        const i = area[k], x = i % w;
        for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
            if (j < 0 || j >= n || seen[j] || back[j] || !white(j)) continue;
            seen[j] = 1;
            area.push(j);
        }
    }
    if (area.length > 1500) area.forEach(i => { back[i] = 1; });
}
const rgba = Buffer.alloc(n * 4);
for (let i = 0; i < n; i++) {
    rgba[i * 4] = data[i * 3]; rgba[i * 4 + 1] = data[i * 3 + 1]; rgba[i * 4 + 2] = data[i * 3 + 2];
    // A pixel beside the backdrop is half see-through, so the edge isn't stepped
    let a = back[i] ? 0 : 255;
    if (!back[i]) {
        const x = i % w;
        if ((x > 0 && back[i - 1]) || (x < w - 1 && back[i + 1]) || (i >= w && back[i - w]) || (i < n - w && back[i + w])) a = 140;
    }
    rgba[i * 4 + 3] = a;
}
await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 0 }).resize({ width: 1000 }).png().toFile(out);
const m = await sharp(out).metadata();
console.log(`${out}: ${m.width}x${m.height}`);
