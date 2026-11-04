// quotation-mail: every email from Golfcarts.ph, sent through Resend, and the quotation PDF.
//
// Called by the database (supabase/schema.sql, notify_mail) with the shared secret NOTIFY_SECRET:
//   quote_created          a quote request arrived: the customer gets an acknowledgement (no prices), the owner and
//                          the sales managers get the request
//   quotation_submitted    the master admins are asked to approve it
//   quotation_approved     the person who submitted it can now send it
//   quotation_returned     the person who submitted it gets the master admin's note
//   quotation_sent         the customer gets the quotation PDF (it is "sent" once a staff member sends it in the admin)
// Called from the admin with the staff member's own sign-in (Authorization: Bearer <access token>):
//   preview                the quotation's PDF, to look at before sending
//   resend                 emails a sent quotation to the customer again (when the first email failed)
// Everything it needs it reads from the database itself, as the service role; each email is logged in email_log.
//
// Secrets (Supabase dashboard -> Edge Functions -> Secrets): RESEND_API_KEY, NOTIFY_SECRET, and optionally
// SITE_URL (default https://golfcarts.ph/), MAIL_FROM (default Golfcarts.ph <quotes@golfcarts.ph>), OWNER_EMAIL.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase. Deploy with JWT verification off: the
// function checks the secret or the sign-in itself.
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';

const env = (key: string) => ((globalThis as any).Deno ? (globalThis as any).Deno.env.get(key) : (globalThis as any).process.env[key]) || '';
const SUPABASE_URL = env('SUPABASE_URL');
const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const SITE_URL = (env('SITE_URL') || 'https://golfcarts.ph/').replace(/\/?$/, '/');
const FROM = env('MAIL_FROM') || 'Golfcarts.ph <quotes@golfcarts.ph>';
const OWNER_EMAIL = env('OWNER_EMAIL') || 'donnavalonda@sjkguahan.com';
const COMPANY = {
    name: 'Golfcarts.ph', legal: 'SJK Guahan Inc.', site: 'golfcarts.ph', email: 'info@golfcarts.ph', phone: '(02) 7745-5089',
    address: '1877 Honda Cars Manila Building, Paz M. Guazon St. cor Pres. Quirino Ave., Paco, Manila'
};
// The site's colours (src/styles/tokens.css)
const C = { ink: '#151714', green: '#749E35', greenText: '#4F6E22', stone: '#ECECE6', line: '#D6D6CE', mute: '#6B6C64' };
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };

// ---------- Database (as the service role) ----------
async function db(path: string, { method = 'GET', body }: { method?: string, body?: unknown } = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method,
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Database ${res.status}: ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : null;
}

async function one(table: string, id: number) {
    const rows = await db(`${table}?id=eq.${id}&select=*`);
    if (!rows || !rows.length) throw new Error(`${table} ${id} not found`);
    return rows[0];
}

async function staffEmails(role?: string) {
    const rows = await db(`staff?select=email,role${role ? `&role=eq.${role}` : ''}`);
    return rows.map((r: { email: string }) => r.email);
}

// The staff member signed in with this access token, or an error
async function staffFromToken(token: string) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Sign in again');
    const user = await res.json();
    const rows = await db(`staff?email=eq.${encodeURIComponent(String(user.email || '').toLowerCase())}&select=email,role`);
    if (!rows.length) throw new Error('Only staff can do this');
    return rows[0];
}

// ---------- Email ----------
async function sendMail(kind: string, refTable: string, refId: number, mail: { to: string[], replyTo?: string, bcc?: string[], subject: string, html: string, attachments?: unknown[] }) {
    const to = [...new Set(mail.to.filter(Boolean))];
    let status = 'sent', error = '';
    try {
        if (!to.length) throw new Error('No one to send to');
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: FROM, to, reply_to: mail.replyTo || undefined, bcc: mail.bcc && mail.bcc.length ? mail.bcc : undefined, subject: mail.subject, html: mail.html, attachments: mail.attachments })
        });
        if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
    } catch (err) {
        status = 'failed';
        error = String((err as Error).message || err);
    }
    await db('email_log', { method: 'POST', body: { kind, ref_table: refTable, ref_id: refId, to_addresses: to.join(', '), status, error } });
    return { status, error };
}

