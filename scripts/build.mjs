// Builds the static site into dist/:
//   1. compiles src/styles (tokens + Tailwind) into css/site.css
//   2. copies scripts, images, video and self-hosted fonts
//   3. writes a WebP copy of every photo (max 1920px wide) and points the built pages at it
//   4. pre-renders every page to real HTML with JSDOM, running the same app.js the browser runs, so each
//      URL has its content, title, description, canonical link, Open Graph tags and structured data
//      before any JavaScript loads. In the browser, app.js re-renders in place and the configurator runs.
//
// Environment:
//   SITE_ORIGIN  origin for canonical / Open Graph URLs   (default: the hosting platform's public address
//                when it sets one, else http://localhost:8765)
//   SITE_BASE    path the site is served from              (default /; GitHub Pages uses /golfcarts.ph/)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { JSDOM, VirtualConsole } from 'jsdom';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
// Hosting platforms announce their public address; SITE_ORIGIN, when set, wins
const platformOrigin =
    (process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`) ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    process.env.URL ||                 // Netlify
    process.env.RENDER_EXTERNAL_URL;   // Render
const origin = (process.env.SITE_ORIGIN || platformOrigin || 'http://localhost:8765').replace(/\/$/, '');
const base = ('/' + (process.env.SITE_BASE || '/').replace(/^\/|\/$/g, '') + '/').replace('//', '/');
const siteUrl = origin + base;

const rel = p => path.join(root, p);
const out = p => path.join(dist, p);

function copy(from, to = from) {
    fs.cpSync(rel(from), out(to), { recursive: true });
}

// Runs code as a classic script in the page, so top-level const / let are shared like separate <script> tags
function run(dom, code) {
    return new vm.Script(code).runInContext(dom.getInternalVMContext());
}

function escapeAttr(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// ---- 1. Clean and copy ----
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
for (const f of ['app.js', 'recolor.js', '.nojekyll', 'favicon.ico', 'image', 'video']) copy(f);

const fontFiles = {
    '@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2': 'newsreader-latin-opsz-normal.woff2',
    '@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2': 'instrument-sans-latin-wght-normal.woff2',
    '@fontsource-variable/instrument-sans/files/instrument-sans-latin-ext-wght-normal.woff2': 'instrument-sans-latin-ext-wght-normal.woff2'
};
fs.mkdirSync(out('fonts'));
for (const [from, to] of Object.entries(fontFiles)) fs.copyFileSync(rel(`node_modules/${from}`), out(`fonts/${to}`));

// ---- 2. CSS ----
execFileSync(process.execPath, [rel('node_modules/tailwindcss/lib/cli.js'), '-c', rel('tailwind.config.js'),
    '-i', rel('src/styles/site.css'), '-o', out('css/site.css'), '--minify'], { stdio: 'inherit', cwd: root });

// The source folder also gets the CSS and fonts (git-ignored), so it can be previewed directly with
// a plain static server such as VS Code Live Server. That preview skips pre-rendering and WebP images.
fs.mkdirSync(rel('css'), { recursive: true });
fs.copyFileSync(out('css/site.css'), rel('css/site.css'));
fs.cpSync(out('fonts'), rel('fonts'), { recursive: true });

// ---- 3. Images ----
// Each PNG / JPG gets a WebP copy beside it ("x.png" -> "x.png.webp"), resized to at most 1920px wide.
// The built app.js and HTML point at the copies. The originals stay: recolor.js reads their pixels for
// the color preview, and Open Graph images use them. Conversions are cached between builds.
const cacheDir = rel('node_modules/.cache/images');
fs.mkdirSync(cacheDir, { recursive: true });

function listFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true })
        .flatMap(d => (d.isDirectory() ? listFiles(path.join(dir, d.name)) : [path.join(dir, d.name)]));
}

async function convertImages() {
    const files = listFiles(out('image')).filter(f => /\.(png|jpe?g)$/i.test(f));
    const map = new Map();
    let saved = 0;
    let next = 0;
    async function worker() {
        while (next < files.length) {
            const file = files[next++];
            const stat = fs.statSync(file);
            const key = createHash('sha1').update(`${path.relative(dist, file)}|${stat.size}|${stat.mtimeMs}|v1`).digest('hex');
            const cached = path.join(cacheDir, `${key}.webp`);
            if (!fs.existsSync(cached)) {
                await sharp(file).resize({ width: 1920, withoutEnlargement: true })
                    .webp({ quality: 80, alphaQuality: 90, effort: 5 }).toFile(cached);
            }
            // Keep the original when WebP would not be smaller (some small logos)
            if (fs.statSync(cached).size >= stat.size) continue;
            fs.copyFileSync(cached, `${file}.webp`);
            saved += stat.size - fs.statSync(cached).size;
            const webPath = path.relative(dist, file).split(path.sep).join('/');
            map.set(webPath, `${webPath}.webp`);
        }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    console.log(`Images: ${map.size} of ${files.length} converted to WebP, ${(saved / 1048576).toFixed(1)} MB smaller`);
    return map;
}

const webpMap = await convertImages();
// Points every image path that has a WebP copy at the copy; the client logo paths are built from a template
function useWebp(text) {
    let result = text.replace(/image\/[^'"`<>()]*?\.(?:png|jpe?g)/gi, m => webpMap.get(m) || m);
    const logos = [...webpMap.keys()].filter(k => k.startsWith('image/clientlogo/'));
    if (logos.length && logos.length === listFiles(out('image/clientlogo')).filter(f => /\.jpe?g$/i.test(f)).length) {
        result = result.replace('image/clientlogo/Logo ${i + 1}.jpg`', 'image/clientlogo/Logo ${i + 1}.jpg.webp`');
    }
    return result;
}

