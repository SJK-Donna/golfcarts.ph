// ==========================================
// CART COLOR PREVIEW ENGINE
// Repaints a cart photo in the browser so the color picker can preview any body, seat and canopy color.
// Body panels are found automatically as the dominant saturated hue of the photo; seats and canopy use
// per-photo rules below. Each region keeps its original light and shadow (we shift lightness around the
// region's average instead of flattening it), so the result still looks like a glossy photo.
// ==========================================

// Per-product preview setup. `base` should be a photo whose body is a strongly colored paint (red, blue,
// green) so it separates cleanly from seats, canopy, tires and glass. `seat` / `canopy` are optional:
//   hue: [from, to] degrees, sat: [min, max], light: [min, max], box: [top, bottom] as fractions of the cart's height,
//   x: [left, right] (optional) as fractions of the photo's width. A region can also be a list of rules (any match).
// `bodyBox` (optional, default [0.18, 1]): the band of the cart's height where body paint can be. It keeps the
// roof out of the body, since a canopy with trim near the paint color would otherwise repaint with the body.
// `bodyMinSat` (optional, default 0.28): the least saturation a mid-tone pixel needs to count as body. Lower it
// only on photos whose seats are white or grey, to pick up the paint's pale reflections.
// Tempo 2-seaters share the red Base+ photo: its beige seats and canopy separate cleanly from the paint,
// so all three regions follow the picker (the dark green / black photos can't be repainted reliably).
// `seatStripes: true` marks photos showing a single bench seat, where patterned seats (Tsunami) can be
// drawn as stripes; photos with front and rear seats get the seat's solid signature colour instead.
const TEMPO_TWO_SEAT_PREVIEW = {
    base: 'image/Products/Base +.png',
    seatStripes: true,
    // Backrest from the seat top to 0.45 of the cart's height (its bottom edge is at 0.443), cushion below it
    seatZones: [0.252, 0.45, 0.7],
    // Seat: from the top of the backrests (y 0.252) down; between the hood badge (x 0.37) and the rear curtain (x 0.785)
    seat: { hue: [25, 55], sat: [0.12, 0.8], light: [0.3, 0.95], box: [0.252, 0.7], x: [0.37, 0.785] },
    // Canopy: the roof, plus the rear side curtain that hangs down beside the seat backs
    canopy: [
        { hue: [25, 55], sat: [0.08, 0.8], light: [0.3, 0.97], box: [0, 0.25] },
        { hue: [25, 55], sat: [0.08, 0.8], light: [0.3, 0.97], box: [0.25, 0.33], x: [0.79, 1] }
    ]
};

const COLOR_PREVIEW = {
    'golfer-tempo-2-2': {
        base: 'image/Products/Tempo 2+2 - Golf - Red.png',
        // Seats only right of the windshield post (x 0.45), so the gold hood badge keeps its color. The pale
        // stitched panels are low in saturation (from 0.08); the second rule takes the dark brown piping.
        seat: [
            { hue: [18, 65], sat: [0.08, 1], light: [0.12, 0.97], box: [0.25, 0.75], x: [0.45, 0.9] },
            { hue: [18, 45], sat: [0.4, 1], light: [0.02, 0.12], box: [0.25, 0.75], x: [0.45, 0.9] }
        ],
        // The seat area is boxed in above, so only colors very close to the red paint (within 12°) are kept
        // off the seat; the default 24° also kept the brown piping (hue 20-29) off it
        bodyHueGap: 12,
        // The photographed seat is two-tone (pale panels, caramel bolsters); less of its light / dark carries
        // over, so a one-color seat reads as one color
        seatContrast: 0.45,
        // Stripes run across each part of the seat on its own: front backrest, front cushion, and the
        // rear-facing seat's back and cushion (x = fraction of the photo's width, y = of the cart's height)
        seatStripes: true,
        seatBoxes: [
            { x: [0.46, 0.755], y: [0.3, 0.531] },
            { x: [0.46, 0.75], y: [0.531, 0.65] },
            { x: [0.755, 0.84], y: [0.3, 0.495] },
            { x: [0.75, 0.9], y: [0.495, 0.6] }
        ],
        canopy: { hue: [0, 360], sat: [0, 0.35], light: [0, 0.55], box: [0, 0.17] }
    },
    'golfer-tempo-2': TEMPO_TWO_SEAT_PREVIEW,
    'lifestyle-tempo-2': TEMPO_TWO_SEAT_PREVIEW,
    // White seats and a tan roof (kept out by bodyBox), so the paint's pale pink reflections can safely count as body
    'lifestyle-tempo-2-2': { base: 'image/Products/Tempo 2+2 - Family - Sangria Red.png', bodyMinSat: 0.12, bodyBox: [0.3, 1] },
    // No roof in this photo: the top of the front cowl is the highest paint, so the body can reach the top
    'transporter-400': { base: 'image/Products/Transporter 4.png', bodyBox: [0, 1] },
    'carryall-500': { base: 'image/Products/CA500.png' }
};