function esc(v: unknown) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function peso(n: number) {
    return 'PHP ' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function rowsTable(rows: string[][]) {
    return '<table style="width:100%;border-collapse:collapse;font-size:13px">' + rows.map((r, i) =>
        `<tr style="background:${i % 2 ? '#ffffff' : '#F6F6F2'}"><td style="padding:7px 10px;border-bottom:1px solid ${C.line};color:${C.mute};width:150px;vertical-align:top">${esc(r[0])}</td>` +
        `<td style="padding:7px 10px;border-bottom:1px solid ${C.line};color:${C.ink};white-space:pre-line">${esc(r[1])}</td></tr>`).join('') + '</table>';
}

function emailPage(title: string, intro: string, body = '') {
    return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;color:${C.ink}">` +
        `<div style="padding:16px 0;border-bottom:1px solid ${C.line}"><img src="${SITE_URL}image/GCPH_logo.png" alt="${COMPANY.name}" style="height:36px"></div>` +
        `<h2 style="font-size:20px;margin:20px 0 6px">${title}</h2><p style="font-size:14px;line-height:1.6;margin:0 0 14px">${intro}</p>${body}` +
        `<p style="font-size:11px;color:${C.mute};margin-top:24px;border-top:1px solid ${C.line};padding-top:12px"><b>${COMPANY.name}</b> by ${COMPANY.legal} · ${COMPANY.site} · ${COMPANY.email} · ${COMPANY.phone}</p></div>`;
}

const adminLink = (label: string) => `<p style="margin:16px 0"><a href="${SITE_URL}admin/" style="background:${C.green};color:${C.ink};padding:10px 16px;border-radius:4px;font-weight:bold;text-decoration:none">${label}</a></p>`;

function requestRows(q: any) {
    const rows: string[][] = (q.rows || []).filter((r: unknown) => Array.isArray(r) && r.length === 2).map((r: unknown[]) => [String(r[0]), String(r[1])]);
    if (q.quantity) rows.push(['Quantity', q.quantity]);
    if (q.branch) rows.push(['Nearest branch', q.branch]);
    if (q.notes) rows.push(['Notes', q.notes]);
    return rows;
}

// Each line's unit price times its qty; the per-cart subtotal; times the number of carts, less the discount
function totals(qt: any) {
    const lines = (qt.lines || []).map((l: any) => {
        const qty = l.qty == null ? 1 : Number(l.qty), unit = l.price_php == null ? 0 : Number(l.price_php);
        return { item: [l.part, l.option].filter(Boolean).join(' - '), description: l.description || '', qty, unit, amount: unit * qty };
    });
    const perCart = lines.reduce((s: number, l: any) => s + l.amount, 0);
    const units = Number(qt.units || 1), discount = Number(qt.discount_php || 0);
    return { lines, perCart, units, discount, total: perCart * units - discount };
}

// ---------- The quotation PDF ----------
async function quotationPdf(qt: any) {
    const pdf = await PDFDocument.create();
    const regular = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
    const W = 595.28, H = 841.89, M = 42, inner = W - 2 * M;
    let page = pdf.addPage([W, H]), y = H - M;
    // The standard PDF fonts can't draw every character; those they can't are swapped for a plain one
    const safe = (font: any, text: string) => [...String(text == null ? '' : text).replace(/₱/g, 'PHP ')].map(ch => {
        try { font.encodeText(ch); return ch; } catch { return '?'; }
    }).join('');
    const width = (text: string, size: number, font = regular) => font.widthOfTextAtSize(safe(font, text), size);
    const draw = (text: string, x: number, yy: number, size = 10, font = regular, color = C.ink) => page.drawText(safe(font, text), { x, y: yy, size, font, color: hex(color) });
    const wrap = (text: string, size: number, max: number, font = regular) => {
        const out: string[] = [];
        String(text || '').split('\n').forEach(par => {
            let line = '';
            par.split(/\s+/).forEach(word => {
                const next = line ? `${line} ${word}` : word;
                if (width(next, size, font) <= max || !line) line = next;
                else { out.push(line); line = word; }
            });
            out.push(line);
        });
        return out;
    };
    const room = (needed: number) => { if (y - needed < M + 40) { page = pdf.addPage([W, H]); y = H - M; } };
    const rule = (color = C.green, thick = 2) => { page.drawRectangle({ x: M, y, width: inner, height: thick, color: hex(color) }); };
    const heading = (text: string) => { room(40); y -= 22; draw(text.toUpperCase(), M, y, 9, bold, C.greenText); y -= 6; rule(C.green, 1.5); y -= 6; };
    const image = async (path: string) => {
        try {
            const res = await fetch(SITE_URL + path);
            if (!res.ok) return null;
            const bytes = new Uint8Array(await res.arrayBuffer());
            return /\.png$/i.test(path) ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
        } catch { return null; }
    };

    // Header: logo, QUOTATION, number and date
    const logo = await image('image/GCPH_logo.png');
    if (logo) { const s = 34 / logo.height; page.drawImage(logo, { x: M, y: y - 34, width: logo.width * s, height: 34 }); }
    else draw(COMPANY.name, M, y - 24, 18, bold);
    const right = (text: string, yy: number, size: number, font = regular) => draw(text, W - M - width(text, size, font), yy, size, font);
    const date = new Date(qt.sent_at || Date.now()).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric' });
    right('QUOTATION', y - 18, 20, bold);
    right(`Quotation No: ${qt.reference}`, y - 32, 9);
    right(`Date: ${date}`, y - 44, 9);
    y -= 56; rule(); y -= 18;

    // Issued to / issued by
    const c = qt.customer || {};
    const to = [`Name: ${c.name || ''}`, `Mobile: ${c.phone || ''}`, `Email: ${c.email || ''}`].concat(c.branch ? [`Nearest branch: ${c.branch}`] : []);
    const by = [`${COMPANY.name} (${COMPANY.legal})`, `Phone: ${COMPANY.phone}`, `Email: ${COMPANY.email}`, ...wrap(`Address: ${COMPANY.address}`, 9, inner / 2 - 10)];
    draw('ISSUED TO:', M, y, 10, bold, C.greenText); draw('ISSUED BY:', M + inner / 2, y, 10, bold, C.greenText);
    to.forEach((t, i) => draw(t, M, y - 14 - i * 12, 9));
    by.forEach((t, i) => draw(t, M + inner / 2, y - 14 - i * 12, 9));
    y -= 18 + Math.max(to.length, by.length) * 12 + 10;

    // The model and build, then its photo
    const rows: string[][] = (qt.build_rows || []).filter((r: unknown) => Array.isArray(r) && r.length === 2).map((r: unknown[]) => [String(r[0]), String(r[1])]);
    const model = (rows.find(r => r[0] === 'Model') || [])[1] || qt.title || 'Your golf cart';
    const build = (rows.find(r => r[0] === 'Build') || [])[1] || '';
    draw(model, (W - width(model, 18, bold)) / 2, y - 16, 18, bold); y -= 20;
    if (build) { draw(build, (W - width(build, 12, bold)) / 2, y - 12, 12, bold, C.greenText); y -= 16; }
    const photo = qt.photo ? await image(qt.photo) : null;
    if (photo) { const w = 210, h = photo.height * w / photo.width; room(h + 10); page.drawImage(photo, { x: (W - w) / 2, y: y - h - 6, width: w, height: h }); y -= h + 12; }

    // The build as specified
    const spec = rows.filter(r => r[0] !== 'Model' && r[0] !== 'Build').concat([['Quantity', String(qt.units || 1)]]);
    room(30); y -= 8;
    const col = inner * 0.38;
    page.drawRectangle({ x: M, y: y - 18, width: col, height: 18, color: hex(C.green) });
    page.drawRectangle({ x: M + col, y: y - 18, width: inner - col, height: 18, color: hex(C.ink) });
    draw('SPECIFICATION / ITEM', M + 8, y - 12.5, 9, bold, '#FFFFFF'); draw('DETAILS', M + col + 8, y - 12.5, 9, bold, '#FFFFFF');
    y -= 18;
    spec.forEach(([k, v]) => {
        const lines = wrap(v, 9, inner - col - 16), h = 8 + lines.length * 11;
        room(h);
        page.drawRectangle({ x: M, y: y - h, width: inner, height: h, borderColor: hex(C.green), borderWidth: 0.6 });
        page.drawLine({ start: { x: M + col, y }, end: { x: M + col, y: y - h }, color: hex(C.green), thickness: 0.6 });
        draw(k, M + 8, y - 12, 9);
        lines.forEach((l, i) => draw(l, M + col + 8, y - 12 - i * 11, 9));
        y -= h;
    });

    // Price
    const t = totals(qt);
    heading('Price');
    // Item and qty from the left; unit price and amount right-aligned to their column edges
    const cols = [M + 8, M + inner * 0.58, M + inner * 0.70, M + inner];
    const unitRight = cols[3] - 8 - inner * 0.17;
    const headRow = () => {
        page.drawRectangle({ x: M, y: y - 18, width: inner, height: 18, color: hex(C.ink) });
        draw('ITEM', cols[0], y - 12.5, 9, bold, '#FFFFFF'); draw('QTY', cols[1], y - 12.5, 9, bold, '#FFFFFF');
        draw('UNIT PRICE', unitRight - width('UNIT PRICE', 9, bold), y - 12.5, 9, bold, '#FFFFFF');
        draw('AMOUNT', cols[3] - 8 - width('AMOUNT', 9, bold), y - 12.5, 9, bold, '#FFFFFF');
        y -= 18;
    };
    room(40); headRow();
    t.lines.forEach((l: any) => {
        const desc = wrap(l.description, 8, inner * 0.52), h = 10 + 11 + desc.length * 10;
        if (y - h < M + 40) { room(h + 18); headRow(); }
        page.drawLine({ start: { x: M, y: y - h }, end: { x: M + inner, y: y - h }, color: hex(C.line), thickness: 0.6 });
        draw(l.item, cols[0], y - 13, 9, bold);
        desc.forEach((d, i) => draw(d, cols[0], y - 24 - i * 10, 8, regular, C.mute));
        draw(String(l.qty), cols[1], y - 13, 9);
        draw(peso(l.unit), unitRight - width(peso(l.unit), 9), y - 13, 9);
        draw(peso(l.amount), cols[3] - 8 - width(peso(l.amount), 9), y - 13, 9);
        y -= h;
    });
    const sum = (label: string, value: string, strong = false) => {
        room(20);
        const size = strong ? 12 : 9, font = strong ? bold : regular;
        const valueX = cols[3] - 8 - width(value, size, font);
        // The label ends at the unit price column, or before a wide amount reaches it
        draw(label, Math.min(unitRight, valueX - 14) - width(label, size, font), y - 14, size, font);
        draw(value, valueX, y - 14, size, font);
        y -= strong ? 24 : 17;
    };
    y -= 4;
    sum('Price per cart', peso(t.perCart));
    if (t.units !== 1) sum('Number of carts', String(t.units));
    if (t.discount) sum('Discount', `- ${peso(t.discount)}`);
    page.drawLine({ start: { x: unitRight - 120, y: y - 2 }, end: { x: M + inner, y: y - 2 }, color: hex(C.ink), thickness: 1 });
    y -= 4;
    sum('TOTAL', peso(t.total), true);

    // Notes and terms
    const paragraph = (title: string, text: string, size: number, color: string) => {
        if (!text) return;
        heading(title);
        wrap(text, size, inner).forEach(l => { room(14); draw(l, M, y - 10, size, regular, color); y -= size + 4; });
    };
    paragraph('Notes', qt.notes, 10, C.ink);
    paragraph('Terms', qt.terms, 9, C.mute);

    // Footer band on every page
    pdf.getPages().forEach(p => {
        p.drawRectangle({ x: M, y: M - 6, width: inner, height: 24, color: hex(C.ink) });
        p.drawText(safe(regular, `${COMPANY.name} by ${COMPANY.legal} - ${COMPANY.site} - ${COMPANY.email} - ${COMPANY.phone}`), { x: M + 12, y: M + 2, size: 8, font: regular, color: hex('#FFFFFF') });
    });
    return await pdf.save();
}

function base64(bytes: Uint8Array) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
}