// ---- 4. Pre-render ----
const template = useWebp(fs.readFileSync(rel('index.html'), 'utf8')).replace('<base href="/">', `<base href="${base}">`);
if (!template.includes(`<base href="${base}">`)) throw new Error('index.html must contain <base href="/">');
const appSource = useWebp(fs.readFileSync(rel('app.js'), 'utf8'));
fs.writeFileSync(out('app.js'), appSource);
const recolorSource = fs.readFileSync(rel('recolor.js'), 'utf8');

// Street addresses for structured data (display addresses live in BRANCHES in app.js)
const BRANCH_ADDRESSES = {
    'Manila Branch': { streetAddress: '1877 Honda Cars Manila Building, Paz M. Guazon St. cor Pres. Quirino Ave., Paco', addressLocality: 'Manila', addressRegion: 'Metro Manila', postalCode: '1007' },
    'Cebu Branch': { streetAddress: 'Unit 301 Clotilde Commercial Center, ML Quezon Ave., Casuntingan', addressLocality: 'Mandaue City', addressRegion: 'Cebu', postalCode: '6014' },
    'Laguna Branch': { streetAddress: 'Nissan Technopark, Purok 5 NMPI Rd', addressLocality: 'Santa Rosa', addressRegion: 'Laguna' },
    'Clark Branch': { streetAddress: 'Unit 16E-F, Philexcel Business Park, M.A. Roxas Highway, Clark Freeport Zone', addressLocality: 'Clark Freeport Zone', addressRegion: 'Pampanga' }
};

