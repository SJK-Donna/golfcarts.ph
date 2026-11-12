// Cuts each cart photo a quotation can show out of its white studio background, for the quotation PDF's page 3, where
// the admin stands the customer's cart on the golf course of image/pdf/page3-bg.jpg (account.js, drawQuotationPage3).
// Saves image/pdf/cart/<photo>.webp: the cart, with the studio's grey floor shadow kept as a soft see-through shadow.
//
// Run again after adding or changing a cart photo:  npm start  (in another terminal), then
//   node scripts/pdf-carts.mjs
// It reads the list of photos from the running site (as account.js quotationPhoto picks them). Uses Chrome and sharp.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = process.argv[2] || 'http://localhost:8765/';
const out = path.join(root, 'image', 'pdf', 'cart');
const chromePath = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9354;

// The name account.js asks for: the path without "image/" and its extension, as a slug
export const cartSlug = photo => String(photo).replace(/^\/?image\//i, '').replace(/\.[a-z0-9]+$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// The photos, from the running site
async function photoList() {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const profile = path.join(process.env.TEMP || '/tmp', 'pdf-carts-' + process.pid);
    const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank']);
    try {
        let target;
        for (let i = 0; i < 50 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {} }
        if (!target) throw new Error('Chrome did not start');
        const ws = new WebSocket(target.webSocketDebuggerUrl);
        await new Promise(r => { ws.onopen = r; });
        let id = 0;
        const pending = {};
        ws.onmessage = m => { const d = JSON.parse(m.data); if (pending[d.id]) { pending[d.id](d); delete pending[d.id]; } };
        const send = (method, params = {}) => new Promise(r => { pending[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
        await send('Page.navigate', { url: site });
        await sleep(3500);
        const r = await send('Runtime.evaluate', { returnByValue: true, expression:
            `[...new Set(PRODUCTS_DATA.filter(p => p.category !== 'Accessories').flatMap(p => [p.image, ...Object.values(p.buildPhotos || {})]).filter(Boolean).map(p => String(p).replace(/\\.webp$/i, '')))]` });
        ws.close();
        const list = r.result.result.value;
        if (!list || !list.length) throw new Error(`No products found at ${site}: is "npm start" running?`);
        return list;
    } finally {
        chrome.kill();
        await sleep(300);
        try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
    }
}

// The cut. The studio is pure white: reached from the photo's edges through pure white (so a white cart's body, which
// is shaded, stays), plus large pure-white patches inside (the studio seen through a windshield). Then its floor
// shadow under the cart becomes a soft dark shadow, and the outline's light fringe fades out instead of a white halo
async function cutOut(file) {
    // A photo that's already cut out (a PNG with see-through pixels) is kept as it is
    const meta = await sharp(file).metadata();
    if (meta.hasAlpha && (await sharp(file).stats()).channels[3].min < 250) {
        return sharp(file).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 }).resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 86, alphaQuality: 90 });
    }
    const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = info, n = w * h;
    // The site's colour-preview mask of this photo (body, seats, canopy), if it has one: those parts are never studio,
    // so a white cart's white panels stay
    const keep = new Uint8Array(n);
    let bodyTop = 0; // the row where the masked body panels start (0: no mask)
    const maskFile = path.join(path.dirname(file), 'masks', path.basename(file).replace(/.[a-z0-9]+$/i, '.png'));
    if (fs.existsSync(maskFile)) {
        const m = await sharp(maskFile).removeAlpha().resize(w, h, { fit: 'fill' }).raw().toBuffer();
        for (let i = 0; i < n; i++) if (m[i * 3] + m[i * 3 + 1] + m[i * 3 + 2] > 60) keep[i] = 1;
        // the top of the body panels (the mask's red): above it are the windshield and steering wheel
        for (let i = 0; i < n; i++) if (m[i * 3] > 150 && m[i * 3 + 1] < 100 && m[i * 3 + 2] < 100) { bodyTop = Math.floor(i / w); break; }
    }
    const lo = new Uint8Array(n), sat = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
        const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
        lo[i] = Math.min(r, g, b);
        sat[i] = Math.max(r, g, b) - lo[i];
    }
    const kind = new Uint8Array(n); // 1 studio, 2 floor shadow
    const flood = (seeds, ok, mark) => {
        const queue = seeds.filter(i => !kind[i] && ok(i));
        queue.forEach(i => { kind[i] = mark; });
        for (let q = 0; q < queue.length; q++) {
            const i = queue[q], x = i % w;
            for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
                if (j >= 0 && j < n && !kind[j] && ok(j)) { kind[j] = mark; queue.push(j); }
            }
        }
        return queue;
    };
    const white = i => !keep[i] && lo[i] >= 246 && sat[i] <= 10;
    const edges = [];
    for (let x = 0; x < w; x++) edges.push(x, (h - 1) * w + x);
    for (let y = 0; y < h; y++) edges.push(y * w, y * w + w - 1);
    flood(edges, white, 1);
    // Large pure-white patches inside (seen through glass)
    const pure = i => !keep[i] && lo[i] >= 252 && sat[i] <= 6;
    const seen = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
        if (kind[i] || seen[i] || !pure(i)) continue;
        const blob = [i];
        seen[i] = 1;
        for (let q = 0; q < blob.length; q++) {
            const k = blob[q], x = k % w;
            for (const j of [x > 0 ? k - 1 : -1, x < w - 1 ? k + 1 : -1, k - w, k + w]) {
                if (j >= 0 && j < n && !seen[j] && !kind[j] && pure(j)) { seen[j] = 1; blob.push(j); }
            }
        }
        // small patches too (gaps in a steering wheel) when a mask protects the cart's white panels
        // small ones only above a masked cart's body (gaps in a steering wheel); lower down they're headlight glare
        if (blob.length > n * 0.002 || (bodyTop && blob.length > n * 0.0002 && blob.every(k => k / w < bodyTop))) blob.forEach(k => { kind[k] = 1; });
    }
    // The floor shadow: neutral greys in the band under the wheels (the cart's lowest fifth), reached from the studio;
    // never a masked part, and never higher up, where the cart's own light panels are
    let bottom = 0;
    for (let i = n - 1; i >= 0; i--) if (!kind[i]) { bottom = Math.floor(i / w); break; }
    const floorTop = bottom - (bottom - Math.floor(h * 0.1)) * 0.2;
    const inFloor = i => i / w > floorTop;
    const studioEdge = [];
    for (let i = 0; i < n; i++) if (kind[i] === 1 && inFloor(i)) studioEdge.push(i + w, i - 1, i + 1);
    flood(studioEdge.filter(i => i >= 0 && i < n), i => inFloor(i) && !keep[i] && lo[i] >= 100 && sat[i] <= 24, 2);
    // Large light-grey areas left over: the studio seen through a windshield's tinted glass, and pale floor between the
    // wheels that the shadow above didn't reach. They turn see-through by their lightness (near-white almost clear,
    // greyer more solid). Anywhere on a photo with a mask (its white panels are protected); only in the floor band on
    // one without (a white body there is unprotected). Small light bits, like headlights, stay
    const hasMask = keep.some(v => v);
    const soft = new Int16Array(n).fill(-1);
    const light = i => !kind[i] && !keep[i] && lo[i] >= 185 && sat[i] <= 16;
    const done = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
        if (done[i] || !light(i)) continue;
        const blob = [i];
        done[i] = 1;
        for (let q = 0; q < blob.length; q++) {
            const k = blob[q], x = k % w;
            for (const j of [x > 0 ? k - 1 : -1, x < w - 1 ? k + 1 : -1, k - w, k + w]) {
                if (j >= 0 && j < n && !done[j] && light(j)) { done[j] = 1; blob.push(j); }
            }
        }
        // small patches only above the body (glass, steering wheel gaps): lower down they're headlights and trim
        const small = blob.length < n * 0.003;
        if (small && !(hasMask && blob.length >= n * 0.0002 && blob.every(k => k / w < bodyTop))) continue;
        const inFloorBand = blob.reduce((s, k) => s + (inFloor(k) ? 1 : 0), 0) > blob.length * 0.8;
        if (!hasMask && !inFloorBand) continue;
        blob.forEach(k => { soft[k] = Math.round(Math.max(0, Math.min(1, (255 - lo[k]) / 75)) * 255); });
    }
    // Pixels within two pixels of the studio (for the soft outline)
    const near = new Uint8Array(n);
    for (let pass = 0; pass < 2; pass++) {
        const from = pass === 0 ? i => kind[i] === 1 : i => near[i] === 1;
        const mark = [];
        for (let i = 0; i < n; i++) {
            if (!from(i)) continue;
            const x = i % w;
            for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) if (j >= 0 && j < n && kind[j] !== 1 && !near[j]) mark.push(j);
        }
        mark.forEach(j => { near[j] = pass + 1; });
    }
    const out = Buffer.alloc(n * 4);
    for (let i = 0; i < n; i++) {
        const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
        let a = 255;
        if (kind[i] === 1) a = 0;
        else if (soft[i] >= 0) a = soft[i];
        else if (kind[i] === 2) { out.set([20, 22, 20, Math.round(Math.max(0, Math.min(1, (250 - lo[i]) / 140)) * 170)], i * 4); continue; }
        else {
            // a light outline pixel up to two pixels from the studio fades with its lightness
            if (near[i] && lo[i] >= 170 && sat[i] <= 24) a = Math.round(Math.max(0, Math.min(1, (255 - lo[i]) / 85)) * 255);
        }
        out.set([r, g, b, a], i * 4);
    }
    return sharp(out, { raw: { width: w, height: h, channels: 4 } })
        .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
        .resize({ width: 1100, withoutEnlargement: true })
        .webp({ quality: 86, alphaQuality: 90 });
}

const photos = await photoList();
fs.mkdirSync(out, { recursive: true });
const made = new Set();
for (const photo of photos) {
    const src = path.join(root, photo);
    if (!fs.existsSync(src)) { console.log(`missing ${photo}`); continue; }
    const name = `${cartSlug(photo)}.webp`;
    await (await cutOut(src)).toFile(path.join(out, name));
    made.add(name);
    console.log(name);
}
fs.readdirSync(out).filter(f => (f.endsWith('.png') || f.endsWith('.webp')) && !made.has(f)).forEach(f => { fs.unlinkSync(path.join(out, f)); console.log(`removed ${f}`); });
console.log(`${made.size} carts in image/pdf/cart/`);