// The Golfer 2 / 2+2 build photos, one per build level ("<slug>:<level>"). Their paint is white, cream, grey,
// black or dark green, so instead of color rules each has a paint map (scripts/build-masks.mjs): red = body,
// green = seat, blue = canopy. These are painted with `shade` (see shadeRegion): the photo's own light and
// reflections over the chosen color, which holds up when a white cart turns black or a black one turns white.
// Parts left at the photo's own color are not repainted (see app.js updateDetailPreview).
// The Scratch and Pro photos' seats also have a tone map (`seatTones`): which parts are bolster, panel and stripe
// (see paintToneSeat). The Scratch seats are photographed striped (Tsunami, `stripedSeat`), so every choice is
// painted tone by tone. The Pro seats are one color (Camello), so one-color choices are shaded like paint and only
// a two-tone choice (Black and Gray) is painted by tone: its lighter color on the pleated panels.
const STRIPED_SEATS = ['golfer-2-scratch-right', 'golfer-2-2-scratch'];
const SEAT_TONES = [...STRIPED_SEATS, 'golfer-2-pro', 'golfer-2-2-pro-right'];
[
    ['golfer-tempo-2:golf', 'golfer-2-golfer'], ['golfer-tempo-2:scratch', 'golfer-2-scratch-right'], ['golfer-tempo-2:pro', 'golfer-2-pro'],
    ['golfer-tempo-2-2:golf', 'golfer-2-2-golfer'], ['golfer-tempo-2-2:scratch', 'golfer-2-2-scratch'], ['golfer-tempo-2-2:pro', 'golfer-2-2-pro-right']
].forEach(([key, photo]) => {
    COLOR_PREVIEW[key] = {
        base: `image/Products/builds/${photo}.jpg`, mask: `image/Products/builds/masks/${photo}.png`, shade: true,
        seatTones: SEAT_TONES.includes(photo) ? `image/Products/builds/masks/${photo}-tones.png` : null, stripedSeat: STRIPED_SEATS.includes(photo)
    };
});
// The Scratch 2+2 photo is the Golfer 2+2 cart shot from the same camera, so a one-color seat is the Golfer photo's
// real standard seat, repainted (`plainSeatFrom`), instead of the Tsunami seat with its stripes smoothed away
COLOR_PREVIEW['golfer-tempo-2-2:scratch'].plainSeatFrom = 'golfer-tempo-2-2:golf';

const recolorCache = {};

// A paint map at the size the photo is worked at. Scaling it down softens its edges, so each pixel's
// value (0-255) says how much of it belongs to the part.
function loadRecolorMask(src, w, h) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0, w, h);
            resolve(ctx.getImageData(0, 0, w, h).data);
        };
        img.onerror = reject;
        img.src = src;
    });
}

// A region from one channel of a paint map (0 body, 1 seat, 2 canopy), in the shape collectRegion returns,
// plus each pixel's weight and the region's typical (median) linear brightness
function maskRegion(base, mask, channel) {
    const idx = [];
    const weight = [];
    const xs = [];
    for (let i = 0; i < base.w * base.h; i++) {
        const m = mask[i * 4 + channel];
        if (m > 8) {
            idx.push(i);
            weight.push(m / 255);
            xs.push(i % base.w);
        }
    }
    if (!idx.length) return null;
    const [minX, maxX] = percentileSpan(xs, base.w);
    const ls = idx.map(i => base.light[i]).sort((p, q) => p - q);
    const px = base.imageData.data;
    const ys = idx.filter((_, k) => weight[k] > 0.5).map(i => linearLuma(px[i * 4], px[i * 4 + 1], px[i * 4 + 2])).sort((p, q) => p - q);
    return { idx, weight, meanL: ls[Math.floor(ls.length / 2)], midL: ls[Math.floor(ls.length / 2)], refY: ys[Math.floor(ys.length / 2)] || 0.5, topY: ys[Math.floor(ys.length * 0.8)] || 0.5, minX, maxX };
}

const toLinear = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const toSrgb = c => 255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

