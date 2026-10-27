// Cut-outs of the Red Series studio photos (image/Promo) for the homepage promo stage: the white backdrop is
// found from the photo's edges (near-white, colorless pixels reached without crossing an edge, as in
// build-masks.mjs) and made transparent; the soft floor shadow under the cart stays as a see-through shadow.
// The result is trimmed to the cart and saved to image/Promo/cutouts.
//
//   node scripts/cut-promo.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'image', 'Promo');
const PHOTOS = ['red-series-tempo-2', 'red-series-tempo-2-2', 'red-series-tempo-4'];

function toLab(r, g, b) {
    const f = c => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; };
    const [R, G, B] = [f(r), f(g), f(b)];
    const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, Y = R * 0.2126 + G * 0.7152 + B * 0.0722, Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    const t = v => v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116;
    return [116 * t(Y) - 16, 500 * (t(X) - t(Y)), 200 * (t(Y) - t(Z))];
}

for (const name of PHOTOS) {
    const { data, info } = await sharp(path.join(dir, `${name}.jpg`)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H } = info;
    const lab = new Float32Array(W * H * 3);
    for (let p = 0; p < W * H; p++) lab.set(toLab(data[p * 3], data[p * 3 + 1], data[p * 3 + 2]), p * 3);
    // The backdrop: near-white and colorless (L* 94 up), reached from the edges in very small steps, so it stops at
    // the faint outline of a white roof or seat
    const bg = new Uint8Array(W * H);
    const flood = (seeds, ok, step) => {
        const todo = seeds.filter(p => !bg[p] && ok(p));
        todo.forEach(p => { bg[p] = 1; });
        while (todo.length) {
            const p = todo.pop();
            const x = p % W;
            for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) {
                if (q < 0 || q >= W * H || bg[q] || !ok(q)) continue;
                if (Math.abs(lab[q * 3] - lab[p * 3]) > step) continue;
                bg[q] = 1;
                todo.push(q);
            }
        }
    };
    const neutral = p => Math.hypot(lab[p * 3 + 1], lab[p * 3 + 2]) < 4;
    const edges = [];
    for (let x = 0; x < W; x++) edges.push(x, (H - 1) * W + x);
    for (let y = 0; y < H; y++) edges.push(y * W, y * W + W - 1);
    flood(edges, p => neutral(p) && lab[p * 3] >= 94, 0.6);
    // The floor shadow: the grey under the cart (bottom third of the photo), grown from the backdrop through the
    // mid-tone shadow right under the cart, short of the near-black tires
    const low = [];
    for (let p = Math.floor(H * 0.65) * W; p < W * H; p++) if (bg[p]) low.push(p);
    // (the floor picks up a faint warm cast from the paint, so it may be a little less neutral)
    const floorOk = p => p >= Math.floor(H * 0.65) * W && Math.hypot(lab[p * 3 + 1], lab[p * 3 + 2]) < 9 && lab[p * 3] > 34;
    for (const p of low) bg[p] = 0;
    flood(low, floorOk, 4);
    // Backdrop seen through the windshield and between posts: enclosed areas of studio white (L* 95 up; the white
    // seats and roofs stay under about 90) at least 300 px across
    const seen = new Uint8Array(W * H);
    const white = p => neutral(p) && lab[p * 3] >= 95;
    for (let p0 = 0; p0 < W * H; p0++) {
        if (bg[p0] || seen[p0] || !white(p0)) continue;
        const comp = [p0]; seen[p0] = 1;
        for (let k = 0; k < comp.length; k++) {
            const p = comp[k], x = p % W;
            for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) {
                if (q < 0 || q >= W * H || seen[q] || bg[q] || !white(q)) continue;
                seen[q] = 1; comp.push(q);
            }
        }
        if (comp.length >= 300) comp.forEach(p => { bg[p] = 1; });
    }
    // Specks of backdrop noise the trace stepped around: small islands of cart (under 400 px) are backdrop too
    const done = new Uint8Array(W * H);
    for (let p0 = 0; p0 < W * H; p0++) {
        if (bg[p0] || done[p0]) continue;
        const comp = [p0]; done[p0] = 1;
        for (let k = 0; k < comp.length && comp.length < 400; k++) {
            const p = comp[k], x = p % W;
            for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) {
                if (q < 0 || q >= W * H || done[q] || bg[q]) continue;
                done[q] = 1; comp.push(q);
            }
        }
        if (comp.length < 400) comp.forEach(p => { bg[p] = 1; });
    }
    // Backdrop is transparent; its shadow keeps a black of matching depth (the backdrop's own white is L* ~98)
    const out = Buffer.alloc(W * H * 4);
    for (let p = 0; p < W * H; p++) {
        if (bg[p]) {
            const a = Math.max(0, Math.min(1, (97 - lab[p * 3]) / 60));
            out[p * 4 + 3] = Math.round(255 * a * 0.85);
        } else {
            for (let c = 0; c < 3; c++) out[p * 4 + c] = data[p * 3 + c];
            out[p * 4 + 3] = 255;
        }
    }
    const trimmed = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer();
    // At web size: about 1000 px tall
    await sharp(trimmed).resize({ height: 1000 }).png().toFile(path.join(dir, 'cutouts', `${name}.png`));
    console.log('cut', name);
}
