// Paint maps for the Golfer 2 / 2+2 build photos, used by the live color preview (recolor.js).
// The build photos' carts are white, beige, grey or black, so the preview can't find their paint by color
// alone. Each part is outlined here (polygons in the 900 x 675 preview size) and, inside its outline, only
// pixels close to that part's own colors in the photo count, so frame, glass, wheels and badges stay as they
// are. Output: image/Products/builds/masks/<photo>.png, red = body, green = seat, blue = canopy.
//
//   node scripts/build-masks.mjs            writes the masks
//   node scripts/build-masks.mjs <dir>      also writes overlays of each mask on its photo into <dir>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = 900, H = 675;

// refs: the part's colors in the photo; tol: how far (in Lab, lightness counted 1/kL) a pixel may be
const MASKS = {
    'golfer-2-golfer': {
        body: { refs: ['#f1f0ee', '#dbdad6', '#c9c8c4', '#b4b3ae'], kL: 2.5, tol: 9, minL: 55, polys: [
            [[446, 330], [470, 320], [470, 418], [446, 404]],
            [[400, 322], [560, 312], [650, 318], [700, 360], [705, 408], [640, 428], [560, 438], [450, 445], [395, 425]],
            [[160, 345], [240, 335], [400, 345], [395, 470], [330, 470], [235, 468], [160, 425]]
        ] },
        seat: { refs: ['#d4d1cc', '#dedcd8', '#e9e8e5', '#bdbab5'], kL: 2.5, tol: 10, minL: 50, polys: [
            [[225, 248], [240, 233], [420, 235], [445, 258], [445, 330], [418, 345], [410, 392], [245, 392], [226, 345]]
        ] },
        canopy: { refs: ['#9d9c98', '#a5a4a0', '#d9d8d4', '#eeeeec', '#c0bfbb'], kL: 2.5, tol: 10, minL: 45, polys: [
            [[195, 96], [232, 44], [370, 36], [628, 70], [628, 90], [450, 132], [250, 120], [195, 110]]
        ] }
    },
    'golfer-2-scratch-right': {
        body: { refs: ['#ddd6cc', '#c3b8af', '#eeeadf', '#d2c9bd', '#b3a79c', '#9d9185', '#8a7f74', '#a8a097'], kL: 2.5, tol: 8, minL: 38,
            // Headlights (their white LED bars match the paint)
            exclude: [[[536, 382], [628, 384], [632, 436], [540, 430]], [[698, 366], [728, 366], [730, 424], [700, 424]]],
            polys: [
            [[442, 335], [560, 318], [650, 320], [705, 350], [727, 382], [722, 415], [640, 432], [560, 427], [520, 408], [445, 412]],
            [[146, 344], [200, 334], [234, 336], [240, 390], [456, 394], [452, 432], [410, 472], [240, 472], [148, 428]]
        ] },
        seat: { refs: ['#a19c98', '#b0aba7', '#bfbcb7', '#3a3938', '#232222', '#d8d6d2', '#6e6b68'], kL: 2, tol: 12,
            // Traced on the photo; the hip restraint bar in front of the cushion is left alone
            exclude: [[[232, 328], [250, 320], [300, 382], [300, 396], [285, 396], [232, 350]]],
            polys: [
            [[248, 222], [262, 214], [300, 214], [308, 228], [350, 226], [356, 216], [400, 216], [408, 232], [422, 248], [440, 258], [444, 300], [440, 340], [452, 352], [452, 384], [420, 392], [350, 396], [300, 396], [262, 392], [240, 385], [232, 345], [230, 300], [232, 255]]
        ] },
        canopy: { refs: ['#a18d72', '#7a6850', '#c4b294', '#d6c7aa', '#8f7c62'], kL: 2.5, tol: 10, polys: [
            [[196, 100], [216, 74], [420, 38], [642, 72], [646, 86], [450, 132], [250, 126], [200, 112]]
        ] }
    },
    'golfer-2-pro': {
        body: { refs: ['#828085', '#827b6c', '#d2d5e1', '#9b999e', '#6b6a6f', '#b4b4ba', '#5a595e', '#4a494e', '#e6e7ee', '#3e3d42', '#333237'], kL: 2.5, tol: 11, minL: 18,
            exclude: [[[519, 386], [586, 378], [602, 404], [598, 432], [530, 422]], [[690, 382], [712, 372], [716, 420], [694, 426]]],
            polys: [
            [[448, 332], [560, 320], [650, 323], [708, 360], [720, 412], [640, 432], [520, 412], [450, 412]],
            [[155, 352], [236, 346], [240, 392], [446, 396], [440, 432], [400, 472], [230, 472], [150, 422]]
        ] },
        seat: { refs: ['#c58a6a', '#e2a589', '#a86f50', '#8a5a40', '#d99a78'], kL: 3, tol: 16, polys: [
            [[230, 246], [250, 226], [422, 226], [446, 256], [446, 345], [452, 392], [300, 394], [240, 372], [230, 300]]
        ] },
        canopy: { refs: ['#2c2c27'], kL: 1, tol: 999, polys: [
            [[190, 80], [206, 54], [400, 40], [636, 68], [640, 80], [420, 100], [200, 100]]
        ] }
    },
    'golfer-2-2-golfer': {
        body: { refs: ['#282421'], kL: 1, tol: 999,
            exclude: [[[606, 400], [666, 400], [666, 430], [606, 430]]],
            polys: [
            // Traced on the photo (the Golfer and Scratch 2+2 photos share one camera angle): front cowl, rear
            // side panel along the wheel arch, seat line and footwell, and the tail corner
            [[430, 334], [452, 322], [520, 317], [600, 320], [655, 330], [700, 358], [722, 370], [724, 408], [716, 420], [640, 444], [560, 448], [490, 440], [452, 428], [430, 420]],
            [[192, 352], [250, 356], [300, 384], [312, 390], [420, 390], [420, 445], [335, 448], [330, 476], [248, 458], [230, 420], [205, 395], [188, 370]],
            [[176, 356], [192, 352], [188, 370], [180, 372]]
        ] },
        seat: { refs: ['#b49a83', '#bba08a', '#cdb5a0', '#9a826d', '#a58c76'], kL: 3, tol: 14, polys: [
            [[240, 242], [260, 230], [440, 235], [466, 265], [460, 330], [420, 345], [432, 392], [280, 392], [245, 350]],
            [[168, 310], [240, 304], [246, 336], [168, 342]]
        ] },
        canopy: { refs: ['#2c2c27'], kL: 1, tol: 999, polys: [
            [[145, 106], [160, 86], [400, 42], [642, 70], [646, 86], [420, 116], [300, 130], [160, 126]]
        ] }
    },
    'golfer-2-2-scratch': {
        body: { refs: ['#1f3623'], kL: 1, tol: 999,
            exclude: [[[500, 386], [566, 388], [590, 418], [572, 430], [508, 414]], [[680, 384], [706, 372], [712, 416], [698, 424], [684, 410]], [[606, 400], [666, 400], [666, 430], [606, 430]]],
            polys: [
            // Traced on the photo (the Golfer and Scratch 2+2 photos share one camera angle): front cowl, rear
            // side panel along the wheel arch, seat line and footwell, and the tail corner
            [[430, 334], [452, 322], [520, 317], [600, 320], [655, 330], [700, 358], [722, 370], [724, 408], [716, 420], [640, 444], [560, 448], [490, 440], [452, 428], [430, 420]],
            [[192, 352], [250, 356], [300, 384], [312, 390], [420, 390], [420, 445], [335, 448], [330, 476], [248, 458], [230, 420], [205, 395], [188, 370]],
            [[176, 356], [192, 352], [188, 370], [180, 372]]
        ] },
        seat: { refs: ['#656660', '#777672', '#666561', '#2a2a28', '#1c1c1a', '#9c9b96', '#4a4a46'], kL: 2, tol: 12,
            // Traced on the photo; the hip restraint bar and the roof post in front of the seat are left alone
            exclude: [[[236, 296], [252, 292], [302, 370], [302, 392], [290, 392], [236, 318]], [[398, 196], [412, 196], [446, 400], [432, 400]]],
            polys: [
            [[262, 214], [275, 207], [322, 207], [330, 222], [372, 222], [380, 210], [428, 210], [436, 226], [455, 248], [464, 275], [462, 320], [445, 342], [446, 384], [420, 390], [300, 392], [275, 388], [258, 370], [243, 330], [244, 262]],
            [[214, 240], [244, 228], [244, 320], [214, 316]],
            [[168, 310], [244, 304], [246, 340], [168, 344]]
        ] },
        canopy: { refs: ['#7c6850', '#baa68b', '#a18d72', '#d0bfa3', '#8f7c62'], kL: 2.5, tol: 10, polys: [
            [[145, 106], [160, 86], [400, 42], [642, 70], [646, 86], [420, 116], [300, 130], [160, 126]]
        ] }
    },
    'golfer-2-2-pro-right': {
        body: { refs: ['#8a878d', '#7d7970', '#d5d4da', '#a2a0a6', '#6f6d73', '#b8b7bd', '#5a585e', '#4a484e', '#e6e5ea', '#3e3c42', '#333137'], kL: 2.5, tol: 11, minL: 18,
            exclude: [[[552, 388], [612, 384], [628, 404], [626, 430], [560, 428]], [[714, 378], [730, 364], [738, 410], [720, 426]]],
            polys: [
            [[488, 332], [600, 324], [690, 334], [746, 370], [746, 420], [670, 442], [560, 426], [488, 422]],
            [[160, 372], [240, 362], [250, 396], [470, 400], [462, 440], [420, 482], [240, 482], [160, 432]]
        ] },
        seat: { refs: ['#9d6b49', '#c4967e', '#b07a58', '#7c5236', '#d8a88e'], kL: 3, tol: 16, polys: [
            [[240, 252], [260, 238], [440, 238], [462, 270], [456, 345], [476, 392], [300, 396], [250, 372]],
            [[148, 314], [215, 308], [222, 340], [148, 346]]
        ] },
        canopy: { refs: ['#2c2c27'], kL: 1, tol: 999, polys: [
            [[205, 96], [220, 70], [420, 42], [652, 72], [652, 86], [450, 116], [240, 116]]
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

const outDir = path.join(root, 'image', 'Products', 'builds', 'masks');
fs.mkdirSync(outDir, { recursive: true });
const overlayDir = process.argv[2];

for (const [name, parts] of Object.entries(MASKS)) {
    const { data } = await sharp(path.join(root, 'image', 'Products', 'builds', `${name}.jpg`)).resize(W, H).raw().toBuffer({ resolveWithObject: true });
    const mask = Buffer.alloc(W * H * 3);
    const channel = { body: 0, seat: 1, canopy: 2 };
    for (const part of ['seat', 'canopy', 'body']) {
        const spec = parts[part];
        const refs = spec.refs.map(hexLab);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (!spec.polys.some(p => inPoly(x, y, p))) continue;
            const i = (y * W + x) * 3;
            const [L, a, b] = toLab(data[i], data[i + 1], data[i + 2]);
            if (spec.minL && L < spec.minL) continue;
            if (spec.exclude && spec.exclude.some(p => inPoly(x, y, p))) continue;
            if (part === 'body' && (mask[i + 1] || mask[i + 2])) continue;
            const d = Math.min(...refs.map(([L2, a2, b2]) => Math.hypot((L - L2) / spec.kL, a - a2, b - b2)));
            if (d <= spec.tol) mask[i + channel[part]] = 255;
        }
    }
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