function linearLuma(r, g, b) {
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// Paints a region of a build photo with a color, the way light falls on it: each pixel's brightness against
// the part's typical brightness shades the color (shadows darken it), and whatever is brighter than typical
// (gloss, sky reflections) is added on top as light. Works in linear light, so a white panel painted black
// reads as glossy black paint, not grey, and a black panel painted white keeps its reflections.
// On a dark photo (black or deep green paint) the light is almost all sharp reflections, which would turn a
// light color into chrome; there a light color takes its shading from the panel's broad light instead
// (`form`, the brightness averaged over the part), with only a trace of the reflections.
// `target` is an [h, s, l] color, or a list of them blended across the region (multi-tone paints).
// `top` (roofs): the color is matched on the part's lit side (its 80th-percentile brightness) instead of its
// typical pixel. A roof is half shadowed underside, so matching the typical pixel lifted the whole top surface
// above the swatch: a beige roof came out cream, a white one blown out and a black one light grey.
function shadeRegion(out, base, region, target, gradient, top) {
    const px = base.imageData.data;
    const toRgb = hsl => hslToRgb(...hsl).map(toLinear);
    const solid = toRgb(target);
    const stops = gradient && gradient.map(toRgb);
    const dark = Math.max(0, Math.min(1, (0.12 - region.refY) / 0.06));
    const refY = top ? Math.max(region.refY, region.topY) : region.refY;
    const form = dark ? regionForm(base, region) : null;
    // A black roof photographs as dark slate, not black: its matte top catches the sky (the real black roofs in the
    // build photos measure L* 37-65). So on a roof a near-black color is lifted toward a cool dark grey.
    const sky = top ? Math.max(0, Math.min(1, (0.1 - (0.2126 * solid[0] + 0.7152 * solid[1] + 0.0722 * solid[2])) / 0.08)) : 0;
    region.idx.forEach((i, k) => {
        let t = solid;
        if (sky) t = t.map((v, c) => v + ([0.085, 0.09, 0.105][c] - v) * sky);
        if (stops) {
            const pos = Math.min(stops.length - 1.001, ((i % base.w) / base.w) * (stops.length - 1));
            const a = stops[Math.floor(pos)], b = stops[Math.floor(pos) + 1], f = pos - Math.floor(pos);
            t = a.map((v, c) => v + (b[c] - v) * f);
        }
        const tY = 0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2];
        const Y = linearLuma(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
        const shade = Math.min(1, Y / refY);
        // Reflections show more strongly on dark paint
        const gloss = Math.max(0, Y - refY) * (0.6 + 0.4 * (1 - tY));
        let rgb = t.map(v => v * shade + gloss);
        // The lighter the color, the more it follows the panel's broad light on a dark photo
        const light = dark * Math.max(0, Math.min(1, (tY - 0.05) / 0.5));
        if (light) {
            const B = form.blur[k];
            // Fine detail is weak: on near-black paint it is mostly JPEG noise, which showed as blocks on a white cart
            // Deep shadow is floored at 75% of the color's lightness: faces in near-black shadow on a dark photo (the
            // roof's side ends) otherwise turned a light roof charcoal, which read as unpainted
            const lum = Math.max(Math.cbrt(tY) * 0.75, Math.min(1, Math.cbrt(tY) + (Math.cbrt(B) - Math.cbrt(top ? form.top : form.ref)) * 0.7 + (Math.cbrt(Y) - Math.cbrt(B)) * 0.1)) ** 3;
            const shine = Math.max(0, Y - Math.max(B, refY) * 1.5) * 0.35;
            rgb = rgb.map((v, c) => v + (t[c] * lum / Math.max(tY, 1e-4) + shine - v) * light);
        }
        const w = region.weight[k];
        for (let c = 0; c < 3; c++) {
            const painted = toSrgb(Math.min(1, rgb[c]));
            out[i * 4 + c] = px[i * 4 + c] + (painted - px[i * 4 + c]) * w;
        }
    });
}

// A one-color seat taken from another photo of the same cart from the same camera (`donor`, its preview key):
// everywhere either photo has seat, the donor photo's pixels go in (its seat and what is behind it), apart from
// this photo's body and roof; then the donor's seat is repainted the way its own preview paints it.
async function paintDonorSeat(out, regions, donor, target) {
    const dcfg = COLOR_PREVIEW[donor];
    const dbase = await loadRecolorBase(dcfg.base);
    const dseat = (await loadMaskRegions(donor, dcfg, dbase)).seat;
    const dpx = dbase.imageData.data;
    const n = dbase.w * dbase.h;
    const share = new Float32Array(n), keep = new Float32Array(n);
    // This photo's seat is replaced whole, with a 2 px margin, so no outline of it (the Tsunami headrests) shows
    const w = dbase.w;
    regions.seat.idx.forEach(i => {
        const x = i % w;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
            const j = i + dy * w + dx;
            if (x + dx >= 0 && x + dx < w && j >= 0 && j < n) share[j] = Math.max(share[j], 1 - Math.max(Math.abs(dx), Math.abs(dy)) / 3);
        }
    });
    dseat.idx.forEach((i, k) => { share[i] = Math.max(share[i], dseat.weight[k]); });
    [regions.body, regions.canopy].forEach(r => r && r.idx.forEach((i, k) => { keep[i] = Math.max(keep[i], r.weight[k]); }));
    for (let i = 0; i < n; i++) {
        const m = share[i] * (1 - keep[i]);
        if (m <= 0) continue;
        for (let c = 0; c < 3; c++) out[i * 4 + c] += (dpx[i * 4 + c] - out[i * 4 + c]) * m;
    }
    shadeRegion(out, dbase, dseat, target, null);
    blendRegionEdges(out, dbase, dseat, true);
}