function localBusinessJsonLd(branches) {
    const org = { '@type': 'Organization', '@id': `${siteUrl}#organization`, name: 'Golfcarts.ph', legalName: 'SJK Guahan Inc.', url: siteUrl, logo: `${siteUrl}image/GCPH_logo.png`, email: 'info@golfcarts.ph' };
    const locations = branches.map(b => ({
        '@type': 'LocalBusiness',
        '@id': `${siteUrl}#${b.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: `Golfcarts.ph ${b.name}`,
        parentOrganization: { '@id': org['@id'] },
        url: siteUrl,
        image: `${siteUrl}image/GCPH_logo.png`,
        email: 'info@golfcarts.ph',
        ...(b.phones.length ? { telephone: b.phones[0] } : {}),
        ...(b.lat ? { geo: { '@type': 'GeoCoordinates', latitude: b.lat, longitude: b.lon } } : {}),
        address: { '@type': 'PostalAddress', addressCountry: 'PH', ...BRANCH_ADDRESSES[b.name] }
    }));
    return JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, ...locations] });
}

function seoHead({ meta, url, image, jsonLd, noindex }) {
    const tags = [
        noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${escapeAttr(url)}">`,
        '<meta property="og:site_name" content="Golfcarts.ph">',
        '<meta property="og:type" content="website">',
        `<meta property="og:title" content="${escapeAttr(meta.title)}">`,
        `<meta property="og:description" content="${escapeAttr(meta.description)}">`,
        `<meta property="og:url" content="${escapeAttr(url)}">`,
        `<meta property="og:image" content="${escapeAttr(image)}">`,
        '<meta property="og:locale" content="en_PH">',
        '<meta name="twitter:card" content="summary_large_image">',
        jsonLd ? `<script type="application/ld+json">${jsonLd.replace(/</g, '\\u003c')}</script>` : ''
    ];
    return tags.filter(Boolean).join('\n    ');
}

async function renderRoute(routePath) {
    const virtualConsole = new VirtualConsole();
    // Media playback, scrolling and canvas are not available in JSDOM and are not needed for the HTML
    virtualConsole.on('jsdomError', err => {
        if (!/Not implemented/.test(err.message)) console.warn(`  [${routePath || '/'}] ${err.message}`);
    });
    const dom = new JSDOM(template, { url: siteUrl + routePath, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole });
    const { window } = dom;
    window.scrollTo = () => {};
    run(dom, recolorSource);
    run(dom, appSource);
    // app.js renders on DOMContentLoaded; wait for it
    await new Promise(resolve => (window.document.readyState === 'complete' ? resolve() : window.addEventListener('load', resolve)));
    await new Promise(resolve => setTimeout(resolve, 0));
    return dom;
}

// Every route the site has, from the same data the app uses
const probe = await renderRoute('');
const data = run(probe, `({
    products: PRODUCTS_DATA.map(p => p.slug),
    segments: NAV_SEGMENTS.map(s => s.id),
    posts: BLOGS_DATA.map(b => b.slug),
    branches: BRANCHES
})`);
probe.window.close();

const routes = [
    ['home', null], ['products', null], ['solutions', null], ['service', null], ['blogs', null], ['about', null], ['contact', null],
    ...data.segments.map(id => ['segment', id]),
    ...data.products.map(slug => ['product-details', slug]),
    ...data.posts.map(slug => ['blog-details', slug])
];
const branchJsonLd = localBusinessJsonLd(data.branches);
const sitemap = [];

async function writePage(page, slug, file, { noindex = false } = {}) {
    const dom = await renderRoute(file === '404.html' ? '__not-found__/' : '');
    const { window } = dom;
    if (file !== '404.html') {
        run(dom, `currentPage = ${JSON.stringify(page)}; currentSlug = ${JSON.stringify(slug)}; productFilterCategory = 'All';
            applyPageMeta(currentPage, currentSlug); updateNavState(); renderApp();`);
    }
    const routePath = run(dom, `routeToPath(${JSON.stringify(page)}, ${JSON.stringify(slug)})`);
    const meta = run(dom, `getPageMeta(${JSON.stringify(page)}, ${JSON.stringify(slug)})`);
    // Scroll reveals start hidden; pre-rendered pages show everything so they read without JavaScript
    window.document.querySelectorAll('.rise, .reveal').forEach(el => el.classList.add('is-visible'));
    const url = siteUrl + routePath;
    // Open Graph images use the originals: WebP previews are not supported everywhere
    const image = siteUrl + encodeURI((meta.image || 'image/Hero/hero-poster.jpg').replace(/\.(png|jpe?g)\.webp$/i, '.$1'));
    const jsonLd = ['home', 'contact', 'about'].includes(page) ? branchJsonLd : null;
    let html = dom.serialize().replace(/<!-- SEO:HEAD[\s\S]*?-->/, seoHead({ meta, url, image, jsonLd, noindex }));
    window.close();
    const target = out(file || path.join(routePath, 'index.html'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, html);
    if (!noindex) sitemap.push(url);
}

for (const [page, slug] of routes) await writePage(page, slug, null);
await writePage('not-found', null, '404.html', { noindex: true });

fs.writeFileSync(out('sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(out('robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`);

console.log(`Built ${sitemap.length} pages + 404 into dist/ for ${siteUrl}`);
