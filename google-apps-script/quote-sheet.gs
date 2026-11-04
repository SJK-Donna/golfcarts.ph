// Quote requests from golfcarts.ph: each one is saved as a row in this Sheet, and the customer and the
// owner both get an email with the quotation attached as a PDF.
//
// Setup (in the Google Sheet): Extensions > Apps Script, paste this file, save, then
// Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone. Put the web app URL in
// QUOTE_SHEET_URL in app.js. After editing this file, Deploy > Manage deployments > Edit > New version.

const OWNER_EMAIL = 'donnavalonda@sjkguahan.com';
const COMPANY = {
  name: 'Golfcarts.ph',
  legal: 'SJK Guahan Inc.',
  site: 'golfcarts.ph',
  email: 'info@golfcarts.ph',
  phone: '(02) 7745-5089',
  // The Manila branch, whose number is the company phone
  address: '1877 Honda Cars Manila Building, Paz M. Guazon St. cor Pres. Quirino Ave., Paco, Manila',
  branches: 'Manila · Cebu · Laguna · Clark'
};
// The site's colors (src/styles/tokens.css)
const C = { ink: '#151714', green: '#749E35', greenText: '#4F6E22', stone: '#ECECE6', line: '#D6D6CE', mute: '#6B6C64' };
const HEADERS = ['Date/time', 'Reference', 'Source', 'Name', 'Email', 'Mobile', 'Model', 'Build and options', 'Quantity', 'Branch', 'Notes'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const q = readRequest(e.parameter);
    saveRow(q);
    sendEmails(q);
    return json({ ok: true, reference: q.reference });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// The form fields, trimmed and size-limited; the build comes as [label, value] rows, the logo and photo as data URLs
function readRequest(p) {
  const text = (v, max) => String(v || '').trim().slice(0, max || 500);
  let rows = [];
  try { rows = JSON.parse(p.rows || '[]'); } catch (err) { rows = []; }
  rows = rows.filter(r => Array.isArray(r) && r.length === 2).slice(0, 40).map(r => [text(r[0], 80), text(r[1], 1000)]);
  const q = {
    date: new Date(),
    reference: text(p.reference, 20) || 'QT-' + Math.floor(100000 + Math.random() * 900000),
    source: text(p.source, 40),
    name: text(p.name, 120),
    email: text(p.email, 200),
    phone: text(p.phone, 40),
    model: text(p.model, 200),
    quantity: text(p.quantity, 10) || '1',
    branch: text(p.branch, 80),
    notes: text(p.notes, 2000),
    rows: rows,
    logo: imageBlob(p.logo, 'logo.png'),
    photo: imageBlob(p.photo, 'cart.jpg')
  };
  if (!q.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.email)) throw new Error('Name and a valid email are required');
  return q;
}

// A PNG or JPEG data URL (at most about 1.5 MB) as a blob, or null
function imageBlob(dataUrl, name) {
  const m = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m || m[2].length > 2000000) return null;
  return Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], name);
}

function saveRow(q) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  const build = q.rows.map(r => r[0] + ': ' + r[1]).join('\n');
  // A leading = + - @ would make Sheets read the cell as a formula (a phone like +63 does), and a leading 0 would be
  // dropped from a number (09xx mobile numbers), so keep those as text
  const cell = v => (/^([=+\-@]|0\d)/.test(v) ? "'" + v : v);
  sheet.appendRow([q.date, q.reference, q.source, q.name, q.email, q.phone, q.model, build, q.quantity, q.branch, q.notes].map(v => (typeof v === 'string' ? cell(v) : v)));
}

function sendEmails(q) {
  // The PDF carries its images inline; the emails reference theirs as attachments (Gmail drops inline data URLs)
  const dataUrl = b => 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes());
  const pdf = Utilities.newBlob(quotationHtml(q, q.logo && dataUrl(q.logo), q.photo && dataUrl(q.photo)), MimeType.HTML)
    .getAs(MimeType.PDF).setName('Quotation ' + q.reference + '.pdf');
  const inlineImages = {};
  if (q.logo) inlineImages.logo = q.logo;
  if (q.photo) inlineImages.photo = q.photo;
  const logo = q.logo && 'cid:logo', photo = q.photo && 'cid:photo';
  MailApp.sendEmail({
    to: q.email,
    replyTo: OWNER_EMAIL,
    name: COMPANY.name,
    subject: 'Your quotation request ' + q.reference,
    htmlBody: emailHtml(q, logo, photo, 'Thank you, ' + esc(q.name) + '!',
      'We received your quotation request. Your build is summarized below and attached as a PDF. Our team will contact you with pricing and availability.'),
    inlineImages: inlineImages,
    attachments: [pdf]
  });
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    replyTo: q.email,
    name: COMPANY.site + ' quotes',
    subject: 'New quotation request ' + q.reference + ' from ' + q.name,
    htmlBody: emailHtml(q, logo, photo, 'New quotation request',
      'A new request came in from the website (' + esc(q.source) + '). Reply to this email to answer the customer directly.'),
    inlineImages: inlineImages,
    attachments: [pdf]
  });
}

