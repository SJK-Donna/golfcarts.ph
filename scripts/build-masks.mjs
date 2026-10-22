// Paint maps for the Golfer 2 / 2+2 build photos, used by the live color preview (recolor.js).
// The build photos' carts are white, cream, grey, black or dark green, so the preview can't find their paint by
// color alone. Each part is outlined here and, inside its outline, only pixels close to that part's own colors
// in the photo count (or, for `seed` / `keep`, pass a color test), grown out over the panel's shading, so frame,
// glass, wheels and badges stay as they are. The white studio backdrop is found first and never counts.
// Outlines are in the 900 x 675 preview size, or at the photo's full size where marked `full: true`.
// Output: image/Products/builds/masks/<photo>.png at full size, red = body, green = seat, blue = canopy.
//
//   node scripts/build-masks.mjs            writes the masks
//   node scripts/build-masks.mjs <dir>      also writes overlays of each mask on its photo into <dir>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The maps are drawn at the photos' full size (1600 x 1200); outlines traced in the preview size are scaled up
const TRACE_W = 900;
const W = 1600, H = 1200;
const K = W / TRACE_W;

// refs: the part's colors in the photo; tol: how far (in Lab, lightness counted 1/kL) a pixel may be.
// seed / keep (instead of refs): color tests (L, a, b) for where the part starts and what it may grow over.
// from: take the body map of another photo shot from the same camera position.
const MASKS = {
    'golfer-2-golfer': {
        // Loose outlines at full size (full: true): the backdrop, the seat and black trim are kept out by color
        // solid: the hood and roof highlights are pure white like the backdrop, so these outlines follow the
        // cart's real edge and the backdrop search stays out of them
        body: { refs: ['#f1f0ee', '#dbdad6', '#c9c8c4', '#b4b3ae'], kL: 2.5, tol: 9, minL: 55, full: true, solid: true,
            exclude: [[[1054, 716], [1148, 716], [1148, 762], [1054, 762]]],
            polys: [
            // Front cowl, below the dash line, down to the black bumper
            [[742, 606], [800, 589], [1000, 582], [1150, 583], [1210, 607], [1236, 640], [1246, 715], [1248, 760], [1100, 805], [900, 805], [740, 765], [715, 700]],
            // Side panel and rear corner, under the seat
            [[290, 670], [318, 610], [400, 605], [425, 650], [470, 698], [738, 695], [745, 750], [722, 815], [600, 845], [420, 845], [400, 770], [300, 760]]
        ] },
        seat: { refs: ['#d4d1cc', '#dedcd8', '#e9e8e5', '#bdbab5'], kL: 2.5, tol: 10, minL: 50, polys: [
            [[225, 248], [240, 233], [420, 235], [445, 258], [445, 330], [418, 345], [410, 392], [245, 392], [226, 345]]
        ] },
        canopy: { refs: ['#9d9c98', '#a5a4a0', '#d9d8d4', '#eeeeec', '#c0bfbb'], kL: 2.5, tol: 10, minL: 45, full: true, solid: true, allowWhite: true, polys: [
            [[340, 190], [450, 125], [600, 80], [700, 72], [900, 85], [1100, 135], [1115, 150], [1100, 153], [1000, 162], [800, 190], [600, 208], [400, 205], [345, 196]]
        ] },
    },
    'golfer-2-scratch-right': {
        body: { refs: ['#ddd6cc', '#c3b8af', '#eeeadf', '#d2c9bd', '#b3a79c', '#9d9185', '#8a7f74', '#a8a097'], kL: 2.5, tol: 8, minL: 38, full: true,
            // Headlights (their white LED bars match the paint) and the badge
            exclude: [[[958, 684], [1082, 688], [1106, 740], [1094, 766], [994, 756], [960, 722]], [[1248, 668], [1290, 656], [1298, 740], [1266, 754], [1250, 722]], [[1150, 721], [1224, 721], [1224, 760], [1150, 760]]],
            polys: [
            [[790, 620], [850, 585], [1000, 568], [1180, 593], [1300, 648], [1335, 700], [1335, 812], [1100, 852], [900, 842], [800, 812], [775, 750]],
            [[300, 660], [330, 628], [480, 640], [520, 700], [800, 700], [802, 770], [780, 852], [450, 870], [420, 875], [375, 815], [300, 770]]
        ] },
        seat: { refs: ['#a19c98', '#b0aba7', '#bfbcb7', '#3a3938', '#232222', '#d8d6d2', '#6e6b68'], kL: 2, tol: 12,
            // Traced on the photo; the hip restraint bar in front of the cushion is left alone
            exclude: [[[232, 328], [250, 320], [300, 382], [300, 396], [285, 396], [232, 350]]],
            polys: [
            [[248, 222], [262, 214], [300, 214], [308, 228], [350, 226], [356, 216], [400, 216], [408, 232], [422, 248], [440, 258], [444, 300], [440, 340], [452, 352], [452, 384], [420, 392], [350, 396], [302, 396], [286, 388], [246, 348], [232, 334], [230, 300], [232, 255]]
        ] },
        // The roof and its underside, down to where the side curtains hang from it
        canopy: { refs: ['#a18d72', '#7a6850', '#c4b294', '#d6c7aa', '#8f7c62'], kL: 2.5, tol: 10, full: true, polys: [
            [[340, 160], [450, 110], [700, 55], [900, 62], [1100, 108], [1162, 140], [1150, 158], [1100, 166], [1000, 190], [950, 200], [700, 205], [400, 205], [345, 200]]
        ] }
    },
    'golfer-2-pro': {
        body: { refs: ['#828085', '#827b6c', '#d2d5e1', '#9b999e', '#6b6a6f', '#b4b4ba', '#5a595e', '#4a494e', '#e6e7ee', '#3e3d42', '#333237'], kL: 2.5, tol: 11, minL: 18, growMinL: 12, full: true,
            exclude: [[[916, 676], [1062, 688], [1074, 766], [1056, 778], [934, 758], [916, 712]], [[1198, 658], [1262, 646], [1268, 742], [1210, 754]], [[1098, 712], [1190, 712], [1190, 764], [1098, 764]]],
            polys: [
            [[790, 625], [870, 580], [1000, 572], [1150, 593], [1252, 648], [1275, 750], [1255, 812], [1100, 845], [900, 842], [800, 812], [775, 750]],
            [[268, 650], [310, 618], [410, 648], [440, 700], [800, 700], [802, 770], [762, 862], [450, 870], [410, 875], [365, 810], [290, 770], [262, 720]]
        ] },
        seat: { refs: ['#c58a6a', '#e2a589', '#a86f50', '#8a5a40', '#d99a78'], kL: 3, tol: 16, polys: [
            [[230, 246], [250, 226], [422, 226], [446, 256], [446, 345], [452, 392], [300, 394], [240, 372], [230, 300]]
        ] },
        // The black roof's shell and the liner under it, back to the visor and speaker bar, which stay as they are,
        // as does the roof post in front of the liner
        canopy: { refs: ['#2c2c27'], kL: 1, tol: 999, full: true,
            exclude: [[[700, 112], [732, 112], [748, 182], [712, 182]]],
            polys: [
            [[335, 125], [500, 60], [800, 40], [1100, 80], [1150, 130], [1145, 140], [1000, 122], [780, 114], [600, 127], [420, 157], [335, 170]],
            [[390, 168], [450, 150], [600, 120], [780, 105], [790, 128], [720, 150], [600, 170], [400, 178]]
        ] }
    },
    'golfer-2-2-golfer': {
        // Black paint can't be told from the black trim, so the body is the map found on the Scratch 2+2 photo:
        // the same cart, shot from the same camera position, in green paint
        body: { from: 'golfer-2-2-scratch' },
        seat: { refs: ['#b49a83', '#bba08a', '#cdb5a0', '#9a826d', '#a58c76'], kL: 3, tol: 14,
            // The hip restraint bar is left alone (the dark roof post doesn't match the tan seat)
            exclude: [[[236, 296], [252, 292], [302, 370], [302, 392], [290, 392], [236, 318]]],
            polys: [
            [[240, 242], [260, 230], [440, 235], [466, 265], [460, 330], [420, 345], [432, 392], [280, 392], [245, 350]],
            // The rear-facing seat: its back (behind the front seat) and its cushion
            [[214, 240], [244, 228], [244, 320], [214, 316]],
            [[168, 310], [240, 304], [246, 336], [168, 342]]
        ] },
        // The black roof is one piece, top and underside; the roof post in front of the underside stays as it is
        canopy: { refs: ['#2c2c27'], kL: 1, tol: 999, full: true,
            exclude: [[[675, 105], [702, 105], [737, 235], [707, 235]]],
            polys: [
            [[255, 190], [400, 140], [650, 70], [700, 62], [900, 70], [1100, 105], [1152, 138], [1150, 154], [1000, 182], [800, 217], [670, 232], [600, 227], [400, 212], [255, 202]]
        ] }
    },
    'golfer-2-2-scratch': {
        // Green paint: found by its green tint (Lab a* below -7), then grown over its shading, the sky's pale
        // reflections and its near-black shadows (still slightly green), but never onto the neutral black trim,
        // frame, posts or wheels (a* about 0)
        // fill: the side panel in front of the rear wheel, which runs into near-black shadow beside the clear step
        // guard; traced, and always body, so its edge is straight instead of stepped
        body: { refs: [], seed: (L, a) => a <= -7, keep: (L, a) => a <= -3 || L >= 45 || (L < 10 && a <= -1.5), growMinL: 0,
            fill: [[[281, 394], [391, 394], [391, 441], [336, 442], [335, 470], [281, 462]]],
            exclude: [[[500, 386], [566, 388], [590, 418], [572, 430], [508, 414]], [[680, 384], [706, 372], [712, 416], [698, 424], [684, 410]], [[606, 400], [666, 400], [666, 430], [606, 430]]],
            polys: [
            // Front cowl, rear side panel along the wheel arch, seat line and footwell, and the tail corner
            [[430, 334], [452, 322], [520, 317], [600, 320], [655, 330], [700, 358], [722, 370], [724, 408], [716, 420], [640, 444], [560, 448], [490, 440], [452, 428], [430, 420]],
            [[192, 352], [250, 356], [300, 384], [312, 390], [420, 390], [432, 470], [335, 472], [330, 476], [248, 458], [230, 420], [205, 395], [188, 370]],
            [[176, 356], [192, 352], [188, 370], [180, 372]]
        ] },
        seat: { refs: ['#656660', '#777672', '#666561', '#2a2a28', '#1c1c1a', '#9c9b96', '#4a4a46'], kL: 2, tol: 12,
            // Traced on the photo; the hip restraint bar and the roof post in front of the seat are left alone
            exclude: [[[236, 296], [252, 292], [302, 370], [302, 392], [290, 392], [236, 318]], [[403, 191], [415, 191], [464, 405], [453, 405]]],
            polys: [
            [[262, 214], [275, 207], [322, 207], [330, 222], [372, 222], [380, 210], [428, 210], [436, 226], [455, 248], [464, 275], [462, 320], [445, 342], [446, 384], [420, 390], [300, 392], [275, 388], [258, 370], [243, 330], [244, 262]],
            [[214, 240], [244, 228], [244, 320], [214, 316]],
            [[168, 310], [244, 304], [246, 340], [168, 344]]
        ] },
        canopy: { refs: ['#7c6850', '#baa68b', '#a18d72', '#d0bfa3', '#8f7c62'], kL: 2.5, tol: 10, full: true, polys: [
            [[245, 185], [400, 130], [650, 60], [700, 52], [900, 60], [1100, 98], [1162, 135], [1158, 158], [1000, 188], [800, 222], [670, 238], [600, 232], [400, 217], [245, 207]]
        ] }
    },
    'golfer-2-2-pro-right': {
        body: { refs: ['#8a878d', '#7d7970', '#d5d4da', '#a2a0a6', '#6f6d73', '#b8b7bd', '#5a585e', '#4a484e', '#e6e5ea', '#3e3c42', '#333137'], kL: 2.5, tol: 11, minL: 18, growMinL: 12, full: true,
            exclude: [[[975, 676], [1110, 690], [1122, 762], [1100, 772], [990, 758], [975, 712]], [[1262, 660], [1300, 648], [1305, 740], [1268, 752]], [[1158, 716], [1242, 716], [1242, 760], [1158, 760]]],
            polys: [
            [[800, 640], [850, 590], [1000, 575], [1200, 585], [1300, 640], [1340, 740], [1325, 800], [1200, 830], [900, 830], [790, 800], [780, 700]],
            [[285, 700], [320, 640], [400, 640], [450, 700], [820, 700], [820, 780], [780, 860], [470, 870], [430, 875], [390, 815], [300, 780]]
        ] },
        seat: { refs: ['#9d6b49', '#c4967e', '#b07a58', '#7c5236', '#d8a88e'], kL: 3, tol: 16, polys: [
            [[240, 252], [260, 238], [440, 238], [462, 270], [456, 345], [476, 392], [300, 396], [250, 372]],
            [[204, 253], [222, 241], [243, 239], [243, 338], [204, 338]],
            [[148, 314], [215, 308], [222, 340], [148, 346]]
        ] },
        // The black roof's shell and the liner under it; the speaker bar and mirror stay as they are
        canopy: { refs: ['#2c2c27'], kL: 1, tol: 999, full: true,
            // The roof post in front of the liner stays as it is
            exclude: [[[750, 120], [785, 120], [805, 240], [770, 240]]],
            polys: [
            [[355, 180], [400, 135], [600, 80], [770, 60], [900, 65], [1100, 100], [1168, 135], [1165, 157], [1080, 137], [900, 107], [750, 112], [600, 132], [450, 177], [355, 197]],
            // The liner under it, back to the speaker bar
            [[385, 195], [450, 160], [600, 122], [760, 105], [780, 108], [790, 150], [805, 228], [770, 232], [700, 224], [500, 210], [400, 202]]
        ] }
    }
};