// ---------- The events ----------
async function quoteCreated(id: number) {
    const q = await one('quotes', id);
    const rows = requestRows(q);
    await sendMail('request_received', 'quotes', id, {
        to: [q.email], replyTo: OWNER_EMAIL,
        subject: `We received your quotation request ${q.reference}`,
        html: emailPage(`Thank you, ${esc(q.name)}!`, `We received your quotation request <b>${esc(q.reference)}</b>. Our sales team will prepare your quotation and email it to you.`,
            rowsTable([['Model', q.model], ...rows.filter(r => r[0] !== 'Model')]))
    });
    await sendMail('request_staff', 'quotes', id, {
        to: [OWNER_EMAIL, ...await staffEmails('sales')], replyTo: q.email,
        subject: `New quotation request ${q.reference} from ${q.name}`,
        html: emailPage('New quotation request', `From the website (${esc(q.source)}). Reply to this email to answer ${esc(q.name)} directly, or prepare the quotation in the admin.`,
            rowsTable([['Name', q.name], ['Email', q.email], ['Mobile', q.phone], ['Model', q.model], ...rows.filter(r => r[0] !== 'Model')]) + adminLink('Open the admin'))
    });
}

async function quotationEvent(id: number, status: string) {
    const qt = await one('quotations', id);
    if (qt.status !== status) return; // it moved on already; the newer event sends its own email
    const t = totals(qt), c = qt.customer || {};
    const summary = rowsTable([['Quotation', qt.reference], ['Customer', `${c.name || ''} (${c.email || ''})`], ['Build', qt.title], ['Total', peso(t.total)]]);
    if (status === 'submitted') {
        await sendMail('quotation_submitted', 'quotations', id, {
            to: await staffEmails('master'), replyTo: qt.submitted_by,
            subject: `Approve quotation ${qt.reference} for ${c.name || 'a customer'}`,
            html: emailPage('A quotation is waiting for your approval', `${esc(qt.submitted_by)} submitted quotation ${esc(qt.reference)}.`, summary + adminLink('Review it in the admin'))
        });
    } else if (status === 'approved' || status === 'returned') {
        const approved = status === 'approved';
        await sendMail(`quotation_${status}`, 'quotations', id, {
            to: [qt.submitted_by || qt.prepared_by], replyTo: qt.reviewed_by,
            subject: `Quotation ${qt.reference} ${approved ? 'approved' : 'returned'}`,
            html: emailPage(approved ? 'Your quotation is approved' : 'Your quotation was returned',
                approved ? `${esc(qt.reviewed_by)} approved quotation ${esc(qt.reference)}. You can now send it to the customer from the admin.`
                    : `${esc(qt.reviewed_by)} returned quotation ${esc(qt.reference)}: <b>${esc(qt.review_note)}</b>`,
                summary + adminLink('Open it in the admin'))
        });
    } else if (status === 'sent') {
        await sendQuotation(qt);
    }
}

