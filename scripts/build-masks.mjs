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

// refs: the part's colors in the photo; tol: how far (in Lab, lightness counted 1/kL) a pixel may be; minL / maxL: lightness limits
const MASKS = {
    'golfer-2-golfer': {
        body: { refs: ['#f1f0ee', '#dbdad6', '#c9c8c4', '#b4b3ae'], kL: 2.5, tol: 9, minL: 55, polys: [
            [[446, 330], [470, 320], [470, 418], [446, 404]],
            [[400, 322], [560, 312], [650, 318], [700, 360], [712, 400], [706, 416], [680, 438], [650, 450], [600, 456], [560, 454], [520, 446], [450, 440], [395, 428]],
            // Side panel; its top-left corner is rounded
            [[162, 362], [170, 350], [182, 341], [205, 337], [222, 339], [240, 335], [400, 345], [395, 470], [330, 470], [235, 468], [160, 425]]
        ],
            // The Club Car badge's white letters
            exclude: [[[594, 403], [643, 403], [643, 427], [594, 427]]] },
        // Seat backs follow their rounded tops and the dip between them, so the white background stays out
        seat: { refs: ['#d4d1cc', '#dedcd8', '#e9e8e5', '#bdbab5'], kL: 2.5, tol: 10, minL: 50, polys: [
            [[226, 256], [232, 243], [245, 236], [328, 238], [342, 248], [356, 236], [420, 236], [436, 246], [445, 262], [445, 330], [418, 345], [410, 392], [245, 392], [226, 345]]
        ] },
        canopy: { refs: ['#9d9c98', '#a5a4a0', '#d9d8d4', '#eeeeec', '#c0bfbb'], kL: 2.5, tol: 10, minL: 45, polys: [
            [[195, 96], [232, 44], [370, 36], [628, 70], [628, 90], [450, 132], [250, 120], [195, 110]]
        ] }
    },
    'golfer-2-scratch-right': {
        body: { refs: ['#ddd6cc', '#c3b8af', '#eeeadf', '#d2c9bd', '#b3a79c', '#9d9185', '#8a7f74', '#a8a097'], kL: 2.5, tol: 8, minL: 38,
            // Headlight housings (their white LED bars match the paint) and the Club Car badge, traced at 4x
            exclude: [
                [[538, 384], [598, 388], [630, 419], [626, 432], [618, 433], [554, 421], [537, 398]],
                [[700, 388], [707, 376], [723, 372], [728, 396], [719, 421], [704, 421]],
                [[644, 403], [689, 403], [689, 429], [644, 429]]
            ],
            polys: [
            // Cowl, down to its lower lip; the bumper's light top edge below the lip is left out
            [[442, 335], [560, 318], [650, 320], [705, 350], [730, 385], [738, 405], [736, 420], [720, 436], [700, 446], [650, 447], [632, 446], [620, 436], [560, 433], [530, 429], [500, 426], [470, 424], [445, 418]],
            // Side panel, including its top surface under the hip restraint bar and its lower lip
            [[146, 344], [200, 334], [232, 332], [262, 360], [298, 394], [456, 394], [452, 432], [410, 478], [236, 478], [200, 462], [148, 430]]
        ] },
        // maxL keeps the white background (seen through the gap under the seat back) out of the seat
        seat: { refs: ['#a19c98', '#b0aba7', '#bfbcb7', '#3a3938', '#232222', '#d8d6d2', '#6e6b68'], kL: 2, tol: 12, maxL: 95,
            // The hip restraint bar in front of the cushion, and the gap between seat back and cushion
            exclude: [
                [[232, 328], [250, 320], [300, 382], [300, 396], [285, 396], [232, 350]],
                [[400, 329], [452, 322], [452, 345], [430, 347], [400, 340]]
            ],
            // Traced on the photo: rounded top-right corner, and the cushion's left edge runs along the bar
            polys: [
            [[248, 222], [262, 214], [300, 214], [308, 228], [350, 226], [356, 216], [400, 216], [408, 232], [420, 244], [432, 255], [440, 275], [443, 300], [442, 318], [432, 330], [404, 332], [404, 342], [440, 344], [452, 352], [452, 384], [420, 392], [350, 396], [300, 396], [262, 358], [234, 327], [230, 300], [232, 255]]
        ] },
        canopy: { refs: ['#a18d72', '#7a6850', '#c4b294', '#d6c7aa', '#8f7c62'], kL: 2.5, tol: 10, polys: [
            [[196, 100], [216, 74], [420, 38], [642, 72], [646, 86], [450, 132], [250, 126], [200, 112]]
        ] }
    },
    'golfer-2-pro': {
        body: { refs: ['#828085', '#827b6c', '#d2d5e1', '#9b999e', '#6b6a6f', '#b4b4ba', '#5a595e', '#4a494e', '#e6e7ee', '#3e3d42', '#333237'], kL: 2.5, tol: 11, minL: 18,
            exclude: [[[519, 386], [586, 378], [602, 404], [598, 432], [530, 422]], [[690, 382], [712, 372], [716, 420], [694, 426]]],
            polys: [
            // Cowl, down to its lower lip (same grey paint); the right edge follows the cowl so the background stays out
            [[448, 332], [560, 320], [650, 323], [690, 352], [702, 366], [712, 388], [716, 412], [700, 428], [680, 432], [640, 436], [600, 442], [580, 446], [560, 442], [540, 440], [520, 428], [500, 424], [470, 418], [450, 412]],
            // Side panel, including its top surface under the hip restraint bar
            [[155, 352], [236, 346], [240, 360], [300, 390], [446, 394], [440, 432], [400, 472], [230, 472], [150, 422]]
        ] },
        seat: { refs: ['#c58a6a', '#e2a589', '#a86f50', '#8a5a40', '#d99a78'], kL: 3, tol: 16, polys: [
            [[230, 246], [250, 226], [422, 226], [446, 256], [446, 345], [452, 392], [300, 394], [240, 372], [230, 300]]
        ] },
        // Roof top and front rim, traced at 2x; the dark underside below the rim is left out. Inside the outline
        // everything is roof, so no colour test (tol 999); maxL keeps the background out at its edges.
        canopy: { refs: ['#4e5565'], kL: 1, tol: 999, maxL: 95, polys: [
            [[188, 86], [190, 72], [230, 61], [305, 50], [380, 45], [430, 44], [530, 49], [605, 54], [632, 61], [641, 75], [637, 80], [580, 75], [505, 71], [430, 68], [380, 67], [300, 72], [230, 79], [200, 84]]
        ] }
    },
    'golfer-2-2-golfer': {
        // Black paint: told apart from the black plastic by outline only (tol 999), so the outlines follow the painted
        // panels and leave out the matte fender flares, the roof post, the sill and the bumper (traced on a brightened
        // copy of the photo). maxL keeps the white background out at the cowl's edges.
        body: { refs: ['#282421'], kL: 1, tol: 999, maxL: 92,
            exclude: [[[607, 401], [663, 401], [663, 428], [607, 428]]],
            polys: [
            // Hood, cowl sides and front fascia (with the blank headlight covers), above the front flare and bumper.
            // Traced on the green 2+2 Scratch photo (same camera), where paint and plastic differ in colour
            [[450, 325], [470, 318], [560, 312], [650, 322], [672, 334], [690, 348], [706, 362], [713, 380], [714, 400], [717, 427], [690, 435], [640, 438], [600, 440], [560, 438], [525, 428], [500, 428], [470, 426], [445, 422], [440, 400], [443, 345]],
            // Rear side panel: from its rounded shoulder to the sill, between the rear flare and the roof post
            [[183, 377], [190, 366], [200, 360], [250, 364], [300, 389], [411, 385], [405, 467], [259, 467], [248, 439], [236, 405], [219, 388]]
        ] },
        seat: { refs: ['#b49a83', '#bba08a', '#cdb5a0', '#9a826d', '#a58c76'], kL: 3, tol: 14, polys: [
            [[240, 242], [260, 230], [440, 235], [466, 265], [460, 330], [420, 345], [432, 392], [280, 392], [245, 350]],
            [[168, 310], [240, 304], [246, 336], [168, 342]]
        ] },
        canopy: { refs: ['#2c2c27', '#7b7a76', '#4a4a45', '#1e1e1a', '#5f5e5a'], kL: 2.5, tol: 11, polys: [
            [[145, 106], [160, 86], [400, 42], [642, 70], [646, 86], [420, 116], [300, 130], [160, 126]]
        ] }
    },
    'golfer-2-2-scratch': {
        // Same camera as the 2+2 Golfer photo, so the same panel outlines (flares, roof post, sill and bumper left out)
        body: { refs: ['#1f3623'], kL: 1, tol: 999, maxL: 92,
            exclude: [[[500, 386], [566, 388], [590, 418], [572, 430], [508, 414]], [[680, 384], [706, 372], [712, 416], [698, 424], [684, 410]], [[607, 401], [663, 401], [663, 428], [607, 428]]],
            polys: [
            [[450, 325], [470, 318], [560, 312], [650, 322], [672, 334], [690, 348], [706, 362], [713, 380], [714, 400], [717, 427], [690, 435], [640, 438], [600, 440], [560, 438], [525, 428], [500, 428], [470, 426], [445, 422], [440, 400], [443, 345]],
            [[183, 377], [190, 366], [200, 360], [250, 364], [300, 389], [411, 385], [405, 467], [259, 467], [248, 439], [236, 405], [219, 388]]
        ] },
        seat: { refs: ['#656660', '#777672', '#666561', '#2a2a28', '#1c1c1a', '#9c9b96', '#4a4a46'], kL: 2, tol: 12,
            // Traced on the photo; the hip restraint bar and the roof post in front of the seat are left alone
            exclude: [[[236, 296], [252, 292], [302, 370], [302, 392], [290, 392], [236, 318]], [[398, 196], [412, 196], [446, 400], [432, 400]]],
            polys: [
            [[262, 214], [275, 207], [322, 207], [330, 222], [372, 222], [380, 210], [428, 210], [436, 226], [455, 248], [464, 275], [462, 320], [445, 342], [446, 384], [420, 386], [300, 386], [250, 362], [243, 330], [244, 262]],
            [[214, 240], [244, 228], [244, 320], [214, 316]],
            [[168, 310], [244, 304], [246, 340], [168, 344]]
        ] },
        canopy: { refs: ['#7c6850', '#baa68b', '#a18d72', '#d0bfa3', '#8f7c62'], kL: 2.5, tol: 10, polys: [
            [[145, 106], [160, 86], [400, 42], [642, 70], [646, 86], [420, 116], [300, 130], [160, 126]]
        ] }
    },
    'golfer-2-2-pro-right': {
        body: { refs: ['#8a878d', '#7d7970', '#d5d4da', '#a2a0a6', '#6f6d73', '#b8b7bd', '#5a585e', '#4a484e', '#e6e5ea', '#3e3c42', '#333137'], kL: 2.5, tol: 11, minL: 18,
            // Headlight housings and the Club Car badge, traced at 3x
            exclude: [
                [[552, 382], [600, 388], [620, 396], [634, 418], [630, 432], [575, 424], [553, 400]],
                [[708, 380], [727, 362], [733, 375], [734, 410], [722, 430], [710, 420]],
                [[651, 399], [699, 399], [699, 429], [651, 429]]
            ],
            // The dark grey refs also match the plastic flares, bumper and step, so the outlines follow the paint
            polys: [
            // Cowl, from the roof post to its right corner and down to its lower lip, above the front flare and bumper
            [[470, 330], [490, 320], [600, 316], [667, 333], [700, 345], [727, 362], [733, 380], [736, 405], [737, 430], [730, 434], [683, 441], [633, 438], [550, 433], [483, 424], [470, 410], [468, 360]],
            // Side panel: its top under the hip bar and cushion, the rear flare's edge, and the sill and step below
            [[170, 362], [200, 357], [250, 372], [320, 396], [457, 399], [452, 420], [432, 447], [355, 450], [352, 478], [252, 476], [245, 460], [232, 440], [215, 420], [195, 405], [175, 396]]
        ] },
        seat: { refs: ['#9d6b49', '#c4967e', '#b07a58', '#7c5236', '#d8a88e'], kL: 3, tol: 16, polys: [
            [[240, 252], [260, 238], [440, 238], [462, 270], [456, 345], [476, 392], [300, 396], [250, 372]],
            [[148, 314], [215, 308], [222, 340], [148, 346]]
        ] },
        // Roof top and front rim only (traced at 2x), as on the 2-seat Pro photo
        canopy: { refs: ['#61636c'], kL: 1, tol: 999, maxL: 95, polys: [
            [[205, 100], [205, 92], [240, 72], [315, 52], [390, 42], [440, 41], [540, 50], [620, 62], [645, 72], [651, 84], [647, 88], [590, 83], [490, 77], [415, 70], [340, 71], [265, 83], [212, 101]]
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
            if (spec.maxL && L > spec.maxL) continue;
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