function toLab(r, g, b) {
    const f = c => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; };
    const [R, G, B] = [f(r), f(g), f(b)];
    const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, Y = R * 0.2126 + G * 0.7152 + B * 0.0722, Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    const t = v => v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116;
    return [116 * t(Y) - 16, 500 * (t(X) - t(Y)), 200 * (t(Y) - t(Z))];
}
const hexLab = h => toLab(...[1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));

function inPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

// The white studio backdrop: near-white, colorless pixels reached from the photo's edges without crossing an
// edge. It also shows through the windshield and between the seats, where light paint and seats would
// otherwise run into it.
function findBackdrop(data, solid) {
    const blocked = new Uint8Array(W * H);
    for (const poly of solid) {
        const ys = poly.map(p => p[1]), xs = poly.map(p => p[0]);
        for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++)
            for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++)
                if (inPoly(x, y, poly)) blocked[y * W + x] = 1;
    }
    const bg = new Uint8Array(W * H);
    const lab = p => toLab(data[p * 3], data[p * 3 + 1], data[p * 3 + 2]);
    const isWhite = ([L, a, b]) => L >= 93 && Math.hypot(a, b) < 4;
    const queue = [];
    for (let x = 0; x < W; x++) queue.push(x, (H - 1) * W + x);
    for (let y = 0; y < H; y++) queue.push(y * W, y * W + W - 1);
    for (const p of queue) bg[p] = isWhite(lab(p)) && !blocked[p] ? 1 : 0;
    const stack = queue.filter(p => bg[p]);
    while (stack.length) {
        const p = stack.pop();
        const x = p % W, y = (p / W) | 0;
        const v = lab(p);
        for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
            if (q < 0 || bg[q] || blocked[q]) continue;
            const u = lab(q);
            if (!isWhite(u) || Math.hypot(u[0] - v[0], u[1] - v[1], u[2] - v[2]) > 1.5) continue;
            bg[q] = 1;
            stack.push(q);
        }
    }
    return bg;
}

