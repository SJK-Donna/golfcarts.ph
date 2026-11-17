// Measures how one build photo lines up with another of the same cart from the same camera (2026-11-16), for a paint
// map carried over between them (scripts/build-color-masks.mjs `fromAt`). The photos' edges are compared (wheels,
// frame, trim and panel outlines are where they are whatever the paint colour): the scale and shift that line up the
// strongest edges best are searched for on small copies, then refined on larger ones.
// Prints { scale, dx, dy } in full-size pixels: this photo's (x, y) is the other's
// ((x - w/2) / scale + w/2 - dx, (y - h/2) / scale + h/2 - dy).
//
//   node scripts/align-photos.mjs <this photo> <other photo>
import sharp from 'sharp';

const [fileA, fileB] = process.argv.slice(2);
const full = await sharp(fileA).metadata();

// Edge strength (Sobel) of a photo at width W, as a Float32Array, and its size
async function edges(file, W) {
    const { data, info } = await sharp(file).flatten({ background: '#ffffff' }).resize(W).greyscale().raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = info, g = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const p = (dx, dy) => data[(y + dy) * w + x + dx];
        const gx = p(1, -1) + 2 * p(1, 0) + p(1, 1) - p(-1, -1) - 2 * p(-1, 0) - p(-1, 1);
        const gy = p(-1, 1) + 2 * p(0, 1) + p(1, 1) - p(-1, -1) - 2 * p(0, -1) - p(1, -1);
        g[y * w + x] = Math.hypot(gx, gy);
    }
    return { g, w, h };
}

const sample = (e, x, y) => {
    if (x < 0 || y < 0 || x >= e.w - 1 || y >= e.h - 1) return 0;
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, i = y0 * e.w + x0;
    return (e.g[i] * (1 - fx) + e.g[i + 1] * fx) * (1 - fy) + (e.g[i + e.w] * (1 - fx) + e.g[i + e.w + 1] * fx) * fy;
};

// The strongest edges of A (the top 3%), and how much of B's edge strength lands on them
function search(A, B, scales, shifts) {
    const strong = [...A.g.keys()].sort((p, q) => A.g[q] - A.g[p]).slice(0, Math.round(A.g.length * 0.03));
    let best = null;
    for (const s of scales) for (const [dx, dy] of shifts) {
        let sum = 0;
        for (const i of strong) {
            const x = i % A.w, y = (i / A.w) | 0;
            sum += Math.min(A.g[i], sample(B, (x - A.w / 2) / s + A.w / 2 - dx, (y - A.h / 2) / s + A.h / 2 - dy));
        }
        if (!best || sum > best.sum) best = { s, dx, dy, sum };
    }
    return best;
}

const range = (from, to, step) => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, k) => from + k * step);
const grid = (cx, cy, r, step) => range(cx - r, cx + r, step).flatMap(dx => range(cy - r, cy + r, step).map(dy => [dx, dy]));

// Coarse: 200 px wide
let A = await edges(fileA, 200), B = await edges(fileB, 200);
let best = search(A, B, range(0.85, 1.15, 0.01), grid(0, 0, 30, 1));
// Refine: 800 px wide (4x), then the full size
const steps = [[800, 0.02, 0.0025, 8, 1], [full.width, 0.006, 0.001, 4, 0.5]];
let atW = 200;
for (const [W, sr, ss, r, st] of steps) {
    const f = W / atW;
    A = await edges(fileA, W); B = await edges(fileB, W);
    best = search(A, B, range(best.s - sr, best.s + sr, ss), grid(best.dx * f, best.dy * f, r, st));
    atW = W;
}
console.log(JSON.stringify({ scale: +best.s.toFixed(4), dx: +best.dx.toFixed(1), dy: +best.dy.toFixed(1) }));
