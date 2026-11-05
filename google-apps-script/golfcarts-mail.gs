// Every email from Golfcarts.ph, sent from the Google account that deploys this script, and the quotation PDF.
//
// Called by the database (supabase/schema.sql, notify_mail) with the shared secret and the record:
//   quote_created          a quote request arrived: the customer gets an acknowledgement (no prices), the owner and
//                          the sales managers get the request
//   quotation_submitted    the master admins are asked to approve it
//   quotation_approved     the person who submitted it can now send it
//   quotation_returned     the person who submitted it gets the master admin's note
//   quotation_sent         the customer gets the quotation PDF
// Called from the admin with the staff member's own sign-in (their Supabase access token):
//   preview                the quotation's PDF, to look at before sending
//   resend                 emails a sent quotation to the customer again (when the first email failed)
// Each email is logged in the database (log_mail), where staff see it in the admin.
//
// Setup:
//   1. script.google.com > New project, paste this file, save.
//   2. Project Settings > Script Properties > Add: NOTIFY_SECRET = the same long random secret as the Vault secret
//      "notify_secret" in Supabase.
//   3. Run > testMail once, and allow the permissions it asks for (it emails OWNER_EMAIL a sample).
//   4. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Copy the web app URL (ends in /exec)
//      into the Vault secret "mail_script_url" and into MAIL_SCRIPT_URL in account.js.
//   After editing this file: Deploy > Manage deployments > Edit > Version: New version (the URL stays the same).