// Morphological closing of one mask channel (grow by r, then shrink by r): fills gaps narrower than about
// 2r that the part surrounds. Only pixels `allowed` accepts are added.
function closeHoles(mask, c, r, allowed) {
    const on = new Uint8Array(W * H);
    for (let p = 0; p < W * H; p++) on[p] = mask[p * 3 + c] ? 1 : 0;
    const spread = (src, value) => {
        // Square neighbourhood, done as a row pass then a column pass
        const rows = new Uint8Array(W * H), out = new Uint8Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            let hit = 0;
            for (let d = -r; d <= r && !hit; d++) { const xx = x + d; if (xx >= 0 && xx < W && src[y * W + xx] === value) hit = 1; }
            rows[y * W + x] = hit;
        }
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            let hit = 0;
            for (let d = -r; d <= r && !hit; d++) { const yy = y + d; if (yy >= 0 && yy < H && rows[yy * W + x]) hit = 1; }
            out[y * W + x] = value ? hit : 1 - hit;
        }
        return out;
    };
    const grown = spread(on, 1);
    const closed = spread(grown, 0);
    for (let p = 0; p < W * H; p++) {
        if (closed[p] && !on[p] && allowed(p)) mask[p * 3 + c] = 255;
    }
}

// Seats and colored roofs never take pure white: that is backdrop showing through, often in pockets the
// backdrop search can't reach (between the seat back and the roof posts). White roofs opt out (allowWhite).
function blownWhite(part, spec, L, a, b) {
    return part !== 'body' && !spec.allowWhite && L >= 97 && Math.hypot(a, b) < 3;
}

