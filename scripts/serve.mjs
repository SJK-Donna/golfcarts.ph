// Serves the built site (dist/) for hosting platforms that run a Node app (`npm start`), and for `npm run dev`.
// Listens on $PORT (set by the platform) or 8765. Folder URLs serve their index.html; unknown paths get
// dist/404.html with a 404 status, as on GitHub Pages.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT) || 8765;

const TYPES = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
    '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4'
};

if (!fs.existsSync(path.join(dist, 'index.html'))) {
    console.error('dist/ has no build. Run `npm run build` first.');
    process.exit(1);
}

// Resolves a URL path to a file inside dist/, or null (never outside dist/)
function resolveFile(urlPath) {
    let rel;
    try { rel = decodeURIComponent(urlPath.split('?')[0]); } catch { return null; }
    const file = path.normalize(path.join(dist, rel));
    if (file !== dist && !file.startsWith(dist + path.sep)) return null;
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        const index = path.join(file, 'index.html');
        return fs.existsSync(index) ? index : null;
    }
    return fs.existsSync(file) ? file : null;
}

function send(req, res, file, status) {
    const stat = fs.statSync(file);
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    // Pages, scripts and styles always revalidate, so a rebuild shows at once (a cached app.js hid changes); photos are cached for a day
    const cache = /^(text\/(html|css|javascript)|application\/(javascript|json))/.test(type) ? 'no-cache' : 'public, max-age=86400';
    const range = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (range && status === 200) {
        // Video seeking needs byte ranges
        const start = range[1] ? Number(range[1]) : stat.size - Number(range[2]);
        const end = range[1] && range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
        if (start >= stat.size || start > end) {
            res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
            return res.end();
        }
        res.writeHead(206, { 'Content-Type': type, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Cache-Control': cache });
        return req.method === 'HEAD' ? res.end() : fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(status, { 'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes', 'Cache-Control': cache });
    return req.method === 'HEAD' ? res.end() : fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' });
        return res.end();
    }
    // A folder URL without its trailing slash (e.g. /about) redirects to /about/, the address the pages use
    const urlPath = req.url.split('?')[0];
    if (!urlPath.endsWith('/') && !path.extname(urlPath) && resolveFile(urlPath + '/')) {
        const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        res.writeHead(301, { Location: urlPath + '/' + query });
        return res.end();
    }
    const file = resolveFile(req.url);
    if (file) return send(req, res, file, 200);
    return send(req, res, path.join(dist, '404.html'), 404);
}).listen(port, '0.0.0.0', () => console.log(`Serving dist/ on http://localhost:${port}`));