function modelName(q) {
  const row = q.rows.filter(r => r[0] === 'Model')[0];
  return (row && row[1]) || q.model || 'Your golf cart';
}

function buildName(q) {
  const row = q.rows.filter(r => r[0] === 'Build')[0];
  return row ? row[1] : '';
}

function customerRows(q) {
  const rows = [['Name', q.name], ['Email', q.email], ['Mobile', q.phone]];
  if (q.branch) rows.push(['Nearest branch', q.branch]);
  return rows;
}

// The model and build are the title above, so the rows list the rest of the build
function buildRows(q) {
  const rows = q.rows.filter(r => r[0] !== 'Model' && r[0] !== 'Build');
  rows.push(['Quantity', q.quantity]);
  if (q.notes) rows.push(['Notes', q.notes]);
  return rows;
}

function table(rows) {
  return '<table style="width:100%;border-collapse:collapse;font-size:12px">' + rows.map((r, i) =>
    '<tr style="page-break-inside:avoid;background:' + (i % 2 ? '#ffffff' : '#F6F6F2') + '">' +
    '<td style="padding:7px 10px;border-bottom:1px solid ' + C.line + ';color:' + C.mute + ';width:130px;vertical-align:top">' + esc(r[0]) + '</td>' +
    '<td style="padding:7px 10px;border-bottom:1px solid ' + C.line + ';color:' + C.ink + ';white-space:pre-line">' + esc(r[1]) + '</td></tr>').join('') + '</table>';
}

function heading(text) {
  return '<div style="font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:' + C.greenText +
    ';border-bottom:2px solid ' + C.green + ';padding-bottom:4px;margin:16px 0 6px">' + text + '</div>';
}

function logoOrName(logo, height) {
  return logo ? '<img src="' + logo + '" alt="' + COMPANY.name + '" style="height:' + height + 'px">'
    : '<span style="font-size:22px;font-weight:bold;color:' + C.ink + '">' + COMPANY.name + '</span>';
}

// The model as the centered title, its build beneath, then the cart photo
function hero(q, photo) {
  const build = buildName(q);
  return '<div style="text-align:center;margin-top:20px">' +
    '<div style="font-size:26px;font-weight:bold;color:' + C.ink + '">' + esc(modelName(q)) + '</div>' +
    (build ? '<div style="font-size:15px;font-weight:bold;color:' + C.greenText + ';margin-top:4px">' + esc(build) + '</div>' : '') +
    (photo ? '<img src="' + photo + '" alt="' + esc(modelName(q)) + '" style="width:300px;max-width:100%;margin-top:10px">' : '') +
    '</div>';
}

// The quotation's build table: a green item column and a dark details column under a header row
function specTable(rows) {
  const cell = 'padding:7px 10px;border:1px solid ' + C.green + ';vertical-align:top;font-size:12px';
  return '<table style="width:100%;border-collapse:collapse;margin-top:16px">' +
    '<tr><td style="' + cell + ';width:38%;background:' + C.green + ';color:#ffffff;font-weight:bold">SPECIFICATION / ITEM</td>' +
    '<td style="' + cell + ';background:' + C.ink + ';border-color:' + C.ink + ';color:#ffffff;font-weight:bold;text-align:center">DETAILS</td></tr>' +
    rows.map(r => '<tr style="page-break-inside:avoid"><td style="' + cell + '">' + esc(r[0]) + '</td>' +
      '<td style="' + cell + ';white-space:pre-line">' + esc(r[1]) + '</td></tr>').join('') + '</table>';
}

// "ISSUED TO:" / "ISSUED BY:" columns under the header
function issued(q) {
  const block = (title, lines) => '<td style="width:50%;vertical-align:top;font-size:12px;line-height:1.6">' +
    '<div style="font-size:13px;font-weight:bold;color:' + C.greenText + '">' + title + '</div>' + lines.map(esc).join('<br>') + '</td>';
  return '<table style="width:100%;border-collapse:collapse;margin-top:14px"><tr>' +
    block('ISSUED TO:', ['Name: ' + q.name, 'Mobile: ' + q.phone, 'Email: ' + q.email].concat(q.branch ? ['Nearest branch: ' + q.branch] : [])) +
    block('ISSUED BY:', [COMPANY.name + ' (' + COMPANY.legal + ')', 'Phone: ' + COMPANY.phone, 'Email: ' + COMPANY.email, 'Address: ' + COMPANY.address]) +
    '</tr></table>';
}