// A part's outline in the photo is a blend of the part and what's behind it, and shading that blend as if it
// were all part left the old color in it (a grey line round a white roof that was black, a caramel hairline round
// a repainted seat). So each soft-edged pixel takes the color change of the nearest pixel fully inside the part,
// as much as it is part: the background's share stays as photographed.
// `strays` (seats): pixels just outside the part that are still the seat's own color (a sliver beside a roof post or
// the hip restraint bar, between the front and rear seats) are recolored with it the same way.
function blendRegionEdges(out, base, region, strays, reach = 10) {
    const { w, h } = base;
    const px = base.imageData.data;
    if (strays && !region.strayFrom) region.strayFrom = seatStrays(base, region, reach);
    // A stray takes its seat pixel's new color at its own brightness (adding the change instead turned dark
    // strays blue on a white seat)
    if (strays) region.strayFrom.forEach((j, i) => {
        const r = Math.min(1.5, linearLuma(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]) / Math.max(1e-4, linearLuma(px[j * 4], px[j * 4 + 1], px[j * 4 + 2])));
        for (let c = 0; c < 3; c++) out[i * 4 + c] = toSrgb(Math.min(1, toLinear(out[j * 4 + c]) * r));
    });
    if (!region.edgeFrom) {
        const inside = new Uint8Array(w * h);
        region.idx.forEach((i, k) => { if (region.weight[k] >= 0.95) inside[i] = 1; });
        region.edgeFrom = new Map();
        region.idx.forEach((i, k) => {
            if (region.weight[k] >= 0.95) return;
            const x = i % w, y = Math.floor(i / w);
            let best = -1, bestD = Infinity;
            for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
                const xx = x + dx, yy = y + dy, d = dx * dx + dy * dy;
                if (xx < 0 || yy < 0 || xx >= w || yy >= h || d >= bestD || !inside[yy * w + xx]) continue;
                best = yy * w + xx; bestD = d;
            }
            if (best >= 0) region.edgeFrom.set(i, best);
        });
    }
    region.idx.forEach((i, k) => {
        const j = region.edgeFrom.get(i);
        if (j === undefined) return;
        const m = region.weight[k];
        for (let c = 0; c < 3; c++) out[i * 4 + c] = px[i * 4 + c] + (out[j * 4 + c] - px[j * 4 + c]) * m;
    });
}

// Pixels within `reach` px outside a part that are its own color (for seats 10 px, so the seat seen through the hip
// restraint bar counts too; roofs 3 px, the rim only, so a rain curtain of the same color below stays as it is) (close to the seat's typical color in the photo, and
// colored, so the black frame and grey trim never count), each with the nearest pixel fully inside the seat
function seatStrays(base, region, reach) {
    const { w, h } = base;
    const px = base.imageData.data;
    const inside = new Uint8Array(w * h), inRegion = new Uint8Array(w * h);
    const hs = [];
    region.idx.forEach((i, k) => { inRegion[i] = 1; if (region.weight[k] >= 0.95) { inside[i] = 1; hs.push(i); } });
    const mid = hs.map(i => rgbToHsl(px[i * 4], px[i * 4 + 1], px[i * 4 + 2])).sort((p, q) => p[2] - q[2])[hs.length >> 1];
    const strays = new Map();
    if (!mid || mid[1] < 0.2) return strays;
    region.idx.forEach(i => {
        if (!inside[i]) return;
        const x = i % w, y = Math.floor(i / w);
        for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++) {
            const xx = x + dx, yy = y + dy, j = yy * w + xx;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h || inRegion[j] || strays.has(j)) continue;
            const [hh, ss, ll] = rgbToHsl(px[j * 4], px[j * 4 + 1], px[j * 4 + 2]);
            if (ss >= 0.12 && ll > 0.05 && ll < 0.9 && hueDistance(hh, mid[0]) <= 22) strays.set(j, i);
        }
    });
    return strays;
}

// A region's broad light: each pixel's linear brightness averaged over the part within 12 px (pixels outside
// the part don't count, so black trim doesn't darken the panel's edges), and the typical (median) value of it.
// Box sums come from summed-area tables, so this is one pass however wide the box is.
function regionForm(base, region) {
    if (region.form) return region.form;
    const { w, h } = base;
    const px = base.imageData.data;
    const W1 = w + 1;
    const SY = new Float64Array(W1 * (h + 1)), SW = new Float64Array(W1 * (h + 1));
    const weight = new Float32Array(w * h);
    region.idx.forEach((i, k) => { weight[i] = region.weight[k]; });
    for (let y = 0; y < h; y++) {
        let ry = 0, rw = 0;
        for (let x = 0; x < w; x++) {
            const i = y * w + x;
            const m = weight[i];
            if (m) { ry += m * linearLuma(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]); rw += m; }
            SY[(y + 1) * W1 + x + 1] = SY[y * W1 + x + 1] + ry;
            SW[(y + 1) * W1 + x + 1] = SW[y * W1 + x + 1] + rw;
        }
    }
    const r = 12;
    const blur = region.idx.map(i => {
        const x = i % w, y = Math.floor(i / w);
        const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1), y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
        const box = A => A[y1 * W1 + x1] - A[y0 * W1 + x1] - A[y1 * W1 + x0] + A[y0 * W1 + x0];
        return box(SY) / Math.max(1e-6, box(SW));
    });
    const sorted = blur.filter((_, k) => region.weight[k] > 0.5).sort((p, q) => p - q);
    region.form = { blur, ref: sorted[Math.floor(sorted.length / 2)] || region.refY, top: sorted[Math.floor(sorted.length * 0.8)] || region.refY };
    return region.form;
}


function loadRecolorBase(src) {
    if (recolorCache[src]) return recolorCache[src];
    recolorCache[src] = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            // Work at a moderate size so repainting stays instant
            const scale = Math.min(1, 900 / Math.max(img.width, img.height));
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0, w, h);
            const data = ctx.getImageData(0, 0, w, h);
            resolve(analyzeRecolorBase(data, w, h));
        };
        img.onerror = reject;
        img.src = src;
    });
    return recolorCache[src];
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [h * 60, s, l];
}

function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    if (s === 0) {
        const v = Math.round(l * 255);
        return [v, v, v];
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const f = t => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
}

