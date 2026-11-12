// Every email from Golfcarts.ph, sent from the Google account that deploys this script, and the quotation PDF.
//
// Called by the database (supabase/schema.sql, notify_mail) with the shared secret and the record:
//   quote_created          a quote request arrived: the customer gets an acknowledgement (no prices), the owner and
//                          the sales managers get the request
//   quotation_submitted    its approvers (the GM, or the sales manager and the GM, by margin) are asked to approve it
//   quotation_approved     the person who submitted it can now send it
//   quotation_returned     the person who submitted it gets the master admin's note
//   quotation_sent         the customer gets the quotation PDF
//   quote_zoho             a lead that failed to reach Zoho CRM is sent again (Marketing's Send again in the admin)
//   sku_photos             staff pressed "Get photos from Zoho now": the Zoho items and their photos are copied at
//                          once (syncZohoPhotos)
// Each new quote request also becomes a Lead in Zoho CRM (sendLead), and the result is logged through log_zoho.
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
//
// Zoho CRM (the Leads), once:
//   a. api-console.zoho.com > Add Client > Self Client. Copy its Client ID and Client Secret into Script Properties as
//      ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET.
//   b. In the Self Client: Generate Code, scope ZohoCRM.modules.leads.CREATE, 10 minutes. Paste the code into Script
//      Properties as ZOHO_GRANT_CODE, then Run > connectZoho within those 10 minutes. It saves ZOHO_REFRESH_TOKEN
//      and removes the code. The refresh token is like a password: it stays in Script Properties, nowhere else.
//   If your Zoho account isn't on zoho.com (the address bar shows zoho.eu, zoho.in, zoho.com.au...), also add
//   ZOHO_ACCOUNTS_URL, for example https://accounts.zoho.eu.
//
// Zoho Inventory (the SKU photos in the admin), once:
//   a. In the same Self Client: Generate Code with both scopes, ZohoCRM.modules.leads.CREATE,ZohoInventory.items.READ,
//      10 minutes. Put it in ZOHO_GRANT_CODE and Run > connectZoho again (the old refresh token only covers Leads).
//   b. Run > setupZohoPhotos, and allow the Drive permission it asks for. It creates the Drive folder "Golfcarts.ph SKU
//      photos (from Zoho Inventory)", shared so anyone with a link can view (the admin shows the photos from there),
//      copies the photos, and from then on copies new or changed ones every hour.
//   c. Deploy > Manage deployments > Edit > Version: New version, so the admin's "Get photos from Zoho now" works.

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
// Which copy of this script answered: the admin shows it after a PDF preview. Change it with each edit
const SCRIPT_VERSION = '2026-11-12 stock-sheet';
// What the last PDF's page 3 was made from, for that same message (set by quotationPdf)
let lastPage3 = '';