async function sendQuotation(qt: any) {
    const c = qt.customer || {}, t = totals(qt);
    const pdf = await quotationPdf(qt);
    return await sendMail('quotation_sent', 'quotations', qt.id, {
        to: [c.email], replyTo: qt.sent_by || OWNER_EMAIL, bcc: [OWNER_EMAIL],
        subject: `Your quotation ${qt.reference} from ${COMPANY.name}`,
        html: emailPage(`Your quotation is ready, ${esc(c.name || '')}`,
            `Thank you for your interest in ${esc(qt.title || 'our carts')}. Your quotation ${esc(qt.reference)} is attached as a PDF. Reply to this email with any questions, or to confirm your order.`,
            `<p style="font-size:15px;margin:0">Total: <b>${peso(t.total)}</b></p>`),
        attachments: [{ filename: `Quotation ${qt.reference}.pdf`, content: base64(pdf) }]
    });
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

export async function handle(req: Request) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (req.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);
    let body: any = {};
    try { body = await req.json(); } catch { return json({ ok: false, error: 'Expected JSON' }, 400); }
    const id = Number(body.id);
    try {
        // From the database: the shared secret
        const secret = req.headers.get('x-notify-secret');
        if (secret) {
            if (!env('NOTIFY_SECRET') || secret !== env('NOTIFY_SECRET')) return json({ ok: false, error: 'Not allowed' }, 401);
            if (body.event === 'quote_created') await quoteCreated(id);
            else if (/^quotation_(submitted|approved|returned|sent)$/.test(body.event)) await quotationEvent(id, body.event.slice(10));
            else return json({ ok: false, error: 'Unknown event' }, 400);
            return json({ ok: true });
        }
        // From the admin: a staff member's sign-in
        const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
        if (!token) return json({ ok: false, error: 'Sign in first' }, 401);
        await staffFromToken(token);
        const qt = await one('quotations', id);
        if (body.action === 'preview') {
            const pdf = await quotationPdf(qt);
            return new Response(pdf, { headers: { ...CORS, 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="Quotation ${qt.reference}.pdf"` } });
        }
        if (body.action === 'resend') {
            if (qt.status !== 'sent') return json({ ok: false, error: 'Only a sent quotation can be emailed again' }, 400);
            const result = await sendQuotation(qt);
            return json({ ok: result.status === 'sent', error: result.error });
        }
        return json({ ok: false, error: 'Unknown action' }, 400);
    } catch (err) {
        return json({ ok: false, error: String((err as Error).message || err) }, 500);
    }
}

if ((globalThis as any).Deno) (globalThis as any).Deno.serve(handle);