function nextSteps() {
  const steps = [['1', 'We review your build', 'Our sales team checks your options and availability.'],
    ['2', 'You get your price', 'We send the final quotation by email or call you.'],
    ['3', 'Visit or test drive', 'See the cart at your nearest branch: ' + COMPANY.branches + '.']];
  return '<table style="width:100%;border-collapse:collapse;page-break-inside:avoid"><tr>' + steps.map(s =>
    '<td style="width:33%;vertical-align:top;padding:10px;background:' + C.stone + ';border-right:4px solid #ffffff">' +
    '<div style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:11px;background:' + C.green +
    ';color:#ffffff;font-weight:bold;font-size:12px">' + s[0] + '</div>' +
    '<div style="font-size:12px;font-weight:bold;margin:6px 0 2px">' + s[1] + '</div>' +
    '<div style="font-size:11px;color:' + C.mute + '">' + s[2] + '</div></td>').join('') + '</tr></table>';
}

function footer() {
  return '<table style="width:100%;border-collapse:collapse;margin-top:24px"><tr><td style="background:' + C.ink + ';color:#ffffff;padding:12px 18px;font-size:11px">' +
    '<b>' + COMPANY.name + '</b> by ' + COMPANY.legal + ' &middot; ' + COMPANY.site + ' &middot; ' + COMPANY.email + ' &middot; ' + COMPANY.phone +
    '</td></tr></table>';
}

function emailHtml(q, logo, photo, title, intro) {
  return '<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;color:' + C.ink + '">' +
    '<div style="padding:16px 0;border-bottom:1px solid ' + C.line + '">' + logoOrName(logo, 40) + '</div>' +
    '<h2 style="font-size:20px;margin:20px 0 6px">' + title + '</h2>' +
    '<p style="font-size:14px;line-height:1.6;margin:0">' + intro + '</p>' +
    '<p style="font-size:13px;color:' + C.mute + ';margin:8px 0 0">Reference <b style="color:' + C.ink + '">' + esc(q.reference) + '</b></p>' +
    hero(q, photo) +
    heading('Build and options') + table(buildRows(q)) +
    heading('Customer') + table(customerRows(q)) +
    heading('What happens next') + nextSteps() +
    footer() + '</div>';
}

function quotationHtml(q, logo, photo) {
  const date = Utilities.formatDate(q.date, 'Asia/Manila', 'MMMM d, yyyy');
  return '<html><body style="font-family:Arial,Helvetica,sans-serif;color:' + C.ink + ';margin:28px 36px">' +
    '<table style="width:100%;border-collapse:collapse"><tr>' +
    '<td style="vertical-align:middle">' + logoOrName(logo, 46) + '</td>' +
    '<td style="text-align:right;vertical-align:middle">' +
    '<div style="font-size:26px;font-weight:bold;letter-spacing:1px;color:' + C.ink + '">QUOTATION</div>' +
    '<div style="font-size:12px">Quotation No: <b>' + esc(q.reference) + '</b></div>' +
    '<div style="font-size:12px">Date: ' + date + '</div></td></tr></table>' +
    '<div style="border-bottom:3px solid ' + C.green + ';margin-top:10px"></div>' +
    issued(q) +
    hero(q, photo) +
    specTable(buildRows(q)) +
    heading('Pricing') +
    '<p style="font-size:12px;line-height:1.6;margin:0">Pricing for this build will be confirmed by our sales team. ' +
    'This document summarizes the build requested and is not yet a final price offer.</p>' +
    '<div style="page-break-inside:avoid">' + heading('What happens next') + nextSteps() + footer() + '</div></body></html>';
}

function esc(v) {
  return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run this from the Apps Script editor (Run > testQuote) to grant permissions and send yourself a sample.
// The website sends its own logo and photo; the sample borrows them from the site's GitHub repository.
function testQuote() {
  const img = path => {
    const b = UrlFetchApp.fetch('https://raw.githubusercontent.com/SJK-Donna/golfcarts.ph/main/' + path).getBlob();
    return 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes());
  };
  const q = readRequest({ reference: 'QT-SAMPLE', source: 'Test', name: 'Test Customer', email: OWNER_EMAIL, phone: '+63 900 000 0000',
    rows: JSON.stringify([['Model', '2+2 Seater Club Car'], ['Build', 'Scratch'], ['Body color', 'Sapphire'], ['Seat', 'Beige'], ['Accessories', 'None']]),
    notes: 'Test request', logo: img('image/GCPH_logo.png'), photo: img('image/Products/builds/golfer-2-2-scratch.jpg') });
  saveRow(q);
  sendEmails(q);
}