// Opening the web app's address in a browser shows which copy of this script that deployment runs
function doGet() {
  return json({ ok: true, version: SCRIPT_VERSION });
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse((e.postData && e.postData.contents) || '{}'); } catch (err) { return json({ ok: false, error: 'Expected JSON' }); }
  try {
    // From the database: the shared secret, and the record as it was saved
    if (body.secret !== undefined) {
      if (!secret() || body.secret !== secret()) return json({ ok: false, error: 'Not allowed' });
      const staff = body.staff || {};
      if (body.event === 'quote_created') quoteCreated(body.record, staff);
      else if (body.event === 'quote_zoho') sendLead(body.record);
      else if (body.event === 'sku_photos') syncZohoPhotos();
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
    if (body.action === 'preview') return json({ ok: true, pdf: Utilities.base64Encode(quotationPdf(qt).getBytes()), version: SCRIPT_VERSION, page3: lastPage3 });
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
  if (q.source === 'Service and support') return serviceCreated(q, rows, staff);
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
  sendLead(q);
}

// A booking from the Service and support page: saved with the quotes, but worded as a service request.
// Its rows already carry the service, the cart, the branch and the note
function serviceCreated(q, rows, staff) {
  sendMail('request_received', 'quotes', q.id, {
    to: [q.email], replyTo: OWNER_EMAIL,
    subject: 'We received your service request ' + q.reference,
    html: emailPage('Thank you, ' + esc(q.name) + '!', 'We received your service request <b>' + esc(q.reference) + '</b>. Our service team will call you to confirm a schedule.',
      rowsTable(rows))
  });
  sendMail('request_staff', 'quotes', q.id, {
    to: [OWNER_EMAIL].concat(staff.sales || []), replyTo: q.email,
    subject: 'New service request ' + q.reference + ' from ' + q.name,
    html: emailPage('New service request', 'From the Service and support page. Reply to this email to answer ' + esc(q.name) + ' directly.',
      rowsTable([['Name', q.name], ['Email', q.email], ['Mobile', q.phone]].concat(rows)) + adminLink('Open the admin'))
  });
  sendLead(q);
}

function quotationEvent(qt, status, staff) {
  if (!qt) return;
  const t = totals(qt), c = qt.customer || {};
  const summary = rowsTable([['Quotation', qt.reference], ['Customer', (c.name || '') + ' (' + (c.email || '') + ')'], ['Build', qt.title], ['Total', peso(t.total)]]);
  if (status === 'submitted') {
    sendMail('quotation_submitted', 'quotations', qt.id, {
      // Whoever may approve it at its margin (the GM, or the sales manager and the GM); set by the database
      to: (qt.approvers && qt.approvers.length) ? qt.approvers : (staff.master || []), replyTo: qt.submitted_by,
      subject: 'Approve quotation ' + qt.reference + ' for ' + (c.name || 'a customer'),
      html: emailPage('A quotation is waiting for your approval', esc(qt.submitted_by) + ' submitted quotation ' + esc(qt.reference) + '.', summary + adminLink('Review it in the admin'))
    });
  } else if (status === 'approved' || status === 'returned') {
    const approved = status === 'approved';
    sendMail('quotation_' + status, 'quotations', qt.id, {
      to: [qt.submitted_by || qt.prepared_by], replyTo: qt.reviewed_by,
      subject: 'Quotation ' + qt.reference + ' ' + (approved ? 'approved' : 'returned'),
      html: emailPage(approved ? 'Your quotation is approved' : 'Your quotation was returned',
        approved ? (qt.reviewed_by === qt.submitted_by && !(qt.approvers || []).length
            ? 'Quotation ' + esc(qt.reference) + ' has a margin over 25%, so it was approved when you submitted it. Its PDF and PSS are ready in the admin, and you can send it to the customer.'
            : esc(qt.reviewed_by) + ' approved quotation ' + esc(qt.reference) + '. Its PDF and PSS are ready in the admin, and you can send it to the customer.')
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

// The Golfer builds as the site names them: Scratch -> Scratch Golfer, Pro -> Pro Golfer (the request keeps the short
// name, which the bundles match on)
function buildName(b) {
  return /^(Scratch|Pro)$/.test(String(b)) ? b + ' Golfer' : String(b || '');
}

// The same for the PDF: "Golfer" in italic, a little smaller
function buildNameHtml(b) {
  return /^(Scratch|Pro)$/.test(String(b)) ? esc(b) + ' <i style="font-family:Georgia,serif;font-weight:normal;font-size:85%">Golfer</i>' : esc(b);
}

// The build rows of a request, then quantity, branch and notes
function requestRows(q) {
  const rows = (q.rows || []).filter(function (r) { return Array.isArray(r) && r.length === 2; }).map(function (r) { return [String(r[0]), r[0] === 'Build' ? buildName(r[1]) : String(r[1])]; });
  if (q.quantity) rows.push(['Quantity', q.quantity]);
  if (q.branch) rows.push(['Nearest branch', q.branch]);
  if (q.notes) rows.push(['Notes', q.notes]);
  return rows;
}

// Each line's unit price times its qty; the per-cart subtotal; times the number of carts, less the discount
function totals(qt) {
  const lines = (qt.lines || []).map(function (l) {
    const qty = l.qty == null ? 1 : Number(l.qty), unit = l.price_php == null ? 0 : Number(l.price_php);
    return { item: [l.part, l.option].filter(Boolean).join(' · '), description: l.description || '', qty: qty, unit: unit, amount: unit * qty, upgrade: !!l.upgrade };
  });
  const perCart = lines.reduce(function (s, l) { return s + l.amount; }, 0);
  const units = Number(qt.units || 1), discount = Number(qt.discount_php || 0);
  return { lines: lines, perCart: perCart, units: units, discount: discount, total: perCart * units - discount };
}

// ---------- The quotation PDF ----------
// Page 1: the quotation, with the build as one package price and each upgrade priced on its own.
// Page 2: the specifications (the build chosen, and the model's) and the warranty.
// Page 3: a brochure of upgrades the model can take (when the admin saved some with the quotation).

// Images on the live site as data URLs (the PDF carries its images inline), fetched together; '' for any that
// isn't an image (a wrong SITE_URL returns a web page, which would show as a broken image)
function siteImages(paths) {
  // A path on the site, or a full address (a photo uploaded in the admin, in Supabase Storage)
  const wanted = paths.map(function (p) { return !p ? '' : /^https?:\/\//.test(p) ? String(p) : SITE_URL + encodeURI(String(p).replace(/^\//, '')); });
  const urls = wanted.filter(Boolean);
  let responses = [];
  try {
    responses = UrlFetchApp.fetchAll(urls.map(function (u) { return { url: u, muteHttpExceptions: true }; }));
  } catch (err) {
    return paths.map(function () { return ''; });
  }
  let next = 0;
  return wanted.map(function (u) {
    if (!u) return '';
    const res = responses[next++];
    if (!res || res.getResponseCode() !== 200) return '';
    const blob = res.getBlob();
    const type = blob.getContentType() || '';
    return /^image\//.test(type) ? 'data:' + type + ';base64,' + Utilities.base64Encode(blob.getBytes()) : '';
  });
}

function quotationPdf(qt) {
  // Up to 8 upgrades (two rows of four); quotations saved before 2026-11-12 may carry 9
  const offers = ((qt.pdf_extra || {}).offers || []).filter(function (o) { return o && o.name; }).slice(0, 8);
  // Page 3 as one picture, drawn by the admin when the quotation was saved (account.js drawQuotationPage3); without it,
  // the plain page 3 below, with the upgrades' own photos
  const picture = offers.length ? String((qt.pdf_extra || {}).page3 || '') : '';
  const images = siteImages(['image/GCPH_logo.png', qt.photo, picture].concat(picture ? [] : offers.map(function (o) { return o.image; })));
  const offerImages = images.slice(3);
  lastPage3 = !offers.length ? 'none (no upgrades)' : !picture ? 'plain (no page 3 picture saved)'
    : images[2] ? 'picture' : 'plain (the picture could not be fetched: ' + picture + ')';
  return Utilities.newBlob(quotationHtml(qt, images[0], images[1], offers.map(function (o, i) { return { group: o.group, name: o.name, image: offerImages[i] }; }), images[2]), MimeType.HTML)
    .getAs(MimeType.PDF).setName('Quotation ' + qt.reference + '.pdf');
}

// The price lines as the customer sees them: the build's own lines as one package, then the upgrades
function customerLines(qt, model, build) {
  const t = totals(qt);
  const upgrades = t.lines.filter(function (l) { return l.upgrade; });
  const pkg = t.lines.filter(function (l) { return !l.upgrade; }).reduce(function (s, l) { return s + l.amount; }, 0);
  const rows = t.lines.some(function (l) { return !l.upgrade; })
    ? [{ item: model + (build ? ' · ' + buildName(build) : ''), description: 'Complete cart as specified on page 2', qty: 1, unit: pkg, amount: pkg }] : [];
  return { t: t, rows: rows.concat(upgrades) };
}

function quotationHtml(qt, logo, photo, offers, page3Picture) {
  const c = qt.customer || {};
  const extra = qt.pdf_extra || {};
  const rows = (qt.build_rows || []).filter(function (r) { return Array.isArray(r) && r.length === 2; }).map(function (r) { return [String(r[0]), String(r[1])]; });
  const model = (rows.filter(function (r) { return r[0] === 'Model'; })[0] || [])[1] || qt.title || 'Your golf cart';
  const build = (rows.filter(function (r) { return r[0] === 'Build'; })[0] || [])[1] || '';
  const spec = rows.filter(function (r) { return r[0] !== 'Model' && r[0] !== 'Build'; }).concat([['Quantity', String(qt.units || 1)]]);
  const modelSpecs = (extra.specs || []).filter(function (r) { return Array.isArray(r) && r.length === 2; });
  const priced = customerLines(qt, model, build), t = priced.t;
  const date = Utilities.formatDate(qt.sent_at ? new Date(qt.sent_at) : new Date(), 'Asia/Manila', 'MMMM d, yyyy');
  const block = function (title, lines) {
    return '<td style="width:50%;vertical-align:top;font-size:11px;line-height:1.5"><div style="font-size:12px;font-weight:bold;color:' + C.greenText + '">' + title + '</div>' + lines.map(esc).join('<br>') + '</td>';
  };
  const heading = function (text) {
    return '<div style="font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:' + C.greenText + ';border-bottom:2px solid ' + C.green + ';padding-bottom:4px;margin:14px 0 6px">' + text + '</div>';
  };
  const logoHtml = function (h) {
    return logo ? '<img src="' + logo + '" alt="' + COMPANY.name + '" style="height:' + h + 'px">' : '<span style="font-size:' + Math.round(h / 2) + 'px;font-weight:bold">' + COMPANY.name + '</span>';
  };
  // The small header of pages 2 and 3
  const pageHead = function (label) {
    return '<table style="width:100%;border-collapse:collapse"><tr><td style="vertical-align:middle">' + logoHtml(34) + '</td>' +
      '<td style="text-align:right;vertical-align:middle;font-size:11px;color:' + C.mute + '"><b style="color:' + C.ink + ';letter-spacing:1px">' + label + '</b><br>Quotation ' + esc(qt.reference) + ' · ' + date + '</td></tr></table>' +
      '<div style="border-bottom:3px solid ' + C.green + ';margin-top:8px"></div>';
  };
  const footer = '<table style="width:100%;border-collapse:collapse;margin-top:18px"><tr><td style="background:' + C.ink + ';color:#ffffff;padding:10px 16px;font-size:10px">' +
    '<b>' + COMPANY.name + '</b> by ' + COMPANY.legal + ' &middot; ' + COMPANY.site + ' &middot; ' + COMPANY.email + ' &middot; ' + COMPANY.phone + '</td></tr></table>';
  const pageBreak = '<div style="page-break-before:always"></div>';
  // Each page's margins (2026-11-12): the converter's own are turned off (@page, at the end) so page 3 can fill the
  // whole sheet; pages 1 and 2 keep theirs as padding, about as wide as before
  const PAGE_PAD = 'padding:38px 52px 30px';
  const specCell = 'padding:6px 9px;border:1px solid ' + C.green + ';vertical-align:top;font-size:11px';
  const specTable = function (title, list) {
    return '<table style="width:100%;border-collapse:collapse"><tr><td colspan="2" style="' + specCell + ';background:' + C.green + ';color:#ffffff;font-weight:bold">' + title + '</td></tr>' +
      list.map(function (r) { return '<tr style="page-break-inside:avoid"><td style="' + specCell + ';width:42%;color:' + C.mute + '">' + esc(r[0]) + '</td><td style="' + specCell + ';white-space:pre-line">' + esc(r[1]) + '</td></tr>'; }).join('') + '</table>';
  };
  const cell = 'padding:6px 8px;border:1px solid ' + C.line + ';font-size:11px;vertical-align:top';
  const head = 'padding:6px 8px;font-size:10px;font-weight:bold;color:#ffffff;background:' + C.ink;
  const money = 'text-align:right;white-space:nowrap';
  const sum = function (label, value, strong) {
    return '<tr><td colspan="3" style="' + cell + ';text-align:right' + (strong ? ';font-weight:bold' : '') + '">' + label + '</td><td style="' + cell + ';' + money + (strong ? ';font-weight:bold;font-size:13px' : '') + '">' + value + '</td></tr>';
  };

  // ---- Page 1: the quotation
  const page1 = '<div style="' + PAGE_PAD + '"><table style="width:100%;border-collapse:collapse"><tr><td style="vertical-align:middle">' + logoHtml(44) + '</td>' +
    '<td style="text-align:right;vertical-align:middle"><div style="font-size:24px;font-weight:bold;letter-spacing:1px">QUOTATION</div>' +
    '<div style="font-size:11px">Quotation No: <b>' + esc(qt.reference) + '</b></div><div style="font-size:11px">Date: ' + date + '</div></td></tr></table>' +
    '<div style="border-bottom:3px solid ' + C.green + ';margin-top:8px"></div>' +
    '<table style="width:100%;border-collapse:collapse;margin-top:12px"><tr>' +
    block('ISSUED TO:', ['Name: ' + (c.name || ''), 'Mobile: ' + (c.phone || ''), 'Email: ' + (c.email || '')].concat(c.branch ? ['Nearest branch: ' + c.branch] : [])) +
    block('ISSUED BY:', [COMPANY.name + ' (' + COMPANY.legal + ')', 'Phone: ' + COMPANY.phone, 'Email: ' + COMPANY.email, 'Address: ' + COMPANY.address]) + '</tr></table>' +
    '<div style="text-align:center;margin-top:14px"><div style="font-size:21px;font-weight:bold">' + esc(model) + '</div>' +
    (build ? '<div style="font-size:14px;font-weight:bold;color:' + C.greenText + ';margin-top:2px">' + buildNameHtml(build) + '</div>' : '') +
    (photo ? '<img src="' + photo + '" alt="" style="height:190px;max-width:100%;margin-top:8px">' : '') + '</div>' +
    heading('Price') +
    '<table style="width:100%;border-collapse:collapse;margin-top:6px"><tr><td style="' + head + '">ITEM</td><td style="' + head + ';text-align:center">QTY</td>' +
    '<td style="' + head + ';' + money + '">UNIT PRICE</td><td style="' + head + ';' + money + '">AMOUNT</td></tr>' +
    priced.rows.map(function (l) {
      return '<tr style="page-break-inside:avoid"><td style="' + cell + '"><b>' + esc(l.item) + '</b>' + (l.description ? '<br><span style="color:' + C.mute + '">' + esc(l.description) + '</span>' : '') +
        '</td><td style="' + cell + ';text-align:center">' + l.qty + '</td><td style="' + cell + ';' + money + '">' + peso(l.unit) + '</td><td style="' + cell + ';' + money + '">' + peso(l.amount) + '</td></tr>';
    }).join('') +
    (t.units !== 1 || priced.rows.length > 1 ? sum('Price per cart', peso(t.perCart)) : '') + (t.units !== 1 ? sum('Number of carts', String(t.units)) : '') +
    (t.discount ? sum('Discount', '- ' + peso(t.discount)) : '') + sum('TOTAL', peso(t.total), true) + '</table>' +
    (qt.notes ? heading('Notes') + '<p style="font-size:11px;line-height:1.5;margin:0;white-space:pre-line">' + esc(qt.notes) + '</p>' : '') +
    (qt.terms ? heading('Terms') + '<p style="font-size:10px;line-height:1.5;margin:0;white-space:pre-line;color:' + C.mute + '">' + esc(qt.terms) + '</p>' : '') +
    footer + '</div>';

  // ---- Page 2: specifications and warranty
  const page2 = pageBreak + '<div style="' + PAGE_PAD + '">' + pageHead('SPECIFICATIONS & WARRANTY') +
    '<div style="font-size:20px;font-weight:bold;margin-top:16px">' + esc(model) + (build ? ' <span style="color:' + C.greenText + '">· ' + buildNameHtml(build) + '</span>' : '') + '</div>' +
    heading('Specifications') +
    (modelSpecs.length
      ? '<table style="width:100%;border-collapse:collapse"><tr><td style="width:50%;vertical-align:top;padding-right:8px">' + specTable('YOUR BUILD', spec) + '</td>' +
        '<td style="width:50%;vertical-align:top;padding-left:8px">' + specTable('MODEL SPECIFICATIONS', modelSpecs) + '</td></tr></table>'
      : specTable('YOUR BUILD', spec)) +
    heading('Warranty') +
    '<p style="font-size:11px;line-height:1.6;margin:0;white-space:pre-line">' + esc(qt.warranty || 'Warranty terms are confirmed with your order. Ask your sales consultant for the details for your cart.') + '</p>' +
    footer + '</div>';

  // ---- Page 3: upgrades the model can take (2026-11-12). The converter drops backgrounds, so page 3 is a picture the
  // admin draws (the designer's background, the customer's cart, the upgrade cards), across the whole sheet. Without
  // it (a quotation saved before, or a picture that didn't load): a plain page with the headline and the cards
  const SLATE = '#4E6276', MIST = '#F1F3EE', PAGE3_HEIGHT = '11.62in';
  const cellsPerRow = 4;
  const offerRows = [];
  for (let i = 0; i < offers.length; i += cellsPerRow) offerRows.push(offers.slice(i, i + cellsPerRow));
  const page3 = !offers.length ? '' : page3Picture
    ? pageBreak + '<img src="' + page3Picture + '" alt="Upgrades and accessories for your cart" style="display:block;width:100%;height:11.66in">'
    : pageBreak +
    '<div style="height:' + PAGE3_HEIGHT + ';overflow:hidden;background:' + SLATE + '">' +
    '<div style="background:' + MIST + ';padding:30px 40px 0">' + pageHead('UPGRADES & ACCESSORIES') + '</div>' +
    '<div style="background:' + MIST + ';padding:16px 40px 14px"><div style="font-family:Georgia,serif;font-size:30px;font-weight:bold">ELEVATE YOUR RIDE</div>' +
      '<div style="font-size:15px;font-weight:bold;margin:2px 0 6px">TRANSFORM YOUR CART INTO A MASTERPIECE</div>' +
      '<p style="font-size:11px;line-height:1.5;margin:0;color:' + C.mute + '">Upgrades and accessories that fit your ' + esc(model) + '. Tell us what you need: we\'ll price it and make it yours.</p></div>' +
    '<div style="padding:10px 30px 0"><table style="width:100%;border-collapse:separate;border-spacing:10px">' + offerRows.map(function (row) {
      return '<tr style="page-break-inside:avoid">' + row.map(function (o) {
        return '<td style="width:25%;vertical-align:top;background:#ffffff;padding:7px 7px 9px;text-align:center">' +
          '<div style="background:#F1F2EE;height:124px;text-align:center">' +
          (o.image ? '<img src="' + o.image + '" alt="" style="height:116px;max-width:100%;margin-top:4px">' : '') + '</div>' +
          '<div style="font-size:8px;letter-spacing:1px;text-transform:uppercase;color:' + C.mute + ';margin-top:7px">' + esc(o.group) + '</div>' +
          '<div style="font-size:10.5px;font-weight:bold;line-height:1.25;margin-top:2px">' + esc(o.name) + '</div></td>';
      }).join('') + new Array(cellsPerRow - row.length + 1).join('<td style="width:25%"></td>') + '</tr>';
    }).join('') + '</table></div>' +
    // "More from Golfcarts.ph", white on the slate, with its speech-bubble tail; then the company line
    '<div style="padding:18px 40px 0"><table style="width:100%;border-collapse:collapse"><tr><td style="border:2px solid ' + C.green + ';background:#44586B;color:#FFFFFF;padding:11px 16px;font-size:11px;line-height:1.6">' +
    '<b style="font-size:12px">More from ' + COMPANY.name + '</b><br>Golf carts, lifestyle carts, resort shuttles and utility carts, plus parts and service at our branches in ' + COMPANY.branches + '.' +
    ' See the full range at <b>' + COMPANY.site + '</b> or call <b>' + COMPANY.phone + '</b>.</td></tr></table>' +
    '<div style="width:0;height:0;margin-left:36px;border-top:16px solid ' + C.green + ';border-right:16px solid transparent"></div></div>' +
    '<div style="padding:18px 40px 0;font-size:10px;color:#C9D3DC"><b style="color:#FFFFFF">' + COMPANY.name + '</b> by ' + COMPANY.legal + ' &middot; ' + COMPANY.site +
    ' &middot; ' + COMPANY.email + ' &middot; ' + COMPANY.phone + '</div>' +
    '</div>';

  // @page: no margins from the converter (each page sets its own, above), on A4 as the quotations have always been
  return '<html><head><style>@page { size: A4; margin: 0; }</style></head><body style="font-family:Arial,Helvetica,sans-serif;color:' + C.ink + ';margin:0">' +
    page1 + page2 + page3 + '</body></html>';
}

// ---------- Zoho CRM ----------

function zohoSettings() {
  const p = PropertiesService.getScriptProperties();
  return { id: p.getProperty('ZOHO_CLIENT_ID'), secret: p.getProperty('ZOHO_CLIENT_SECRET'), refresh: p.getProperty('ZOHO_REFRESH_TOKEN'),
    accounts: String(p.getProperty('ZOHO_ACCOUNTS_URL') || 'https://accounts.zoho.com').replace(/\/+$/, '') };
}

// A short-lived access token from the refresh token, kept for just under an hour
function zohoAccess() {
  const cache = CacheService.getScriptCache();
  const kept = cache.get('zoho_access');
  if (kept) return JSON.parse(kept);
  const z = zohoSettings();
  if (!z.id || !z.secret || !z.refresh) throw new Error('Zoho CRM isn\'t connected yet: see "Zoho CRM" in the email script\'s setup notes');
  const res = UrlFetchApp.fetch(z.accounts + '/oauth/v2/token', { method: 'post', muteHttpExceptions: true,
    payload: { refresh_token: z.refresh, client_id: z.id, client_secret: z.secret, grant_type: 'refresh_token' } });
  const data = JSON.parse(res.getContentText() || '{}');
  if (!data.access_token) throw new Error('Zoho sign-in failed: ' + (data.error || ('HTTP ' + res.getResponseCode())));
  const access = { token: data.access_token, api: data.api_domain || 'https://www.zohoapis.com' };
  cache.put('zoho_access', JSON.stringify(access), Math.max(60, (data.expires_in || 3600) - 300));
  return access;
}

// The request as a Zoho Lead: the last word of the name is the last name (the only field Zoho requires)
function zohoLead(q) {
  const parts = String(q.name || '').trim().split(/\s+/).filter(Boolean);
  const last = parts.length ? parts.pop() : 'Website request';
  const lines = ['Quote request ' + q.reference + ' from the website (' + (q.source || 'website') + ')', 'Model: ' + (q.model || '')]
    .concat(requestRows(q).filter(function (r) { return r[0] !== 'Model'; }).map(function (r) { return r[0] + ': ' + r[1]; }));
  const lead = { Last_Name: last.slice(0, 80), Lead_Source: 'Website', Description: lines.join('\n').slice(0, 32000) };
  if (parts.length) lead.First_Name = parts.join(' ').slice(0, 40);
  if (VALID_EMAIL.test(String(q.email || ''))) lead.Email = String(q.email);
  if (q.phone) lead.Mobile = String(q.phone).slice(0, 30);
  return lead;
}

// Creates the Lead and logs the result, whether it worked or not
function sendLead(q) {
  if (!q || !q.id) return;
  let result = 'sent', leadId = '', error = '';
  try {
    const access = zohoAccess();
    const res = UrlFetchApp.fetch(access.api + '/crm/v8/Leads', { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { Authorization: 'Zoho-oauthtoken ' + access.token },
      payload: JSON.stringify({ data: [zohoLead(q)], trigger: ['workflow'] }) });
    const body = JSON.parse(res.getContentText() || '{}');
    const one = body.data && body.data[0];
    if (one && one.code === 'SUCCESS') leadId = String(one.details.id);
    else {
      if (res.getResponseCode() === 401) CacheService.getScriptCache().remove('zoho_access');
      const field = one && one.details && one.details.api_name ? ' (' + one.details.api_name + ')' : '';
      throw new Error(one ? one.message + field : (body.message || ('Zoho replied HTTP ' + res.getResponseCode())));
    }
  } catch (err) {
    result = 'failed';
    error = String(err && err.message || err);
  }
  try {
    supabase('/rest/v1/rpc/log_zoho', null, 'post', { secret: secret(), ref_id: q.id, result: result, lead_id: leadId, error_text: error });
  } catch (err) {
    console.error('Zoho result not logged: ' + err);
  }
}

// Run once (Run > connectZoho) after putting ZOHO_GRANT_CODE in Script Properties: saves the refresh token
function connectZoho() {
  const p = PropertiesService.getScriptProperties(), z = zohoSettings(), code = p.getProperty('ZOHO_GRANT_CODE');
  if (!z.id || !z.secret || !code) throw new Error('Add ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET and ZOHO_GRANT_CODE to Script Properties first');
  const res = UrlFetchApp.fetch(z.accounts + '/oauth/v2/token', { method: 'post', muteHttpExceptions: true,
    payload: { code: code, client_id: z.id, client_secret: z.secret, grant_type: 'authorization_code' } });
  const data = JSON.parse(res.getContentText() || '{}');
  if (!data.refresh_token) throw new Error('Zoho did not connect: ' + (data.error || res.getContentText().slice(0, 200)) + '. Generate a new code and try again.');
  p.setProperty('ZOHO_REFRESH_TOKEN', data.refresh_token);
  p.deleteProperty('ZOHO_GRANT_CODE');
  CacheService.getScriptCache().remove('zoho_access');
  zohoAccess();
  console.log('Zoho CRM is connected. New quote requests will become Leads.');
}

// ---------- Zoho Inventory: the SKU photos in the admin ----------

const ZOHO_ORG_ID = '768095675'; // SJK-GUAHAN INC.

// The team's stock sheet (read only; this Google account needs view access): per-branch stock, in transit, remarks
const STOCK_SHEET_ID = '1gBR4h9ccRGv12aomzjtC1jt6lGwaQmWdl1YhEvTs5co'; // LIVE STOCK INVENTORY & REPLENISEMENT MONITORING - PARTS
const STOCK_SHEET_TAB = 'Live stock Monitoring';

// Copies that tab's quantities and remarks by SKU (never the workbook's cost tabs). Columns are found by their
// headings, so a column moved in the sheet still lands right
function syncStockSheet() {
  let stock = [], error = '';
  try {
    const tab = SpreadsheetApp.openById(STOCK_SHEET_ID).getSheetByName(STOCK_SHEET_TAB);
    if (!tab) throw new Error('the tab "' + STOCK_SHEET_TAB + '" is not in the stock sheet');
    const rows = tab.getDataRange().getValues();
    const head = rows[0].map(function (h) { return String(h).toLowerCase().replace(/\s+/g, ' ').trim(); });
    const col = function (re) { const i = head.findIndex(function (h) { return re.test(h); }); if (i < 0) throw new Error('no column matching ' + re + ' in the stock sheet'); return i; };
    const c = { sku: col(/^sku/), cebu: col(/^cebu soh/), manila: col(/^manila soh/), staRosa: col(/^sta\.? ?rosa soh/), total: col(/^total current stock/),
      transit: col(/^stock in transit/), remark: col(/^remarks?$/), movement: col(/^inventory movement/) };
    const number = function (v) { return v === '' || v == null || isNaN(Number(v)) ? null : Number(v); };
    stock = rows.slice(1).map(function (r) {
      return { sku: String(r[c.sku] || '').trim(), cebu: number(r[c.cebu]), manila: number(r[c.manila]), sta_rosa: number(r[c.staRosa]),
        total: number(r[c.total]), in_transit: number(r[c.transit]), remark: String(r[c.remark] || '').trim(), movement: String(r[c.movement] || '').trim() };
    }).filter(function (s) { return s.sku; });
  } catch (err) {
    error = 'Stock sheet: ' + String((err && err.message) || err);
  }
  try { supabase('/rest/v1/rpc/save_stock_sheet', null, 'post', { secret: secret(), stock: stock, error_text: error }); }
  catch (err) { console.error('Stock sheet not saved: ' + err); }
  return error;
}

// Copies the list of active Zoho Inventory items (SKU, name, category, unit, stock; no prices) and each item's photo into
// the Drive folder (once per photo: the file's name holds the SKU and Zoho's id for that photo, so only a new or
// changed photo is copied), then saves both by SKU in the database. Stops copying photos after 4½ minutes, under Apps
// Script's 6-minute limit; the next run picks up the rest
function syncZohoPhotos() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return; // already running
  const started = Date.now(), photos = [], items = [];
  let complete = false, listed = false, error = '';
  syncStockSheet(); // the team's stock sheet first: quick, and independent of Zoho
  try {
    const access = zohoAccess(), folder = zohoPhotoFolder(), files = {}, seen = {}, listedSku = {};
    const all = folder.getFiles();
    while (all.hasNext()) { const f = all.next(); files[f.getName()] = f; }
    let page = 1, more = true, outOfTime = false;
    while (more) {
      const data = zohoInventory(access, '/items?organization_id=' + ZOHO_ORG_ID + '&per_page=200&page=' + page);
      (data.items || []).forEach(item => {
        const sku = String(item.sku || '').trim();
        if (!sku || item.status === 'inactive') return;
        if (!listedSku[sku]) {
          listedSku[sku] = true;
          // Stock, all locations together: available (on hand less what's committed), on hand, and Zoho's reorder level
          const number = function (v) { return v === '' || v == null || isNaN(Number(v)) ? null : Number(v); };
          items.push({ sku: sku, item_id: item.item_id, name: item.name || '', category: item.category_name || item.cf_item_category_1 || '',
            unit: item.unit || '', has_photo: !!item.image_document_id,
            available_stock: number(item.available_stock != null ? item.available_stock : item.actual_available_stock),
            stock_on_hand: number(item.stock_on_hand), reorder_level: number(item.reorder_level) });
        }
        if (seen[sku] || !item.image_document_id) return;
        const name = sku + '__' + item.image_document_id + '.' + (item.image_type || 'jpg');
        let file = files[name];
        if (!file) {
          if (Date.now() - started > 270000) { outOfTime = true; return; }
          const res = UrlFetchApp.fetch(access.api + '/inventory/v1/items/' + item.item_id + '/image?organization_id=' + ZOHO_ORG_ID,
            { headers: { Authorization: 'Zoho-oauthtoken ' + access.token }, muteHttpExceptions: true });
          if (res.getResponseCode() !== 200) return;
          file = folder.createFile(res.getBlob().setName(name));
          // The SKU's older photo
          Object.keys(files).forEach(n => { if (n.indexOf(sku + '__') === 0) { files[n].setTrashed(true); delete files[n]; } });
          files[name] = file;
        }
        seen[sku] = true;
        photos.push({ sku: sku, url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w800', zoho_item_id: item.item_id });
      });
      more = !!(data.page_context && data.page_context.has_more_page);
      page++;
    }
    listed = true;
    complete = !outOfTime;
    if (outOfTime) error = 'Copied part of the photos; the rest follow on the next run.';
  } catch (err) {
    error = String((err && err.message) || err);
  } finally {
    try { if (items.length) supabase('/rest/v1/rpc/save_zoho_items', null, 'post', { secret: secret(), items: items, complete: listed }); }
    catch (err) { console.error('Zoho items not saved: ' + err); error = error || 'Zoho items not saved: ' + err; }
    try { supabase('/rest/v1/rpc/save_sku_photos', null, 'post', { secret: secret(), photos: photos, error_text: error, complete: complete }); }
    catch (err) { console.error('SKU photos not saved: ' + err); }
    lock.releaseLock();
  }
}

function zohoInventory(access, path) {
  const res = UrlFetchApp.fetch(access.api + '/inventory/v1' + path, { headers: { Authorization: 'Zoho-oauthtoken ' + access.token }, muteHttpExceptions: true });
  const body = JSON.parse(res.getContentText() || '{}');
  if (res.getResponseCode() === 401) CacheService.getScriptCache().remove('zoho_access');
  if (res.getResponseCode() !== 200 || body.code !== 0) {
    throw new Error('Zoho Inventory: ' + (body.message || ('HTTP ' + res.getResponseCode())) + (res.getResponseCode() === 401 ? ' (run connectZoho with the ZohoInventory.items.READ scope)' : ''));
  }
  return body;
}

// The Drive folder the photos are kept in, made (and shared by link) the first time
function zohoPhotoFolder() {
  const p = PropertiesService.getScriptProperties(), id = p.getProperty('ZOHO_PHOTO_FOLDER');
  if (id) { try { return DriveApp.getFolderById(id); } catch (err) { /* deleted: make a new one */ } }
  const folder = DriveApp.createFolder('Golfcarts.ph SKU photos (from Zoho Inventory)');
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  p.setProperty('ZOHO_PHOTO_FOLDER', folder.getId());
  return folder;
}

// Run once (Run > setupZohoPhotos): copies the photos now and every hour from then on
function setupZohoPhotos() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'syncZohoPhotos').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncZohoPhotos').timeBased().everyHours(1).create();
  syncZohoPhotos();
  console.log('SKU photos copied from Zoho Inventory; they will be copied again every hour.');
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