const OWNER_EMAIL = 'donnavalonda@sjkguahan.com';
// The site's Supabase project and its publishable key (the same as in account.js; safe to share)
const SUPABASE_URL = 'https://xcmkkvzxstzxqefhhgxa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zEHyhUcCcO14meqwN3uPuQ_3jLs4-CM';
// The live site, where the logo and cart photos are fetched from, and the admin is linked to.
// GitHub Pages for now: golfcarts.ph doesn't point at this site yet. Change it when it does.
const SITE_URL = 'https://sjk-donna.github.io/golfcarts.ph/';
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
const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function doPost(e) {
  let body = {};
  try { body = JSON.parse((e.postData && e.postData.contents) || '{}'); } catch (err) { return json({ ok: false, error: 'Expected JSON' }); }
  try {
    // From the database: the shared secret, and the record as it was saved
    if (body.secret !== undefined) {
      if (!secret() || body.secret !== secret()) return json({ ok: false, error: 'Not allowed' });
      const staff = body.staff || {};
      if (body.event === 'quote_created') quoteCreated(body.record, staff);
      else if (/^quotation_(submitted|approved|returned|sent)$/.test(body.event)) quotationEvent(body.record, body.event.slice(10), staff);
      else return json({ ok: false, error: 'Unknown event' });
      return json({ ok: true });
    }
    // From the admin: a staff member's sign-in. The quotation is read with it, so the database's rules decide
    // whether this person may see it (only staff can).
    const token = String(body.token || '');
    const id = parseInt(body.id, 10);
    if (!token || !id) return json({ ok: false, error: 'Sign in to the admin first' });
    const user = supabase('/auth/v1/user', token);
    const found = supabase('/rest/v1/quotations?id=eq.' + id + '&select=*', token);
    if (!found || !found.length) return json({ ok: false, error: 'Quotation not found, or you do not have access to it' });
    const qt = found[0];
    if (body.action === 'preview') return json({ ok: true, pdf: Utilities.base64Encode(quotationPdf(qt).getBytes()) });
    if (body.action === 'resend') {
      if (qt.status !== 'sent') return json({ ok: false, error: 'Only a sent quotation can be emailed again' });
      const result = sendQuotation(qt, user.email);
      return json({ ok: result.status === 'sent', error: result.error });
    }
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

function secret() {
  return PropertiesService.getScriptProperties().getProperty('NOTIFY_SECRET') || '';
}

// ---------- Supabase ----------

// A REST call with the publishable key; with a staff member's token, the database's rules apply to them
function supabase(path, token, method, payload) {
  const res = UrlFetchApp.fetch(SUPABASE_URL + path, {
    method: method || 'get',
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + (token || SUPABASE_KEY) },
    contentType: 'application/json',
    payload: payload ? JSON.stringify(payload) : undefined,
    muteHttpExceptions: true
  });
  const text = res.getContentText();
  if (res.getResponseCode() >= 300) throw new Error('Supabase ' + res.getResponseCode() + ': ' + text.slice(0, 300));
  return text ? JSON.parse(text) : null;
}

// Sends one email and logs it in the database (email_log), whether it went out or not
function sendMail(kind, refTable, refId, mail) {
  const to = mail.to.filter(function (a, i, all) { return a && VALID_EMAIL.test(a) && all.indexOf(a) === i; });
  let status = 'sent', error = '';
  try {
    if (!to.length) throw new Error('No one to send to');
    const options = { to: to.join(','), name: COMPANY.name, subject: mail.subject, htmlBody: mail.html };
    if (mail.replyTo && VALID_EMAIL.test(mail.replyTo)) options.replyTo = mail.replyTo;
    if (mail.bcc && mail.bcc.length) options.bcc = mail.bcc.join(',');
    if (mail.attachments) options.attachments = mail.attachments;
    MailApp.sendEmail(options);
  } catch (err) {
    status = 'failed';
    error = String(err && err.message || err);
  }
  try {
    supabase('/rest/v1/rpc/log_mail', null, 'post', { secret: secret(), kind: kind, ref_table: refTable, ref_id: refId, to_addresses: to.join(', '), status: status, error: error });
  } catch (err) {
    console.error('Not logged: ' + err);
  }
  return { status: status, error: error };
}

// ---------- The events ----------

function quoteCreated(q, staff) {
  if (!q) return;
  const rows = requestRows(q);
  sendMail('request_received', 'quotes', q.id, {
    to: [q.email], replyTo: OWNER_EMAIL,
    subject: 'We received your quotation request ' + q.reference,
    html: emailPage('Thank you, ' + esc(q.name) + '!', 'We received your quotation request <b>' + esc(q.reference) + '</b>. Our sales team will prepare your quotation and email it to you.',
      rowsTable([['Model', q.model]].concat(rows.filter(function (r) { return r[0] !== 'Model'; }))) + nextSteps())
  });
  sendMail('request_staff', 'quotes', q.id, {
    to: [OWNER_EMAIL].concat(staff.sales || []), replyTo: q.email,
    subject: 'New quotation request ' + q.reference + ' from ' + q.name,
    html: emailPage('New quotation request', 'From the website (' + esc(q.source) + '). Reply to this email to answer ' + esc(q.name) + ' directly, or prepare the quotation in the admin.',
      rowsTable([['Name', q.name], ['Email', q.email], ['Mobile', q.phone], ['Model', q.model]].concat(rows.filter(function (r) { return r[0] !== 'Model'; }))) + adminLink('Open the admin'))
  });
}

function quotationEvent(qt, status, staff) {
  if (!qt) return;
  const t = totals(qt), c = qt.customer || {};
  const summary = rowsTable([['Quotation', qt.reference], ['Customer', (c.name || '') + ' (' + (c.email || '') + ')'], ['Build', qt.title], ['Total', peso(t.total)]]);
  if (status === 'submitted') {
    sendMail('quotation_submitted', 'quotations', qt.id, {
      to: staff.master || [], replyTo: qt.submitted_by,
      subject: 'Approve quotation ' + qt.reference + ' for ' + (c.name || 'a customer'),
      html: emailPage('A quotation is waiting for your approval', esc(qt.submitted_by) + ' submitted quotation ' + esc(qt.reference) + '.', summary + adminLink('Review it in the admin'))
    });
  } else if (status === 'approved' || status === 'returned') {
    const approved = status === 'approved';
    sendMail('quotation_' + status, 'quotations', qt.id, {
      to: [qt.submitted_by || qt.prepared_by], replyTo: qt.reviewed_by,
      subject: 'Quotation ' + qt.reference + ' ' + (approved ? 'approved' : 'returned'),
      html: emailPage(approved ? 'Your quotation is approved' : 'Your quotation was returned',
        approved ? esc(qt.reviewed_by) + ' approved quotation ' + esc(qt.reference) + '. You can now send it to the customer from the admin.'
          : esc(qt.reviewed_by) + ' returned quotation ' + esc(qt.reference) + ': <b>' + esc(qt.review_note) + '</b>',
        summary + adminLink('Open it in the admin'))
    });
  } else if (status === 'sent') {
    sendQuotation(qt, qt.sent_by);
  }
}

function sendQuotation(qt, replyTo) {
  const c = qt.customer || {}, t = totals(qt);
  return sendMail('quotation_sent', 'quotations', qt.id, {
    to: [c.email], replyTo: replyTo || OWNER_EMAIL, bcc: [OWNER_EMAIL],
    subject: 'Your quotation ' + qt.reference + ' from ' + COMPANY.name,
    html: emailPage('Your quotation is ready, ' + esc(c.name || ''),
      'Thank you for your interest in ' + esc(qt.title || 'our carts') + '. Your quotation ' + esc(qt.reference) + ' is attached as a PDF. Reply to this email with any questions, or to confirm your order.',
      '<p style="font-size:15px;margin:0">Total: <b>' + peso(t.total) + '</b></p>'),
    attachments: [quotationPdf(qt)]
  });
}

// ---------- Email layout ----------

function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; });
}