const outDir = path.join(root, 'image', 'Products', 'builds', 'masks');
fs.mkdirSync(outDir, { recursive: true });
const overlayDir = process.argv[2];

// Photos that borrow another photo's body map come after it
const built = {};
const order = Object.entries(MASKS).sort(([, p], [, q]) => Boolean(p.body.from) - Boolean(q.body.from));
for (const [name, parts] of order) {
    const { data } = await sharp(path.join(root, 'image', 'Products', 'builds', `${name}.jpg`)).resize(W, H).raw().toBuffer({ resolveWithObject: true });
    const mask = Buffer.alloc(W * H * 3);
    const solid = Object.values(parts).filter(spec => spec.solid).flatMap(spec => spec.polys);
    const backdrop = findBackdrop(data, solid);
    const channel = { body: 0, seat: 1, canopy: 2 };
    for (const part of ['seat', 'canopy', 'body']) {
        const traced = parts[part];
        if (traced.from) {
            const source = built[traced.from];
            for (let p = 0; p < W * H; p++) {
                if (source[p * 3] && !mask[p * 3 + 1] && !mask[p * 3 + 2]) mask[p * 3] = 255;
            }
            continue;
        }
        const scale = list => list && list.map(poly => poly.map(([x, y]) => [x * K, y * K]));
        const spec = traced.full ? traced : { ...traced, polys: scale(traced.polys), exclude: scale(traced.exclude) };
        const refs = spec.refs.map(hexLab);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (!spec.polys.some(p => inPoly(x, y, p))) continue;
            if (backdrop[y * W + x]) continue;
            const i = (y * W + x) * 3;
            const [L, a, b] = toLab(data[i], data[i + 1], data[i + 2]);
            if (spec.minL && L < spec.minL) continue;
            if (blownWhite(part, spec, L, a, b)) continue;
            if (spec.exclude && spec.exclude.some(p => inPoly(x, y, p))) continue;
            if (part === 'body' && (mask[i + 1] || mask[i + 2])) continue;
            if (spec.seed) {
                if (spec.seed(L, a, b)) mask[i + channel[part]] = 255;
                continue;
            }
            const d = Math.min(...refs.map(([L2, a2, b2]) => Math.hypot((L - L2) / spec.kL, a - a2, b - b2)));
            if (d <= spec.tol) mask[i + channel[part]] = 255;
        }
        // Then grow out from what matched, pixel by pixel, while the color changes smoothly: shadowed and
        // reflective paint is continuous with the panel and is taken in, while the jump to black trim, glass,
        // wheels or the backdrop stops it. Stays inside the outline and out of the cut-outs.
        // Outline-only parts (tol 999) are already whole. Growth never goes darker than the part's darkest
        // sampled tone minus a margin, so it stops at black trim and badges on light carts.
        const step = spec.tol >= 999 ? 0 : spec.grow === undefined ? 4 : spec.grow;
        const floorL = spec.growMinL !== undefined ? spec.growMinL : Math.min(...refs.map(r => r[0])) - 14;
        if (step) {
            const c = channel[part];
            const allowed = new Uint8Array(W * H);
            const lab = new Float32Array(W * H * 3);
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
                const p = y * W + x, i = p * 3;
                if (!spec.polys.some(q => inPoly(x, y, q)) || backdrop[p]) continue;
                if (spec.exclude && spec.exclude.some(q => inPoly(x, y, q))) continue;
                if (part === 'body' && (mask[i + 1] || mask[i + 2])) continue;
                const v = toLab(data[i], data[i + 1], data[i + 2]);
                if (v[0] < floorL || blownWhite(part, spec, ...v) || (spec.keep && !spec.keep(...v))) continue;
                lab[i] = v[0]; lab[i + 1] = v[1]; lab[i + 2] = v[2];
                allowed[p] = 1;
            }
            const queue = [];
            for (let p = 0; p < W * H; p++) if (mask[p * 3 + c] && allowed[p]) queue.push(p);
            while (queue.length) {
                const p = queue.pop();
                const x = p % W, y = (p / W) | 0;
                for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
                    if (q < 0 || !allowed[q] || mask[q * 3 + c]) continue;
                    const dl = (lab[q * 3] - lab[p * 3]) / 2, da = lab[q * 3 + 1] - lab[p * 3 + 1], db = lab[q * 3 + 2] - lab[p * 3 + 2];
                    if (Math.hypot(dl, da, db) > step) continue;
                    mask[q * 3 + c] = 255;
                    queue.push(q);
                }
            }
        }
    }
    // Close pinholes in the body (dark, noisy paint the growth skipped): a gap the body surrounds within 3 px
    // is filled, as long as it is inside the outline and not backdrop
    closeHoles(mask, 0, 3, p => {
        const x = p % W, y = (p / W) | 0;
        const spec = parts.body;
        if (spec.from || backdrop[p] || mask[p * 3 + 1] || mask[p * 3 + 2]) return false;
        const polys = spec.full ? spec.polys : spec.polys.map(poly => poly.map(([px, py]) => [px * K, py * K]));
        const exclude = spec.exclude && (spec.full ? spec.exclude : spec.exclude.map(poly => poly.map(([px, py]) => [px * K, py * K])));
        return polys.some(q => inPoly(x, y, q)) && !(exclude && exclude.some(q => inPoly(x, y, q)));
    });
    if (parts.body.fill) {
        const fill = parts.body.fill.map(poly => poly.map(([x, y]) => [x * K, y * K]));
        for (let p = 0; p < W * H; p++) {
            if (backdrop[p] || mask[p * 3 + 1] || mask[p * 3 + 2]) continue;
            if (fill.some(q => inPoly(p % W, (p / W) | 0, q))) mask[p * 3] = 255;
        }
    }
    built[name] = mask;
    // Smooth the edges a little so repainted areas don't look jagged
    const png = await sharp(mask, { raw: { width: W, height: H, channels: 3 } }).median(3).png().toBuffer();
    fs.writeFileSync(path.join(outDir, `${name}.png`), png);
    if (overlayDir) {
        const photo = await sharp(path.join(root, 'image', 'Products', 'builds', `${name}.jpg`)).resize(W, H).png().toBuffer();
        const tint = await sharp(png).ensureAlpha(0.55).png().toBuffer();
        await sharp(photo).composite([{ input: tint, blend: 'over' }]).png().toFile(path.join(overlayDir, `mask-${name}.png`));
    }
    console.log('mask', name);
}