function hexToHsl(hex) {
    const m = hex.replace('#', '');
    return rgbToHsl(parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16));
}

function hueDistance(a, b) {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
}

function hueInRange(h, [from, to]) {
    return from <= to ? h >= from && h <= to : h >= from || h <= to;
}

// Precomputes HSL per pixel, the cart's bounding box, and the dominant body hue
function analyzeRecolorBase(imageData, w, h) {
    const px = imageData.data;
    const n = w * h;
    const hue = new Float32Array(n);
    const sat = new Float32Array(n);
    const light = new Float32Array(n);
    let top = h, bottom = 0;
    const hist = new Float32Array(36);

    for (let i = 0; i < n; i++) {
        const a = px[i * 4 + 3];
        const [hh, ss, ll] = rgbToHsl(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
        hue[i] = hh; sat[i] = ss; light[i] = ll;
        if (a > 20) {
            const y = Math.floor(i / w);
            if (y < top) top = y;
            if (y > bottom) bottom = y;
            if (ss > 0.35 && ll > 0.12 && ll < 0.85) hist[Math.floor(hh / 10) % 36] += ss;
        }
    }

    // Dominant saturated hue = the body paint (smoothed over neighbouring 10° bins)
    let best = 0, bestScore = -1;
    for (let b = 0; b < 36; b++) {
        const score = hist[(b + 35) % 36] + hist[b] + hist[(b + 1) % 36];
        if (score > bestScore) { bestScore = score; best = b; }
    }

    return { imageData, w, h, hue, sat, light, top, bottom, bodyHue: best * 10 + 5 };
}

// Builds a mask for one region and returns its pixel indexes, typical (median) lightness and horizontal extent
function collectRegion(base, test) {
    const idx = [];
    let sumL = 0;
    const xs = [];
    const alpha = base.imageData.data;
    const height = Math.max(1, base.bottom - base.top);
    for (let i = 0; i < base.w * base.h; i++) {
        if (alpha[i * 4 + 3] < 20) continue;
        const x = i % base.w;
        const yFrac = (Math.floor(i / base.w) - base.top) / height;
        if (test(base.hue[i], base.sat[i], base.light[i], yFrac, x / base.w)) {
            idx.push(i);
            sumL += base.light[i];
            xs.push(x);
        }
    }
    const [minX, maxX] = percentileSpan(xs, base.w);
    // The median, not the mean: glossy highlights skew the mean upward, which made repaints come out darker
    // than the swatch on most of the panel
    const ls = idx.map(i => base.light[i]).sort((p, q) => p - q);
    const midL = ls.length ? ls[Math.floor(ls.length / 2)] : 0.5;
    return { idx, meanL: idx.length ? sumL / idx.length : 0.5, midL, minX, maxX };
}

// Horizontal span from the 3rd to 97th percentile, so a few stray matching pixels elsewhere on the cart
// (e.g. on the dashboard) don't stretch the measured width
function percentileSpan(xs, fallbackW) {
    if (!xs.length) return [0, fallbackW];
    xs.sort((p, q) => p - q);
    return [xs[Math.floor(xs.length * 0.03)], xs[Math.floor(xs.length * 0.97)]];
}

// Splits a seat region into horizontal zones (e.g. backrest and cushion) at the given fractions of the
// cart's height, each with its own fixed width, so stripes run straight down each part of the seat
function seatZones(base, region, cuts) {
    const height = Math.max(1, base.bottom - base.top);
    const zones = [];
    for (let k = 0; k < cuts.length - 1; k++) {
        const y0 = base.top + cuts[k] * height, y1 = base.top + cuts[k + 1] * height;
        const xs = region.idx.filter(i => { const y = Math.floor(i / base.w); return y >= y0 && y < y1; }).map(i => i % base.w);
        const [minX, maxX] = percentileSpan(xs, base.w);
        zones.push({ y0, y1, minX, maxX });
    }
    return zones;
}

// Seat parts given as boxes ({ x: [from, to] of the photo's width, y: [from, to] of the cart's height}), for
// photos with more than one seat; each box gets the measured width of the seat pixels inside it
function seatBoxZones(base, region, boxes) {
    const height = Math.max(1, base.bottom - base.top);
    return boxes.map(b => {
        const y0 = base.top + b.y[0] * height, y1 = base.top + b.y[1] * height;
        const x0 = b.x[0] * base.w, x1 = b.x[1] * base.w;
        const xs = region.idx.filter(i => {
            const x = i % base.w, y = Math.floor(i / base.w);
            return y >= y0 && y < y1 && x >= x0 && x < x1;
        }).map(i => i % base.w);
        const [minX, maxX] = percentileSpan(xs, base.w);
        return { y0, y1, x0, x1, minX, maxX };
    });
}

// A region rule, or a list of rules where any one matching is enough
function regionRule(rule) {
    if (Array.isArray(rule)) {
        const tests = rule.map(regionRule);
        return (hh, ss, ll, y, x) => tests.some(t => t(hh, ss, ll, y, x));
    }
    return (hh, ss, ll, y, x) =>
        hueInRange(hh, rule.hue) && ss >= rule.sat[0] && ss <= rule.sat[1] &&
        ll >= rule.light[0] && ll <= rule.light[1] && y >= rule.box[0] && y <= rule.box[1] &&
        (!rule.x || (x >= rule.x[0] && x <= rule.x[1]));
}

// Paints one region toward a target color, keeping the photo's shading.
// `bands` (optional) paints hard vertical stripes across the region instead, for patterned seats such as
// the Tsunami: [{ hsl, to }] where `to` is where the stripe ends, as a fraction of the region's width.
function paintRegion(out, base, region, target, xGradient, bands, contrast = 0.85) {
    for (const i of region.idx) {
        let th = target[0], ts = target[1], tl = target[2];
        if (bands) {
            // Stripes run across the seat zone (backrest or cushion) this pixel belongs to
            const y = Math.floor(i / base.w), x = i % base.w;
            const zone = region.zones
                ? region.zones.find(z => y >= z.y0 && y < z.y1 && (z.x0 === undefined || (x >= z.x0 && x < z.x1)))
                : region;
            // Seat pixels outside every seat-part box (small trim pieces) take the seat's signature color
            if (zone) {
                const xf = (x - zone.minX) / Math.max(1, zone.maxX - zone.minX);
                // Edge pixels just past the measured width take the outer stripe; far-off specks are left alone
                if (xf < -0.15 || xf > 1.15) continue;
                const band = bands.find(b => Math.max(0, xf) <= b.to) || bands[bands.length - 1];
                [th, ts, tl] = band.hsl;
            }
        } else if (xGradient) {
            // Multi-tone paints (chameleon, 3D) shift color across the body
            const x = (i % base.w) / base.w;
            const stops = xGradient;
            const pos = Math.min(stops.length - 1.001, x * (stops.length - 1));
            const a = stops[Math.floor(pos)], b = stops[Math.floor(pos) + 1], t = pos - Math.floor(pos);
            // Blend in RGB: blending hues would pass through unrelated colors between a near-neutral stop and a
            // colored one (black to red went through purple, silver to beige through pink)
            const ra = hslToRgb(a[0], a[1], a[2]), rb = hslToRgb(b[0], b[1], b[2]);
            [th, ts, tl] = rgbToHsl(...ra.map((v, k) => v + (rb[k] - v) * t));
        }
        const l = Math.max(0.02, Math.min(0.98, tl + (base.light[i] - region.midL) * contrast));
        // Keep the swatch's colorfulness (chroma) through the shading. A fixed HSL saturation would grey out
        // every pixel lighter or darker than the swatch, so the panel read duller than the chosen color.
        const chroma = ts * (1 - Math.abs(2 * tl - 1));
        const s = Math.min(1, chroma / Math.max(0.001, 1 - Math.abs(2 * l - 1)));
        const [r, g, b] = hslToRgb(th, s, l);
        out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b;
    }
}

// Seats photographed striped (the Tsunami seats in the Scratch build photos: black bolsters, grey panels,
// silver stripes). A tone map made with the paint map (scripts/build-masks.mjs) says how much of each pixel is
// bolster, panel or stripe. A patterned choice paints each tone with the pattern's matching color (darkest,
// middle, lightest), so Tsunami Red keeps its black and silver and only the panels turn red. A one-color seat
// paints every tone the same color, so the stripes disappear.
// Each tone is shaded like paint (see shadeRegion): a pixel's linear brightness against its own tone's typical
// brightness shades the color, so folds and shadows carry over but the stripes' light and dark don't.
// Judging tones pixel by pixel from lightness instead turned whole black panels red, and shifting HSL
// lightness turned white and grey seats flat and washed out.
// A striped seat's light with the stripes taken out, for painting it one color. The stripes differ in sheen, so
// the seat's broad form comes from each pixel's brightness over its tones' typical brightness, averaged within
// 14 px and softened. On top go the photo's shadows (creases, the gaps between headrests, backrest and cushion),
// judged against nearby pixels of the same stripe so the stripes themselves cancel out, and faded out over the
// 3 px next to a stripe edge, since the traced edges sit a pixel or two off the real ones and outlined them.
function toneFreeLight(base, region) {
    if (region.toneFree) return region.toneFree;
    const { w, h } = base;
    const px = base.imageData.data;
    const W1 = w + 1;
    // Summed-area tables: the tone-free ratio over the seat, and brightness and count per tone
    const tables = () => [new Float64Array(W1 * (h + 1)), new Float64Array(W1 * (h + 1))];
    const all = tables(), per = [tables(), tables(), tables()];
    const ratio = new Float32Array(w * h), Y = new Float32Array(w * h), tone = new Int8Array(w * h).fill(-1);
    region.idx.forEach((i, k) => {
        const t = region.tones[k];
        const ref = t.reduce((sum, wt, n) => sum + wt * region.toneY[n], 0);
        Y[i] = linearLuma(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
        ratio[i] = Math.max(0.1, Math.min(4, Y[i] / ref));
        tone[i] = t[0] >= t[1] && t[0] >= t[2] ? 0 : t[1] >= t[2] ? 1 : 2;
    });
    const fill = ([S, N], value, on) => {
        for (let y = 0; y < h; y++) {
            let rs = 0, rn = 0;
            for (let x = 0; x < w; x++) {
                const i = y * w + x;
                if (on(i)) { rs += value[i]; rn++; }
                S[(y + 1) * W1 + x + 1] = S[y * W1 + x + 1] + rs;
                N[(y + 1) * W1 + x + 1] = N[y * W1 + x + 1] + rn;
            }
        }
    };
    fill(all, ratio, i => tone[i] >= 0);
    per.forEach((tbl, t) => fill(tbl, Y, i => tone[i] === t));
    const mean = ([S, N], x, y, r) => {
        const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1), y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
        const box = A => A[y1 * W1 + x1] - A[y0 * W1 + x1] - A[y1 * W1 + x0] + A[y0 * W1 + x0];
        return box(S) / Math.max(1, box(N));
    };
    // Distance in px (up to 3) to a pixel of another tone
    const edgeDist = (i, x, y) => {
        for (let d = 1; d <= 3; d++) {
            for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== d || x + dx < 0 || x + dx >= w || y + dy < 0 || y + dy >= h) continue;
                const j = (y + dy) * w + x + dx;
                if (tone[j] >= 0 && tone[j] !== tone[i]) return d - 1;
            }
        }
        return 3;
    };
    const light = new Float32Array(w * h);
    region.idx.forEach(i => {
        const x = i % w, y = Math.floor(i / w);
        const broad = Math.max(0.6, Math.min(1.15, mean(all, x, y, 14))) ** 0.6;
        const shadow = Math.max(0.55, Math.min(1.04, Y[i] / Math.max(1e-4, mean(per[tone[i]], x, y, 8))));
        light[i] = broad * shadow ** (edgeDist(i, x, y) / 3);
    });
    // Smoothed within 2 px, so the result reads as soft vinyl rather than patches
    const smooth = tables();
    fill(smooth, light, i => tone[i] >= 0);
    region.toneFree = region.idx.map(i => mean(smooth, i % w, Math.floor(i / w), 2));
    return region.toneFree;
}