function peso(n) {
  return 'PHP ' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function rowsTable(rows) {
  return '<table style="width:100%;border-collapse:collapse;font-size:13px">' + rows.map(function (r, i) {
    return '<tr style="background:' + (i % 2 ? '#ffffff' : '#F6F6F2') + '"><td style="padding:7px 10px;border-bottom:1px solid ' + C.line + ';color:' + C.mute + ';width:150px;vertical-align:top">' + esc(r[0]) + '</td>' +
      '<td style="padding:7px 10px;border-bottom:1px solid ' + C.line + ';color:' + C.ink + ';white-space:pre-line">' + esc(r[1]) + '</td></tr>';
  }).join('') + '</table>';
}

function emailPage(title, intro, body) {
  return '<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;color:' + C.ink + '">' +
    '<div style="padding:16px 0;border-bottom:1px solid ' + C.line + '"><img src="' + SITE_URL + 'image/GCPH_logo.png" alt="' + COMPANY.name + '" style="height:36px"></div>' +
    '<h2 style="font-size:20px;margin:20px 0 6px">' + title + '</h2><p style="font-size:14px;line-height:1.6;margin:0 0 14px">' + intro + '</p>' + (body || '') +
    '<p style="font-size:11px;color:' + C.mute + ';margin-top:24px;border-top:1px solid ' + C.line + ';padding-top:12px"><b>' + COMPANY.name + '</b> by ' + COMPANY.legal +
    ' &middot; ' + COMPANY.site + ' &middot; ' + COMPANY.email + ' &middot; ' + COMPANY.phone + '</p></div>';
}

function adminLink(label) {
  return '<p style="margin:16px 0"><a href="' + SITE_URL + 'admin/" style="background:' + C.green + ';color:' + C.ink + ';padding:10px 16px;border-radius:4px;font-weight:bold;text-decoration:none">' + label + '</a></p>';
}

function nextSteps() {
  const steps = [['1', 'We review your build', 'Our sales team checks your options and availability.'],
    ['2', 'You get your price', 'We send the final quotation by email or call you.'],
    ['3', 'Visit or test drive', 'See the cart at your nearest branch: ' + COMPANY.branches + '.']];
  return '<table style="width:100%;border-collapse:collapse;margin-top:16px"><tr>' + steps.map(function (s) {
    return '<td style="width:33%;vertical-align:top;padding:10px;background:' + C.stone + ';border-right:4px solid #ffffff">' +
      '<div style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:11px;background:' + C.green + ';color:#ffffff;font-weight:bold;font-size:12px">' + s[0] + '</div>' +
      '<div style="font-size:12px;font-weight:bold;margin:6px 0 2px">' + s[1] + '</div><div style="font-size:11px;color:' + C.mute + '">' + s[2] + '</div></td>';
  }).join('') + '</tr></table>';
}

// The build rows of a request, then quantity, branch and notes
function requestRows(q) {
  const rows = (q.rows || []).filter(function (r) { return Array.isArray(r) && r.length === 2; }).map(function (r) { return [String(r[0]), String(r[1])]; });
  if (q.quantity) rows.push(['Quantity', q.quantity]);
  if (q.branch) rows.push(['Nearest branch', q.branch]);
  if (q.notes) rows.push(['Notes', q.notes]);
  return rows;
}

// Each line's unit price times its qty; the per-cart subtotal; times the number of carts, less the discount
function totals(qt) {
  const lines = (qt.lines || []).map(function (l) {
    const qty = l.qty == null ? 1 : Number(l.qty), unit = l.price_php == null ? 0 : Number(l.price_php);
    return { item: [l.part, l.option].filter(Boolean).join(' · '), description: l.description || '', qty: qty, unit: unit, amount: unit * qty };
  });
  const perCart = lines.reduce(function (s, l) { return s + l.amount; }, 0);
  const units = Number(qt.units || 1), discount = Number(qt.discount_php || 0);
  return { lines: lines, perCart: perCart, units: units, discount: discount, total: perCart * units - discount };
}

// ---------- The quotation PDF ----------

// An image on the live site as a data URL (the PDF carries its images inline), or ''
function siteImage(path) {
  if (!path) return '';
  try {
    const res = UrlFetchApp.fetch(SITE_URL + String(path).replace(/^\//, ''), { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return '';
    const blob = res.getBlob();
    return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (err) {
    return '';
  }
}

function quotationPdf(qt) {
  return Utilities.newBlob(quotationHtml(qt, siteImage('image/GCPH_logo.png'), siteImage(qt.photo)), MimeType.HTML)
    .getAs(MimeType.PDF).setName('Quotation ' + qt.reference + '.pdf');
}

function quotationHtml(qt, logo, photo) {
  const c = qt.customer || {};
  const rows = (qt.build_rows || []).filter(function (r) { return Array.isArray(r) && r.length === 2; }).map(function (r) { return [String(r[0]), String(r[1])]; });
  const model = (rows.filter(function (r) { return r[0] === 'Model'; })[0] || [])[1] || qt.title || 'Your golf cart';
  const build = (rows.filter(function (r) { return r[0] === 'Build'; })[0] || [])[1] || '';
  const spec = rows.filter(function (r) { return r[0] !== 'Model' && r[0] !== 'Build'; }).concat([['Quantity', String(qt.units || 1)]]);
  const t = totals(qt);
  const date = Utilities.formatDate(qt.sent_at ? new Date(qt.sent_at) : new Date(), 'Asia/Manila', 'MMMM d, yyyy');
  const block = function (title, lines) {
    return '<td style="width:50%;vertical-align:top;font-size:12px;line-height:1.6"><div style="font-size:13px;font-weight:bold;color:' + C.greenText + '">' + title + '</div>' + lines.map(esc).join('<br>') + '</td>';
  };
  const heading = function (text) {
    return '<div style="font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:' + C.greenText + ';border-bottom:2px solid ' + C.green + ';padding-bottom:4px;margin:16px 0 6px">' + text + '</div>';
  };
  const specCell = 'padding:7px 10px;border:1px solid ' + C.green + ';vertical-align:top;font-size:12px';
  const cell = 'padding:6px 8px;border:1px solid ' + C.line + ';font-size:11px;vertical-align:top';
  const head = 'padding:7px 8px;font-size:11px;font-weight:bold;color:#ffffff;background:' + C.ink;
  const money = 'text-align:right;white-space:nowrap';
  const sum = function (label, value, strong) {
    return '<tr><td colspan="3" style="' + cell + ';text-align:right' + (strong ? ';font-weight:bold' : '') + '">' + label + '</td><td style="' + cell + ';' + money + (strong ? ';font-weight:bold;font-size:13px' : '') + '">' + value + '</td></tr>';
  };
  return '<html><body style="font-family:Arial,Helvetica,sans-serif;color:' + C.ink + ';margin:28px 36px">' +
    '<table style="width:100%;border-collapse:collapse"><tr><td style="vertical-align:middle">' +
    (logo ? '<img src="' + logo + '" alt="' + COMPANY.name + '" style="height:46px">' : '<span style="font-size:22px;font-weight:bold">' + COMPANY.name + '</span>') + '</td>' +
    '<td style="text-align:right;vertical-align:middle"><div style="font-size:26px;font-weight:bold;letter-spacing:1px">QUOTATION</div>' +
    '<div style="font-size:12px">Quotation No: <b>' + esc(qt.reference) + '</b></div><div style="font-size:12px">Date: ' + date + '</div></td></tr></table>' +
    '<div style="border-bottom:3px solid ' + C.green + ';margin-top:10px"></div>' +
    '<table style="width:100%;border-collapse:collapse;margin-top:14px"><tr>' +
    block('ISSUED TO:', ['Name: ' + (c.name || ''), 'Mobile: ' + (c.phone || ''), 'Email: ' + (c.email || '')].concat(c.branch ? ['Nearest branch: ' + c.branch] : [])) +
    block('ISSUED BY:', [COMPANY.name + ' (' + COMPANY.legal + ')', 'Phone: ' + COMPANY.phone, 'Email: ' + COMPANY.email, 'Address: ' + COMPANY.address]) + '</tr></table>' +
    '<div style="text-align:center;margin-top:20px"><div style="font-size:24px;font-weight:bold">' + esc(model) + '</div>' +
    (build ? '<div style="font-size:15px;font-weight:bold;color:' + C.greenText + ';margin-top:4px">' + esc(build) + '</div>' : '') +
    (photo ? '<img src="' + photo + '" alt="" style="width:280px;max-width:100%;margin-top:10px">' : '') + '</div>' +
    '<table style="width:100%;border-collapse:collapse;margin-top:16px"><tr>' +
    '<td style="' + specCell + ';width:38%;background:' + C.green + ';color:#ffffff;font-weight:bold">SPECIFICATION / ITEM</td>' +
    '<td style="' + specCell + ';background:' + C.ink + ';border-color:' + C.ink + ';color:#ffffff;font-weight:bold;text-align:center">DETAILS</td></tr>' +
    spec.map(function (r) { return '<tr style="page-break-inside:avoid"><td style="' + specCell + '">' + esc(r[0]) + '</td><td style="' + specCell + ';white-space:pre-line">' + esc(r[1]) + '</td></tr>'; }).join('') + '</table>' +
    heading('Price') +
    '<table style="width:100%;border-collapse:collapse;margin-top:8px"><tr><td style="' + head + '">ITEM</td><td style="' + head + ';text-align:center">QTY</td>' +
    '<td style="' + head + ';' + money + '">UNIT PRICE</td><td style="' + head + ';' + money + '">AMOUNT</td></tr>' +
    t.lines.map(function (l) {
      return '<tr style="page-break-inside:avoid"><td style="' + cell + '"><b>' + esc(l.item) + '</b>' + (l.description ? '<br><span style="color:' + C.mute + '">' + esc(l.description) + '</span>' : '') +
        '</td><td style="' + cell + ';text-align:center">' + l.qty + '</td><td style="' + cell + ';' + money + '">' + peso(l.unit) + '</td><td style="' + cell + ';' + money + '">' + peso(l.amount) + '</td></tr>';
    }).join('') +
    sum('Price per cart', peso(t.perCart)) + (t.units !== 1 ? sum('Number of carts', String(t.units)) : '') +
    (t.discount ? sum('Discount', '- ' + peso(t.discount)) : '') + sum('TOTAL', peso(t.total), true) + '</table>' +
    (qt.notes ? heading('Notes') + '<p style="font-size:12px;line-height:1.6;margin:0;white-space:pre-line">' + esc(qt.notes) + '</p>' : '') +
    (qt.terms ? heading('Terms') + '<p style="font-size:11px;line-height:1.6;margin:0;white-space:pre-line;color:' + C.mute + '">' + esc(qt.terms) + '</p>' : '') +
    '<table style="width:100%;border-collapse:collapse;margin-top:24px"><tr><td style="background:' + C.ink + ';color:#ffffff;padding:12px 18px;font-size:11px">' +
    '<b>' + COMPANY.name + '</b> by ' + COMPANY.legal + ' &middot; ' + COMPANY.site + ' &middot; ' + COMPANY.email + ' &middot; ' + COMPANY.phone + '</td></tr></table></body></html>';
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run this from the editor (Run > testMail) to grant the permissions and email OWNER_EMAIL a sample acknowledgement
// and a sample quotation PDF. Nothing is logged in the database.
function testMail() {
  const q = { id: 0, reference: 'QT-SAMPLE', source: 'Test', name: 'Test Customer', email: OWNER_EMAIL, phone: '+63 900 000 0000', model: 'Golfer 2+2',
    quantity: '1', branch: 'Manila', notes: 'Test request', rows: [['Model', 'Golfer 2+2'], ['Build', 'Scratch'], ['Body color', 'Sapphire'], ['Seat', 'Beige']] };
  const qt = { id: 0, reference: 'QT-SAMPLE', title: 'Golfer 2+2 · Scratch', customer: { name: 'Test Customer', email: OWNER_EMAIL, phone: '+63 900 000 0000' },
    build_rows: q.rows, units: 1, lines: [{ part: 'Cart', option: 'Golfer 2+2 Scratch', qty: 1, price_php: 650000 }], photo: 'image/Products/builds/golfer-2-2-scratch.jpg' };
  MailApp.sendEmail({ to: OWNER_EMAIL, name: COMPANY.name, subject: 'Sample: quotation request ' + q.reference,
    htmlBody: emailPage('Thank you, ' + esc(q.name) + '!', 'This is a sample of the acknowledgement customers get.', rowsTable(requestRows(q)) + nextSteps()),
    attachments: [quotationPdf(qt)] });
}