function paintToneSeat(out, base, region, target, bands) {
    const px = base.imageData.data;
    if (!region.toneY) {
        region.toneY = [0, 1, 2].map(t => {
            const ys = region.idx.filter((_, k) => region.tones[k][t] > 0.8)
                .map(i => linearLuma(px[i * 4], px[i * 4 + 1], px[i * 4 + 2])).sort((p, q) => p - q);
            return ys.length ? ys[Math.floor(ys.length / 2)] : 0.1;
        });
    }
    // The pattern's colors from darkest to lightest; a two-color pattern paints panel and light alike
    let palette = [target, target, target];
    const patterned = bands && bands.length;
    if (patterned) {
        const cols = [...new Set(bands.map(b => b.hex))].map(hexToHsl).sort((p, q) => p[2] - q[2]);
        palette = cols.length >= 3 ? [cols[0], cols[1], cols[cols.length - 1]] : [cols[0], cols[cols.length - 1], cols[cols.length - 1]];
    }
    const colors = palette.map(hsl => {
        const rgb = hslToRgb(...hsl).map(toLinear);
        return { rgb, Y: 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] };
    });
    region.idx.forEach((i, k) => {
        // Studio white caught at the seat's outline is background, not seat
        if (base.light[i] > 0.92 && base.sat[i] < 0.12) return;
        const Y = linearLuma(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
        let rgb = [0, 0, 0];
        if (!patterned) {
            // One color: the standard seats are matte vinyl (see image/Seats/standard-*.jpg), whose light varies only a
            // few percent across the seat, with no shine. So the seat's light with the stripes taken out (see
            // toneFreeLight) keeps its shadows, softened, and only a trace of anything brighter
            const r = toneFreeLight(base, region)[k];
            const shade = r < 1 ? r ** 0.6 : 1 + (Math.min(r, 1.3) - 1) * 0.12;
            rgb = colors[1].rgb.map(v => v * shade);
        } else region.tones[k].forEach((w, t) => {
            if (!w) return;
            const ref = region.toneY[t];
            const shade = Math.min(1.15, Y / ref);
            // Light beyond the tone's typical brightness is sheen on the vinyl, added on top as light
            const gloss = Math.max(0, Y - ref) * 0.5 * (1 - colors[t].Y);
            colors[t].rgb.forEach((v, c) => { rgb[c] += w * (v * shade + gloss); });
        });
        // Soft mask edges blend into the photo instead of ending in a hard, stepped outline
        const m = region.weight[k];
        for (let c = 0; c < 3; c++) out[i * 4 + c] += (toSrgb(Math.min(1, rgb[c])) - out[i * 4 + c]) * m;
    });
}

// Swatch value -> { hsl } or { gradient: [hsl, ...] } (gradients come from the custom-paint swatches)
function parseSwatch(value) {
    if (!value) return null;
    if (value.startsWith('linear-gradient')) {
        const stops = (value.match(/#[0-9a-fA-F]{6}/g) || []).map(hexToHsl);
        return stops.length ? { hsl: stops[0], gradient: stops } : null;
    }
    return { hsl: hexToHsl(value) };
}

const recolorRegionCache = {};

// A build photo's body, seat and canopy from its paint map (and the seat's tone map), once per photo
async function loadMaskRegions(slug, cfg, base) {
    if (recolorRegionCache[slug]) return recolorRegionCache[slug];
    const mask = await loadRecolorMask(cfg.mask, base.w, base.h);
    recolorRegionCache[slug] = { body: maskRegion(base, mask, 0), seat: maskRegion(base, mask, 1), canopy: maskRegion(base, mask, 2) };
    const seat = recolorRegionCache[slug].seat;
    if (seat && cfg.seatTones) {
        // Each seat pixel's share of bolster, panel and stripe (the map's red, green and blue)
        const tones = await loadRecolorMask(cfg.seatTones, base.w, base.h);
        seat.tones = seat.idx.map(i => {
            const sum = tones[i * 4] + tones[i * 4 + 1] + tones[i * 4 + 2];
            return sum ? [0, 1, 2].map(c => tones[i * 4 + c] / sum) : [0, 1, 0];
        });
    }
    return recolorRegionCache[slug];
}

// Returns a data URL of the cart repainted with the given body / seat / canopy swatch values.
// `choice.seatBands` (optional) paints the seat as vertical stripes instead of one colour.
async function renderCartPreview(slug, choice) {
    const cfg = COLOR_PREVIEW[slug];
    if (!cfg) return null;
    const base = await loadRecolorBase(cfg.base);

    if (cfg.mask) await loadMaskRegions(slug, cfg, base);
    if (!recolorRegionCache[slug]) {
        const bodyHue = base.bodyHue;
        // Body = pixels close to the dominant paint hue. A wider band would swallow tan seats on red carts.
        // Deep shadows on the paint are dull, so dark pixels count as body at lower saturation; neutral blacks
        // (frame, tires, saturation under 0.1) are still left alone.
        const bodyBox = cfg.bodyBox || [0.18, 1];
        const isBody = (hh, ss, ll, y) => y >= bodyBox[0] && y <= bodyBox[1] &&
            hueDistance(hh, bodyHue) <= 22 && ll >= 0.02 && ll <= 0.9 &&
            (ss >= (cfg.bodyMinSat || 0.28) || (ss >= 0.1 && ll < 0.3));
        // Seats / canopy never claim pixels near the paint hue (the paint's brownish shadows otherwise
        // pick up the seat color and show as specks on the panels)
        const notBody = rule => {
            const test = regionRule(rule);
            return (hh, ss, ll, y, x) => test(hh, ss, ll, y, x) && !(ss >= 0.2 && hueDistance(hh, bodyHue) <= (cfg.bodyHueGap || 24));
        };
        const seat = cfg.seat ? collectRegion(base, notBody(cfg.seat)) : null;
        if (seat && cfg.seatZones) seat.zones = seatZones(base, seat, cfg.seatZones);
        if (seat && cfg.seatBoxes) seat.zones = seatBoxZones(base, seat, cfg.seatBoxes);
        recolorRegionCache[slug] = {
            body: collectRegion(base, isBody),
            seat,
            canopy: cfg.canopy ? collectRegion(base, notBody(cfg.canopy)) : null
        };
    }
    const regions = recolorRegionCache[slug];

    const out = new Uint8ClampedArray(base.imageData.data);
    // Canopy and seats first so the body (the most important region) wins any overlap
    const canopy = parseSwatch(choice.canopy);
    const gradient = swatch => swatch.gradient && swatch.gradient.length > 1 ? swatch.gradient : null;
    if (canopy && regions.canopy) {
        if (cfg.shade) shadeRegion(out, base, regions.canopy, canopy.hsl, null, true);
        else paintRegion(out, base, regions.canopy, canopy.hsl, null);
        if (cfg.mask) blendRegionEdges(out, base, regions.canopy, true, 3);
    }
    const seat = parseSwatch(choice.seat);
    const seatBands = choice.seatBands && cfg.seatStripes
        ? choice.seatBands.map(b => ({ hsl: hexToHsl(b.hex), to: b.to }))
        : null;
    if (seat && regions.seat) {
        // Seats photographed striped (Scratch) are painted tone by tone, so a one-color seat loses the photo's
        // stripes; shading them like paint kept the black-and-grey Tsunami stripes under every color
        const patterned = choice.seatBands && choice.seatBands.length;
        if (cfg.plainSeatFrom && !patterned) await paintDonorSeat(out, regions, cfg.plainSeatFrom, seat.hsl);
        else if (cfg.seatTones && (cfg.stripedSeat || patterned)) paintToneSeat(out, base, regions.seat, seat.hsl, choice.seatBands);
        else if (cfg.shade) shadeRegion(out, base, regions.seat, seat.hsl, null);
        else paintRegion(out, base, regions.seat, seat.hsl, null, seatBands, cfg.seatContrast);
        if (cfg.mask && !(cfg.plainSeatFrom && !patterned)) blendRegionEdges(out, base, regions.seat, true);
    }
    const body = parseSwatch(choice.body);
    if (body && regions.body) {
        if (cfg.shade) shadeRegion(out, base, regions.body, body.hsl, gradient(body));
        else paintRegion(out, base, regions.body, body.hsl, gradient(body));
        if (cfg.mask) blendRegionEdges(out, base, regions.body);
    }

    const canvas = document.createElement('canvas');
    canvas.width = base.w;
    canvas.height = base.h;
    canvas.getContext('2d').putImageData(new ImageData(out, base.w, base.h), 0, 0);
    return canvas.toDataURL('image/png');
}
