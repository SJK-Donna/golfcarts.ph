// ==========================================
// BE A GOLFER (optional sign up / log in) AND THE ADMIN PAGE, kept in Supabase (supabase/schema.sql)
// Nothing here is required: visitors still build carts and request quotes without an account. A golfer gets their
// builds saved, their quotes listed, the quote forms filled in, and can opt in to member news. Staff (the staff
// table) sign in the same way and get the admin instead, with what their role allows.
// Who may read or change what is decided by the database's rules, not by this page: the page only hides what a
// role can't use. Quotes still go to the Google Sheet as before (it sends the PDF); Supabase keeps a copy.
// ==========================================
const SUPABASE_URL = 'https://xcmkkvzxstzxqefhhgxa.supabase.co';
// The publishable key: safe in the page, since it can only do what the database's rules allow a visitor
const SUPABASE_KEY = 'sb_publishable_zEHyhUcCcO14meqwN3uPuQ_3jLs4-CM';
const QUOTE_STATUSES = ['New', 'Contacted', 'Quoted', 'Sold', 'Lost'];

// No client in the pre-render build (no supabase.js there) or on file://: everything shows as logged out
const sb = window.supabase && location.protocol !== 'file:' ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Who is signed in: their auth user, and either their golfer profile or their staff row
const account = { ready: !sb, user: null, golfer: null, staff: null };

function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatShortDate(iso) {
    return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

// A Supabase query's rows, or a thrown error
async function rows(query) {
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

// Every row of a long list: Supabase hands back at most 1,000 rows a request, so it's read in pages of 1,000
// (2026-11-12: the stock sheet has 1,727 SKUs). build() makes the query, ordered so the pages don't overlap
async function allRows(build) {
    const page = 1000, all = [];
    for (let from = 0; ; from += page) {
        const part = await rows(build().range(from, from + page - 1));
        all.push(...part);
        if (part.length < page) return all;
    }
}

// A full link to a page of this site, for the links in Supabase's emails
function siteLink(path) {
    return location.origin + siteBasePath() + path;
}

function authMessage(error) {
    const m = error.message || String(error);
    if (/invalid login credentials/i.test(m)) return 'That email and password don\'t match.';
    if (/email not confirmed/i.test(m)) return 'Confirm your email first: open the link we sent to your inbox.';
    if (/rate limit|too many/i.test(m)) return 'Too many tries. Wait a minute and try again.';
    return m;
}

function currentGolfer() { return account.golfer; }
function currentAdmin() { return account.staff; }

function firstName(golfer) {
    return golfer.name.trim().split(/\s+/)[0];
}

// Loads the signed-in person's golfer profile or staff row, then updates the header, forms and account pages
async function loadAccount(user) {
    account.user = user || null;
    account.golfer = account.staff = null;
    if (user) {
        try {
            account.staff = (await rows(sb.from('staff').select('*').eq('email', user.email.toLowerCase()).maybeSingle())) || null;
            if (!account.staff) account.golfer = (await rows(sb.from('golfers').select('*').eq('id', user.id).maybeSingle())) || null;
        } catch (err) { console.warn('Account could not be loaded:', err); }
    }
    account.ready = true;
    pageData = null;
    refreshGolferUI();
    prefillGolferForms();
    if (currentPage === 'golfer' || currentPage === 'admin') renderApp();
    else renderPageTextButton(); // staff who may edit the page text get its "Edit this page" button
}

if (sb) {
    sb.auth.onAuthStateChange((event, session) => {
        // Supabase asks that no other Supabase call is awaited inside this callback, so the loading runs just after it
        const user = session ? session.user : null;
        if (event === 'PASSWORD_RECOVERY') setTimeout(() => openGolferModal('reset'), 0);
        if (event === 'INITIAL_SESSION' || (user ? user.id : null) !== (account.user ? account.user.id : null)) setTimeout(() => loadAccount(user), 0);
    });
}

// --- Data for the account and admin pages: loaded when the page is shown, kept until something changes ---
let pageData = null, pageDataLoading = null;

function pageDataFor(key, load) {
    if (pageData && pageData.key === key) return pageData;
    if (pageDataLoading !== key) {
        pageDataLoading = key;
        load().then(data => { pageData = { key, ...data }; }, err => { pageData = { key, error: err.message || String(err) }; })
            .finally(() => { pageDataLoading = null; if (currentPage === key) renderApp(); });
    }
    return null;
}

function reloadPageData() {
    pageData = null;
    renderApp();
}

function renderLoading(text = 'Loading…') {
    return `<section class="home-section max-w-site mx-auto px-5 sm:px-8 lg:px-12 min-h-[60vh]"><p class="text-mute" role="status">${text}</p></section>`;
}

function renderLoadError(message) {
    return `<p class="golfer-error" role="alert">Could not load: ${escapeHtml(message)}</p>`;
}

// --- Header: "Be a Golfer" when logged out, the golfer's first name when logged in, "Admin" for signed-in staff ---
function refreshGolferUI() {
    const golfer = currentGolfer(), admin = currentAdmin();
    // The header's link is an icon on laptops, with its label from 1600px; the mobile menu's is text only
    document.querySelectorAll('.golfer-link').forEach(link => {
        (link.querySelector('.golfer-link-label') || link).textContent = admin ? 'Admin' : golfer ? `Hi, ${firstName(golfer)}` : 'Be a Golfer';
        link.setAttribute('aria-label', admin ? `Admin (${admin.email})` : golfer ? `Your Golfer account (${golfer.name})` : 'Be a Golfer: sign up or log in');
        link.title = admin ? 'Admin' : golfer ? 'Your Golfer account' : 'Be a Golfer';
    });
    const hint = document.getElementById('quote-golfer-hint');
    if (hint) hint.innerHTML = golfer
        ? `This quote will be kept in your <a href="golfer/" data-route="golfer" class="link" onclick="closeQuoteModal()">Golfer account</a>.`
        : admin ? ''
        : `Optional: <button type="button" class="link" onclick="openGolferModal('signup', 'Keep this quote and your builds in one place.')">Be a Golfer</button> to keep your quotes and builds.`;
}

function golferHeaderClick() {
    if (currentAdmin()) navigateTo('admin');
    else if (currentGolfer()) navigateTo('golfer');
    else openGolferModal('signup');
}

// Fills name, email and phone in any empty form field, by its autocomplete hint (forms marked data-no-prefill are left alone)
function prefillGolferForms(root = document) {
    const golfer = currentGolfer();
    if (!golfer) return;
    const values = { name: golfer.name, email: golfer.email, tel: golfer.phone };
    root.querySelectorAll('form:not([data-no-prefill]) input').forEach(input => {
        const value = values[input.getAttribute('autocomplete')];
        if (value && !input.value) input.value = value;
    });
}

// --- Sign up / log in dialog: modes signup, login, forgot (email a reset link), reset (choose a new password), sent ---
let golferModalMode = 'signup';
let golferModalReason = '';
let golferAfterAuth = null;
let golferModalReturnFocus = null;
let golferSentMessage = '';

function openGolferModal(mode = 'signup', reason = '', afterAuth = null) {
    golferModalMode = mode;
    golferModalReason = reason;
    golferAfterAuth = afterAuth;
    const modal = document.getElementById('golfer-modal');
    if (!modal) return;
    // Opened over the quote dialog: that one stays open underneath
    if (modal.classList.contains('hidden')) golferModalReturnFocus = document.activeElement;
    renderGolferModal();
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

function closeGolferModal() {
    const modal = document.getElementById('golfer-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    const quoteOpen = !document.getElementById('quote-modal').classList.contains('hidden');
    if (!quoteOpen) document.body.classList.remove('overflow-hidden');
    golferAfterAuth = null;
    if (golferModalReturnFocus && golferModalReturnFocus.focus) golferModalReturnFocus.focus();
}

// The dialog: on wide screens a brand panel (the cart and what an account is for) beside the form; on phones the
// form alone. Sign up and Log in share a switch at the top; forgot / reset / sent are single steps of their own
const GOLFER_PERKS = ['Save the carts you build', 'See every quote you request', 'Quote forms filled in for you', 'Member news and offers, if you want them'];

function passwordField(id, label, autocomplete, extra = '') {
    return `<div class="field">
        <div class="auth-label-row"><label for="${id}">${label}</label>${extra}</div>
        <div class="auth-password">
            <input id="${id}" name="password" required type="password" minlength="${autocomplete === 'new-password' ? 8 : 1}" autocomplete="${autocomplete}"${autocomplete === 'new-password' ? ` aria-describedby="${id}-hint"` : ''}>
            <button type="button" onclick="toggleGolferPassword(this)" aria-pressed="false" aria-label="Show password">Show</button>
        </div>
        ${autocomplete === 'new-password' ? `<p id="${id}-hint" class="auth-hint">At least 8 characters.</p>` : ''}
    </div>`;
}

function toggleGolferPassword(button) {
    const input = button.previousElementSibling;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.textContent = show ? 'Hide' : 'Show';
    button.setAttribute('aria-pressed', String(show));
    button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
}

function renderGolferModal() {
    const box = document.getElementById('golfer-dialog');
    const mode = golferModalMode, signup = mode === 'signup';
    const reason = golferModalReason ? `<p class="auth-reason">${escapeHtml(golferModalReason)}</p>` : '';
    const steps = {
        signup: {
            title: 'Create your Golfer account',
            sub: 'Free and optional: you can build a cart and get a quote without one.',
            form: `${reason}
                <div class="auth-row">
                    <div class="field"><label for="gf-name">Full name</label><input id="gf-name" name="name" required type="text" autocomplete="name"></div>
                    <div class="field"><label for="gf-phone">Mobile number</label><input id="gf-phone" name="phone" required type="tel" autocomplete="tel" placeholder="+63 900 000 0000"></div>
                </div>
                <div class="field"><label for="gf-email">Email</label><input id="gf-email" name="email" required type="email" autocomplete="email"></div>
                ${passwordField('gf-password', 'Password', 'new-password')}
                <label class="golfer-check"><input type="checkbox" name="news" checked> <span>Send me member news and offers</span></label>
                <p id="golfer-error" class="golfer-error" role="alert"></p>
                <button type="submit" class="btn btn-primary w-full">Create account</button>
                <p class="auth-hint text-center -mt-1">We'll email you a link to confirm your address.</p>
                <p class="auth-foot">Already a member? <button type="button" onclick="openGolferModal('login', golferModalReason, golferAfterAuth)" class="link">Log in</button></p>`
        },
        login: {
            title: 'Log in',
            sub: 'Golfers and Golfcarts.ph staff sign in here.',
            form: `${reason}
                <div class="field"><label for="gf-email">Email</label><input id="gf-email" name="email" required type="email" autocomplete="email"></div>
                ${passwordField('gf-password', 'Password', 'current-password', '<button type="button" onclick="openGolferModal(\'forgot\')" class="link auth-forgot">Forgot password?</button>')}
                <p id="golfer-error" class="golfer-error" role="alert"></p>
                <button type="submit" class="btn btn-primary w-full">Log in</button>
                <p class="auth-foot">New here? <button type="button" onclick="openGolferModal('signup', golferModalReason, golferAfterAuth)" class="link">Create an account</button></p>`
        },
        forgot: {
            title: 'Reset your password',
            sub: 'Enter your account\'s email and we\'ll send you a link to choose a new password.',
            form: `<div class="field"><label for="gf-email">Email</label><input id="gf-email" name="email" required type="email" autocomplete="email"></div>
                <p id="golfer-error" class="golfer-error" role="alert"></p>
                <button type="submit" class="btn btn-primary w-full">Email me a reset link</button>
                <p class="auth-foot"><button type="button" onclick="openGolferModal('login')" class="link">Back to log in</button></p>`
        },
        reset: {
            title: 'Choose a new password',
            sub: 'You\'ll stay logged in on this device.',
            form: `${passwordField('gf-password', 'New password', 'new-password')}
                <p id="golfer-error" class="golfer-error" role="alert"></p>
                <button type="submit" class="btn btn-primary w-full">Save new password</button>`
        },
        sent: {
            title: 'Check your email',
            sub: '',
            form: `<div class="auth-sent">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/></svg>
                    <p>${escapeHtml(golferSentMessage)}</p>
                </div>
                <p class="text-sm text-mute">Nothing after a few minutes? Check your spam folder.</p>
                <button type="button" onclick="openGolferModal('login')" class="btn btn-outline w-full">Back to log in</button>`
        }
    };
    const step = steps[mode];
    const handlers = { signup: 'handleGolferSignup', login: 'handleGolferLogin', forgot: 'handleGolferForgot', reset: 'handleGolferReset' };
    const switcher = signup || mode === 'login' ? `
        <div class="auth-switch" role="tablist" aria-label="Sign up or log in">
            <button type="button" role="tab" aria-selected="${signup}" onclick="openGolferModal('signup', golferModalReason, golferAfterAuth)">Sign up</button>
            <button type="button" role="tab" aria-selected="${mode === 'login'}" onclick="openGolferModal('login', golferModalReason, golferAfterAuth)">Log in</button>
        </div>` : '<span></span>';
    box.innerHTML = `
        <div class="auth">
            <aside class="auth-side" aria-hidden="true">
                <img src="image/GCPH_logo.png" alt="" width="140" height="31" class="auth-logo">
                <img src="image/Products/builds/golfer-2-pro.jpg" alt="" class="auth-cart" loading="lazy">
                <div>
                    <p class="auth-side-title">One account for every cart you build.</p>
                    <ul class="golfer-perks auth-perks">${GOLFER_PERKS.map(p => `<li>${p}</li>`).join('')}</ul>
                </div>
            </aside>
            <div class="auth-main">
                <div class="auth-top">
                    ${switcher}
                    <button type="button" onclick="closeGolferModal()" aria-label="Close" class="auth-close">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
                <h2 id="golfer-modal-title" class="auth-title">${step.title}</h2>
                ${step.sub ? `<p class="auth-sub">${step.sub}</p>` : ''}
                ${handlers[mode] ? `<form data-no-prefill onsubmit="${handlers[mode]}(event)" class="auth-form" novalidate>${step.form}</form>`
                    : `<div class="auth-form">${step.form}</div>`}
            </div>
        </div>`;
    const first = box.querySelector('.auth-main input');
    if (first) setTimeout(() => first.focus(), 0);
}

function golferError(message) {
    const el = document.getElementById('golfer-error');
    if (el) el.textContent = message;
}

function showGolferSent(message) {
    golferSentMessage = message;
    openGolferModal('sent');
}

// Runs a sign-in step with its button disabled; shows its error in the dialog
async function golferStep(form, step) {
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    try { await step(); }
    catch (err) { golferError(authMessage(err)); }
    finally { if (button) button.disabled = false; }
}

function noAccounts() {
    golferError('Accounts are not available on this page right now. You can still get a quote.');
}

// Sign up checks the email first: a staff email needs only a password (staff get the admin, not a member
// profile); any other email signs up as a member (golfer)
async function handleGolferSignup(e) {
    e.preventDefault();
    const form = e.target;
    if (!sb) return noAccounts();
    const email = form.elements.email.value.trim().toLowerCase(), password = form.elements.password.value;
    await golferStep(form, async () => {
        let staff = false;
        if (form.elements.email.checkValidity()) staff = await rows(sb.rpc('is_staff_email', { check_email: email })).catch(() => false);
        if (staff) {
            if (!form.elements.password.reportValidity()) return;
            const { error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: siteLink('admin/') } });
            if (error) throw error;
            showGolferSent(`${email} is a staff email. We sent a link to confirm it; open it, then log in to reach the admin.`);
            return;
        }
        if (!form.reportValidity()) return;
        const data = new FormData(form);
        const { data: result, error } = await sb.auth.signUp({
            email, password,
            options: { emailRedirectTo: siteLink('golfer/'), data: { name: data.get('name').trim(), phone: data.get('phone').trim(), news: data.get('news') === 'on' } }
        });
        if (error) throw error;
        if (result.session) return finishGolferAuth(`Welcome to the club, ${data.get('name').trim().split(/\s+/)[0]}.`);
        showGolferSent(`We sent a link to ${email}. Open it to confirm your account, then log in. Already have an account? Log in instead.`);
    });
}

// Log in: staff land on the admin with their role, golfers stay where they are
async function handleGolferLogin(e) {
    e.preventDefault();
    const form = e.target;
    if (!sb) return noAccounts();
    if (!form.reportValidity()) return;
    await golferStep(form, async () => {
        const { data, error } = await sb.auth.signInWithPassword({ email: form.elements.email.value.trim(), password: form.elements.password.value });
        if (error) throw error;
        await loadAccount(data.user);
        if (currentAdmin()) {
            golferAfterAuth = null;
            closeGolferModal();
            showToast(`Signed in as ${ADMIN_ROLES[currentAdmin().role].label}.`);
            navigateTo('admin');
        } else {
            finishGolferAuth(currentGolfer() ? `Welcome back, ${firstName(currentGolfer())}.` : 'You are logged in.');
        }
    });
}

async function handleGolferForgot(e) {
    e.preventDefault();
    const form = e.target;
    if (!sb) return noAccounts();
    if (!form.reportValidity()) return;
    await golferStep(form, async () => {
        const email = form.elements.email.value.trim();
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: siteLink('golfer/') });
        if (error) throw error;
        showGolferSent(`If ${email} has an account, a link to choose a new password is on its way.`);
    });
}

// Reached from the reset link in the email (Supabase signs them in for this)
async function handleGolferReset(e) {
    e.preventDefault();
    const form = e.target;
    if (!form.reportValidity()) return;
    await golferStep(form, async () => {
        const { error } = await sb.auth.updateUser({ password: form.elements.password.value });
        if (error) throw error;
        closeGolferModal();
        showToast('Your new password is saved.');
    });
}

function finishGolferAuth(message) {
    const after = golferAfterAuth;
    golferAfterAuth = null;
    closeGolferModal();
    refreshGolferUI();
    prefillGolferForms();
    if (currentPage === 'golfer') renderApp();
    showToast(message);
    if (after) after();
}

async function logOutGolfer() {
    if (sb) await sb.auth.signOut();
    await loadAccount(null);
    showToast('You are logged out.');
}

// --- Saved builds (from the build panel on a model page) ---
async function saveCurrentBuild() {
    const golfer = currentGolfer();
    if (!golfer) {
        if (currentAdmin()) { showToast('Saved builds are for Golfer accounts; you are signed in as staff.'); return; }
        openGolferModal('signup', 'Sign up to save this build. It takes a minute.', saveCurrentBuild);
        return;
    }
    const details = getBuildDetails();
    if (!details) return;
    const product = PRODUCTS_DATA.find(p => p.slug === details.slug);
    const level = (details.rows.find(([k]) => k === 'Build') || [])[1];
    const photo = (product.buildPhotos && product.buildPhotos[detailBuild.level]) || product.image;
    const { error } = await sb.from('saved_builds').insert({ slug: product.slug, title: level ? `${product.name} ${level}` : product.name, photo, rows: details.rows });
    if (error) { showToast(`The build could not be saved: ${error.message}`); return; }
    pageData = null;
    showToast('Build saved to your Golfer account.');
}

async function removeSavedBuild(id) {
    const { error } = await sb.from('saved_builds').delete().eq('id', id);
    if (error) showToast(`Could not remove it: ${error.message}`);
    reloadPageData();
}

function quoteSavedBuild(id) {
    const build = ((pageData && pageData.builds) || []).find(b => b.id === id);
    if (build) openQuoteModal(build.slug, build.rows.map(([k, v]) => `${k}: ${v}`).join('\n'));
}

// --- Quotes: every request from the site, for the admin and the golfer's history. Saving it is what sends the
// customer's acknowledgement and the staff's notice (the database calls the email script). Resolves { error } ---
async function recordQuote(fields, slug) {
    if (!sb) return { error: new Error('Requests can\'t be sent from this page') };
    let quoteRows = [];
    try { quoteRows = JSON.parse(fields.rows || '[]'); } catch (e) { /* rows stay empty */ }
    const text = v => (v == null ? '' : String(v));
    const row = {
        reference: text(fields.reference), golfer_id: currentGolfer() ? currentGolfer().id : null, source: text(fields.source),
        name: text(fields.name), email: text(fields.email), phone: text(fields.phone), model: text(fields.model),
        quantity: text(fields.quantity), branch: text(fields.branch), notes: text(fields.notes), rows: quoteRows,
        // The model page it came from, so its quotation can be priced from that model's bundle
        slug: slug || null
    };
    // The bundle options chosen in the builder, by id (2026-11-18); a database without the column yet still takes the request
    const ids = (fields.bundle_options || []).map(Number).filter(n => Number.isInteger(n) && n > 0);
    let { error } = await sb.from('quotes').insert(ids.length ? { ...row, bundle_options: ids } : row);
    if (error && ids.length && /bundle_options/.test(error.message)) ({ error } = await sb.from('quotes').insert(row));
    if (error) console.warn('Quote not saved:', error.message);
    else pageData = null;
    return { error };
}

// --- Golfer account page (golfer/) ---
function renderGolferPage() {
    if (!account.ready) return renderLoading();
    const golfer = currentGolfer();
    if (currentAdmin()) return `
        <section class="home-section max-w-site mx-auto px-5 sm:px-8 lg:px-12 min-h-[60vh] space-y-6">
            <h1 class="type-xl text-ink">You're signed in as staff.</h1>
            <p class="measure">${escapeHtml(currentAdmin().email)} uses the admin, not a Golfer account.</p>
            <a href="admin/" data-route="admin" class="btn btn-primary">Go to the admin</a>
        </section>`;
    if (!golfer) return `
        <section class="home-section max-w-site mx-auto px-5 sm:px-8 lg:px-12 grid lg:grid-cols-12 gap-12 min-h-[60vh]">
            <div class="lg:col-span-6 space-y-6">
                <p class="text-sm text-mute">Optional membership</p>
                <h1 class="type-xl text-ink">Be a Golfer.</h1>
                <p class="measure">You don't need an account to build a cart or get a quote. A free Golfer account keeps everything in one place.</p>
                <div class="flex flex-wrap gap-4">
                    <button type="button" onclick="openGolferModal('signup')" class="btn btn-primary">Sign up</button>
                    <button type="button" onclick="openGolferModal('login')" class="btn btn-outline">Log in</button>
                </div>
            </div>
            <ul class="golfer-perks golfer-perks-lg lg:col-span-5 lg:col-start-8 self-center">
                <li><b>Saved builds.</b> Save a build from any model page and come back to it.</li>
                <li><b>Quote history.</b> Every quote you request, with its reference.</li>
                <li><b>Faster quotes.</b> Your name, email and number filled in for you.</li>
                <li><b>Member news.</b> New models, events and offers, if you want them.</li>
            </ul>
        </section>`;

    const data = pageDataFor('golfer', async () => ({
        builds: await rows(sb.from('saved_builds').select('*').eq('golfer_id', golfer.id).order('saved_at', { ascending: false })),
        quotes: await rows(sb.from('quotes').select('reference, model, status, created_at').eq('golfer_id', golfer.id).order('created_at', { ascending: false }))
    }));
    const builds = data && data.builds, quotes = data && data.quotes;
    const pending = '<p class="text-mute mt-6" role="status">Loading…</p>';
    return `
        <section class="max-w-site mx-auto px-5 sm:px-8 lg:px-12 pt-16 lg:pt-24">
            <p class="text-sm text-mute">Golfer account</p>
            <div class="flex flex-wrap items-end justify-between gap-6 mt-4">
                <h1 class="type-xl text-ink">Hi, ${escapeHtml(firstName(golfer))}.</h1>
                <button type="button" onclick="logOutGolfer()" class="btn btn-outline">Log out</button>
            </div>
            ${data && data.error ? `<div class="mt-6">${renderLoadError(data.error)}</div>` : ''}
        </section>

        <section class="home-section max-w-site mx-auto px-5 sm:px-8 lg:px-12" aria-labelledby="golfer-builds-title">
            <h2 id="golfer-builds-title" class="type-lg text-ink">Saved builds</h2>
            ${!builds ? pending : builds.length ? `<div class="golfer-builds mt-8">${builds.map(b => `
                <article class="golfer-build">
                    <img src="${escapeHtml(b.photo)}" alt="" loading="lazy">
                    <div class="p-5 space-y-4">
                        <div>
                            <h3 class="type-md text-ink">${escapeHtml(b.title)}</h3>
                            <p class="text-xs text-mute mt-1">Saved ${formatShortDate(b.saved_at)}</p>
                        </div>
                        <dl class="golfer-rows">${b.rows.filter(([k]) => k !== 'Model').map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}</dl>
                        <div class="flex flex-wrap gap-3">
                            <button type="button" onclick="quoteSavedBuild('${b.id}')" class="btn btn-primary min-h-[2.5rem] px-4 text-sm">Get a quote</button>
                            <a href="${routeHref('product-details', b.slug)}" data-route="product-details" data-slug="${escapeHtml(b.slug)}" class="btn btn-outline min-h-[2.5rem] px-4 text-sm">See the model</a>
                            <button type="button" onclick="removeSavedBuild('${b.id}')" class="link text-sm">Remove</button>
                        </div>
                    </div>
                </article>`).join('')}</div>`
            : `<p class="measure mt-6">No saved builds yet. On a model page, pick your build and colors, then choose <b>Save this build</b>.</p>
               <a href="${routeHref('products')}" data-route="products" class="btn btn-primary mt-6">Browse carts</a>`}
        </section>

        <section class="home-section max-w-site mx-auto px-5 sm:px-8 lg:px-12" aria-labelledby="golfer-quotes-title">
            <h2 id="golfer-quotes-title" class="type-lg text-ink">Your quotes</h2>
            ${!quotes ? pending : quotes.length ? `<div class="admin-table-wrap mt-8"><table class="admin-table">
                <thead><tr><th>Reference</th><th>Date</th><th>Model</th><th>Status</th></tr></thead>
                <tbody>${quotes.map(q => `<tr><td>${escapeHtml(q.reference)}</td><td>${formatShortDate(q.created_at)}</td><td>${escapeHtml(q.model)}</td><td>${escapeHtml(q.status)}</td></tr>`).join('')}</tbody>
            </table></div>`
            : `<p class="measure mt-6">Quotes you request while logged in show up here, with their reference numbers.</p>`}
        </section>

        <section class="home-section max-w-site mx-auto px-5 sm:px-8 lg:px-12 grid lg:grid-cols-12 gap-12" aria-labelledby="golfer-profile-title">
            <h2 id="golfer-profile-title" class="type-lg text-ink lg:col-span-4">Your details</h2>
            <form data-no-prefill onsubmit="handleGolferProfile(event)" class="lg:col-span-7 lg:col-start-6 grid sm:grid-cols-2 gap-x-6 gap-y-5">
                <div class="field"><label for="gp-name">Full name</label><input id="gp-name" name="name" required type="text" autocomplete="name" value="${escapeHtml(golfer.name)}"></div>
                <div class="field"><label for="gp-phone">Mobile number</label><input id="gp-phone" name="phone" required type="tel" autocomplete="tel" value="${escapeHtml(golfer.phone)}"></div>
                <div class="field sm:col-span-2"><label for="gp-email">Email</label><input id="gp-email" type="email" value="${escapeHtml(golfer.email)}" disabled></div>
                <label class="golfer-check sm:col-span-2"><input type="checkbox" name="news" ${golfer.news ? 'checked' : ''}> <span>Send me member news and offers</span></label>
                <div class="sm:col-span-2"><button type="submit" class="btn btn-primary">Save details</button></div>
            </form>
        </section>`;
}

async function handleGolferProfile(e) {
    e.preventDefault();
    const golfer = currentGolfer();
    if (!golfer) return;
    const data = new FormData(e.target);
    const change = { name: data.get('name').trim(), phone: data.get('phone').trim(), news: data.get('news') === 'on' };
    const { error } = await sb.from('golfers').update(change).eq('id', golfer.id);
    if (error) { showToast(`Your details could not be saved: ${error.message}`); return; }
    Object.assign(golfer, change);
    refreshGolferUI();
    showToast('Your details are saved.');
}

// ==========================================
// ADMIN (admin/): quotes, golfers, product text and prices, the homepage event, and who is on staff. What each role
// may do is enforced by the database (supabase/schema.sql); ADMIN_ROLES below only decides what the page shows.
// ==========================================
const ADMIN_ROLES = {
    master: {
        label: 'Super admin',
        home: 'Everything across the business: the pipeline, what is waiting on approval, and the team.',
        can: ['quotes.view', 'quotes.status', 'quotes.delete', 'quotations.view', 'quotations.prepare', 'golfers.view', 'golfers.news', 'products.edit', 'content.edit', 'leads.zoho', 'bundles.view', 'export.quotes', 'export.all', 'users.manage', 'log.view']
    },
    // Accounting: owns the costs, the bundles, the exchange rate, freight and warranty. Reads the quote requests and
    // quotations; doesn't prepare, approve or send them (approval goes by margin: quotationApprovers)
    pricing: {
        label: 'Price manager (accounting)',
        home: 'The exchange rate and freight every new quotation is priced with, and the quotations in progress.',
        can: ['quotes.view', 'quotations.view', 'pricing.edit', 'bundles.view']
    },
    // Works the leads: quotes and golfers, and prepares quotations from them. Prices, site text, a full customer export
    // and staff management stay with super admins
    sales: {
        label: 'Sales manager',
        home: 'New requests to price, quotations to fix, and approved ones ready to send.',
        can: ['quotes.view', 'quotes.status', 'quotations.view', 'quotations.prepare', 'golfers.view', 'golfers.news', 'export.quotes']
    },
    // Keeps the catalog looking right: product photos, text and specs, accessory photos, the homepage event. No
    // customers, quotes, prices or costs
    marketing: {
        label: 'Marketing',
        home: 'The site as visitors see it: model photos, text and specs, accessory photos, the homepage carousel and event.',
        can: ['products.edit', 'content.edit', 'leads.zoho']
    }
};

const ADMIN_PERMISSION_LABELS = [
    ['quotes.view', 'See quotes'], ['quotes.status', 'Change quote status'], ['quotes.delete', 'Delete quotes'],
    ['golfers.view', 'See golfers'], ['golfers.news', 'Copy news emails'], ['products.edit', 'Edit product photos, text and specs'],
    ['quotations.view', 'See quotations'], ['quotations.prepare', 'Prepare, submit and send quotations'],
    ['pricing.edit', 'Set exchange rate, freight and warranty'],
    ['content.edit', 'Edit site content'], ['bundles.view', 'See and edit bundles'], ['export.quotes', 'Export quotes'], ['export.all', 'Export all data'], ['users.manage', 'Manage staff'], ['log.view', 'See the activity log'], ['leads.zoho', 'See and resend Zoho CRM leads']
];

let adminTab = 'home';

function can(permission) {
    const admin = currentAdmin();
    return !!(admin && ADMIN_ROLES[admin.role] && ADMIN_ROLES[admin.role].can.includes(permission));
}

function adminName(email) {
    return email ? email.split('@')[0] : '';
}

// --- Site edits (product photos, text and specs, accessory photos, the homepage event): read by every visitor,
// written by master admins and marketing ---
// What a product edit may change. An edit stores only the fields that differ from the shipped ones
// specGroups: a model's own copy of its shared spec sheet (SPEC_SHEETS), once edited
const PRODUCT_EDIT_FIELDS = ['tagline', 'description', 'image', 'gallery', 'galleryLevels', 'buildPhotos', 'seating', 'range', 'speed', 'battery', 'chargingTime', 'powertrain', 'specs', 'specGroups'];
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const productFields = p => Object.fromEntries(PRODUCT_EDIT_FIELDS.filter(k => p[k] !== undefined).map(k => [k, clone(p[k])]));
// As shipped, so an edit can be undone
const ADMIN_ORIGINALS = {
    products: Object.fromEntries(PRODUCTS_DATA.map(p => [p.slug, productFields(p)])),
    accessories: Object.fromEntries(ACCESSORY_CATALOG.flatMap(g => g.items.map(i => [i.id, i.image || '']))),
    event: { title: HOME_EVENT.title, date: HOME_EVENT.date, text: HOME_EVENT.text.slice(), header: HOME_EVENT.header, headerAlt: '', photos: clone(HOME_EVENT.photos), effects: true },
    banners: clone(HOME_BANNERS),
    blogs: clone(BLOGS_DATA),
    holiday: clone(HOLIDAY),
    promo: { settings: clone(HOME_PROMO_SETTINGS), carts: HOME_PROMO.map(c => ({ name: c.name, seats: c.seats, image: c.image, seat: c.seat, canopy: c.canopy })) }
};
// From the site_edits table: { 'product:<slug>': { value, updated_by }, 'accessory:<id>': { value: { image } }, event: { ... } }
let siteEdits = {};

function applyAdminEdits() {
    PRODUCTS_DATA.forEach(p => Object.assign(p, clone(ADMIN_ORIGINALS.products[p.slug]), clone((siteEdits[`product:${p.slug}`] || {}).value)));
    ACCESSORY_CATALOG.forEach(g => g.items.forEach(i => {
        const edit = (siteEdits[`accessory:${i.id}`] || {}).value;
        i.image = (edit && edit.image) || ADMIN_ORIGINALS.accessories[i.id] || undefined;
    }));
    Object.assign(HOME_EVENT, clone(ADMIN_ORIGINALS.event), clone((siteEdits.event || {}).value));
    const banners = ((siteEdits.banners || {}).value || {}).slides;
    HOME_BANNERS.splice(0, HOME_BANNERS.length, ...clone(banners && banners.length ? banners : ADMIN_ORIGINALS.banners));
    Object.assign(HOLIDAY, clone(ADMIN_ORIGINALS.holiday), clone((siteEdits.holiday || {}).value || {}));
    applyHoliday();
    // The Red Series: its photos and effects, and each cart's editable fields, over the shipped ones
    const promo = (siteEdits.promo || {}).value || {};
    Object.assign(HOME_PROMO_SETTINGS, clone(ADMIN_ORIGINALS.promo.settings), clone(promo.settings || {}));
    HOME_PROMO.forEach((c, i) => Object.assign(c, clone(ADMIN_ORIGINALS.promo.carts[i]), clone((promo.carts || [])[i] || {})));
    // Each story is its own row: 'story:<slug>' holds the whole story, or { removed: true } for a shipped one taken down
    const stories = new Map(ADMIN_ORIGINALS.blogs.map(p => [p.slug, clone(p)]));
    Object.entries(siteEdits).filter(([key]) => key.startsWith('story:')).forEach(([key, row]) => {
        const slug = key.slice(6);
        if (row.value.removed) stories.delete(slug);
        else stories.set(slug, { ...clone(row.value), slug });
    });
    BLOGS_DATA.splice(0, BLOGS_DATA.length, ...stories.values());
    // Pages made with the page builder: 'custom-page:<slug>' holds { title, intro, menu, menuLabel } (app.js CUSTOM_PAGES)
    CUSTOM_PAGES.splice(0, CUSTOM_PAGES.length, ...Object.entries(siteEdits).filter(([key]) => key.startsWith('custom-page:'))
        .map(([key, row]) => ({ ...clone(row.value), slug: key.slice(12) })).filter(c => c.title));
}

function siteEditsReady() {
    document.documentElement.classList.remove('edits-pending');
}

// The edits from this browser's last visit, used for the page's first draw so repeat visits show them straight away.
// Runs before app.js draws the page (on DOMContentLoaded); the hidden banners show once that's done.
const SITE_EDITS_KEY = 'gc-site-edits';
function restoreSiteEdits() {
    try {
        const saved = localStorage.getItem(SITE_EDITS_KEY);
        if (!saved) return '';
        siteEdits = Object.fromEntries(JSON.parse(saved).map(r => [r.key, r]));
        applyAdminEdits();
        window.addEventListener('DOMContentLoaded', siteEditsReady);
        return saved;
    } catch (err) { return ''; }
}
let drawnEdits = restoreSiteEdits(); // the edits on the page now, as JSON

// Pre-rendered pages carry the shipped text, so a page is drawn again if the edits differ from what it was drawn with
async function loadSiteEdits({ rerender = true } = {}) {
    if (!sb) { siteEditsReady(); return; }
    try {
        const list = await rows(sb.from('site_edits').select('key, value, updated_by'));
        siteEdits = Object.fromEntries(list.map(r => [r.key, r]));
        applyAdminEdits();
        const json = JSON.stringify(list);
        const changed = json !== (drawnEdits || '[]');
        drawnEdits = json;
        try { localStorage.setItem(SITE_EDITS_KEY, json); } catch (err) { /* private mode or full: the next visit just waits for the edits */ }
        // A story added in the admin has no pre-rendered page: its address opens as "not found" until the stories arrive
        if (currentPage === 'not-found') {
            const route = pathToRoute(location.pathname, location.search);
            currentPage = route.page;
            currentSlug = route.slug;
            updateNavState();
        }
        if (rerender && changed && currentPage !== 'admin' && currentPage !== 'golfer') {
            applyPageMeta(currentPage, currentSlug);
            renderApp();
        }
        if (IS_ADMIN_PREVIEW) applyPreviewNow();
    } catch (err) {
        console.warn('Site edits not loaded:', err);
    } finally {
        siteEditsReady();
    }
}
loadSiteEdits();

// The builder's options from the bundles (2026-11-18; app.js BUNDLE_CATALOG): names and ids only, for everyone. Kept
// for the next visit; a model page open when a different list arrives is drawn again. Before schema.sql adds it,
// the builder keeps its own lists
async function loadBundleCatalog() {
    if (!sb) return;
    try {
        const { data, error } = await sb.rpc('bundle_catalog');
        if (error) throw error;
        const next = Array.isArray(data) && data.length ? data : null;
        const changed = JSON.stringify(next) !== JSON.stringify(BUNDLE_CATALOG);
        BUNDLE_CATALOG = next;
        try { if (next) localStorage.setItem(BUNDLE_CATALOG_KEY, JSON.stringify(next)); else localStorage.removeItem(BUNDLE_CATALOG_KEY); } catch (e) { /* not kept */ }
        if (changed && currentPage === 'product-details') renderApp();
    } catch (err) {
        console.warn('Bundle list not loaded:', err.message || err);
    }
}
loadBundleCatalog();

async function saveSiteEdit(key, value, message) {
    const { error } = value ? await sb.from('site_edits').upsert({ key, value }) : await sb.from('site_edits').delete().eq('key', key);
    if (error) { showToast(`Not saved: ${error.message}`); return false; }
    await loadSiteEdits({ rerender: false });
    renderApp();
    showToast(message);
    return true;
}

// --- Page text, edited on the page itself (2026-11-12; every page since 2026-11-12) ---
// Super admins and marketing (content.edit) press "Edit this page" on any page of the site (2026-11-12: every page,
// not only the homepage), click a heading, paragraph, label or button, and change its text, font, size, alignment and
// position (and a button's link and style) in a small panel beside it. Saved per page in site_edits (pageTextKey():
// "home-text" for the homepage, "page-text:<page>[/<slug>]" for the rest): { items: { key: { orig, text, font, bold,
// size, align, x, y, link, style } } }. key: the section (its id or heading's id) and the element's place among that
// section's texts, plus "@<scope>" for a text that changes with a choice on the page (the cart stage's build: each build's
// line is its own edit); orig: its text as shipped, so an edit only lands on the text it was made for: if the code's
// text changes, the edit is skipped (and listed as out of date while editing). Left out: the forms, the stage's build
// cards, its color and its specs (edited in the admin's Products), and the parts that count or switch on their own (the
// banners' counter, the event's Read more). The banners, the Red Series and the event (2026-11-17) are edited on the
// page too; their admin editors (Site content) stay, and an edit made here goes out of date if the admin changes the
// text or photo underneath. Text is set as plain text (never as HTML)
const PAGE_TEXT_SKIP = '.home-stage-cards, .home-stage-swatches, .home-stage-shown > p, .home-stage-facts, .home-banners h1, .banner-bar .tabular-nums, #home-banner-status, #home-promo-title, [aria-controls="home-events-more"], form';
// Photos (2026-11-17, the homepage): any photo is clicked and replaced (uploaded to site-photos/page-photos) and its
// description changed. key: the section's name and "img<n>", n the place of the first photo with the same address (the
// event's scrolling photos repeat, and both copies change together), plus "@<build>" in the stage's features; orig: the
// photo's address as shipped; src: the new photo; alt: its description. A part with data-page-bg (the Red Series'
// background) is a photo too: its "bg<n>" entry sets the CSS variable named in data-page-bg-var. Left out: the
// stage's cart (it's recolored live) and its build cards
const PAGE_IMG_SKIP = '.home-stage-cart, .home-stage-cards, .home-stage-swatches, form';
const pageTextIsPhoto = el => el.tagName === 'IMG' || el.hasAttribute('data-page-bg');
// Also editable (2026-11-17), numbered after a section's other texts so earlier edits keep their keys: the range
// photo's names and seats, and a form's send button (the rest of a form stays out)
const PAGE_TEXT_EXTRA = '.lineup-name, .lineup-seats, form button[type="submit"]';
const PAGE_TEXT_SKIP_EXTRA = PAGE_TEXT_SKIP.replace(', form', '');
// Deleting (2026-11-17): a text or button, its container, or its whole section is hidden from visitors (shown
// faded while editing, so it can be restored). The entry's `del`: 'self', 'box' or 'section'
const PAGE_TEXT_DELETE = { self: 'This text', box: 'Its container', section: 'The whole section' };
const PAGE_TEXT_OFF = ['admin', 'not-found'];
const pageTextKey = () => currentPage === 'home' ? 'home-text' : `page-text:${currentPage}${currentSlug ? '/' + currentSlug : ''}`;
let pageTextDraftKey = null; // the page the draft belongs to
const PAGE_TEXT_TAGS = 'h1, h2, h3, h4, p, li, dt, dd, figcaption, blockquote, a, button';
const PAGE_TEXT_INNER = 'a, button, input, select, textarea, img, svg, video, picture, p, div, ul, ol, li, h1, h2, h3, h4, table';
const PAGE_TEXT_STEP = 8; // px per arrow press
let pageTextDraft = null;    // while editing: the items as edited so far
let pageTextSelected = null; // the element being edited
const pageTextOriginal = new WeakMap();

const pageTextNorm = s => String(s || '').replace(/\s+/g, ' ').trim();

function pageTextItems() {
    return pageTextDraft || pageTextSaved();
}

// The header's and footer's texts (2026-11-17) are the same on every page: their edits (keys starting "~") are saved
// once, under 'site-text', and shown with each page's own
const SITE_TEXT_KEY = 'site-text';
const SITE_TEXT_ROOTS = [['header', '#main-header'], ['footer', '.site-footer']];
function pageTextSaved() {
    return { ...(((siteEdits[SITE_TEXT_KEY] || {}).value || {}).items || {}), ...(((siteEdits[pageTextKey()] || {}).value || {}).items || {}) };
}

function canEditPageText() {
    return !PAGE_TEXT_OFF.includes(currentPage) && typeof can === 'function' && can('content.edit');
}

// The page's editable texts: elements holding only text (and simple formatting), outside the skipped parts
function pageTextTargets() {
    const root = document.getElementById('app-viewport');
    if (!root || PAGE_TEXT_OFF.includes(currentPage)) return [];
    const out = [];
    root.querySelectorAll('section').forEach((section, s) => {
        if (section.matches(PAGE_TEXT_SKIP) || section.closest(PAGE_TEXT_SKIP)) return;
        // As first drawn: the page builder stamps the name before it moves any section (data-pb-name)
        const name = section.dataset.pbName || section.id || section.getAttribute('aria-labelledby') || `section-${s}`;
        [...section.querySelectorAll(PAGE_TEXT_TAGS)]
            .filter(el => !el.closest(PAGE_TEXT_SKIP) && !el.querySelector(PAGE_TEXT_INNER) && (el.dataset.txtOrig || pageTextNorm(el.textContent)))
            .forEach((el, i) => out.push({ el, key: `${name}/${i}${el.dataset.txtScope ? '@' + el.dataset.txtScope : ''}` }));
        [...section.querySelectorAll(PAGE_TEXT_EXTRA)]
            .filter(el => !el.closest(PAGE_TEXT_SKIP_EXTRA) && !el.querySelector('img, svg, input, select, textarea') && pageTextNorm(el.dataset.txtOrig || el.textContent))
            .forEach((el, i) => out.push({ el, key: `${name}/x${i}` }));
        if (currentPage !== 'home') return;
        const first = new Map();
        [...section.querySelectorAll('img')].forEach((el, i) => {
            if (el.closest(PAGE_IMG_SKIP)) return;
            if (el.dataset.txtOrig == null) el.dataset.txtOrig = el.getAttribute('src') || '';
            if (!first.has(el.dataset.txtOrig)) first.set(el.dataset.txtOrig, i);
            const scoped = el.parentElement.closest('[data-txt-scope]');
            if (scoped) el.dataset.txtScope = scoped.dataset.txtScope; else delete el.dataset.txtScope;
            out.push({ el, key: `${name}/img${first.get(el.dataset.txtOrig)}${scoped ? '@' + scoped.dataset.txtScope : ''}` });
        });
        section.querySelectorAll('[data-page-bg]').forEach((el, i) => {
            el.dataset.txtOrig = el.dataset.pageBg;
            out.push({ el, key: `${name}/bg${i}` });
        });
    });
    // Text and buttons on the page outside any section (a model page's section bar), after the sections'
    [...root.querySelectorAll(PAGE_TEXT_TAGS)]
        .filter(el => !el.closest('section') && !el.closest('.page-text-ui, .pb-section') && !el.querySelector(PAGE_TEXT_INNER) && pageTextNorm(el.dataset.txtOrig || el.textContent))
        .forEach((el, i) => out.push({ el, key: `page/${i}` }));
    // The header and footer, site-wide: links and buttons with text only (not the icon buttons), and the footer's text
    SITE_TEXT_ROOTS.forEach(([name, sel]) => {
        const box = document.querySelector(sel);
        if (!box) return;
        [...box.querySelectorAll('a, button, h2, p')]
            .filter(el => !el.querySelector('svg, img, ' + PAGE_TEXT_INNER) && pageTextNorm(el.dataset.txtOrig || el.textContent))
            .forEach((el, i) => out.push({ el, key: `~${name}/${i}` }));
    });
    return out;
}

function safePageLink(link) {
    const l = String(link || '').trim();
    return /^(#[\w-]+|tel:[+\d\s()-]+|mailto:\S+|https?:\/\/\S+|[\w./?=&%-]+)$/i.test(l) && !/^javascript:/i.test(l) ? l : '';
}

function safePagePhoto(src) {
    const s = String(src || '').trim();
    return /^(https:\/\/[^\s"'()<>]+|image\/[^\s"'()<>]+)$/i.test(s) ? s : '';
}

function followPageLink(link) {
    if (link.startsWith('#')) {
        const target = document.getElementById(link.slice(1));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        location.href = link;
    }
}

function resetPageTextEl(el) {
    const o = pageTextOriginal.get(el);
    if (!o) return;
    // The selection outline and a stage text mid-swap (is-out) aren't part of the design: kept as they are
    const keep = ['is-txt-selected', 'is-out', 'is-open'].filter(c => el.classList.contains(c));
    // A photo's insides aren't its own (the Red Series' background holds the whole section): only its address changes
    if (!pageTextIsPhoto(el)) el.innerHTML = o.html;
    if (o.style == null) el.removeAttribute('style'); else el.setAttribute('style', o.style);
    ['btn-primary', 'btn-outline'].forEach(c => el.classList.toggle(c, o.cls.split(/\s+/).includes(c)));
    keep.forEach(c => el.classList.add(c));
    if (o.href == null) el.removeAttribute('href'); else el.setAttribute('href', o.href);
    if (o.route == null) el.removeAttribute('data-route'); else el.setAttribute('data-route', o.route);
    el.onclick = o.onclick;
    if (o.src != null && el.getAttribute('src') !== o.src) el.setAttribute('src', o.src);
    if (o.alt != null) el.setAttribute('alt', o.alt);
}

// The link a text sits inside (a card), when the text isn't a link or button itself
function pageTextCard(el) {
    return el.matches('a, button') ? null : el.closest('a[href]');
}
const pageTextCards = new Map(); // card -> its original href, route and click handler

// What "Its container" deletes: the card or list item the element is in, else its parent (never the whole section)
function pageTextBox(el) {
    const section = el.closest('section') || el.closest('#main-header, .site-footer, #app-viewport');
    let box = el.closest('.lineup-item, li, article, figure') || el.closest('a[href]');
    if (box === el || !box || !section || !section.contains(box)) box = el.parentElement;
    return box && box !== section && section && section.contains(box) ? box : el;
}

function applyPageTextEl(el, e) {
    if (!pageTextOriginal.has(el)) {
        pageTextOriginal.set(el, { html: el.innerHTML, style: el.getAttribute('style'), cls: el.className, href: el.getAttribute('href'),
            route: el.getAttribute('data-route'), onclick: el.onclick, src: el.getAttribute('src'), alt: el.getAttribute('alt') });
    }
    resetPageTextEl(el);
    if (!e) return;
    if (pageTextIsPhoto(el)) {
        const src = safePagePhoto(e.src);
        if (src && el.tagName === 'IMG') { el.setAttribute('src', src); el.removeAttribute('srcset'); }
        else if (src) el.style.setProperty(el.dataset.pageBgVar, `url(${JSON.stringify(new URL(src, document.baseURI).href)})`);
        if (e.alt != null && el.tagName === 'IMG') el.setAttribute('alt', e.alt);
        return;
    }
    if (e.text != null && pageTextNorm(e.text) && pageTextNorm(e.text) !== el.dataset.txtOrig) el.textContent = e.text;
    if (e.font) el.style.fontFamily = e.font === 'serif' ? 'var(--font-display)' : 'var(--font-text)';
    if (e.bold) el.style.fontWeight = e.bold === 'bold' ? '700' : '400';
    // A share of the size the page gives it at this screen width, so it still scales down on phones
    // The box's width and height (2026-11-17): a share of its size as designed at this screen width, measured before
    // the other changes; a wider box drops the designed line-length limit, and a button keeps its text centred
    // Never wider than the window. A text's height only grows its box (a shorter box would spill the text over what
    // follows it); a button's sets its height
    const screenW = document.documentElement.clientWidth;
    if ((e.w && e.w !== 100) || (e.h && e.h !== 100)) {
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        if (cs.display === 'inline') el.style.display = 'inline-block';
        if (e.w && e.w !== 100) { el.style.width = `${Math.min(r.width * e.w / 100, screenW - 16)}px`; el.style.maxWidth = 'none'; el.style.boxSizing = 'border-box'; }
        if (e.h && e.h !== 100) {
            if (el.matches('a, button')) el.style.height = `${r.height * e.h / 100}px`;
            else if (e.h > 100) el.style.minHeight = `${r.height * e.h / 100}px`;
            el.style.boxSizing = 'border-box';
        }
    }
    if (e.size && e.size !== 100) el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * e.size / 100}px`;
    if (e.align) el.style.textAlign = e.align;
    // A move (2026-11-17): across, a share of the window it was made at (ref), so it scales with the screen; and the
    // box is kept inside the window, so a move made on a wide screen never pushes it off a narrower one
    if (e.x || e.y) {
        const { x, y } = pageTextShift(e);
        el.style.translate = `${x}px ${y}px`;
        const r = el.getBoundingClientRect();
        const fix = r.left < 8 ? 8 - r.left : r.right > screenW - 8 ? Math.max(8 - r.left, screenW - 8 - r.right) : 0;
        if (fix) el.style.translate = `${x + fix}px ${y}px`;
    }
    if (e.style && el.classList.contains('btn')) {
        el.classList.remove('btn-primary', 'btn-outline');
        el.classList.add(e.style === 'green' ? 'btn-primary' : 'btn-outline');
    }
    const link = safePageLink(e.link);
    const card = pageTextCard(el);
    if (link && card) {
        if (!pageTextCards.has(card)) pageTextCards.set(card, { href: card.getAttribute('href'), route: card.getAttribute('data-route'), onclick: card.onclick });
        card.setAttribute('href', link);
        card.removeAttribute('data-route');
        card.onclick = ev => { if (pageTextDraft) return; ev.preventDefault(); followPageLink(link); };
    } else if (link) {
        if (el.tagName === 'A') el.setAttribute('href', link);
        el.removeAttribute('data-route');
        el.onclick = ev => { ev.preventDefault(); followPageLink(link); };
    }
}

// After each draw of a page (renderApp) and on resize: the saved (or, while editing, the drafted) edits
function applyPageText() {
    // A draft stays on the page it was started on: going to another page ends it (unsaved)
    if (pageTextDraft && pageTextDraftKey !== pageTextKey()) endPageTextEditing();
    if (PAGE_TEXT_OFF.includes(currentPage)) { endPageTextEditing(); renderPageTextButton(); return; }
    const items = pageTextItems();
    // Cards' links and deleted parts go back as they were, then the edits are put on again
    pageTextCards.forEach((o, card) => {
        if (o.href == null) card.removeAttribute('href'); else card.setAttribute('href', o.href);
        if (o.route == null) card.removeAttribute('data-route'); else card.setAttribute('data-route', o.route);
        card.onclick = o.onclick;
    });
    pageTextCards.clear();
    document.querySelectorAll('.pt-deleted').forEach(x => x.classList.remove('pt-deleted'));
    const deleted = [];
    pageTextTargets().forEach(({ el, key }) => {
        if (!el.dataset.txtOrig) el.dataset.txtOrig = pageTextNorm(el.textContent);
        el.dataset.txtKey = key;
        const e = items[key];
        const live = e && e.orig === el.dataset.txtOrig ? e : null;
        applyPageTextEl(el, live);
        if (live && live.del) deleted.push(live.del === 'section' ? el.closest('section') : live.del === 'box' ? pageTextBox(el) : el);
    });
    deleted.forEach(x => x && x.classList.add('pt-deleted'));
    if (pageTextSelected && !pageTextSelected.isConnected) pageTextSelected = null;
    renderPageTextButton();
    renderPageTextBar();
    renderPageTextTools();
}

let pageTextResize = 0;
window.addEventListener('resize', () => { clearTimeout(pageTextResize); pageTextResize = setTimeout(() => { if (!PAGE_TEXT_OFF.includes(currentPage)) applyPageText(); }, 150); });

// A part of the page that redraws its own texts (the cart stage on a build change): its texts go back to as shipped
// and are forgotten, so the part can set its new texts; applyPageText() afterwards puts the edits back
function releasePageText(root) {
    root.querySelectorAll('[data-txt-key]').forEach(el => {
        resetPageTextEl(el);
        pageTextOriginal.delete(el);
        delete el.dataset.txtOrig;
    });
}

// The edits whose text isn't on the page any more (the shipped text changed since). A scoped edit ("@build") whose
// text is in place but shows another choice right now (another build) isn't out of date
function stalePageTextKeys() {
    const targets = pageTextTargets();
    const live = new Map(targets.map(({ el, key }) => [key, el.dataset.txtOrig]));
    const scoped = new Set(targets.filter(({ el }) => el.dataset.txtScope).map(({ key }) => key.split('@')[0]));
    return Object.entries(pageTextItems())
        .filter(([key, e]) => live.has(key) ? live.get(key) !== e.orig : !(key.includes('@') && scoped.has(key.split('@')[0])))
        .map(([key]) => key);
}

// --- The editing controls: a button to start, a bar to save, and a panel beside the chosen text ---
function pageTextUi(id, html, cls) {
    let el = document.getElementById(id);
    if (!html) { if (el) el.remove(); return null; }
    if (!el) { el = document.createElement('div'); el.id = id; document.body.append(el); }
    el.className = `page-text-ui ${cls}`;
    el.innerHTML = html;
    return el;
}

// Edit this page (its text), and for the page builder, Build this page (its added sections); one at a time
function renderPageTextButton() {
    // Not in the page builder's phone preview, which shows the page as visitors will
    const busy = pageTextDraft || pbDraft || PB_PREVIEW;
    pageTextUi('page-text-start', busy ? '' : (canEditPageText() ? '<button type="button" onclick="startPageTextEditing()">Edit this page</button>' : '')
        + (canBuildPages() ? '<button type="button" onclick="startPageBuilding()">Build this page</button>' : ''), 'page-text-start');
}

function renderPageTextBar() {
    if (!pageTextDraft) { pageTextUi('page-text-bar', ''); return; }
    const stale = stalePageTextKeys();
    const changed = JSON.stringify(pageTextDraft) !== JSON.stringify(pageTextSaved());
    pageTextUi('page-text-bar', `
        <span>Editing ${currentPage === 'home' ? 'the homepage' : 'this page'}: click any text, button${currentPage === 'home' ? ' or photo' : ''}; drag its frame to move or resize it. ${Object.keys(pageTextDraft).length - stale.length} edited</span>
        ${stale.length ? `<button type="button" onclick="removeStalePageText()" class="page-text-quiet">${stale.length} out of date: remove</button>` : ''}
        <button type="button" onclick="discardPageText()" class="page-text-quiet">${changed ? 'Discard' : 'Close'}</button>
        <button type="button" onclick="savePageText(this)" class="page-text-save"${changed ? '' : ' disabled'}>Save</button>`, 'page-text-bar');
}

function startPageTextEditing() {
    pageTextDraft = clone(pageTextSaved());
    pageTextDraftKey = pageTextKey();
    document.body.classList.add('page-editing');
    // The banners stop turning, so the one being edited stays (the lines under them still change banner)
    if (typeof homeBanners !== 'undefined' && homeBanners) homeBanners.pause();
    applyPageText();
}

function endPageTextEditing() {
    pageTextDraft = null;
    pageTextDraftKey = null;
    if (pageTextSelected) pageTextSelected.classList.remove('is-txt-selected');
    pageTextSelected = null;
    document.body.classList.remove('page-editing');
    pageTextUi('page-text-bar', '');
    pageTextUi('page-text-tools', '');
    pageTextUi('page-text-handles', '');
}

function discardPageText() {
    if (JSON.stringify(pageTextDraft) !== JSON.stringify(pageTextSaved()) && !confirm('Discard your changes to this page\'s text?')) return;
    endPageTextEditing();
    renderApp();
}

function removeStalePageText() {
    stalePageTextKeys().forEach(key => delete pageTextDraft[key]);
    renderPageTextBar();
}

async function savePageText(button) {
    button.disabled = true;
    const items = pageTextDraft, key = pageTextDraftKey;
    endPageTextEditing();
    const own = Object.fromEntries(Object.entries(items).filter(([k]) => !k.startsWith('~')));
    const site = Object.fromEntries(Object.entries(items).filter(([k]) => k.startsWith('~')));
    const siteBefore = ((siteEdits[SITE_TEXT_KEY] || {}).value || {}).items || {};
    let ok = true;
    if (JSON.stringify(site) !== JSON.stringify(siteBefore)) ok = await saveSiteEdit(SITE_TEXT_KEY, Object.keys(site).length ? { items: site } : null, 'Header and footer saved.');
    if (ok) ok = await saveSiteEdit(key, Object.keys(own).length ? { items: own } : null, key === 'home-text' ? 'Homepage text saved.' : 'Page text saved.');
    if (!ok) { pageTextDraft = items; pageTextDraftKey = key; document.body.classList.add('page-editing'); applyPageText(); }
}

// While editing, a click on the page picks a text instead of following links or buttons
document.addEventListener('click', ev => {
    if (!pageTextDraft || ev.target.closest('.page-text-ui')) return;
    // A choice that changes the texts (the stage's build cards) still works, so each choice's texts can be edited
    if (!ev.target.closest('#app-viewport, #main-header, .site-footer') || ev.target.closest('[data-txt-pass]')) return;
    ev.preventDefault();
    ev.stopPropagation();
    const el = ev.target.closest('[data-txt-key]');
    if (el) selectPageText(el);
}, true);

function selectPageText(el) {
    if (pageTextSelected) pageTextSelected.classList.remove('is-txt-selected');
    pageTextSelected = el;
    el.classList.add('is-txt-selected');
    renderPageTextTools();
    const text = document.getElementById('pt-text');
    if (text) { text.focus(); text.select(); }
}

function pageTextEntry() {
    const el = pageTextSelected, key = el.dataset.txtKey;
    const e = pageTextDraft[key];
    return e && e.orig === el.dataset.txtOrig ? e : { orig: el.dataset.txtOrig };
}

// One change from the panel: kept in the draft (dropped again when everything is back to the original) and shown
function setPageText(field, value) {
    setPageTextFields({ [field]: value });
}

// quiet: during a drag, only the element, its handles and the bar are redrawn (the panel catches up on letting go)
function setPageTextFields(fields, quiet) {
    const el = pageTextSelected;
    if (!el) return;
    const field = Object.keys(fields)[0];
    const e = { ...pageTextEntry(), ...fields };
    ['x', 'y', 'size', 'w', 'h'].forEach(k => { if (k in fields) e[k] = Number(fields[k]) || 0; });
    // A move is set at this window's width (the values given are as shown here); the other way still gives the same y
    if ('x' in fields || 'y' in fields) {
        if (!('x' in fields)) e.x = Math.round(pageTextShift(e).x);
        e.ref = document.documentElement.clientWidth;
    }
    if (e.text != null && pageTextNorm(e.text) === e.orig) delete e.text;
    ['font', 'bold', 'align', 'link', 'style', 'del'].forEach(k => { if (!e[k]) delete e[k]; });
    ['size', 'w', 'h'].forEach(k => { if (e[k] === 100 || e[k] === 0) delete e[k]; });
    ['x', 'y'].forEach(k => { if (!e[k]) delete e[k]; });
    if (!e.x && !e.y) delete e.ref;
    if (pageTextIsPhoto(el)) {
        if (!e.src || e.src === e.orig) delete e.src;
        if (e.alt != null && e.alt === ((pageTextOriginal.get(el) || {}).alt || '')) delete e.alt;
    }
    const key = el.dataset.txtKey;
    if (Object.keys(e).length > 1) pageTextDraft[key] = e; else delete pageTextDraft[key];
    if (pageTextIsPhoto(el)) {
        applyPageText();
        if (field !== 'alt') renderPageTextTools();
        return;
    }
    applyPageTextEl(el, pageTextDraft[key] || null);
    renderPageTextBar();
    placePageTextHandles();
    if (quiet) return;
    // A slider keeps its place while it's dragged: only its label changes
    const slider = document.activeElement;
    if (['size', 'w', 'h'].includes(field) && slider && slider.type === 'range' && slider.closest('#page-text-tools')) {
        slider.parentElement.firstChild.nodeValue = `${{ size: 'Size', w: 'Width', h: 'Height' }[field]}: ${e[field] || 100}%`;
        placePageTextTools();
    } else if (field !== 'text' && field !== 'link') renderPageTextTools();
    else placePageTextTools();
}

// Deletes the chosen text, its container or its section ('' restores it); the whole page's deletions are drawn again
function setPageTextDelete(value) {
    if (value === 'section' && !confirm('Delete this whole section from the page? You can restore it while editing.')) return;
    setPageText('del', value);
    applyPageText();
}

function nudgePageText(dx, dy) {
    const { x, y } = pageTextShift(pageTextEntry());
    setPageTextFields({ x: Math.round(x + dx * PAGE_TEXT_STEP), y: Math.round(y + dy * PAGE_TEXT_STEP) });
}

// A move as it shows at this window width: across scales with the window it was made at (an older move, with no ref,
// as saved)
function pageTextShift(e) {
    const k = e.ref ? document.documentElement.clientWidth / e.ref : 1;
    return { x: (e.x || 0) * k, y: e.y || 0 };
}

function resetPageTextItem() {
    const el = pageTextSelected;
    if (!el) return;
    delete pageTextDraft[el.dataset.txtKey];
    applyPageText();
}

function closePageTextTools() {
    if (pageTextSelected) pageTextSelected.classList.remove('is-txt-selected');
    pageTextSelected = null;
    pageTextUi('page-text-tools', '');
    pageTextUi('page-text-handles', '');
}

function renderPageTextTools() {
    const el = pageTextSelected;
    renderPageTextHandles();
    if (!pageTextDraft || !el || !el.isConnected) { pageTextUi('page-text-tools', ''); return; }
    if (pageTextIsPhoto(el)) { renderPagePhotoTools(el); return; }
    const e = pageTextEntry();
    const isButton = el.matches('a, button');
    const choice = (field, options) => `<select onchange="setPageText('${field}', this.value)">${options.map(([v, label]) => `<option value="${v}"${(e[field] || '') === v ? ' selected' : ''}>${label}</option>`).join('')}</select>`;
    const pressed = (field, value, label, title) => `<button type="button" title="${title}" aria-pressed="${(e[field] || '') === value}" onclick="setPageText('${field}', '${value}')">${label}</button>`;
    pageTextUi('page-text-tools', `
        <div class="page-text-head"><b>${isButton ? 'Button or link' : 'Text'}</b><button type="button" onclick="closePageTextTools()" aria-label="Close">✕</button></div>
        <label>Text<textarea id="pt-text" rows="2" oninput="setPageText('text', this.value)">${escapeHtml(e.text != null ? e.text : e.orig)}</textarea></label>
        <div class="page-text-row">
            <label>Font${choice('font', [['', 'As designed'], ['serif', 'Serif (headings)'], ['sans', 'Sans (body)']])}</label>
            <label>Weight${choice('bold', [['', 'As designed'], ['bold', 'Bold'], ['regular', 'Regular']])}</label>
        </div>
        <label>Size: ${e.size || 100}%<input type="range" min="50" max="200" step="5" value="${e.size || 100}" oninput="setPageText('size', this.value)"></label>
        <div class="page-text-row">
            <label>Width: ${e.w || 100}%<input type="range" min="30" max="250" step="5" value="${e.w || 100}" oninput="setPageText('w', this.value)"></label>
            <label>Height: ${e.h || 100}%<input type="range" min="50" max="300" step="5" value="${e.h || 100}" oninput="setPageText('h', this.value)"></label>
        </div>
        ${isButton ? '' : `<div class="page-text-row"><span class="page-text-label">Align</span>
            ${pressed('align', '', 'Auto', 'As designed')}${pressed('align', 'left', 'Left', 'Align left')}${pressed('align', 'center', 'Centre', 'Centre')}${pressed('align', 'right', 'Right', 'Align right')}</div>`}
        <div class="page-text-row"><span class="page-text-label">Move</span>
            <button type="button" onclick="nudgePageText(-1, 0)" aria-label="Move left">←</button>
            <button type="button" onclick="nudgePageText(0, -1)" aria-label="Move up">↑</button>
            <button type="button" onclick="nudgePageText(0, 1)" aria-label="Move down">↓</button>
            <button type="button" onclick="nudgePageText(1, 0)" aria-label="Move right">→</button>
            <span class="page-text-label">${e.x || 0}, ${e.y || 0}</span></div>
        ${isButton ? `
            <label>Goes to<input type="text" value="${escapeHtml(e.link || '')}" placeholder="As designed (e.g. carts/, #home-quote, tel:+63277455089)" oninput="setPageText('link', this.value)"></label>
            ${el.classList.contains('btn') ? `<label>Style${choice('style', [['', 'As designed'], ['green', 'Green'], ['outline', 'Outlined']])}</label>` : ''}`
        : pageTextCard(el) ? `<label>Card goes to<input type="text" value="${escapeHtml(e.link || '')}" placeholder="As designed (e.g. carts/, use/resort/)" oninput="setPageText('link', this.value)"></label>` : ''}
        <div class="page-text-row page-text-delete"><span class="page-text-label">Delete</span>
            ${e.del ? `<span class="page-text-label">${PAGE_TEXT_DELETE[e.del]} is deleted</span><button type="button" onclick="setPageTextDelete('')">Restore</button>`
                : Object.entries(PAGE_TEXT_DELETE).filter(([v]) => v !== 'section' || el.closest('section')).map(([v, label]) => `<button type="button" onclick="setPageTextDelete('${v}')">${label}</button>`).join('')}</div>
        ${el.dataset.txtKey.startsWith('~') ? '<p class="page-text-label">Header and footer changes show on every page.</p>' : ''}
        <div class="page-text-row page-text-end"><button type="button" onclick="resetPageTextItem()">Reset this</button><button type="button" onclick="closePageTextTools()">Done</button></div>`, 'page-text-tools');
    placePageTextTools();
}

// A photo's panel: replace it, describe it, delete it. In the Red Series, buttons switch between the cover and the carts
// (the cover hides the carts' background), and the cover's new photo can go behind the carts too
let pagePhotoBusy = '';
function renderPagePhotoTools(el) {
    const e = pageTextEntry();
    const bg = el.hasAttribute('data-page-bg');
    const shown = bg ? safePagePhoto(e.src) || el.dataset.txtOrig : el.currentSrc || el.getAttribute('src');
    const promo = el.closest('.home-promo');
    const cover = el.closest('.promo-cover');
    const what = bg ? 'background' : 'photo';
    pageTextUi('page-text-tools', `
        <div class="page-text-head"><b>${bg ? 'Background photo' : 'Photo'}</b><button type="button" onclick="closePageTextTools()" aria-label="Close">✕</button></div>
        <img class="page-text-thumb" src="${escapeHtml(shown)}" alt="">
        <div class="page-text-row">
            <label class="page-text-file"><span>${pagePhotoBusy || 'Replace ' + what}</span><input type="file" accept="image/jpeg,image/png,image/webp" onchange="replacePagePhoto(this)"${pagePhotoBusy ? ' disabled' : ''}></label>
            ${e.src ? `<button type="button" onclick="setPageText('src', '')">Use the original</button>` : ''}
        </div>
        ${bg ? '' : `<label>Description (for screen readers and search)<input type="text" value="${escapeHtml(e.alt != null ? e.alt : el.getAttribute('alt') || '')}" placeholder="What the photo shows" oninput="setPageText('alt', this.value)"></label>`}
        ${cover && e.src ? '<button type="button" onclick="pagePhotoBehindCarts()">Use this photo behind the carts too</button>' : ''}
        ${promo ? `<div class="page-text-row"><span class="page-text-label">Red Series</span>
            <button type="button" onclick="togglePromoCover(true, true)">Show the carts</button>
            <button type="button" onclick="togglePromoCover(false, true)">Show the cover</button></div>` : ''}
        ${promo && !bg ? '<p class="page-text-label">For the background behind the carts: Show the carts, then click an empty part of it.</p>' : ''}
        <div class="page-text-row page-text-delete"><span class="page-text-label">Delete</span>
            ${e.del ? `<span class="page-text-label">${e.del === 'self' ? 'This ' + what : PAGE_TEXT_DELETE[e.del]} is deleted</span><button type="button" onclick="setPageTextDelete('')">Restore</button>`
                : Object.entries(PAGE_TEXT_DELETE).filter(([v]) => (v !== 'box' || !bg) && (v !== 'section' || el.closest('section')))
                    .map(([v, label]) => `<button type="button" onclick="setPageTextDelete('${v}')">${v === 'self' ? 'This ' + what : label}</button>`).join('')}</div>
        <div class="page-text-row page-text-end"><button type="button" onclick="resetPageTextItem()">Reset this</button><button type="button" onclick="closePageTextTools()">Done</button></div>`, 'page-text-tools');
    placePageTextTools();
}

async function replacePagePhoto(input) {
    const file = input.files && input.files[0], el = pageTextSelected;
    if (!file || !el) return;
    // The wide photos (banners, the Red Series, the event's header) at the banners' size and as JPEG; the rest keep
    // a PNG's see-through background (the cart cut-outs)
    const wide = el.hasAttribute('data-page-bg') || !!el.closest('.banner-slide, .promo-cover') || (el.naturalWidth >= 1600 && el.naturalWidth > el.naturalHeight * 2.5);
    pagePhotoBusy = 'Uploading…';
    renderPageTextTools();
    try {
        const url = await uploadSitePhoto(file, 'page-photos', wide ? { max: BANNER_PHOTO_MAX, jpeg: true } : {});
        pagePhotoBusy = '';
        if (pageTextSelected === el) setPageText('src', url); else renderPageTextTools();
    } catch (err) {
        pagePhotoBusy = '';
        renderPageTextTools();
        alert(`The photo didn't upload: ${err.message || err}`);
    }
}

function pagePhotoBehindCarts() {
    const src = pageTextEntry().src;
    const promo = pageTextSelected && pageTextSelected.closest('.home-promo');
    const stage = promo && promo.querySelector('[data-page-bg]');
    if (!src || !stage) return;
    togglePromoCover(true, true);
    selectPageText(stage);
    setPageText('src', src);
}

// The panel sits beside the chosen text, inside the window
function placePageTextTools() {
    const panel = document.getElementById('page-text-tools');
    if (!panel || !pageTextSelected) return;
    const r = pageTextSelected.getBoundingClientRect(), w = panel.offsetWidth, h = panel.offsetHeight;
    const fitsRight = r.right + 16 + w < window.innerWidth;
    let left = fitsRight ? r.right + 16 : r.left - 16 - w;
    if (left < 8) left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left));
    const top = Math.max(8, Math.min(window.innerHeight - h - 72, r.top));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
}
window.addEventListener('scroll', () => { if (pageTextSelected) { placePageTextTools(); placePageTextHandles(); } }, { passive: true });

// --- Dragging on the page (2026-11-17): the chosen text or button gets a frame with handles. The grip at its top left
// moves it (x, y); the right edge changes its width, the bottom edge its height, and the corner both (w, h, as a share
// of its size as designed, the same as the panel's sliders)
function renderPageTextHandles() {
    const el = pageTextSelected;
    if (!pageTextDraft || !el || !el.isConnected || pageTextIsPhoto(el)) { pageTextUi('page-text-handles', ''); return; }
    if (!document.getElementById('page-text-handles')) {
        pageTextUi('page-text-handles', `
            <span class="pth pth-move" data-drag="move" title="Drag to move">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg>
            </span>
            <span class="pth pth-e" data-drag="w" title="Drag to change the width"></span>
            <span class="pth pth-s" data-drag="h" title="Drag to change the height"></span>
            <span class="pth pth-se" data-drag="wh" title="Drag to change the width and height"></span>`, 'page-text-handles');
    }
    placePageTextHandles();
}

function placePageTextHandles() {
    const box = document.getElementById('page-text-handles');
    if (!box || !pageTextSelected) return;
    const r = pageTextSelected.getBoundingClientRect();
    Object.assign(box.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
}

document.addEventListener('pointerdown', ev => {
    const handle = ev.target.closest('#page-text-handles [data-drag]');
    const el = pageTextSelected;
    if (!handle || !el) return;
    ev.preventDefault();
    const mode = handle.dataset.drag, e0 = pageTextEntry(), r = el.getBoundingClientRect();
    // The size as designed, from the size now and the share it is of it
    const baseW = r.width / ((e0.w || 100) / 100), baseH = r.height / ((e0.h || 100) / 100);
    const sx = ev.clientX, sy = ev.clientY;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    handle.setPointerCapture(ev.pointerId);
    document.body.classList.add('page-text-dragging');
    const move = m => {
        const dx = m.clientX - sx, dy = m.clientY - sy, f = {};
        if (mode === 'move') { const at = pageTextShift(e0); f.x = Math.round(at.x + dx); f.y = Math.round(at.y + dy); }
        if (mode === 'w' || mode === 'wh') f.w = clamp(Math.round((r.width + dx) / baseW * 100), 20, 400);
        if (mode === 'h' || mode === 'wh') f.h = clamp(Math.round((r.height + dy) / baseH * 100), 20, 500);
        setPageTextFields(f, true);
    };
    const up = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
        document.body.classList.remove('page-text-dragging');
        renderPageTextTools();
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
});

// --- Page builder (2026-11-16): sections added to any page, the WordPress way ---
// Staff with the page builder permission (staff.page_builder in supabase/schema.sql; Donna for now) get "Build this
// page" beside "Edit this page". Phase 1: a "+ Add section" line between the page's sections inserts one of ten
// ready-made sections, in the site's own type, colours and dark mode; the panel beside it fills it in, and its toolbar
// moves, duplicates, hides or deletes it. Phase 2: the page's own sections move up and down and hide; Columns holds 2
// or 3 columns of headings, text, photos and buttons; an added section drags onto any "+ Add section" line; and Phone
// preview shows the draft at phone size. Phase 3: History lists the versions saved (each Save draft and Publish, kept
// by the database in page_revisions) and loads one back into the editor; Pages makes a new page at p/<slug>/ (its
// title and intro in 'custom-page:<slug>', optionally linked in the footer menu), changes its settings or deletes it.
// Saved per page in site_edits under 'page-sections:<page>[/<slug>]' as { live: page, draft: page }, a page being
// { sections, order, hidden }: visitors see live; Save draft keeps the work without showing it; Publish makes it live.
//   sections: [{ id, type, after, hidden, data, look }]; after is the page's own section it follows, or '@top'; one
//             whose section is gone goes to the end
//   order:    the page's own sections by name, in the order chosen (any not listed keep their place)
//   hidden:   the page's own sections hidden, by name
// The page's own sections are named as the page text names them (its id, its aria-labelledby, or section-<n> by its
// place as drawn), stamped on them (data-pb-name) before any moves, so the page text's keys never shift. The added
// sections are <div>s, not <section>s, for the same reason. Text is set as text, never as HTML
// Classes made from values, written out in full so the CSS build keeps them: pb-cards-1 pb-cards-2 pb-cards-3 pb-cards-4
// pb-bg-paper pb-bg-stone pb-bg-band pb-space-s pb-space-m pb-space-l pb-gap-s pb-gap-m pb-gap-l pb-align-left
// pb-align-center pb-cols-2 pb-cols-3
const PB_PHOTOS = ['image/4.png', 'image/5.png', 'image/6.png', 'image/7.png'];
const PB_TYPES = {
    text: { label: 'Heading and text', hint: 'A headline with a paragraph or two',
        data: () => ({ eyebrow: '', heading: 'A new heading', body: 'Write a few sentences here.', align: 'left' }) },
    'image-text': { label: 'Image and text', hint: 'A photo beside a headline, text and a button',
        data: () => ({ image: PB_PHOTOS[0], alt: '', heading: 'A photo and its story', body: 'Say what the photo shows and why it matters.', side: 'left', btnLabel: '', btnLink: '' }) },
    columns: { label: 'Columns', hint: '2 or 3 columns, each with headings, text, photos and buttons',
        data: () => ({ heading: '', count: '2', cols: ['First', 'Second', 'Third'].map(n => ({ blocks: [{ kind: 'heading', text: `${n} column` }, { kind: 'text', text: 'Some text for this column.' }] })) }) },
    banner: { label: 'Banner', hint: 'A wide photo with a headline over it',
        data: () => ({ image: 'image/Banners/golf.jpg', alt: '', heading: 'A headline over the photo', body: '', btnLabel: '', btnLink: '', height: 'm' }) },
    cards: { label: 'Cards', hint: '2 to 4 cards, each with a photo, title, text and link',
        data: () => ({ heading: 'Three things to know', cards: [1, 2, 3].map(n => ({ image: PB_PHOTOS[n], title: `Card ${n}`, text: 'A short description.', btnLabel: '', btnLink: '' })) }) },
    gallery: { label: 'Photo gallery', hint: 'A grid of photos',
        data: () => ({ heading: '', images: PB_PHOTOS.slice(0, 3).map(src => ({ src, alt: '' })) }) },
    cta: { label: 'Call to action', hint: 'A headline and one or two buttons on a band', look: { bg: 'band' },
        data: () => ({ heading: 'Ready to ride?', body: 'Tell us what you need and we\'ll send you a quotation.', btnLabel: 'Contact us', btnLink: 'contact/', btn2Label: '', btn2Link: '' }) },
    faq: { label: 'Questions and answers', hint: 'Questions that open to show their answers',
        data: () => ({ heading: 'Questions and answers', items: [{ q: 'A question customers ask?', a: 'Its answer.' }] }) },
    quote: { label: 'Quote', hint: 'What a customer said, and who said it',
        data: () => ({ quote: 'What a customer said about us.', name: 'Customer name', role: '' }) },
    spacer: { label: 'Space or line', hint: 'Room between sections, with or without a line',
        data: () => ({ size: 'm', line: 'yes' }) }
};
// What goes in a column, and a new one of each
const PB_BLOCKS = {
    heading: { label: 'Heading', make: () => ({ kind: 'heading', text: 'A heading' }) },
    text: { label: 'Text', make: () => ({ kind: 'text', text: 'Some text.' }) },
    image: { label: 'Photo', make: () => ({ kind: 'image', src: '', alt: '' }) },
    button: { label: 'Button', make: () => ({ kind: 'button', label: 'Find out more', link: '', style: 'primary' }) }
};
// A new item in a section's list (the panel's "Add"), and how many a list may hold
const PB_ITEMS = {
    'data.cards': () => ({ image: '', title: 'New card', text: 'A short description.', btnLabel: '', btnLink: '' }),
    'data.images': () => ({ src: '', alt: '' }),
    'data.items': () => ({ q: 'A question?', a: 'Its answer.' })
};
const pbLimit = path => (path === 'data.cards' ? 4 : path === 'data.items' ? 20 : 12);

// Phone preview: the page in a phone-sized frame named 'pb-preview' shows the draft handed over in sessionStorage
const PB_PREVIEW = window.name === 'pb-preview';

let pbDraft = null;     // while building: the page as edited so far ({ sections, order, hidden })
let pbDraftKey = null;  // the page the draft belongs to
let pbSelected = null;  // the added section open in the panel (its id)
let pbAdding = null;    // where "+ Add section" was pressed: { anchor, index }
let pbDragging = null;  // the added section being dragged (its id)
let pbAnchorNames = []; // what the "+ Add section" lines point at, by number: '@top', the page's sections, '@end'
let pbOwnNames = [];    // the page's own sections, by number, in the order shown

const pageSectionsKey = () => `page-sections:${currentPage}${currentSlug ? '/' + currentSlug : ''}`;
const pbEmpty = () => ({ sections: [], order: [], hidden: [] });

function pbPage(v) {
    if (!v || typeof v !== 'object') return null;
    const list = x => (Array.isArray(x) ? x : []);
    return { sections: list(v.sections), order: list(v.order), hidden: list(v.hidden) };
}

function pbSaved() {
    if (PB_PREVIEW) {
        try {
            const preview = JSON.parse(sessionStorage.getItem('pb-preview') || 'null');
            if (preview && preview.key === pageSectionsKey()) return { live: pbPage(preview.page) || pbEmpty(), draft: null };
        } catch (err) { /* no preview: the published page */ }
    }
    const value = (siteEdits[pageSectionsKey()] || {}).value || {};
    return { live: pbPage(value.live) || pbEmpty(), draft: pbPage(value.draft) };
}

function canBuildPages() {
    const admin = currentAdmin();
    return !PB_PREVIEW && !!(admin && admin.page_builder) && !PAGE_TEXT_OFF.includes(currentPage);
}

// ---- The sections as visitors see them ----
const pbText = v => escapeHtml(String(v == null ? '' : v));
// Paragraphs from blank lines, line breaks kept
const pbParas = v => String(v || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => `<p>${pbText(p).replace(/\n/g, '<br>')}</p>`).join('');
// A photo on the site (image/...) or uploaded (https://...)
const pbSrc = v => (/^(https:\/\/|image\/)/i.test(String(v || '').trim()) ? String(v).trim() : '');

// A photo not chosen yet shows as a grey box while building, and not at all to visitors
let pbDrawingDraft = false;
function pbImg(src, alt, cls = '') {
    const url = pbSrc(src);
    if (url) return `<img src="${escapeHtml(url)}" alt="${pbText(alt)}" loading="lazy" class="${cls}">`;
    return pbDrawingDraft ? `<div class="pb-img-empty ${cls}">No photo yet</div>` : '';
}

function pbButton(label, link, kind) {
    return String(label || '').trim() ? `<a href="${escapeHtml(safePageLink(link) || 'contact/')}" class="btn ${kind} pb-btn">${pbText(label)}</a>` : '';
}

function pbBlockHtml(k, second) {
    if (k.kind === 'heading') return String(k.text || '').trim() ? `<h3 class="type-md">${pbText(k.text)}</h3>` : '';
    if (k.kind === 'text') return `<div class="pb-body">${pbParas(k.text)}</div>`;
    if (k.kind === 'image') return pbImg(k.src, k.alt, 'pb-col-img');
    if (k.kind === 'button') return `<div>${pbButton(k.label, k.link, k.style === 'outline' ? second : 'btn-primary')}</div>`;
    return '';
}

function pbSectionHtml(b, editing) {
    pbDrawingDraft = editing;
    const d = b.data || {}, look = { bg: 'paper', space: 'm', ...(b.look || {}) };
    const second = look.bg === 'band' ? 'btn-on-dark' : 'btn-outline';
    const wrap = inner => `<div class="max-w-site mx-auto px-5 sm:px-8 lg:px-12">${inner}</div>`;
    const heading = (text, cls = 'type-lg') => (String(text || '').trim() ? `<h2 class="${cls}">${pbText(text)}</h2>` : '');
    let inner = '';
    if (b.type === 'text') {
        inner = wrap(`<div class="pb-text pb-align-${d.align === 'center' ? 'center' : 'left'}">${d.eyebrow ? `<p class="pb-eyebrow">${pbText(d.eyebrow)}</p>` : ''}${heading(d.heading)}<div class="pb-body measure">${pbParas(d.body)}</div></div>`);
    } else if (b.type === 'image-text') {
        inner = wrap(`<div class="pb-split${d.side === 'right' ? ' pb-split-right' : ''}"><div class="pb-split-media">${pbImg(d.image, d.alt)}</div>
            <div class="pb-split-text">${heading(d.heading)}<div class="pb-body">${pbParas(d.body)}</div>${pbButton(d.btnLabel, d.btnLink, 'btn-primary')}</div></div>`);
    } else if (b.type === 'columns') {
        const count = d.count === '3' ? 3 : 2;
        inner = wrap(`${heading(d.heading, 'type-lg pb-head')}<div class="pb-cols pb-cols-${count}">${(d.cols || []).slice(0, count)
            .map(c => `<div class="pb-col">${(c.blocks || []).map(k => pbBlockHtml(k, second)).join('')}</div>`).join('')}</div>`);
    } else if (b.type === 'banner') {
        inner = `<div class="pb-banner${d.height === 'l' ? ' pb-banner-l' : ''}">${pbImg(d.image, d.alt, 'pb-banner-img')}<div class="pb-banner-shade"></div>
            ${wrap(`<div class="pb-banner-text">${heading(d.heading, 'type-xl')}${d.body ? `<div class="pb-body measure">${pbParas(d.body)}</div>` : ''}${pbButton(d.btnLabel, d.btnLink, 'btn-primary')}</div>`)}</div>`;
    } else if (b.type === 'cards') {
        const cards = (d.cards || []).slice(0, 4);
        inner = wrap(`${heading(d.heading, 'type-lg pb-head')}<div class="pb-cards pb-cards-${cards.length}">${cards.map(c => `<article class="pb-card">
            ${pbSrc(c.image) ? pbImg(c.image, c.title, 'pb-card-img') : ''}<h3 class="type-md">${pbText(c.title)}</h3><div class="pb-body">${pbParas(c.text)}</div>
            ${String(c.btnLabel || '').trim() ? `<a href="${escapeHtml(safePageLink(c.btnLink) || 'contact/')}" class="link">${pbText(c.btnLabel)}</a>` : ''}</article>`).join('')}</div>`);
    } else if (b.type === 'gallery') {
        inner = wrap(`${heading(d.heading, 'type-lg pb-head')}<div class="pb-gallery">${(d.images || []).map(i => `<figure>${pbImg(i.src, i.alt)}</figure>`).join('')}</div>`);
    } else if (b.type === 'cta') {
        inner = wrap(`<div class="pb-cta">${heading(d.heading)}${d.body ? `<div class="pb-body measure">${pbParas(d.body)}</div>` : ''}
            <div class="pb-actions">${pbButton(d.btnLabel, d.btnLink, 'btn-primary')}${pbButton(d.btn2Label, d.btn2Link, second)}</div></div>`);
    } else if (b.type === 'faq') {
        inner = wrap(`${heading(d.heading, 'type-lg pb-head')}<div class="pb-faq">${(d.items || []).map(i => `<details><summary>${pbText(i.q)}</summary><div class="pb-body">${pbParas(i.a)}</div></details>`).join('')}</div>`);
    } else if (b.type === 'quote') {
        inner = wrap(`<figure class="pb-quote"><blockquote class="type-md">“${pbText(d.quote)}”</blockquote><figcaption><b>${pbText(d.name)}</b>${d.role ? ` · ${pbText(d.role)}` : ''}</figcaption></figure>`);
    } else if (b.type === 'spacer') {
        inner = d.line === 'yes' ? wrap('<hr class="pb-rule">') : '';
    }
    const space = b.type === 'spacer' ? `pb-gap-${['s', 'm', 'l'].includes(d.size) ? d.size : 'm'}` : b.type === 'banner' ? '' : `pb-space-${['s', 'm', 'l'].includes(look.space) ? look.space : 'm'}`;
    const bg = b.type === 'banner' || b.type === 'spacer' ? '' : ` pb-bg-${['paper', 'stone', 'band'].includes(look.bg) ? look.bg : 'paper'}`;
    return `<div class="pb-section${bg} ${space}${b.hidden ? ' is-hidden' : ''}${editing && pbSelected === b.id ? ' is-selected' : ''}" data-pb-id="${escapeHtml(b.id)}">${editing ? pbToolbar(b) : ''}${inner}</div>`;
}

// The page's own sections (not those inside another), each stamped with its name and place as first drawn
function pbOwn(root) {
    const all = [...root.querySelectorAll('section')];
    all.forEach((section, s) => {
        if (!section.dataset.pbName) section.dataset.pbName = section.id || section.getAttribute('aria-labelledby') || `section-${s}`;
    });
    const own = all.filter(section => !(section.parentElement && section.parentElement.closest('section')));
    own.forEach((section, i) => { if (section.dataset.pbPlace == null) section.dataset.pbPlace = String(i); });
    return own.map(el => ({ name: el.dataset.pbName, el }));
}

// The order chosen, with any section it doesn't list kept after the one it followed as first drawn
function pbOrder(base, order) {
    const out = order.filter((name, i) => base.includes(name) && order.indexOf(name) === i);
    base.forEach((name, i) => {
        if (out.includes(name)) return;
        const before = i ? out.indexOf(base[i - 1]) : -1;
        out.splice(before + 1, 0, name);
    });
    return out;
}

// After each draw of a page (renderApp): the published page (or, while building, the draft with its controls)
function applyPageSections() {
    if (pbDraft && pbDraftKey !== pageSectionsKey()) endPageBuilding();
    const root = document.getElementById('app-viewport');
    if (!root) return;
    root.querySelectorAll('.pb-section, .pb-insert, .pb-own-bar').forEach(el => el.remove());
    root.querySelectorAll('.pb-own, [data-pb-off]').forEach(el => {
        el.classList.remove('pb-own', 'pb-own-hidden');
        if (el.dataset.pbOff != null) { el.style.display = ''; delete el.dataset.pbOff; }
    });
    if (PAGE_TEXT_OFF.includes(currentPage)) { renderPbBar(); return; }
    const editing = !!pbDraft;
    const page = editing ? pbDraft : pbSaved().live;

    // The page's own sections in the order chosen: each moves into the place of the one shown there
    const own = pbOwn(root);
    const base = own.slice().sort((a, b) => a.el.dataset.pbPlace - b.el.dataset.pbPlace).map(a => a.name);
    const order = pbOrder(base, page.order);
    const byName = new Map(own.map(a => [a.name, a.el]));
    const marks = own.map(a => { const m = document.createComment(''); a.el.before(m); return m; });
    order.forEach((name, i) => marks[i].after(byName.get(name)));
    marks.forEach(m => m.remove());
    pbOwnNames = order;
    order.forEach(name => {
        const el = byName.get(name);
        if (!page.hidden.includes(name)) return;
        if (editing) el.classList.add('pb-own-hidden');
        else { el.dataset.pbOff = ''; el.style.display = 'none'; }
    });

    // The added sections, each after the section it follows
    pbAnchorNames = ['@top', ...order, '@end'];
    const groups = {};
    page.sections.forEach((b, i) => {
        const anchor = b.after === '@top' || byName.has(b.after) ? b.after : '@end';
        (groups[anchor] = groups[anchor] || []).push({ b, i });
    });
    const inserter = (anchor, index) => (editing ? `<div class="pb-insert page-text-ui" ondragover="pbDragOver(event)" ondragleave="this.classList.remove('is-over')" ondrop="pbDrop(event, ${pbAnchorNames.indexOf(anchor)}, ${index})">
        <button type="button" onclick="pbOpenAdd(${pbAnchorNames.indexOf(anchor)}, ${index})">${pbDragging ? 'Drop here' : '+ Add section'}</button></div>` : '');
    const html = anchor => {
        const items = groups[anchor] || [];
        return inserter(anchor, items.length ? items[0].i : page.sections.length)
            + items.filter(({ b }) => editing || !b.hidden).map(({ b, i }) => pbSectionHtml(b, editing) + (editing ? inserter(anchor, i + 1) : '')).join('');
    };
    root.insertAdjacentHTML('afterbegin', html('@top'));
    order.forEach((name, i) => {
        const el = byName.get(name);
        el.insertAdjacentHTML('afterend', html(name));
        if (!editing) return;
        el.classList.add('pb-own');
        const hidden = page.hidden.includes(name);
        el.insertAdjacentHTML('beforebegin', `<div class="pb-own-bar page-text-ui"><div class="pb-toolbar"><b>Page section${hidden ? ' · hidden' : ''}</b>
            <button type="button" onclick="pbOwnMove(${i}, -1)" aria-label="Move up" title="Move up"${i ? '' : ' disabled'}>↑</button>
            <button type="button" onclick="pbOwnMove(${i}, 1)" aria-label="Move down" title="Move down"${i < order.length - 1 ? '' : ' disabled'}>↓</button>
            <button type="button" onclick="pbOwnHide(${i})">${hidden ? 'Show' : 'Hide'}</button></div></div>`);
    });
    if (groups['@end']) root.insertAdjacentHTML('beforeend', groups['@end'].filter(({ b }) => editing || !b.hidden).map(({ b }) => pbSectionHtml(b, editing)).join(''));
    if (pbSelected && !(pbDraft ? pbDraft.sections : []).some(b => b.id === pbSelected)) pbSelected = null;
    renderPbBar();
    renderPbPanel();
}

// ---- Building ----
function pbToolbar(b) {
    const t = PB_TYPES[b.type] || { label: 'Section' };
    const id = escapeHtml(b.id);
    return `<div class="pb-toolbar page-text-ui"><b>${t.label}${b.hidden ? ' · hidden' : ''}</b>
        <button type="button" draggable="true" ondragstart="pbDragStart(event, '${id}')" ondragend="pbDragEnd()" title="Drag onto a + Add section line" class="pb-drag">⠿ Drag</button>
        <button type="button" onclick="pbMove('${id}', -1)" aria-label="Move up" title="Move up">↑</button>
        <button type="button" onclick="pbMove('${id}', 1)" aria-label="Move down" title="Move down">↓</button>
        <button type="button" onclick="pbSelect('${id}')">Edit</button>
        <button type="button" onclick="pbDuplicate('${id}')">Duplicate</button>
        <button type="button" onclick="pbToggleHidden('${id}')">${b.hidden ? 'Show' : 'Hide'}</button>
        <button type="button" onclick="pbDelete('${id}')">Delete</button></div>`;
}

function startPageBuilding() {
    if (pageTextDraft || !canBuildPages()) return;
    const saved = pbSaved();
    pbDraft = clone(saved.draft || saved.live);
    pbDraftKey = pageSectionsKey();
    pbSelected = null;
    document.body.classList.add('page-building');
    applyPageSections();
    renderPageTextButton();
    if (saved.draft) showToast('Continuing the draft saved for this page.');
}

function endPageBuilding() {
    pbDraft = null;
    pbDraftKey = null;
    pbSelected = null;
    pbAdding = null;
    pbDragging = null;
    document.body.classList.remove('page-building', 'pb-dragging');
    ['pb-bar', 'pb-panel', 'pb-picker', 'pb-preview', 'pb-pages', 'pb-history'].forEach(id => pageTextUi(id, ''));
}

const pbSame = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function pbChanged() {
    const saved = pbSaved();
    return !pbSame(pbDraft, saved.draft || saved.live);
}

function renderPbBar() {
    if (!pbDraft) { pageTextUi('pb-bar', ''); return; }
    const unpublished = !pbSame(pbDraft, pbSaved().live);
    const changed = pbChanged();
    const n = pbDraft.sections.length;
    const moved = pbDraft.order.length || pbDraft.hidden.length ? ' · sections rearranged' : '';
    pageTextUi('pb-bar', `
        <span>Building: ${n} added section${n === 1 ? '' : 's'}${moved}${unpublished ? ' · not published' : ' · published'}</span>
        <button type="button" onclick="pbOpenPages()" class="page-text-quiet">Pages</button>
        <button type="button" onclick="pbOpenHistory()" class="page-text-quiet">History</button>
        <button type="button" onclick="pbPhonePreview()" class="page-text-quiet">Phone preview</button>
        <button type="button" onclick="closePageBuilding()" class="page-text-quiet">${changed ? 'Discard' : 'Close'}</button>
        <button type="button" onclick="savePageSections(false, this)" class="page-text-quiet"${changed ? '' : ' disabled'}>Save draft</button>
        <button type="button" onclick="savePageSections(true, this)" class="page-text-save"${unpublished ? '' : ' disabled'}>Publish</button>`, 'page-text-bar pb-bar');
}

function closePageBuilding() {
    if (pbChanged() && !confirm('Discard the changes since your last save?')) return;
    endPageBuilding();
    applyPageSections();
    renderPageTextButton();
}

// Save draft: kept, but visitors still see what's published. Publish: the draft becomes what visitors see
async function savePageSections(publish, button) {
    if (!pbDraft) return;
    button.disabled = true;
    const saved = pbSaved(), page = clone(pbDraft), key = pbDraftKey;
    const empty = pbSame(page, pbEmpty());
    const value = publish ? (empty ? null : { live: page }) : { live: saved.live, draft: page };
    const ok = await saveSiteEdit(key, value, publish ? 'Published: visitors now see this page as built.' : 'Draft saved. Visitors still see the published page.');
    if (!ok) button.disabled = false;
}

// The draft at phone size: the page in a 390px frame, handed the draft through sessionStorage
function pbPhonePreview() {
    try { sessionStorage.setItem('pb-preview', JSON.stringify({ key: pbDraftKey, page: pbDraft })); } catch (err) { showToast('The preview could not open in this browser.'); return; }
    pageTextUi('pb-preview', `<div class="pb-preview-box" role="dialog" aria-label="Phone preview">
        <div class="page-text-head"><b>Phone preview of your draft</b><button type="button" onclick="pbClosePreview()" aria-label="Close">✕</button></div>
        <iframe name="pb-preview" src="${escapeHtml(location.href)}" title="This page at phone size, with your draft"></iframe></div>`, 'pb-picker pb-preview');
}

function pbClosePreview() {
    pageTextUi('pb-preview', '');
    try { sessionStorage.removeItem('pb-preview'); } catch (err) { /* nothing to clear */ }
}

function pbFind(id) {
    return pbDraft ? pbDraft.sections.find(b => b.id === id) : null;
}

function pbRedraw(scrollTo) {
    applyPageSections();
    const el = scrollTo && document.querySelector(`[data-pb-id="${CSS.escape(scrollTo)}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function pbSelect(id) {
    pbSelected = id || null;
    pbRedraw();
}

function pbOpenAdd(anchorIndex, index) {
    pbAdding = { anchor: pbAnchorNames[anchorIndex] || '@end', index };
    pageTextUi('pb-picker', `<div class="pb-picker-box" role="dialog" aria-label="Add a section">
        <div class="page-text-head"><b>Add a section</b><button type="button" onclick="pbCloseAdd()" aria-label="Close">✕</button></div>
        <div class="pb-picker-grid">${Object.entries(PB_TYPES).map(([type, t]) => `<button type="button" onclick="pbAdd('${type}')"><b>${t.label}</b><span>${t.hint}</span></button>`).join('')}</div></div>`, 'pb-picker');
}

function pbCloseAdd() {
    pbAdding = null;
    pageTextUi('pb-picker', '');
}

function pbNewId() {
    return `pb${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function pbAdd(type) {
    const t = PB_TYPES[type];
    if (!t || !pbDraft || !pbAdding) return;
    const b = { id: pbNewId(), type, after: pbAdding.anchor, data: t.data(), look: { bg: 'paper', space: 'm', ...(t.look || {}) } };
    pbDraft.sections.splice(Math.min(pbAdding.index, pbDraft.sections.length), 0, b);
    pbCloseAdd();
    pbSelected = b.id;
    pbRedraw(b.id);
}

// An added section up or down past the next section, the page's own included: the order is read as one list of the
// page's sections (markers) and the added ones, the two neighbours swap, and each added one follows the marker before it
function pbMove(id, dir) {
    const known = new Set(['@top', ...pbOwnNames]);
    const tokens = [];
    ['@top', ...pbOwnNames].forEach(name => { tokens.push({ anchor: name }); pbDraft.sections.filter(b => b.after === name).forEach(b => tokens.push({ b })); });
    pbDraft.sections.filter(b => !known.has(b.after)).forEach(b => tokens.push({ b }));
    const i = tokens.findIndex(t => t.b && t.b.id === id), j = i + dir;
    if (i < 0 || j < 1 || j >= tokens.length) return;
    [tokens[i], tokens[j]] = [tokens[j], tokens[i]];
    let anchor = '@top';
    const out = [];
    tokens.forEach(t => { if (t.anchor) anchor = t.anchor; else { t.b.after = anchor; out.push(t.b); } });
    pbDraft.sections = out;
    pbSelected = id;
    pbRedraw(id);
}

// Dragging an added section onto a "+ Add section" line puts it there
function pbDragStart(ev, id) {
    pbDragging = id;
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/plain', id);
    document.body.classList.add('pb-dragging');
    document.querySelectorAll('.pb-insert button').forEach(b => { b.textContent = 'Drop here'; });
}

function pbDragOver(ev) {
    if (!pbDragging) return;
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';
    ev.currentTarget.classList.add('is-over');
}

function pbDragEnd() {
    if (!pbDragging) return;
    pbDragging = null;
    document.body.classList.remove('pb-dragging');
    document.querySelectorAll('.pb-insert').forEach(el => el.classList.remove('is-over'));
    document.querySelectorAll('.pb-insert button').forEach(b => { b.textContent = '+ Add section'; });
}

function pbDrop(ev, anchorIndex, index) {
    ev.preventDefault();
    const id = pbDragging;
    pbDragEnd();
    const from = pbDraft.sections.findIndex(b => b.id === id);
    if (from < 0) return;
    const [b] = pbDraft.sections.splice(from, 1);
    b.after = pbAnchorNames[anchorIndex] || '@end';
    pbDraft.sections.splice(Math.min(from < index ? index - 1 : index, pbDraft.sections.length), 0, b);
    pbSelected = id;
    pbRedraw(id);
}

// The page's own sections: up or down one place (the sections added after one move with it), and hide or show
function pbOwnMove(i, dir) {
    const order = pbOwnNames.slice(), j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    pbDraft.order = order;
    pbRedraw();
    const el = document.querySelector(`[data-pb-name="${CSS.escape(order[j])}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function pbOwnHide(i) {
    const name = pbOwnNames[i];
    pbDraft.hidden = pbDraft.hidden.includes(name) ? pbDraft.hidden.filter(n => n !== name) : [...pbDraft.hidden, name];
    pbRedraw();
}

function pbDuplicate(id) {
    const i = pbDraft.sections.findIndex(b => b.id === id);
    if (i < 0) return;
    const copy = { ...clone(pbDraft.sections[i]), id: pbNewId() };
    pbDraft.sections.splice(i + 1, 0, copy);
    pbSelected = copy.id;
    pbRedraw(copy.id);
}

function pbToggleHidden(id) {
    const b = pbFind(id);
    if (!b) return;
    if (b.hidden) delete b.hidden; else b.hidden = true;
    pbRedraw();
}

function pbDelete(id) {
    if (!confirm('Delete this section?')) return;
    pbDraft.sections = pbDraft.sections.filter(b => b.id !== id);
    if (pbSelected === id) pbSelected = null;
    pbRedraw();
}

// ---- The panel: the chosen section's content and look ----
function pbGet(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

// One change from the panel. Typing redraws only that section, so the field keeps its focus; a choice also redraws the panel
function pbSet(path, value, panel) {
    const b = pbFind(pbSelected);
    if (!b) return;
    const keys = path.split('.');
    let o = b;
    keys.slice(0, -1).forEach(k => { if (o[k] == null) o[k] = {}; o = o[k]; });
    o[keys[keys.length - 1]] = value;
    const el = document.querySelector(`[data-pb-id="${CSS.escape(b.id)}"]`);
    if (el) el.outerHTML = pbSectionHtml(b, true);
    renderPbBar();
    if (panel) renderPbPanel();
}

function pbListAdd(path, kind) {
    const b = pbFind(pbSelected), list = b && pbGet(b, path);
    if (!Array.isArray(list) || list.length >= pbLimit(path)) return;
    list.push(kind ? PB_BLOCKS[kind].make() : PB_ITEMS[path]());
    pbRedraw();
}

function pbListRemove(path, i) {
    const b = pbFind(pbSelected), list = b && pbGet(b, path);
    if (!Array.isArray(list)) return;
    list.splice(i, 1);
    pbRedraw();
}

function pbListMove(path, i, dir) {
    const b = pbFind(pbSelected), list = b && pbGet(b, path), j = i + dir;
    if (!Array.isArray(list) || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    pbRedraw();
}

async function pbUpload(path, input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const id = pbSelected;
    showToast('Uploading the photo…');
    try {
        const url = await uploadSitePhoto(file, 'page-sections');
        pbSelected = id;
        pbSet(path, url, true);
        showToast('Photo added.');
    } catch (err) {
        showToast(`Photo not added: ${err.message}`);
    }
}

const pbAttr = v => escapeHtml(String(v == null ? '' : v));

function pbInput(label, path, value, { area = false, placeholder = '' } = {}) {
    const field = area
        ? `<textarea rows="3" oninput="pbSet('${path}', this.value)">${pbAttr(value)}</textarea>`
        : `<input type="text" value="${pbAttr(value)}" placeholder="${pbAttr(placeholder)}" oninput="pbSet('${path}', this.value)">`;
    return `<label>${label}${field}</label>`;
}

function pbChoice(label, path, value, options) {
    return `<label>${label}<select onchange="pbSet('${path}', this.value, true)">${options.map(([v, text]) => `<option value="${v}"${value === v ? ' selected' : ''}>${text}</option>`).join('')}</select></label>`;
}

function pbPhoto(label, path, value) {
    const url = pbSrc(value);
    return `<div class="pb-photo-field"><span class="page-text-label">${label}</span>${url ? `<img src="${escapeHtml(url)}" alt="">` : ''}
        <label class="pb-upload">Upload a photo<input type="file" accept="image/jpeg,image/png,image/webp" onchange="pbUpload('${path}', this)"></label>
        <input type="text" value="${pbAttr(value)}" placeholder="or a photo address (image/… or https://…)" onchange="pbSet('${path}', this.value, true)"></div>`;
}

const PB_LINK_HINT = 'e.g. carts/, contact/, #home-quote, https://…';

function pbButtonFields(d, prefix, label = 'Button') {
    return pbInput(`${label} text (empty: no button)`, `data.${prefix}Label`, d[`${prefix}Label`])
        + pbInput(`${label} goes to`, `data.${prefix}Link`, d[`${prefix}Link`], { placeholder: PB_LINK_HINT });
}

// A column's contents: each piece with its own fields, moved, removed, and new ones added
function pbColumnFields(col, path) {
    const blocks = col.blocks || [];
    const list = `${path}.blocks`;
    return blocks.map((k, i) => {
        const p = `${list}.${i}`;
        const fields = k.kind === 'heading' ? pbInput('Heading', `${p}.text`, k.text)
            : k.kind === 'text' ? pbInput('Text', `${p}.text`, k.text, { area: true })
                : k.kind === 'image' ? pbPhoto('Photo', `${p}.src`, k.src) + pbInput('Description', `${p}.alt`, k.alt)
                    : pbInput('Button text', `${p}.label`, k.label) + pbInput('Goes to', `${p}.link`, k.link, { placeholder: PB_LINK_HINT })
                        + pbChoice('Style', `${p}.style`, k.style, [['primary', 'Green'], ['outline', 'Outlined']]);
        return `<div class="pb-piece"><div class="page-text-row"><span class="page-text-label">${(PB_BLOCKS[k.kind] || { label: 'Piece' }).label}</span>
            <button type="button" onclick="pbListMove('${list}', ${i}, -1)" aria-label="Move up"${i ? '' : ' disabled'}>↑</button>
            <button type="button" onclick="pbListMove('${list}', ${i}, 1)" aria-label="Move down"${i < blocks.length - 1 ? '' : ' disabled'}>↓</button>
            <button type="button" onclick="pbListRemove('${list}', ${i})" aria-label="Remove">✕</button></div>${fields}</div>`;
    }).join('') + (blocks.length < pbLimit(list) ? `<div class="page-text-row"><span class="page-text-label">Add</span>${Object.entries(PB_BLOCKS)
        .map(([kind, t]) => `<button type="button" onclick="pbListAdd('${list}', '${kind}')">${t.label}</button>`).join('')}</div>` : '');
}

function renderPbPanel() {
    const b = pbDraft && pbFind(pbSelected);
    if (!b) { pageTextUi('pb-panel', ''); return; }
    pageTextUi('pb-pages', '');
    pageTextUi('pb-history', '');
    const d = b.data || {}, t = PB_TYPES[b.type] || { label: 'Section' }, look = { bg: 'paper', space: 'm', ...(b.look || {}) };
    const list = (path, items, legend, fields, addLabel) => items.map((item, i) => `<fieldset><legend>${legend} ${i + 1}</legend>${fields(item, `${path}.${i}`)}
            ${items.length > 1 ? `<button type="button" onclick="pbListRemove('${path}', ${i})">Remove</button>` : ''}</fieldset>`).join('')
        + (items.length < pbLimit(path) ? `<button type="button" onclick="pbListAdd('${path}')">${addLabel}</button>` : '');
    let fields = '';
    if (b.type === 'text') {
        fields = pbInput('Small label above (optional)', 'data.eyebrow', d.eyebrow) + pbInput('Heading', 'data.heading', d.heading)
            + pbInput('Text (a blank line starts a new paragraph)', 'data.body', d.body, { area: true })
            + pbChoice('Alignment', 'data.align', d.align, [['left', 'Left'], ['center', 'Centred']]);
    } else if (b.type === 'image-text') {
        fields = pbPhoto('Photo', 'data.image', d.image) + pbInput('Photo description (for screen readers)', 'data.alt', d.alt)
            + pbChoice('Photo side', 'data.side', d.side, [['left', 'Photo on the left'], ['right', 'Photo on the right']])
            + pbInput('Heading', 'data.heading', d.heading) + pbInput('Text', 'data.body', d.body, { area: true }) + pbButtonFields(d, 'btn');
    } else if (b.type === 'columns') {
        const count = d.count === '3' ? 3 : 2;
        fields = pbInput('Heading (optional)', 'data.heading', d.heading) + pbChoice('Columns', 'data.count', String(count), [['2', '2 columns'], ['3', '3 columns']])
            + (d.cols || []).slice(0, count).map((c, i) => `<fieldset><legend>Column ${i + 1}</legend>${pbColumnFields(c, `data.cols.${i}`)}</fieldset>`).join('');
    } else if (b.type === 'banner') {
        fields = pbPhoto('Photo', 'data.image', d.image) + pbInput('Photo description (for screen readers)', 'data.alt', d.alt)
            + pbChoice('Height', 'data.height', d.height, [['m', 'Medium'], ['l', 'Tall']])
            + pbInput('Headline', 'data.heading', d.heading) + pbInput('Text (optional)', 'data.body', d.body, { area: true }) + pbButtonFields(d, 'btn');
    } else if (b.type === 'cards') {
        fields = pbInput('Heading (optional)', 'data.heading', d.heading)
            + list('data.cards', d.cards || [], 'Card', (c, p) => pbPhoto('Photo (optional)', `${p}.image`, c.image) + pbInput('Title', `${p}.title`, c.title)
                + pbInput('Text', `${p}.text`, c.text, { area: true }) + pbInput('Link text (optional)', `${p}.btnLabel`, c.btnLabel)
                + pbInput('Link goes to', `${p}.btnLink`, c.btnLink, { placeholder: PB_LINK_HINT }), 'Add a card');
    } else if (b.type === 'gallery') {
        fields = pbInput('Heading (optional)', 'data.heading', d.heading)
            + list('data.images', d.images || [], 'Photo', (i, p) => pbPhoto('Photo', `${p}.src`, i.src) + pbInput('Description', `${p}.alt`, i.alt), 'Add a photo');
    } else if (b.type === 'cta') {
        fields = pbInput('Heading', 'data.heading', d.heading) + pbInput('Text (optional)', 'data.body', d.body, { area: true })
            + pbButtonFields(d, 'btn', 'Main button') + pbButtonFields(d, 'btn2', 'Second button');
    } else if (b.type === 'faq') {
        fields = pbInput('Heading (optional)', 'data.heading', d.heading)
            + list('data.items', d.items || [], 'Question', (q, p) => pbInput('Question', `${p}.q`, q.q) + pbInput('Answer', `${p}.a`, q.a, { area: true }), 'Add a question');
    } else if (b.type === 'quote') {
        fields = pbInput('What they said', 'data.quote', d.quote, { area: true }) + pbInput('Name', 'data.name', d.name) + pbInput('Role or place (optional)', 'data.role', d.role);
    } else if (b.type === 'spacer') {
        fields = pbChoice('Space', 'data.size', d.size, [['s', 'Small'], ['m', 'Medium'], ['l', 'Large']])
            + pbChoice('Line', 'data.line', d.line, [['yes', 'With a line'], ['no', 'Space only']]);
    }
    const lookFields = b.type === 'banner' || b.type === 'spacer' ? '' : `<fieldset><legend>Look</legend>
        ${pbChoice('Background', 'look.bg', look.bg, [['paper', 'Page'], ['stone', 'Stone band'], ['band', 'Dark band']])}
        ${pbChoice('Space above and below', 'look.space', look.space, [['s', 'Small'], ['m', 'Medium'], ['l', 'Large']])}</fieldset>`;
    const scroll = (document.getElementById('pb-panel') || {}).scrollTop || 0;
    const panel = pageTextUi('pb-panel', `
        <div class="page-text-head"><b>${t.label}</b><button type="button" onclick="pbSelect(null)" aria-label="Close">✕</button></div>
        ${fields}${lookFields}
        <div class="page-text-row page-text-end"><button type="button" onclick="pbSelect(null)">Done</button></div>`, 'pb-panel');
    if (panel) { panel.setAttribute('aria-label', `${t.label} settings`); panel.scrollTop = scroll; }
}

// ---- Phase 3: History (the versions saved) and Pages (pages made here) ----
let pbRevisions = []; // the versions listed in History, newest first

// One side panel at a time: a section's settings, Pages or History
function pbSidePanel(id, html) {
    if (pbSelected) { pbSelected = null; applyPageSections(); }
    ['pb-pages', 'pb-history'].filter(x => x !== id).forEach(x => pageTextUi(x, ''));
    return pageTextUi(id, html, 'pb-panel');
}

const pbPanelHead = (title, id) => `<div class="page-text-head"><b>${title}</b><button type="button" onclick="pageTextUi('${id}', '')" aria-label="Close">✕</button></div>`;

// The page a saved version holds: its draft when it was a Save draft, else what was published (nothing when cleared)
function pbRevisionPage(r) {
    const v = r.value || {};
    return pbPage(v.draft) || pbPage(v.live) || pbEmpty();
}

async function pbOpenHistory() {
    if (!pbDraft) return;
    pbSidePanel('pb-history', `${pbPanelHead('History', 'pb-history')}<p class="page-text-label">Loading…</p>`);
    const key = pbDraftKey;
    const { data, error } = await sb.from('page_revisions').select('id, value, saved_by, saved_at').eq('key', key).order('id', { ascending: false }).limit(30);
    if (!pbDraft || pbDraftKey !== key || !document.getElementById('pb-history')) return;
    pbRevisions = data || [];
    const when = at => new Date(at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
    const list = error
        ? `<p>History isn't available yet: ${/does not exist|schema cache|relation/i.test(error.message) ? 're-run supabase/schema.sql in Supabase' : escapeHtml(error.message)}.</p>`
        : !pbRevisions.length ? '<p class="page-text-label">No versions yet. Each Save draft and Publish keeps one.</p>'
            : pbRevisions.map((r, i) => {
                const kind = !r.value ? 'Page cleared' : r.value.draft ? 'Draft saved' : 'Published';
                const n = pbRevisionPage(r).sections.length;
                return `<div class="pb-page-row"><div><b>${kind}</b><span>${when(r.saved_at)} · ${escapeHtml(adminName(r.saved_by) || 'unknown')} · ${n} added section${n === 1 ? '' : 's'}</span></div>
                    <button type="button" onclick="pbRestore(${i})">Load</button></div>`;
            }).join('');
    pageTextUi('pb-history', `${pbPanelHead('History', 'pb-history')}
        <p class="page-text-label">Load an earlier version into the editor, then Save draft or Publish to keep it. Newest first; the last 30 are kept.</p>${list}`, 'pb-panel');
}

function pbRestore(i) {
    const r = pbRevisions[i];
    if (!r || !pbDraft) return;
    if (pbChanged() && !confirm('Replace your unsaved changes with this version?')) return;
    pbDraft = clone(pbRevisionPage(r));
    pbSelected = null;
    pageTextUi('pb-history', '');
    pbRedraw();
    showToast('Earlier version loaded. Save draft or Publish to keep it.');
}

// A page's address from its title: lower case, words joined by dashes
function pbSlug(title) {
    return String(title || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
}

function pbOpenPages() {
    if (!pbDraft) return;
    const current = currentPage === 'custom' ? CUSTOM_PAGES.find(c => c.slug === currentSlug) : null;
    const pages = CUSTOM_PAGES.slice().sort((a, b) => String(a.title).localeCompare(String(b.title)));
    pbSidePanel('pb-pages', `${pbPanelHead('Pages', 'pb-pages')}
        <fieldset><legend>New page</legend>
            <label>Title<input id="pb-new-title" type="text" placeholder="e.g. Golf course partners" oninput="document.getElementById('pb-new-address').textContent = 'p/' + (pbSlug(this.value) || '…') + '/'"></label>
            <span class="page-text-label">Address: golfcarts.ph/<span id="pb-new-address">p/…/</span></span>
            <button type="button" onclick="pbCreatePage(this)">Create the page</button>
        </fieldset>
        ${current ? `<fieldset><legend>This page</legend>
            <label>Title<input id="pb-page-title" type="text" value="${pbAttr(current.title)}"></label>
            <label>Intro under the title (also shown by search engines)<textarea id="pb-page-intro" rows="3">${pbAttr(current.intro)}</textarea></label>
            <label class="pb-check"><input id="pb-page-menu" type="checkbox"${current.menu ? ' checked' : ''}> Show in the footer menu (Company)</label>
            <label>Name in the menu (optional)<input id="pb-page-label" type="text" value="${pbAttr(current.menuLabel)}" placeholder="The title"></label>
            <div class="page-text-row"><button type="button" onclick="pbSavePageSettings(this)">Save page settings</button>
                <button type="button" onclick="pbDeletePage()">Delete this page</button></div>
        </fieldset>` : ''}
        <fieldset><legend>Pages made here</legend>
            ${pages.length ? pages.map(c => `<div class="pb-page-row"><div><b>${pbText(c.title)}</b><span>p/${c.slug}/${c.menu ? ' · in the footer menu' : ''}</span></div>
                <button type="button" onclick="pbGoToPage('${c.slug}')"${current && current.slug === c.slug ? ' disabled' : ''}>Open</button></div>`).join('')
                : '<p class="page-text-label">None yet.</p>'}
        </fieldset>`);
}

// Leaving the page being built: asks first when there are unsaved changes
function pbLeave() {
    if (pbDraft && pbChanged() && !confirm('Leave this page? Your changes since the last save will be lost.')) return false;
    endPageBuilding();
    return true;
}

function pbGoToPage(slug) {
    if (!pbLeave()) return;
    navigateTo('custom', slug);
    startPageBuilding();
}

async function pbCreatePage(button) {
    const title = ((document.getElementById('pb-new-title') || {}).value || '').trim();
    const base = pbSlug(title);
    if (!base) { showToast('Give the page a title first.'); return; }
    let slug = base;
    for (let n = 2; CUSTOM_PAGES.some(c => c.slug === slug); n++) slug = `${base}-${n}`;
    if (!pbLeave()) return;
    button.disabled = true;
    const ok = await saveSiteEdit(`custom-page:${slug}`, { title, intro: '', menu: false, menuLabel: '' }, `Page created at p/${slug}/. Add sections, then Publish.`);
    if (!ok) { button.disabled = false; return; }
    navigateTo('custom', slug);
    startPageBuilding();
    pbOpenPages();
}

async function pbSavePageSettings(button) {
    const page = CUSTOM_PAGES.find(c => c.slug === currentSlug);
    if (currentPage !== 'custom' || !page) return;
    const value = id => ((document.getElementById(id) || {}).value || '').trim();
    const title = value('pb-page-title');
    if (!title) { showToast('The page needs a title.'); return; }
    button.disabled = true;
    const ok = await saveSiteEdit(`custom-page:${page.slug}`, { title, intro: value('pb-page-intro'), menu: !!(document.getElementById('pb-page-menu') || {}).checked, menuLabel: value('pb-page-label') }, 'Page settings saved.');
    applyPageMeta(currentPage, currentSlug);
    if (ok) pbOpenPages(); else button.disabled = false;
}

async function pbDeletePage() {
    const page = CUSTOM_PAGES.find(c => c.slug === currentSlug);
    if (currentPage !== 'custom' || !page) return;
    if (!confirm(`Delete the page "${page.title}" and everything on it? Its address will stop working.`)) return;
    const sectionsKey = pageSectionsKey();
    endPageBuilding();
    if (siteEdits[sectionsKey] && !(await saveSiteEdit(sectionsKey, null, 'Page sections removed.'))) return;
    if (await saveSiteEdit(`custom-page:${page.slug}`, null, `The page "${page.title}" is deleted.`)) navigateTo('home');
}

// While building, a click on an added section opens it in the panel; links and buttons elsewhere on the page don't
// navigate away from the unsaved draft
document.addEventListener('click', ev => {
    if (!pbDraft || ev.target.closest('.page-text-ui') || !ev.target.closest('#app-viewport')) return;
    const section = ev.target.closest('.pb-section');
    if (section) {
        ev.preventDefault();
        ev.stopPropagation();
        if (pbSelected !== section.dataset.pbId) pbSelect(section.dataset.pbId);
        return;
    }
    if (ev.target.closest('a, button')) { ev.preventDefault(); ev.stopPropagation(); }
}, true);

// --- Admin sign in ---
async function handleAdminSignIn(e) {
    e.preventDefault();
    const form = e.target;
    const error = document.getElementById('admin-error');
    if (!sb) { error.textContent = 'Sign-in is not available on this page.'; return; }
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
        const { data, error: authError } = await sb.auth.signInWithPassword({ email: form.elements.email.value.trim(), password: form.elements.password.value });
        if (authError) throw authError;
        await loadAccount(data.user);
        if (!currentAdmin()) error.textContent = 'You are logged in, but this email does not have admin access.';
    } catch (err) {
        error.textContent = authMessage(err);
    } finally {
        button.disabled = false;
    }
}

async function signOutAdmin() {
    if (sb) await sb.auth.signOut();
    await loadAccount(null);
}

// The admin's sections, grouped as the sidebar shows them: [id, label, permission]. Home (no permission) is every
// role's own start page
const ADMIN_SECTIONS = [
    ['', [['home', 'Home']]],
    ['Work', [['quotes', 'Quote requests', 'quotes.view'], ['quotations', 'Quotations', 'quotations.view'], ['golfers', 'Golfers', 'golfers.view'], ['zoho', 'Zoho leads', 'leads.zoho']]],
    ['Catalog', [['bundles', 'Bundles', 'bundles.view'], ['products', 'Products', 'products.edit'], ['content', 'Site content', 'content.edit'], ['stories', 'Stories and guides', 'content.edit']]],
    ['Team', [['users', 'Staff', 'users.manage'], ['activity', 'Activity log', 'log.view']]]
];

// The quotation pipeline across the top of Quote requests and Quotations: each stage's count; a click filters to it
let quoteFilter = '';     // '' or 'open' (requests without a quotation yet)
let quotationFilter = ''; // '' or a quotation status

function adminPipeline(data) {
    const quotations = data.quotations || [];
    const withQuotation = new Set(quotations.map(q => q.quote_id));
    const count = s => quotations.filter(q => s.includes(q.status)).length;
    return [
        { id: 'open', label: 'New requests', n: data.quotes.filter(q => !withQuotation.has(q.id) && q.status !== 'Lost' && q.status !== 'Sold').length, tab: 'quotes' },
        { id: 'draft', label: 'Draft', n: count(['draft', 'returned']), note: count(['returned']) ? `${count(['returned'])} returned` : '', tab: 'quotations' },
        { id: 'submitted', label: 'Waiting for approval', n: count(['submitted']), tab: 'quotations' },
        { id: 'approved', label: 'Approved', n: count(['approved']), tab: 'quotations' },
        { id: 'sent', label: 'Sent', n: count(['sent']), tab: 'quotations' }
    ];
}

function renderAdminPipeline(data) {
    if (!can('quotations.view') || !data.quotations) return '';
    const active = adminTab === 'quotes' ? quoteFilter : quotationFilter;
    return `<ol class="adm-pipeline" aria-label="Quotation pipeline">${adminPipeline(data).map(s => `
        <li><button type="button" onclick="filterPipeline('${s.tab}', '${s.id}')" aria-pressed="${active === s.id && adminTab === s.tab}">
            <span class="adm-pipeline-n">${s.n}</span>
            <span class="adm-pipeline-label">${s.label}</span>
            ${s.note ? `<span class="adm-pipeline-note">${s.note}</span>` : ''}
        </button></li>`).join('')}</ol>`;
}

function filterPipeline(tab, id) {
    const active = tab === 'quotes' ? quoteFilter : quotationFilter;
    const next = active === id && adminTab === tab ? '' : id;
    if (tab === 'quotes') quoteFilter = next; else quotationFilter = next;
    adminTab = tab;
    quotationOpen = null;
    renderApp();
}

function showAdminTab(tab) {
    adminTab = tab;
    quotationOpen = null;
    renderApp();
}

// Each section's heading: its title, a one-line summary from the data, and its actions
function adminHeading(data) {
    const quotes = data ? data.quotes || [] : [], quotations = data && data.quotations ? data.quotations : [];
    const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
    const admin = currentAdmin();
    const hour = new Date().getHours();
    const headings = {
        home: [`Good ${hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'}, ${escapeHtml(adminName(admin.email))}`, ADMIN_ROLES[admin.role].home, ''],
        quotes: ['Quote requests', data ? `${plural(quotes.length, 'request')}, ${quotes.filter(q => q.status === 'New').length} new` : '',
            `${can('export.quotes') ? '<button type="button" onclick="exportAdminQuotes()" class="adm-btn">Export quotes</button>' : ''}`],
        quotations: ['Quotations', data ? `${plural(quotations.length, 'quotation')}, ${quotations.filter(q => q.status === 'submitted').length} waiting for approval` : '', ''],
        golfers: ['Golfers', data ? `${plural((data.golfers || []).length, 'member')}, ${(data.golfers || []).filter(g => g.news).length} want member news` : '', ''],
        bundles: ['Bundles', 'Cost lines for each build, in USD. Quotations are priced from these.', ''],
        products: ['Products', 'Photos, text and specifications of each model, and the accessory photos.', ''],
        content: ['Site content', `${HOLIDAY_HIDDEN ? '' : 'The holiday theme, '}the homepage carousel, the Red Series and the event story.`.replace(/^t/, 'T'), ''],
        stories: ['Stories and guides', 'Add, edit or remove the stories on the Stories and Guides page.', ''],
        zoho: ['Zoho leads', 'Each quote request from the website, and whether it reached Zoho CRM Leads. Newest first.', '<button type="button" onclick="reloadPageData()" class="adm-btn">Refresh</button>'],
        users: ['Staff', 'Who can use the admin, and as what.', `${can('export.all') ? '<button type="button" onclick="exportAdminData()" class="adm-btn">Export all data</button>' : ''}`],
        activity: ['Activity log', 'Who changed what and when, newest first. Only super admins see this, and nobody can edit it.', '<button type="button" onclick="reloadPageData()" class="adm-btn">Refresh</button>']
    };
    return headings[adminTab];
}

function renderAdminPage() {
    if (!account.ready) return renderLoading();
    const admin = currentAdmin();
    if (!admin) return `
        <div class="adm-signin">
            <form data-no-prefill onsubmit="handleAdminSignIn(event)" class="adm-signin-card" novalidate>
                <a href="./" data-route="home" aria-label="Golfcarts.ph website"><img src="image/GCPH_logo.png" alt="Golfcarts.ph" width="140" height="31" class="h-8 w-auto"></a>
                <div>
                    <h1 class="adm-title">Sign in to the admin</h1>
                    <p class="adm-sub">For Golfcarts.ph staff. Use your work email.</p>
                </div>
                <div class="field"><label for="admin-email">Work email</label><input id="admin-email" name="email" required type="email" autocomplete="username"></div>
                <div class="field"><label for="admin-password">Password</label><input id="admin-password" name="password" required type="password" autocomplete="current-password"></div>
                <p id="admin-error" class="golfer-error" role="alert"></p>
                <button type="submit" class="btn btn-primary w-full">Sign in</button>
                <p class="text-sm">First time? <button type="button" onclick="openGolferModal('signup')" class="link">Create your password</button> with your work email, then confirm it from your inbox.</p>
                <p class="text-sm"><button type="button" onclick="openGolferModal('forgot')" class="link">Forgot your password?</button></p>
            </form>
        </div>`;

    const data = pageDataFor('admin', async () => {
        // Bundles are read by everyone who prices quotations; tables not created yet (supabase/schema.sql not re-run)
        // come back as null, and the rest of the admin still loads
        const costs = can('bundles.view') || can('quotations.view');
        const [quotes, golfers, builds, staff, bundles, skuUsd, quotations, pricing, activity, zohoLeads, skuPhotos, skuPhotoSync, zohoItems, skuSitePhotos, stockSheet, basis] = await Promise.all([
            can('quotes.view') ? rows(sb.from('quotes').select('*').order('created_at', { ascending: false })) : Promise.resolve([]),
            can('golfers.view') ? rows(sb.from('golfers').select('*').order('joined_at', { ascending: false })) : Promise.resolve([]),
            can('golfers.view') ? rows(sb.from('saved_builds').select('golfer_id')) : Promise.resolve([]),
            can('users.manage') ? rows(sb.from('staff').select('*').order('added_at')) : Promise.resolve([]),
            costs ? allRows(() => sb.from('bundles').select('*').order('sheet_row')).catch(() => null) : Promise.resolve([]),
            costs ? allRows(() => sb.from('sku_usd').select('*').order('sheet_row')).catch(() => null) : Promise.resolve([]),
            can('quotations.view') ? rows(sb.from('quotations').select('*').order('created_at', { ascending: false })).catch(() => null) : Promise.resolve([]),
            can('quotations.view') ? rows(sb.from('pricing_settings').select('*').eq('id', 1).maybeSingle()).catch(() => null) : Promise.resolve(null),
            can('log.view') ? rows(sb.from('activity_log').select('*').order('created_at', { ascending: false }).limit(ACTIVITY_LIMIT)).catch(() => null) : Promise.resolve([]),
            can('leads.zoho') ? rows(sb.from('zoho_leads').select('*').order('created_at', { ascending: false }).limit(ZOHO_LIMIT)).catch(() => null) : Promise.resolve([]),
            // The SKUs' photos from Zoho Inventory, and when they were last copied (null until schema.sql adds them)
            costs ? allRows(() => sb.from('sku_photos').select('sku, url').order('sku')).catch(() => null) : Promise.resolve(null),
            costs ? rows(sb.from('sku_photo_sync').select('*').eq('id', 1).maybeSingle()).catch(() => null) : Promise.resolve(null),
            // Every Zoho Inventory item (no prices), and the photos added here for SKUs Zoho has none for
            // with their stock once schema.sql has added it (before that, without)
            costs ? allRows(() => sb.from('zoho_items').select('sku, name, category, unit, has_photo, available_stock, stock_on_hand, reorder_level').order('sku'))
                .catch(() => allRows(() => sb.from('zoho_items').select('sku, name, category, unit, has_photo').order('sku')))
                .catch(() => null) : Promise.resolve(null),
            costs ? allRows(() => sb.from('sku_site_photos').select('sku, url').order('sku')).catch(() => null) : Promise.resolve(null),
            // The team's stock sheet: per-branch stock, in transit and remarks (null until schema.sql adds it)
            costs ? allRows(() => sb.from('stock_sheet').select('sku, cebu, manila, sta_rosa, total, in_transit, remark, movement').order('sku')).catch(() => null) : Promise.resolve(null),
            // The admin's own bundles (2026-11-18): parts list and build bases (null until schema.sql adds them)
            costs ? loadBundleBasis().catch(() => null) : Promise.resolve(null)
        ]);
        return { quotes, golfers, builds, staff, bundles, skuUsd, quotations, pricing, activity, zohoLeads, skuPhotos, skuPhotoSync, zohoItems, skuSitePhotos, stockSheet, basis };
    });
    const sections = ADMIN_SECTIONS.map(([group, items]) => [group, items.filter(([, , p]) => !p || can(p))]).filter(([, items]) => items.length);
    const allowed = sections.flatMap(([, items]) => items.map(([id]) => id));
    if (!allowed.includes(adminTab)) adminTab = allowed[0];
    const needsData = ['home', 'quotes', 'quotations', 'golfers', 'bundles', 'users', 'activity', 'zoho'].includes(adminTab);
    const ready = data && !data.error;
    const body = data && data.error ? renderLoadError(data.error)
        : needsData && !data ? '<p class="text-mute" role="status">Loading…</p>'
        : { home: renderAdminHome, quotes: renderAdminQuotes, quotations: renderAdminQuotations, golfers: renderAdminGolfers, products: renderAdminProducts,
            content: renderAdminContent, stories: renderAdminStories, bundles: renderAdminBundles, users: renderAdminUsers, activity: renderAdminActivity, zoho: renderAdminZoho }[adminTab](data);
    // Counts beside the sidebar items: new requests, and quotations waiting on this person
    const counts = ready ? {
        quotes: data.quotes.filter(q => q.status === 'New').length,
        quotations: (data.quotations || []).filter(q => approvesQuotation(q) || (can('quotations.prepare') && q.status === 'returned')).length,
        zoho: (data.zohoLeads || []).filter(zohoNeedsSending).length
    } : {};
    const [title, summary, actions] = adminHeading(ready ? data : null);
    const editing = adminTab === 'quotations' && quotationOpen;
    return `
        <div class="adm">
            <aside class="adm-side" aria-label="Admin">
                <div class="adm-brand">
                    <a href="./" data-route="home" aria-label="Golfcarts.ph website"><img src="image/GCPH_logo.png" alt="Golfcarts.ph" width="120" height="27" class="h-7 w-auto"></a>
                    <span>Admin</span>
                </div>
                <nav class="adm-nav" aria-label="Admin sections">
                    ${sections.map(([group, items]) => `
                        ${group ? `<p class="adm-nav-group">${group}</p>` : ''}
                        ${items.map(([id, label]) => `<button type="button" onclick="showAdminTab('${id}')"${adminTab === id ? ' aria-current="page"' : ''}>
                            <span>${label}</span>${counts[id] ? `<span class="adm-count" aria-label="${counts[id]} need attention">${counts[id]}</span>` : ''}
                        </button>`).join('')}`).join('')}
                </nav>
                <div class="adm-me">
                    <p class="adm-me-name">${escapeHtml(adminName(admin.email))}</p>
                    <p class="adm-me-role">${ADMIN_ROLES[admin.role].label}</p>
                    <div class="adm-me-links">
                        <button type="button" class="theme-toggle" aria-pressed="${currentTheme() === 'dark'}">Dark mode</button>
                        <a href="./" data-route="home">View website</a>
                        <button type="button" onclick="signOutAdmin()">Sign out</button>
                    </div>
                </div>
            </aside>
            <div class="adm-main">
                ${editing ? '' : `<header class="adm-head">
                    <div>
                        <h1 class="adm-title">${title}</h1>
                        ${summary ? `<p class="adm-sub">${summary}</p>` : ''}
                    </div>
                    ${actions ? `<div class="adm-actions">${actions}</div>` : ''}
                </header>
                ${ready && (adminTab === 'quotes' || adminTab === 'quotations') ? renderAdminPipeline(data) : ''}`}
                <div class="adm-body">${body}</div>
            </div>
        </div>`;
}

// --- Home: each role's own start page: what is waiting on them, and the way into their work ---
// A number tile that opens the section (and pipeline stage) it counts
function homeTile(n, label, note, onclick, alert) {
    return `<li><button type="button" onclick="${onclick}" class="adm-tile${alert && n ? ' adm-tile-alert' : ''}">
        <span class="adm-tile-n">${n}</span><span class="adm-tile-label">${label}</span>${note ? `<span class="adm-tile-note">${note}</span>` : ''}
    </button></li>`;
}

// A short list of quotations or requests to act on; `rows` are [main text, detail, button label, onclick]
function homeList(title, rows, empty, more) {
    return `<section class="adm-panel">
        <div class="adm-panel-head"><h2>${title}</h2>${more || ''}</div>
        ${rows.length ? `<ul class="adm-todo">${rows.slice(0, 6).map(([main, detail, label, onclick]) => `<li>
            <div><p class="adm-todo-main">${main}</p>${detail ? `<p class="adm-todo-detail">${detail}</p>` : ''}</div>
            <button type="button" onclick="${onclick}" class="adm-btn">${label}</button>
        </li>`).join('')}</ul>${rows.length > 6 ? `<p class="adm-panel-foot">and ${rows.length - 6} more</p>` : ''}` : `<p class="adm-panel-empty">${empty}</p>`}
    </section>`;
}

// Shortcuts into the role's sections: [label, what it is for, onclick]
function homeShortcuts(items) {
    return `<section class="adm-panel">
        <div class="adm-panel-head"><h2>Go to</h2></div>
        <ul class="adm-links">${items.map(([label, text, onclick]) => `<li><button type="button" onclick="${onclick}">
            <span class="adm-links-label">${label}</span><span class="adm-links-text">${text}</span>
        </button></li>`).join('')}</ul>
    </section>`;
}

function renderAdminHome(data) {
    const me = currentAdmin().email, role = currentAdmin().role;
    const quotes = data.quotes || [], quotations = data.quotations || [];
    const priced = new Set(quotations.map(q => q.quote_id));
    const open = quotes.filter(q => !priced.has(q.id) && q.status !== 'Lost' && q.status !== 'Sold');
    const at = (...s) => quotations.filter(q => s.includes(q.status));
    const month = new Date().toISOString().slice(0, 7);
    const sentThisMonth = at('sent').filter(q => String(q.sent_at || '').startsWith(month));
    const who = email => escapeHtml(adminName(email));
    const quotationRow = (qt, detail, label = 'Open') => [`${escapeHtml(qt.reference)} · ${escapeHtml((qt.customer || {}).name)}`,
        `${escapeHtml(qt.title)} · ${formatPhp(quotationTotals(qt).total)}${detail ? ` · ${detail}` : ''}`, label, `openQuotation(${qt.id})`];
    const requestRow = q => [`${escapeHtml(q.reference)} · ${escapeHtml(q.name)}`, `${escapeHtml(q.model)} · ${formatShortDate(q.created_at)}`,
        can('quotations.prepare') ? 'Prepare quotation' : 'See request', can('quotations.prepare') ? `prepareQuotation(${q.id})` : `showAdminTab('quotes')`];
    const tab = id => `showAdminTab('${id}')`;
    const stage = (t, id) => `filterPipeline('${t}', '${id}')`;
    const tiles = list => `<ul class="adm-tiles">${list.join('')}</ul>`;
    const noTables = data.quotations === null ? '<p class="quotation-note mb-6">Quotations aren\'t in the database yet. Re-run supabase/schema.sql.</p>' : '';

    if (role === 'marketing') {
        const edits = Object.entries(siteEdits);
        const productEdits = edits.filter(([k]) => k.startsWith('product:'));
        const accessoryEdits = edits.filter(([k]) => k.startsWith('accessory:'));
        const noPhoto = PRODUCTS_DATA.filter(p => !(p.gallery || []).length);
        return `
            ${tiles([
                homeTile(PRODUCTS_DATA.length, 'Models on the site', '', tab('products')),
                homeTile(productEdits.length, 'Models edited', 'photos, text or specs', tab('products')),
                homeTile(accessoryEdits.length, 'Accessory photos replaced', '', tab('products')),
                homeTile(noPhoto.length, 'Models without a gallery', noPhoto.length ? 'worth adding photos' : '', tab('products'), true)
            ])}
            <div class="adm-home">
                ${homeList('Recently edited', productEdits.map(([k, r]) => {
                    const p = PRODUCTS_DATA.find(x => x.slug === k.slice(8));
                    return [escapeHtml(p ? p.name : k.slice(8)), `${Object.keys(r.value || {}).join(', ')}${r.updated_by ? ` · by ${who(r.updated_by)}` : ''}`, 'Edit', tab('products')];
                }), 'No model has been edited yet. Every model shows its photos and text as shipped.')}
                ${homeShortcuts([
                    ['Products', 'Main, build, gallery and accessory photos; text and specifications', tab('products')],
                    ['Site content', 'The homepage carousel and the event story', tab('content')],
                    ['Stories and guides', 'Add, edit or remove stories and their photos', tab('stories')],
                    ['Zoho leads', zohoHomeNote(data.zohoLeads), tab('zoho')],
                    ['View the website', 'See your changes as visitors do', 'navigateTo(\'home\')']
                ])}
                <section class="adm-panel adm-panel-wide">
                    <div class="adm-panel-head"><h2>Photo tips</h2></div>
                    <ul class="adm-tips">
                        <li>Use JPEG or PNG. Larger photos are made smaller before they upload, so there is no need to shrink them first.</li>
                        <li>Best sizes: model main and gallery photos ${PHOTO_SIZES.main}; build photos ${PHOTO_SIZES.build}; accessory photos ${PHOTO_SIZES.accessory}; homepage banners ${PHOTO_SIZES.banner}; event header ${PHOTO_SIZES.eventHeader}; event photos ${PHOTO_SIZES.eventPhoto}; Red Series cover and background ${PHOTO_SIZES.promoCover}, carts as ${PHOTO_SIZES.promoCart}; story photos ${PHOTO_SIZES.storyMain}. Each upload shows its size too.</li>
                        <li>Build photos show on the model page when a visitor picks that build: keep the cart in the same spot and angle as the others.</li>
                        <li>Homepage banners are 2880 × 864 pixels. Any other shape gets cropped, so check the preview in Site content before you save.</li>
                        <li>An edit goes live for every visitor as soon as you save it. Undo puts the shipped photo or text back.</li>
                    </ul>
                </section>
            </div>`;
    }

    if (role === 'pricing') {
        const p = data.pricing;
        const waiting = at('submitted');
        const bundleLines = (data.bundles || []).length;
        return `${noTables}
            ${tiles([
                homeTile(waiting.length, 'Waiting for approval', 'by Jerus or James', stage('quotations', 'submitted'), true),
                homeTile(at('approved').length, 'Approved, not sent yet', '', stage('quotations', 'approved')),
                homeTile(sentThisMonth.length, 'Sent this month', '', stage('quotations', 'sent')),
                homeTile(open.length, 'Requests not priced yet', '', stage('quotes', 'open'))
            ])}
            <div class="adm-home">
                ${homeList('Waiting for approval', waiting.map(qt => quotationRow(qt, `GP ${quotationTotals(qt).margin.toFixed(1)}% · ${escapeHtml(approverNames(qt.approvers || []))}`, 'Open')),
                    'Nothing waiting. Jerus or James approve submitted quotations, by margin.')}
                <section class="adm-panel">
                    <div class="adm-panel-head"><h2>Pricing now</h2><button type="button" onclick="${tab('quotations')}" class="link text-sm">Change</button></div>
                    ${p ? `<dl class="adm-facts">
                        <div><dt>Exchange rate</dt><dd>₱${Number(p.exchange_rate)} per $1</dd></div>
                        <div><dt>Freight</dt><dd>${Number(p.freight_pct)}%</dd></div>
                        <div><dt>Warranty</dt><dd>${'warranty' in p ? (p.warranty ? 'Set' : '<span class="golfer-error">Not set</span>') : '—'}</dd></div>
                    </dl>${p.updated_by ? `<p class="adm-panel-foot">Last changed by ${who(p.updated_by)}</p>` : ''}` : '<p class="adm-panel-empty">Pricing isn\'t in the database yet.</p>'}
                </section>
                ${homeShortcuts([
                    ['Bundles', `${bundleLines} cost lines, in USD, that quotations are priced from`, tab('bundles')],
                    ['Quotations', 'Every quotation and the pricing settings', tab('quotations')],
                    ['Quote requests', 'What customers asked for', tab('quotes')]
                ])}
            </div>`;
    }

    if (role === 'sales') {
        const returned = at('returned');
        const mine = q => q.prepared_by === me;
        return `${noTables}
            ${tiles([
                homeTile(open.length, 'New requests to price', '', stage('quotes', 'open'), true),
                homeTile(returned.length, 'Returned to fix', returned.filter(mine).length ? `${returned.filter(mine).length} yours` : '', stage('quotations', 'draft'), true),
                homeTile(at('submitted').length, 'Waiting for approval', '', stage('quotations', 'submitted')),
                homeTile(at('approved').length, 'Approved, ready to send', '', stage('quotations', 'approved'), true)
            ])}
            <div class="adm-home">
                ${homeList('New requests to price', open.map(requestRow), 'Every open request has a quotation.')}
                ${homeList('Approved, ready to send', at('approved').map(qt => quotationRow(qt, mine(qt) ? 'yours' : `by ${who(qt.prepared_by)}`, 'Send')), 'Nothing to send right now.')}
                ${homeList('Returned with a note', returned.map(qt => quotationRow(qt, escapeHtml(qt.review_note), 'Fix')), 'Nothing returned.')}
                ${homeList('Drafts', at('draft').map(qt => quotationRow(qt, mine(qt) ? 'yours' : `by ${who(qt.prepared_by)}`)), 'No drafts.')}
            </div>`;
    }

    // Super admin: the whole pipeline, approvals, and the team
    const staff = data.staff || [];
    const team = Object.entries(ADMIN_ROLES).map(([id, r]) => [r.label, staff.filter(s => s.role === id)]).filter(([, list]) => list.length);
    return `${noTables}
        ${tiles([
            homeTile(open.length, 'New requests', '', stage('quotes', 'open'), true),
            homeTile(at('draft', 'returned').length, 'Being prepared', at('returned').length ? `${at('returned').length} returned` : '', stage('quotations', 'draft')),
            homeTile(at('submitted').length, 'Waiting for approval', '', stage('quotations', 'submitted'), true),
            homeTile(at('approved').length, 'Approved, not sent', '', stage('quotations', 'approved')),
            homeTile(sentThisMonth.length, 'Sent this month', formatPhp(sentThisMonth.reduce((s, q) => s + quotationTotals(q).total, 0)), stage('quotations', 'sent'))
        ])}
        <div class="adm-home">
            ${homeList('Waiting for approval', at('submitted').map(qt => quotationRow(qt, `GP ${quotationTotals(qt).margin.toFixed(1)}% · from ${who(qt.submitted_by)}`, 'Review')), 'Nothing waiting for approval.')}
            ${homeList('New requests', open.map(requestRow), 'Every open request has a quotation.')}
            <section class="adm-panel">
                <div class="adm-panel-head"><h2>Team</h2><button type="button" onclick="${tab('users')}" class="link text-sm">Manage</button></div>
                <dl class="adm-facts">${team.map(([label, list]) => `<div><dt>${label}</dt><dd>${list.map(s => who(s.email)).join(', ')}</dd></div>`).join('')}</dl>
            </section>
            <section class="adm-panel">
                <div class="adm-panel-head"><h2>Recent activity</h2><button type="button" onclick="${tab('activity')}" class="link text-sm">See the log</button></div>
                ${(data.activity || []).length ? `<ul class="adm-todo">${data.activity.slice(0, 5).map(e => `<li><div>
                    <p class="adm-todo-main">${escapeHtml(activitySentence(e))}</p>
                    <p class="adm-todo-detail">${who(e.who)} · ${formatActivityTime(e.created_at)}</p>
                </div></li>`).join('')}</ul>` : `<p class="adm-panel-empty">${data.activity === null ? 'The log isn\'t in the database yet. Re-run supabase/schema.sql.' : 'Nothing logged yet.'}</p>`}
            </section>
            ${homeShortcuts([
                ['Bundles', 'Cost lines quotations are priced from', tab('bundles')],
                ['Products', 'Photos, text and specs of each model', tab('products')],
                ['Golfers', `${(data.golfers || []).length} member${(data.golfers || []).length === 1 ? '' : 's'}`, tab('golfers')]
            ])}
        </div>`;
}

function renderAdminQuotes({ quotes: allQuotes, golfers, quotations }) {
    if (!allQuotes.length) return '<p class="measure">No quote requests yet. Every request sent from the site lands here and in the quotes Google Sheet.</p>';
    // The pipeline's New requests filter: requests that don't have a quotation yet and are still open
    const priced = new Set((quotations || []).map(q => q.quote_id));
    const quotes = quoteFilter === 'open' ? allQuotes.filter(q => !priced.has(q.id) && q.status !== 'Lost' && q.status !== 'Sold') : allQuotes;
    if (!quotes.length) return '<p class="measure">Every open request has a quotation.</p>';
    const canDelete = can('quotes.delete');
    const pricing = can('quotations.view') && quotations;
    // The quote's quotation: open it, or prepare one from the quote's build
    const quotationCell = q => {
        const qt = quotations.find(x => x.quote_id === q.id);
        return qt ? `<button type="button" onclick="openQuotation(${qt.id})" class="link text-xs">Open</button> <span class="quotation-status quotation-${qt.status}">${QUOTATION_STATUS_LABELS[qt.status]}</span>`
            : can('quotations.prepare') ? `<button type="button" onclick="prepareQuotation(${q.id})" class="link text-xs">Prepare quotation</button>`
            : '<span class="text-xs text-mute">Not priced yet</span>';
    };
    return `<div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>Reference</th><th>Date</th><th>Customer</th><th>Model</th><th>Source</th><th>Golfer</th><th>Status</th>${pricing ? '<th>Quotation</th>' : ''}${canDelete ? '<th><span class="sr-only">Delete</span></th>' : ''}</tr></thead>
        <tbody>${quotes.map(q => `
            <tr>
                <td><details><summary>${escapeHtml(q.reference)}</summary>
                    <dl class="golfer-rows mt-3">${[...(q.rows || []), ['Quantity', q.quantity], ['Branch', q.branch], ['Notes', q.notes]].filter(([, v]) => v).map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}</dl>
                </details></td>
                <td class="whitespace-nowrap">${formatShortDate(q.created_at)}</td>
                <td>${escapeHtml(q.name)}<br><a class="link text-xs" href="mailto:${escapeHtml(q.email)}">${escapeHtml(q.email)}</a><br><span class="text-xs">${escapeHtml(q.phone)}</span></td>
                <td>${escapeHtml(q.model)}</td>
                <td>${escapeHtml(q.source)}</td>
                <td>${q.golfer_id ? escapeHtml(((golfers.find(g => g.id === q.golfer_id) || {}).name) || 'Yes') : '—'}</td>
                <td>${can('quotes.status') ? `<select aria-label="Status of ${escapeHtml(q.reference)}" onchange="setQuoteStatus(${q.id}, this.value)">
                    ${QUOTE_STATUSES.map(s => `<option${s === q.status ? ' selected' : ''}>${s}</option>`).join('')}
                </select>` : escapeHtml(q.status)}
                ${q.status_by ? `<p class="text-xs text-mute mt-1">by ${escapeHtml(adminName(q.status_by))} · ${formatShortDate(q.status_at)}</p>` : ''}</td>
                ${pricing ? `<td class="whitespace-nowrap">${quotationCell(q)}</td>` : ''}
                ${canDelete ? `<td><button type="button" onclick="deleteQuote(${q.id}, '${escapeHtml(q.reference)}')" class="link text-xs">Delete</button></td>` : ''}
            </tr>`).join('')}</tbody>
    </table></div>`;
}

// Who changed it, and when, is stamped by the database
async function setQuoteStatus(id, status) {
    const { error } = await sb.from('quotes').update({ status }).eq('id', id);
    showToast(error ? `Not saved: ${error.message}` : `Marked ${status}.`);
    reloadPageData();
}

async function deleteQuote(id, reference) {
    if (!confirm(`Delete quote ${reference}? This can't be undone.`)) return;
    const { error } = await sb.from('quotes').delete().eq('id', id);
    showToast(error ? `Not deleted: ${error.message}` : `${reference} deleted.`);
    reloadPageData();
}

function renderAdminGolfers({ golfers, builds, quotes }) {
    if (!golfers.length) return '<p class="measure">No golfers have signed up yet.</p>';
    const newsCount = golfers.filter(g => g.news).length;
    return `
        <div class="flex flex-wrap items-center gap-4 mb-6">
            <p class="text-sm">${golfers.length} golfer${golfers.length === 1 ? '' : 's'}, ${newsCount} want member news.</p>
            ${newsCount && can('golfers.news') ? '<button type="button" onclick="copyNewsEmails()" class="link text-sm">Copy news emails</button>' : ''}
        </div>
        <div class="admin-table-wrap"><table class="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>News</th><th>Joined</th><th>Builds</th><th>Quotes</th></tr></thead>
            <tbody>${golfers.map(g => `<tr>
                <td>${escapeHtml(g.name)}</td>
                <td><a class="link" href="mailto:${escapeHtml(g.email)}">${escapeHtml(g.email)}</a></td>
                <td>${escapeHtml(g.phone)}</td>
                <td>${g.news ? 'Yes' : 'No'}</td>
                <td>${formatShortDate(g.joined_at)}</td>
                <td>${builds.filter(b => b.golfer_id === g.id).length}</td>
                <td>${quotes.filter(q => q.golfer_id === g.id).length}</td>
            </tr>`).join('')}</tbody>
        </table></div>`;
}

function copyNewsEmails() {
    const emails = ((pageData && pageData.golfers) || []).filter(g => g.news).map(g => g.email).join(', ');
    navigator.clipboard.writeText(emails).then(() => showToast('News emails copied.'), () => showToast(emails));
}

// --- Products: photos, text and specs (master admins and marketing) ---
// Photos go to the public Supabase Storage bucket below; a product's edits are saved together with Save
const SITE_PHOTO_BUCKET = 'site-photos';
const SITE_PHOTO_MAX = 1920; // px on the long side, as the site's own photos
const CART_SPEC_FIELDS = [['seating', 'Seating'], ['range', 'Range'], ['speed', 'Top speed'], ['battery', 'Battery'], ['chargingTime', 'Charging time'], ['powertrain', 'Powertrain']];
let productOpen = null;  // the product whose card is open
const productDrafts = {}; // slug -> its fields being edited, before Save
let photoBusy = '';      // the photo being uploaded, e.g. 'golfer-tempo-2:image'

function productDraft(slug) {
    if (!productDrafts[slug]) {
        const p = PRODUCTS_DATA.find(x => x.slug === slug);
        const draft = productFields(p);
        draft.specRows = Object.entries(draft.specs || {});
        // A model on a shared spec sheet is edited as that sheet (what its page shows)
        if (SPEC_SHEETS[p.specSheet]) draft.sheetRows = clone(p.specGroups || SPEC_SHEETS[p.specSheet]);
        productDrafts[slug] = draft;
    }
    return productDrafts[slug];
}

// A draft's fields as an edit: specs back from rows, and only what differs from the shipped product
function productEditValue(slug) {
    const d = productDraft(slug), original = ADMIN_ORIGINALS.products[slug];
    const fields = { ...d, specs: Object.fromEntries(d.specRows.map(([k, v]) => [k.trim(), v.trim()]).filter(([k]) => k)) };
    delete fields.specRows;
    if (!original.specs && !Object.keys(fields.specs).length) delete fields.specs;
    delete fields.sheetRows;
    if (d.sheetRows) {
        const p = PRODUCTS_DATA.find(x => x.slug === slug);
        const groups = d.sheetRows.map(g => ({ title: g.title.trim(), rows: g.rows.map(([k, v]) => [k.trim(), v.trim()]).filter(([k]) => k) })).filter(g => g.title && g.rows.length);
        fields.specGroups = JSON.stringify(groups) === JSON.stringify(SPEC_SHEETS[p.specSheet]) ? undefined : groups;
    }
    const value = Object.fromEntries(Object.entries(fields).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(original[k])));
    return Object.keys(value).length ? value : null;
}

function productDirty(slug) {
    if (!productDrafts[slug]) return false;
    const saved = (siteEdits[`product:${slug}`] || {}).value || null;
    return JSON.stringify(productEditValue(slug)) !== JSON.stringify(saved);
}

// Smaller than SITE_PHOTO_MAX, as JPEG (or PNG when it was one, to keep a cut-out's transparent background)
// A homepage banner passes its own size, and always becomes a JPEG: it fills the top of the page, so it stays light
async function shrinkPhoto(file, { max = SITE_PHOTO_MAX, jpeg = false } = {}) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const type = !jpeg && (file.type === 'image/png' || file.type === 'image/webp') ? 'image/png' : 'image/jpeg';
    if (scale === 1 && file.type === type && file.size < 1.5e6) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    // A JPEG has no transparency: a see-through PNG goes on white, not black
    if (type === 'image/jpeg') { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('the photo could not be read'))), type, 0.86));
}

async function uploadSitePhoto(file, folder, options) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('choose a JPG, PNG or WebP photo');
    const blob = await shrinkPhoto(file, options);
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${blob.type === 'image/png' ? 'png' : 'jpg'}`;
    const { error } = await sb.storage.from(SITE_PHOTO_BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000' });
    if (error) throw new Error(/bucket not found/i.test(error.message) ? 'photo storage isn\'t set up yet (re-run supabase/schema.sql)' : error.message);
    return sb.storage.from(SITE_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

// target: 'image', 'build:<level id>', 'gallery:<index>' or 'gallery:new'
async function chooseProductPhoto(slug, target, input) {
    const file = input.files && input.files[0];
    if (!file) return;
    photoBusy = `${slug}:${target}`;
    renderApp();
    try {
        const url = await uploadSitePhoto(file, `products/${slug}`);
        const d = productDraft(slug);
        const [kind, key] = target.split(':');
        if (kind === 'image') d.image = url;
        if (kind === 'build') d.buildPhotos = { ...(d.buildPhotos || {}), [key]: url };
        if (kind === 'gallery') {
            d.gallery = (d.gallery || []).slice();
            if (key === 'new') {
                d.gallery.push(url);
                if (d.galleryLevels) d.galleryLevels = [...d.galleryLevels, null];
            } else d.gallery[Number(key)] = url;
        }
        showToast('Photo uploaded. Save to put it on the site.');
    } catch (err) {
        showToast(`Not uploaded: ${err.message}.`);
    }
    photoBusy = '';
    renderApp();
}

function restoreProductPhoto(slug, target) {
    const d = productDraft(slug), original = ADMIN_ORIGINALS.products[slug];
    const [kind, key] = target.split(':');
    if (kind === 'image') d.image = original.image;
    if (kind === 'build') d.buildPhotos = { ...(d.buildPhotos || {}), [key]: (original.buildPhotos || {})[key] };
    renderApp();
}

function moveGalleryPhoto(slug, i, step) {
    const d = productDraft(slug), j = i + step;
    if (j < 0 || j >= d.gallery.length) return;
    d.gallery = d.gallery.slice();
    [d.gallery[i], d.gallery[j]] = [d.gallery[j], d.gallery[i]];
    if (d.galleryLevels) {
        d.galleryLevels = d.galleryLevels.slice();
        [d.galleryLevels[i], d.galleryLevels[j]] = [d.galleryLevels[j], d.galleryLevels[i]];
    }
    renderApp();
}

function removeGalleryPhoto(slug, i) {
    const d = productDraft(slug);
    if (d.gallery.length <= 1) { showToast('A model keeps at least one gallery photo.'); return; }
    d.gallery = d.gallery.filter((_, k) => k !== i);
    if (d.galleryLevels) d.galleryLevels = d.galleryLevels.filter((_, k) => k !== i);
    renderApp();
}

function setProductField(slug, key, value) {
    productDraft(slug)[key] = value;
}

function setProductSpec(slug, i, part, value) {
    productDraft(slug).specRows[i][part] = value;
}

function addProductSpec(slug) {
    productDraft(slug).specRows.push(['', '']);
    renderApp();
}

function removeProductSpec(slug, i) {
    productDraft(slug).specRows.splice(i, 1);
    renderApp();
}

function setSheetCell(slug, gi, ri, part, value) {
    productDraft(slug).sheetRows[gi].rows[ri][part] = value;
}

function addSheetRow(slug, gi) {
    productDraft(slug).sheetRows[gi].rows.push(['', '']);
    renderApp();
}

function removeSheetRow(slug, gi, ri) {
    productDraft(slug).sheetRows[gi].rows.splice(ri, 1);
    renderApp();
}

function toggleProductCard(slug, open) {
    if (open) productOpen = slug;
    else if (productOpen === slug) productOpen = null;
}

async function saveProductEdit(e, slug) {
    e.preventDefault();
    const value = productEditValue(slug);
    delete productDrafts[slug];
    await saveSiteEdit(`product:${slug}`, value, value ? 'Saved. It shows on the site now.' : 'Saved: back to the original.');
}

function discardProductEdit(slug) {
    delete productDrafts[slug];
    renderApp();
}

function resetProductEdit(slug) {
    if (!confirm('Put back the original photos, text and specs of this model?')) return;
    delete productDrafts[slug];
    saveSiteEdit(`product:${slug}`, null, 'Back to the original.');
}

// The best size for each kind of photo, measured from the site's own photos; shown beside each upload
const PHOTO_SIZES = {
    main: '1080 × 1080 px, square',
    build: '1600 × 1200 px (4:3)',
    gallery: '1080 × 1080 px, square',
    accessory: '1080 × 1080 px, square',
    banner: '2880 × 864 px',
    eventHeader: '1920 × 350 px, a wide strip',
    eventPhoto: '750 × 1000 px, portrait (3:4)',
    storyMain: '1600 × 1200 px (4:3)',
    storyPhoto: '1600 × 1200 px (4:3)',
    promoCover: '2880 × 864 px',
    promoStage: '2880 × 864 px, with the left third clear for the "Red Series" title',
    promoCart: 'PNG cut-out with a see-through background, about 1000 px tall, side-on like the others'
};
const photoSize = kind => `<span class="admin-photo-size">Best size: ${PHOTO_SIZES[kind]}</span>`;

// A photo with its Replace button (a file picker) and, when it was changed, a way back
function photoTile({ src, label, slug, target, changed, extra = '', size = '' }) {
    const id = `ph-${slug}-${target.replace(/[^a-z0-9]/gi, '-')}`;
    const busy = photoBusy === `${slug}:${target}`;
    return `
        <figure class="admin-photo">
            <span class="admin-photo-img">${src ? `<img src="${escapeHtml(src)}" alt="" loading="lazy">` : '<span class="text-xs text-mute">No photo</span>'}</span>
            <figcaption>
                <span class="text-xs font-semibold text-ink">${escapeHtml(label)}</span>${changed ? ' <span class="admin-badge">New</span>' : ''}
                ${size ? photoSize(size) : ''}
                <span class="admin-photo-actions">
                    <label for="${id}" class="link text-xs">${busy ? 'Uploading…' : src ? 'Replace' : 'Add'}</label>
                    <input id="${id}" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" onchange="chooseProductPhoto('${slug}', '${target}', this)"${busy ? ' disabled' : ''}>
                    ${extra}
                </span>
            </figcaption>
        </figure>`;
}

function renderProductEditor(p) {
    const slug = p.slug, d = productDraft(slug), original = ADMIN_ORIGINALS.products[slug];
    const edit = siteEdits[`product:${slug}`];
    const buildSet = getProductBuildSet(p);
    const levelName = id => ((buildSet && buildSet.builds.find(b => b.id === id)) || {}).name || '';
    const isCart = p.category !== 'Accessories';
    const gallery = d.gallery || [];
    return `
        <details class="admin-card"${productOpen === slug ? ' open' : ''} ontoggle="toggleProductCard('${slug}', this.open)">
            <summary><span class="font-semibold text-ink">${escapeHtml(p.name)}</span> <span class="text-mute">${escapeHtml(categoryLabel(p.category))}</span>${edit ? ` <span class="admin-badge">Edited${edit.updated_by ? ` by ${escapeHtml(adminName(edit.updated_by))}` : ''}</span>` : ''}${productDirty(slug) ? ' <span class="admin-badge admin-badge-warn">Not saved</span>' : ''}</summary>
            <form data-no-prefill onsubmit="saveProductEdit(event, '${slug}')" class="grid gap-6 pt-5">
                <section>
                    <h3 class="text-sm font-semibold text-ink mb-2">Photos</h3>
                    <div class="admin-photos">
                        ${photoTile({ src: d.image, label: 'Main photo', slug, target: 'image', changed: d.image !== original.image, size: 'main',
                            extra: d.image !== original.image ? `<button type="button" onclick="restoreProductPhoto('${slug}', 'image')" class="link text-xs">Original</button>` : '' })}
                        ${buildSet ? buildSet.builds.map(b => {
                            const src = (d.buildPhotos || {})[b.id], was = (original.buildPhotos || {})[b.id];
                            return photoTile({ src, label: `${b.name} build`, slug, target: `build:${b.id}`, changed: src !== was, size: 'build',
                                extra: src !== was ? `<button type="button" onclick="restoreProductPhoto('${slug}', 'build:${b.id}')" class="link text-xs">Original</button>` : '' });
                        }).join('') : ''}
                    </div>
                    <p class="text-xs text-mute mt-2">The main photo shows on the model cards and the model page${buildSet ? '; each build photo shows when that build is chosen, and in its quotation PDF' : ''}. Larger photos are made smaller before they upload, so there is no need to resize them first. Build photos look best with the cart in the same spot and angle as the other builds. The colour preview photos stay as they are (they are painted by the site).</p>
                </section>
                <section>
                    <h3 class="text-sm font-semibold text-ink mb-2">Gallery (model page)</h3>
                    <div class="admin-photos">
                        ${gallery.map((src, i) => photoTile({ src, label: `Photo ${i + 1}${d.galleryLevels && d.galleryLevels[i] ? ` · ${levelName(d.galleryLevels[i])}` : ''}`, slug, target: `gallery:${i}`, size: 'gallery',
                            changed: src !== (original.gallery || [])[i],
                            extra: `<button type="button" onclick="moveGalleryPhoto('${slug}', ${i}, -1)" class="link text-xs"${i === 0 ? ' disabled' : ''} aria-label="Move photo ${i + 1} earlier">←</button>
                                <button type="button" onclick="moveGalleryPhoto('${slug}', ${i}, 1)" class="link text-xs"${i === gallery.length - 1 ? ' disabled' : ''} aria-label="Move photo ${i + 1} later">→</button>
                                <button type="button" onclick="removeGalleryPhoto('${slug}', ${i})" class="link text-xs">Remove</button>` })).join('')}
                        ${photoTile({ src: '', label: 'New photo', slug, target: 'gallery:new', changed: false, size: 'gallery' })}
                    </div>
                </section>
                <section class="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                    <h3 class="text-sm font-semibold text-ink sm:col-span-2 -mb-2">Text</h3>
                    <div class="field sm:col-span-2"><label for="ap-tag-${slug}">Tagline</label><input id="ap-tag-${slug}" type="text" value="${escapeHtml(d.tagline)}" onchange="setProductField('${slug}', 'tagline', this.value.trim())"></div>
                    <div class="field sm:col-span-2"><label for="ap-desc-${slug}">Description</label><textarea id="ap-desc-${slug}" rows="3" onchange="setProductField('${slug}', 'description', this.value.trim())">${escapeHtml(d.description)}</textarea></div>
                </section>
                <section class="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                    <h3 class="text-sm font-semibold text-ink sm:col-span-2 lg:col-span-3 -mb-2">Specifications</h3>
                    ${isCart ? CART_SPEC_FIELDS.map(([key, label]) => `
                        <div class="field"><label for="ap-${key}-${slug}">${label}</label><input id="ap-${key}-${slug}" type="text" value="${escapeHtml(d[key] || '')}" onchange="setProductField('${slug}', '${key}', this.value.trim())"></div>`).join('') : ''}
                    ${d.sheetRows ? `<div class="sm:col-span-2 lg:col-span-3 grid gap-5">
                        <p class="text-xs text-mute -mb-3">The spec sheet on the model page and page 2 of the quotation PDF${p.specGroups ? '' : ' (shared with the other models of this size until you change it here)'}</p>
                        ${d.sheetRows.map((g, gi) => `
                        <div>
                            <p class="text-xs font-semibold text-ink mb-2">${escapeHtml(g.title)}</p>
                            <div class="grid gap-2">${g.rows.map(([k, v], ri) => `
                                <div class="admin-spec-row">
                                    <input type="text" value="${escapeHtml(k)}" aria-label="${escapeHtml(g.title)} ${ri + 1} name" onchange="setSheetCell('${slug}', ${gi}, ${ri}, 0, this.value)">
                                    <input type="text" value="${escapeHtml(v)}" aria-label="${escapeHtml(g.title)} ${ri + 1} value" onchange="setSheetCell('${slug}', ${gi}, ${ri}, 1, this.value)">
                                    <button type="button" onclick="removeSheetRow('${slug}', ${gi}, ${ri})" class="link text-xs">Remove</button>
                                </div>`).join('')}
                            </div>
                            <button type="button" onclick="addSheetRow('${slug}', ${gi})" class="link text-sm mt-2">Add to ${escapeHtml(g.title)}</button>
                        </div>`).join('')}
                    </div>` : `<div class="sm:col-span-2 lg:col-span-3">
                        <p class="text-xs text-mute mb-2">The spec table on the model page${isCart ? ' and page 2 of the quotation PDF' : ''}</p>
                        <div class="grid gap-2">${d.specRows.map(([k, v], i) => `
                            <div class="admin-spec-row">
                                <input type="text" value="${escapeHtml(k)}" aria-label="Specification ${i + 1} name" placeholder="e.g. Brakes" onchange="setProductSpec('${slug}', ${i}, 0, this.value)">
                                <input type="text" value="${escapeHtml(v)}" aria-label="Specification ${i + 1} value" placeholder="e.g. Hydraulic disc" onchange="setProductSpec('${slug}', ${i}, 1, this.value)">
                                <button type="button" onclick="removeProductSpec('${slug}', ${i})" class="link text-xs">Remove</button>
                            </div>`).join('')}
                        </div>
                        <button type="button" onclick="addProductSpec('${slug}')" class="link text-sm mt-2">Add a specification</button>
                    </div>`}
                </section>
                <div class="flex flex-wrap gap-4 items-center">
                    <button type="submit" class="btn btn-primary min-h-[2.5rem] px-4 text-sm"${photoBusy ? ' disabled' : ''}>Save</button>
                    ${productDrafts[slug] ? `<button type="button" onclick="discardProductEdit('${slug}')" class="link text-sm">Cancel changes</button>` : ''}
                    ${edit ? `<button type="button" onclick="resetProductEdit('${slug}')" class="link text-sm">Back to the original</button>` : ''}
                    <a href="${routeHref('product-details', slug)}" class="link text-sm" target="_blank" rel="noopener">See the model page</a>
                </div>
            </form>
        </details>`;
}

// Accessory and upgrade photos (the cart builder, the model pages and page 3 of the quotation PDF): saved as soon as
// a photo is chosen
async function chooseAccessoryPhoto(id, input) {
    const file = input.files && input.files[0];
    if (!file) return;
    photoBusy = `accessory:${id}`;
    renderApp();
    try {
        const url = await uploadSitePhoto(file, `accessories/${id}`);
        photoBusy = '';
        await saveSiteEdit(`accessory:${id}`, { image: url }, 'Accessory photo saved.');
    } catch (err) {
        photoBusy = '';
        renderApp();
        showToast(`Not uploaded: ${err.message}.`);
    }
}

function resetAccessoryPhoto(id) {
    saveSiteEdit(`accessory:${id}`, null, 'Back to the original photo.');
}

function renderAccessoryPhotos() {
    return `
        <details class="admin-card"${productOpen === 'accessory-photos' ? ' open' : ''} ontoggle="toggleProductCard('accessory-photos', this.open)">
            <summary><span class="font-semibold text-ink">Upgrade and accessory photos</span> <span class="text-mute">Cart builder and quotation PDF</span></summary>
            <div class="pt-5 grid gap-6">${ACCESSORY_CATALOG.map(g => `
                <section>
                    <h3 class="text-sm font-semibold text-ink mb-2">${escapeHtml(g.group)}</h3>
                    <div class="admin-photos">${g.items.map(i => {
                        const edited = !!siteEdits[`accessory:${i.id}`];
                        const src = i.image || (findProductRef(i.product) || {}).image || '';
                        const fid = `acc-${i.id}`;
                        return `
                        <figure class="admin-photo">
                            <span class="admin-photo-img">${src ? `<img src="${escapeHtml(src)}" alt="" loading="lazy">` : '<span class="text-xs text-mute">No photo</span>'}</span>
                            <figcaption>
                                <span class="text-xs font-semibold text-ink">${escapeHtml(i.name)}</span>${edited ? ' <span class="admin-badge">New</span>' : ''}
                                ${photoSize('accessory')}
                                <span class="admin-photo-actions">
                                    <label for="${fid}" class="link text-xs">${photoBusy === `accessory:${i.id}` ? 'Uploading…' : src ? 'Replace' : 'Add'}</label>
                                    <input id="${fid}" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" onchange="chooseAccessoryPhoto('${i.id}', this)">
                                    ${edited ? `<button type="button" onclick="resetAccessoryPhoto('${i.id}')" class="link text-xs">Original</button>` : ''}
                                </span>
                            </figcaption>
                        </figure>`;
                    }).join('')}</div>
                </section>`).join('')}
            </div>
        </details>`;
}

function renderAdminProducts() {
    const carts = PRODUCTS_DATA.filter(p => p.category !== 'Accessories'), accessories = PRODUCTS_DATA.filter(p => p.category === 'Accessories');
    return `
        <div class="space-y-4">${carts.map(renderProductEditor).join('')}</div>
        <h2 class="type-md text-ink mt-10 mb-4">Accessories</h2>
        <div class="space-y-4">${renderAccessoryPhotos()}${accessories.map(renderProductEditor).join('')}</div>`;
}

// --- The homepage carousel: edited here, then Save puts all of it on the site at once ---
const BANNER_PHOTO_MAX = 2880; // the shipped banners' width
let bannerDraft = null;        // the slides being edited; starts as what the site shows

function bannerSlides() {
    if (!bannerDraft) bannerDraft = clone(HOME_BANNERS);
    return bannerDraft;
}

// Where a banner's button can go: [route, slug, label]
function bannerDestinations() {
    return [
        ['products', '', 'All carts'],
        ...NAV_SEGMENTS.map(s => ['segment', s.id, s.label]),
        ['solutions', '', 'Fleet solutions'],
        ['service', '', 'Service and support'],
        ['blogs', '', 'Stories and guides'],
        ['about', '', 'About us'],
        ['contact', '', 'Contact us'],
        ...PRODUCTS_DATA.filter(p => p.category !== 'Accessories').map(p => ['product-details', p.slug, `Model: ${p.name}`])
    ];
}

function renderBannerEditor() {
    const edit = siteEdits.banners;
    const slides = bannerSlides();
    const destinations = bannerDestinations();
    return `
        <form data-no-prefill onsubmit="saveBanners(event)" class="admin-card grid gap-5 max-w-3xl mb-6" novalidate>
            <div>
                <h2 class="type-md text-ink">Homepage carousel</h2>
                <p class="text-sm text-mute mt-1">The banners at the top of the homepage, in the order they play. Use a photo 2880 × 864 pixels: any other shape gets cropped, as the preview shows.${edit && edit.updated_by ? ` Last edited by ${escapeHtml(adminName(edit.updated_by))}.` : ''}</p>
            </div>
            <ol class="admin-banners">${slides.map((b, i) => `
                <li class="admin-banner" onfocusin="contentPreviewChanged({ section: 'banners', slide: ${i} })">
                    <div class="admin-banner-img">${b.image ? `<img src="${escapeHtml(b.image)}" alt="" loading="lazy">` : '<span class="text-xs text-mute">No photo yet</span>'}</div>
                    <div class="admin-banner-bar">
                        <span class="text-sm font-semibold text-ink">Banner ${i + 1} ${photoSize('banner')}</span>
                        <span class="admin-photo-actions">
                            <label for="ab-photo-${i}" class="link text-xs">${photoBusy === `banner:${i}` ? 'Uploading…' : b.image ? 'Replace photo' : 'Add photo'}</label>
                            <input id="ab-photo-${i}" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" onchange="chooseBannerPhoto(${i}, this)">
                            <button type="button" onclick="moveBanner(${i}, -1)" class="link text-xs"${i === 0 ? ' disabled' : ''}>Move up</button>
                            <button type="button" onclick="moveBanner(${i}, 1)" class="link text-xs"${i === slides.length - 1 ? ' disabled' : ''}>Move down</button>
                            <button type="button" onclick="removeBanner(${i})" class="link text-xs"${slides.length === 1 ? ' disabled' : ''}>Remove</button>
                        </span>
                    </div>
                    <div class="grid sm:grid-cols-2 gap-4">
                        <div class="field"><label for="ab-cta-${i}">Button text</label><input id="ab-cta-${i}" type="text" value="${escapeHtml(b.cta)}" oninput="setBannerField(${i}, 'cta', this.value)"></div>
                        <div class="field"><label for="ab-link-${i}">Button goes to</label>
                            <select id="ab-link-${i}" onchange="setBannerLink(${i}, this.value)">${destinations.map(([route, slug, label]) => `<option value="${route}|${slug}"${route === b.route && slug === (b.slug || '') ? ' selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select></div>
                        <div class="field sm:col-span-2"><label for="ab-alt-${i}">What the banner shows or says</label><input id="ab-alt-${i}" type="text" value="${escapeHtml(b.alt)}" oninput="setBannerField(${i}, 'alt', this.value)">
                            <p class="text-xs text-mute mt-1">For people using screen readers, and for search engines. Type out any words in the photo.</p></div>
                    </div>
                </li>`).join('')}</ol>
            <div class="flex flex-wrap gap-4 items-center">
                <button type="submit" class="btn btn-primary min-h-[2.5rem] px-4 text-sm"${photoBusy ? ' disabled' : ''}>Save carousel</button>
                <button type="button" onclick="addBanner()" class="btn btn-outline min-h-[2.5rem] px-4 text-sm">Add a banner</button>
                <a href="./" data-route="home" class="link text-sm">See the homepage</a>
                ${edit ? '<button type="button" onclick="resetBanners()" class="link text-sm">Back to the original banners</button>' : ''}
            </div>
        </form>`;
}

// A later move can't send the photo to the wrong banner: it goes on the slide it was chosen for
async function chooseBannerPhoto(i, input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const slide = bannerSlides()[i];
    previewFocus = { section: 'banners', slide: i };
    photoBusy = `banner:${i}`;
    renderApp();
    try {
        slide.image = await uploadSitePhoto(file, 'banners', { max: BANNER_PHOTO_MAX, jpeg: true });
        showToast('Photo uploaded. Save the carousel to put it on the site.');
    } catch (err) {
        showToast(`Not uploaded: ${err.message}.`);
    }
    photoBusy = '';
    renderApp();
}

function setBannerField(i, key, value) {
    bannerSlides()[i][key] = value.trim();
    contentPreviewChanged({ section: 'banners', slide: i });
}

function setBannerLink(i, value) {
    const [route, slug] = value.split('|');
    Object.assign(bannerSlides()[i], { route, slug: slug || null });
    contentPreviewChanged({ section: 'banners', slide: i });
}

function moveBanner(i, by) {
    const slides = bannerSlides();
    slides.splice(i + by, 0, slides.splice(i, 1)[0]);
    renderApp();
}

function addBanner() {
    bannerSlides().push({ image: '', alt: '', cta: '', route: 'products', slug: null });
    renderApp();
}

function removeBanner(i) {
    if (!confirm(`Remove banner ${i + 1}? It leaves the site when you save the carousel.`)) return;
    bannerSlides().splice(i, 1);
    renderApp();
}

function saveBanners(e) {
    e.preventDefault();
    const slides = bannerSlides();
    const missing = slides.findIndex(b => !b.image || !b.cta || !b.alt);
    if (missing >= 0) { showToast(`Banner ${missing + 1} needs a photo, button text and a description.`); return; }
    saveSiteEdit('banners', { slides: clone(slides) }, 'Carousel saved. It is on the homepage now.');
}

function resetBanners() {
    if (!confirm('Go back to the original banners? This removes your edited carousel from the site.')) return;
    bannerDraft = null;
    saveSiteEdit('banners', null, 'Back to the original banners.');
}

// --- Stories and guides: each story saves on its own, so two people can work on different stories ---
let storyDraft = null; // the story being edited or added; null shows the list

function renderAdminStories() {
    return storyDraft ? renderStoryEditor() : renderStoryList();
}

function isShippedStory(slug) {
    return ADMIN_ORIGINALS.blogs.some(p => p.slug === slug);
}

function renderStoryList() {
    const removed = ADMIN_ORIGINALS.blogs.filter(p => (siteEdits[`story:${p.slug}`] || { value: {} }).value.removed);
    return `
        <div class="admin-card grid gap-5 max-w-3xl">
            <div class="flex flex-wrap gap-4 items-center justify-between">
                <p class="text-sm text-mute">Newest date first, as the site shows them. A saved change is on the site right away.</p>
                <button type="button" onclick="addStory()" class="btn btn-primary min-h-[2.5rem] px-4 text-sm">Add a story</button>
            </div>
            <ul class="admin-stories">${newestBlogs().map(p => {
                const edit = siteEdits[`story:${p.slug}`], shipped = isShippedStory(p.slug);
                return `<li class="admin-story">
                    <div class="admin-story-img"><img src="${escapeHtml(p.image)}" alt="" loading="lazy"></div>
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-ink">${escapeHtml(p.title)}</p>
                        <p class="text-xs text-mute mt-1">${p.kind === 'guide' ? 'Guides' : 'News and events'} · ${escapeHtml(p.category)} · ${escapeHtml(formatBlogDate(p.date))}${edit && edit.updated_by ? ` · last edited by ${escapeHtml(adminName(edit.updated_by))}` : ''}</p>
                        <span class="admin-photo-actions mt-2">
                            <button type="button" data-slug="${escapeHtml(p.slug)}" onclick="editStory(this.dataset.slug)" class="link text-xs">Edit</button>
                            <a href="${escapeHtml(routeHref('blog-details', p.slug))}" data-route="blog-details" data-slug="${escapeHtml(p.slug)}" class="link text-xs">View</a>
                            ${edit && shipped ? `<button type="button" data-slug="${escapeHtml(p.slug)}" onclick="undoStory(this.dataset.slug)" class="link text-xs">Undo edits</button>` : ''}
                            <button type="button" data-slug="${escapeHtml(p.slug)}" onclick="removeStory(this.dataset.slug)" class="link text-xs">Remove</button>
                        </span>
                    </div>
                </li>`;
            }).join('')}</ul>
            ${removed.length ? `<div>
                <h2 class="text-sm font-semibold text-ink">Removed from the site</h2>
                <ul class="mt-2 grid gap-2">${removed.map(p => `<li class="text-sm flex flex-wrap gap-3 items-center">${escapeHtml(p.title)}
                    <button type="button" data-slug="${escapeHtml(p.slug)}" onclick="undoStory(this.dataset.slug)" class="link text-xs">Put back</button></li>`).join('')}</ul>
            </div>` : ''}
        </div>`;
}

function renderStoryEditor() {
    const d = storyDraft;
    const categories = [...new Set(newestBlogs().map(p => p.category))];
    return `
        <form data-no-prefill onsubmit="saveStory(event)" class="admin-card grid gap-5 max-w-3xl" novalidate>
            <div>
                <h2 class="type-md text-ink">${d.slug ? 'Edit story' : 'New story'}</h2>
                <p class="text-sm text-mute mt-1">Choose photos straight from the camera or Drive: large ones are made smaller before they upload.</p>
            </div>
            <div class="field"><label for="as-title">Title</label><input id="as-title" type="text" required value="${escapeHtml(d.title)}" onchange="setStoryField('title', this.value)"></div>
            <div class="field"><label for="as-kind">Shows under</label><select id="as-kind" onchange="setStoryField('kind', this.value)"><option value="">News and events</option><option value="guide"${d.kind === 'guide' ? ' selected' : ''}>Guides</option></select></div>
            <div class="grid sm:grid-cols-2 gap-4">
                <div class="field"><label for="as-category">Category</label><input id="as-category" type="text" required list="as-categories" value="${escapeHtml(d.category)}" onchange="setStoryField('category', this.value)">
                    <datalist id="as-categories">${categories.map(c => `<option value="${escapeHtml(c)}"></option>`).join('')}</datalist></div>
                <div class="field"><label for="as-date">Date</label><input id="as-date" type="date" required value="${escapeHtml(d.date)}" onchange="setStoryField('date', this.value)"></div>
            </div>
            <div class="field"><label for="as-excerpt">Short summary</label><textarea id="as-excerpt" rows="2" required onchange="setStoryField('excerpt', this.value)">${escapeHtml(d.excerpt)}</textarea>
                <p class="text-xs text-mute mt-1">One or two sentences, shown under the title on the Stories and Guides page.</p></div>
            <div class="field"><label for="as-text">Story (a blank line between paragraphs)</label><textarea id="as-text" rows="10" required onchange="setStoryText(this.value)">${escapeHtml(d.content.join('\n\n'))}</textarea></div>

            <div class="admin-story-photo">
                <div class="admin-story-img">${d.image ? `<img src="${escapeHtml(d.image)}" alt="">` : '<span class="text-xs text-mute">No photo yet</span>'}</div>
                <div class="grid gap-2 min-w-0">
                    <div class="admin-banner-bar">
                        <span class="text-sm font-semibold text-ink">Main photo ${photoSize('storyMain')}</span>
                        <span class="admin-photo-actions">
                            <label for="as-photo" class="link text-xs">${photoBusy === 'story:image' ? 'Uploading…' : d.image ? 'Replace photo' : 'Add photo'}</label>
                            <input id="as-photo" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" onchange="chooseStoryPhoto(this)">
                        </span>
                    </div>
                    <div class="field"><label for="as-alt">What the photo shows</label><input id="as-alt" type="text" required value="${escapeHtml(d.imageAlt || '')}" onchange="setStoryField('imageAlt', this.value)"></div>
                </div>
            </div>

            <div class="grid gap-3">
                <div class="admin-banner-bar">
                    <span class="text-sm font-semibold text-ink">More photos ${photoSize('storyPhoto')}</span>
                    <span class="admin-photo-actions">
                        <label for="as-gallery" class="link text-xs">${photoBusy === 'story:gallery' ? 'Uploading…' : 'Add photos'}</label>
                        <input id="as-gallery" type="file" multiple accept="image/jpeg,image/png,image/webp" class="sr-only" onchange="addStoryPhotos(this)">
                    </span>
                </div>
                ${(d.gallery || []).map((g, i) => `<div class="admin-story-photo">
                    <div class="admin-story-img"><img src="${escapeHtml(g.src)}" alt="" loading="lazy"></div>
                    <div class="grid gap-2 min-w-0">
                        <div class="field"><label for="as-g-${i}">What photo ${i + 1} shows</label><input id="as-g-${i}" type="text" value="${escapeHtml(g.alt || '')}" onchange="setStoryPhotoAlt(${i}, this.value)"></div>
                        <span class="admin-photo-actions">
                            <button type="button" onclick="moveStoryPhoto(${i}, -1)" class="link text-xs"${i === 0 ? ' disabled' : ''}>Move up</button>
                            <button type="button" onclick="moveStoryPhoto(${i}, 1)" class="link text-xs"${i === d.gallery.length - 1 ? ' disabled' : ''}>Move down</button>
                            <button type="button" onclick="removeStoryPhoto(${i})" class="link text-xs">Remove</button>
                        </span>
                    </div>
                </div>`).join('')}
            </div>

            <div class="flex flex-wrap gap-4 items-center">
                <button type="submit" class="btn btn-primary min-h-[2.5rem] px-4 text-sm"${photoBusy ? ' disabled' : ''}>Save story</button>
                <button type="button" onclick="cancelStory()" class="link text-sm">Cancel</button>
            </div>
        </form>`;
}

function addStory() {
    storyDraft = { slug: null, kind: '', title: '', category: '', date: new Date().toLocaleDateString('en-CA'), excerpt: '', content: [], image: '', imageAlt: '', isPhoto: true, gallery: [] };
    renderApp();
}

function editStory(slug) {
    const post = BLOGS_DATA.find(p => p.slug === slug);
    if (!post) return;
    storyDraft = { gallery: [], ...clone(post) };
    renderApp();
}

function cancelStory() {
    storyDraft = null;
    renderApp();
}

function setStoryField(key, value) {
    storyDraft[key] = value.trim();
}

function setStoryText(value) {
    storyDraft.content = value.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean);
}

function setStoryPhotoAlt(i, value) {
    storyDraft.gallery[i].alt = value.trim();
}

// The photos go on the story they were chosen for, even if another story is opened during the upload
async function chooseStoryPhoto(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const draft = storyDraft;
    photoBusy = 'story:image';
    renderApp();
    try {
        draft.image = await uploadSitePhoto(file, 'stories', { jpeg: true });
        draft.isPhoto = true; // a real photo fills its frame; the shipped guides show a cut-out cart
        showToast('Photo uploaded. Save the story to put it on the site.');
    } catch (err) {
        showToast(`Not uploaded: ${err.message}.`);
    }
    photoBusy = '';
    renderApp();
}

async function addStoryPhotos(input) {
    const files = [...(input.files || [])];
    if (!files.length) return;
    const draft = storyDraft;
    photoBusy = 'story:gallery';
    renderApp();
    let failed = 0;
    for (const file of files) {
        try {
            const src = await uploadSitePhoto(file, 'stories', { jpeg: true });
            draft.gallery.push({ src, alt: '' });
            delete draft.galleryGrid;
        } catch (err) {
            failed++;
            console.warn('Photo not uploaded:', err);
        }
        renderApp();
    }
    photoBusy = '';
    showToast(failed ? `${failed} of ${files.length} photos didn't upload. Please try those again.` : 'Photos uploaded. Save the story to put them on the site.');
    renderApp();
}

function moveStoryPhoto(i, by) {
    const list = storyDraft.gallery;
    list.splice(i + by, 0, list.splice(i, 1)[0]);
    delete storyDraft.galleryGrid;
    renderApp();
}

function removeStoryPhoto(i) {
    storyDraft.gallery.splice(i, 1);
    delete storyDraft.galleryGrid;
    renderApp();
}

// A story's address comes from its first title and stays the same, so links to it keep working
function newStorySlug(title) {
    const base = title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, '') || 'story';
    const taken = new Set([...ADMIN_ORIGINALS.blogs, ...BLOGS_DATA].map(p => p.slug));
    let slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
    return slug;
}

async function saveStory(e) {
    e.preventDefault();
    const d = storyDraft;
    const missing = [[d.title, 'a title'], [d.category, 'a category'], [d.date, 'a date'], [d.excerpt, 'a short summary'], [d.content.length, 'the story text'], [d.image, 'a main photo'], [d.imageAlt || !d.isPhoto, 'a description of the main photo']].find(([value]) => !value);
    if (missing) { showToast(`The story needs ${missing[1]}.`); return; }
    const slug = d.slug || newStorySlug(d.title);
    const { slug: _slug, ...value } = clone(d);
    if (await saveSiteEdit(`story:${slug}`, value, 'Story saved. It is on the site now.')) {
        storyDraft = null;
        renderApp();
    }
}

function removeStory(slug) {
    const post = BLOGS_DATA.find(p => p.slug === slug);
    if (!post) return;
    if (isShippedStory(slug)) {
        if (confirm(`Remove "${post.title}" from the site? You can put it back later.`)) saveSiteEdit(`story:${slug}`, { removed: true }, 'Story removed from the site.');
    } else if (confirm(`Delete "${post.title}"? This can't be undone.`)) {
        saveSiteEdit(`story:${slug}`, null, 'Story deleted.');
    }
}

function undoStory(slug) {
    const edit = (siteEdits[`story:${slug}`] || {}).value;
    if (edit && !edit.removed && !confirm('Undo your edits and go back to the original of this story?')) return;
    saveSiteEdit(`story:${slug}`, null, 'The original story is back.');
}

// --- Holiday theme: on or off, the photo behind the site (one for computers and tablets, one for phones), and snow ---
let holidayDraft = null;

function holidayFields() {
    if (!holidayDraft) holidayDraft = clone(HOLIDAY);
    return holidayDraft;
}

function renderHolidayEditor() {
    const edit = siteEdits.holiday, d = holidayFields();
    if (!HOLIDAY_THEMES[d.theme]) d.theme = 'christmas';
    if (d.effects === undefined) d.effects = d.snow !== false;
    const theme = HOLIDAY_THEMES[d.theme];
    const picks = key => `<div class="holiday-picks" role="group">${Object.entries(HOLIDAY_DESIGNS).filter(([, x]) => x.theme === d.theme).map(([id, x]) => `
        <button type="button" class="holiday-pick" aria-pressed="${d[key] === id}" onclick="setHolidayPick('${key}', '${id}', this)">
            <img src="${escapeHtml(x.image)}" alt="" loading="lazy"><span>${escapeHtml(x.label)}</span>
        </button>`).join('')}</div>`;
    return `
        <form data-no-prefill onsubmit="saveHolidayEdit(event)" class="admin-card grid gap-5 max-w-3xl mb-6" novalidate>
            <div>
                <h2 class="type-md text-ink">Holiday theme</h2>
                <p class="text-sm text-mute mt-1">A holiday photo behind the whole website, and falling snow on every page. The photo shows in light mode only, and none of it shows in the admin.${edit && edit.updated_by ? ` Last edited by ${escapeHtml(adminName(edit.updated_by))}.` : ''}</p>
            </div>
            <label class="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox"${d.on ? ' checked' : ''} onchange="setHoliday('on', this.checked)"> Show the holiday theme on the website</label>
            <fieldset><legend class="text-sm font-semibold text-ink mb-2">Theme</legend>
                <div class="admin-chips" role="group">${Object.entries(HOLIDAY_THEMES).map(([id, t]) => `<button type="button" aria-pressed="${d.theme === id}" onclick="setHolidayTheme('${id}')">${escapeHtml(t.label)}</button>`).join('')}</div></fieldset>
            <fieldset class="grid gap-2"><legend class="text-sm font-semibold text-ink mb-2">Background on computers and tablets</legend>${picks('design')}</fieldset>
            <fieldset class="grid gap-2"><legend class="text-sm font-semibold text-ink mb-2">Background on phones</legend>${picks('phone')}</fieldset>
            <p class="text-xs text-mute">Each photo is placed by where its decoration is, so the decoration always shows: a tall photo stands on its decorated side at the screen's height on a computer, with its own background colour around it. Dark and red photos are paled so the website's text stays readable.</p>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox"${d.effects !== false ? ' checked' : ''} onchange="setHoliday('effects', this.checked)"> ${escapeHtml(theme.effect)} on every page</label>
            <p class="text-xs text-mute">These photos are 1024 px wide or smaller, so they look a little soft on big screens. The same photos at 2560 px or wider would look sharp.</p>
            <div class="flex flex-wrap gap-4 items-center">
                <button type="submit" class="btn btn-primary min-h-[2.5rem] px-4 text-sm">Save holiday theme</button>
                ${edit ? '<button type="button" onclick="resetHolidayEdit()" class="link text-sm">Undo edits</button>' : ''}
            </div>
        </form>`;
}

function setHoliday(key, value) {
    holidayFields()[key] = value;
    contentPreviewChanged();
}

// A theme starts with its own photos for computers and phones
function setHolidayTheme(id) {
    Object.assign(holidayFields(), { theme: id, design: HOLIDAY_THEMES[id].design, phone: HOLIDAY_THEMES[id].phone });
    renderApp();
}

// Marks the chosen photo in place (a redraw would reload the preview)
function setHolidayPick(key, id, button) {
    holidayFields()[key] = id;
    button.parentElement.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    contentPreviewChanged();
}

async function saveHolidayEdit(e) {
    e.preventDefault();
    const d = holidayFields();
    if (await saveSiteEdit('holiday', clone(d), d.on ? 'Holiday theme saved. It is on the website now.' : 'Saved. The holiday theme is off.')) {
        holidayDraft = null;
        renderApp();
    }
}

function resetHolidayEdit() {
    if (!confirm('Go back to no holiday theme? This removes it from the website.')) return;
    holidayDraft = null;
    saveSiteEdit('holiday', null, 'The holiday theme is off.');
}

// --- The Red Series: its cover, background and effects, and each cart's photo, name, seats line, seat and canopy.
// The seat and canopy lists are the Scratch build's, from the bundles, so a Red Series quote is still priced. ---
let promoDraft = null;

function promoFields() {
    if (!promoDraft) promoDraft = { settings: clone(HOME_PROMO_SETTINGS), carts: HOME_PROMO.map(c => ({ name: c.name, seats: c.seats, image: c.image, seat: c.seat, canopy: c.canopy })) };
    return promoDraft;
}

// The Scratch build's seat and canopy choices for a Red Series cart's model
function promoChoices(i) {
    const product = PRODUCTS_DATA.find(p => p.slug === HOME_PROMO[i].slug) || {};
    return { seats: TEMPO_MATRIX.seat[RED_SERIES_LEVEL], canopies: (TEMPO_MATRIX.canopy[product.layout] || [])[RED_SERIES_LEVEL] || [] };
}

function renderPromoEditor() {
    const edit = siteEdits.promo, d = promoFields(), s = d.settings;
    const options = (list, chosen) => list.map(v => `<option${v === chosen ? ' selected' : ''}>${escapeHtml(v)}</option>`).join('');
    const photoRow = (id, label, size, src, busy, onchange, wide) => `
        <div class="grid gap-2">
            <div class="admin-banner-bar">
                <span class="text-sm font-semibold text-ink">${label} ${photoSize(size)}</span>
                <span class="admin-photo-actions">
                    <label for="${id}" class="link text-xs">${photoBusy === busy ? 'Uploading…' : 'Replace photo'}</label>
                    <input id="${id}" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" onchange="${onchange}">
                </span>
            </div>
            <div class="${wide ? 'admin-banner-img' : 'admin-story-img admin-promo-cart'}">${src ? `<img src="${escapeHtml(src)}" alt="">` : '<span class="text-xs text-mute">No photo yet</span>'}</div>
        </div>`;
    return `
        <form data-no-prefill onsubmit="savePromoEdit(event)" class="admin-card grid gap-5 max-w-3xl mb-6" novalidate>
            <div>
                <h2 class="type-md text-ink">Red Series</h2>
                <p class="text-sm text-mute mt-1">The Red Series on the homepage: the cover, the background behind the carts, and the three carts. Each cart is a fixed Scratch build in Sangria; its seat and canopy are what its quote asks for.${edit && edit.updated_by ? ` Last edited by ${escapeHtml(adminName(edit.updated_by))}.` : ''}</p>
            </div>
            <div onfocusin="contentPreviewChanged({ section: 'promo' })">
                ${photoRow('rp-cover', 'Cover', 'promoCover', s.cover, 'promo:cover', 'choosePromoPhoto(\'cover\', this)', true)}
                <div class="field mt-3"><label for="rp-cover-alt">What the cover shows or says</label><input id="rp-cover-alt" type="text" value="${escapeHtml(s.coverAlt)}" oninput="setPromoSetting('coverAlt', this.value)"></div>
            </div>
            <div onfocusin="contentPreviewChanged({ section: 'promo', open: true })">
                ${photoRow('rp-stage', 'Background behind the carts', 'promoStage', s.stage, 'promo:stage', 'choosePromoPhoto(\'stage\', this)', true)}
            </div>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox"${s.effects !== false ? ' checked' : ''} onchange="setPromoSetting('effects', this.checked)"> Show the falling glitter and sparkles</label>
            <ol class="admin-banners">${d.carts.map((c, i) => {
                const choice = promoChoices(i);
                return `
                <li class="admin-banner" onfocusin="contentPreviewChanged({ section: 'promo', open: true })">
                    ${photoRow(`rp-cart-${i}`, `Cart ${i + 1}: ${escapeHtml(PRODUCTS_DATA.find(p => p.slug === HOME_PROMO[i].slug).name)}`, 'promoCart', c.image, `promo:cart:${i}`, `choosePromoPhoto('cart:${i}', this)`, false)}
                    <div class="grid sm:grid-cols-2 gap-4">
                        <div class="field"><label for="rp-name-${i}">Name on the homepage</label><input id="rp-name-${i}" type="text" maxlength="20" value="${escapeHtml(c.name)}" oninput="setPromoCart(${i}, 'name', this.value)"></div>
                        <div class="field"><label for="rp-seats-${i}">Seats line</label><input id="rp-seats-${i}" type="text" maxlength="40" value="${escapeHtml(c.seats)}" oninput="setPromoCart(${i}, 'seats', this.value)"></div>
                        <div class="field"><label for="rp-seat-${i}">Seat</label><select id="rp-seat-${i}" onchange="setPromoCart(${i}, 'seat', this.value)">${options(choice.seats, c.seat)}</select></div>
                        <div class="field"><label for="rp-canopy-${i}">Canopy</label><select id="rp-canopy-${i}" onchange="setPromoCart(${i}, 'canopy', this.value)">${options(choice.canopies, c.canopy)}</select></div>
                    </div>
                </li>`;
            }).join('')}</ol>
            <p class="text-xs text-mute -mt-2">Change the seat or canopy only together with a cart photo that shows them. The body colour stays Sangria.</p>
            <div class="flex flex-wrap gap-4 items-center">
                <button type="submit" class="btn btn-primary min-h-[2.5rem] px-4 text-sm"${photoBusy ? ' disabled' : ''}>Save Red Series</button>
                ${edit ? '<button type="button" onclick="resetPromoEdit()" class="link text-sm">Undo edits</button>' : ''}
            </div>
        </form>`;
}

function setPromoSetting(key, value) {
    promoFields().settings[key] = typeof value === 'string' ? value.trim() : value;
    contentPreviewChanged({ section: 'promo', open: key !== 'coverAlt' && key !== 'cover' });
}

function setPromoCart(i, key, value) {
    promoFields().carts[i][key] = value.trim();
    contentPreviewChanged({ section: 'promo', open: true });
}

// target: 'cover', 'stage' or 'cart:<index>'. Cut-outs stay PNG to keep their see-through background
async function choosePromoPhoto(target, input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const draft = promoFields();
    const cart = target.startsWith('cart:') ? +target.slice(5) : null;
    if (cart !== null && file.type !== 'image/png' && !confirm('This is not a PNG, so it has no see-through background: the cart will show on a box. Use it anyway?')) { input.value = ''; return; }
    previewFocus = { section: 'promo', open: target !== 'cover' };
    photoBusy = `promo:${target}`;
    renderApp();
    try {
        const url = await uploadSitePhoto(file, 'promo', cart === null ? { max: BANNER_PHOTO_MAX, jpeg: true } : {});
        if (cart === null) draft.settings[target] = url;
        else draft.carts[cart].image = url;
        showToast('Photo uploaded. Save the Red Series to put it on the site.');
    } catch (err) {
        showToast(`Not uploaded: ${err.message}.`);
    }
    photoBusy = '';
    renderApp();
}

async function savePromoEdit(e) {
    e.preventDefault();
    const d = promoFields();
    const missing = d.carts.findIndex(c => !c.name || !c.image);
    if (missing >= 0) { showToast(`Cart ${missing + 1} needs a name and a photo.`); return; }
    if (!d.settings.cover || !d.settings.stage) { showToast('The Red Series needs a cover and a background.'); return; }
    if (await saveSiteEdit('promo', clone(d), 'Red Series saved. It is on the homepage now.')) {
        promoDraft = null;
        renderApp();
    }
}

function resetPromoEdit() {
    if (!confirm('Go back to the original Red Series? This removes your edited photos and text from the homepage.')) return;
    promoDraft = null;
    saveSiteEdit('promo', null, 'Back to the original Red Series.');
}

// --- The homepage event: its text, header, photos and effects, edited here and saved together ---
const EVENT_PHOTO_MAX = 1200; // the event photos show in narrow columns
let eventDraft = null;        // the event being edited; starts as what the site shows

function eventFields() {
    if (!eventDraft) eventDraft = clone({ title: HOME_EVENT.title, date: HOME_EVENT.date, text: HOME_EVENT.text, header: HOME_EVENT.header,
        headerAlt: HOME_EVENT.headerAlt || '', photos: HOME_EVENT.photos, effects: HOME_EVENT.effects !== false });
    return eventDraft;
}

// --- Live preview: the homepage at a phone, tablet or desktop width, showing the unsaved changes as they're typed ---
const PREVIEW_DEVICES = { desktop: ['Desktop', 1366, 768], tablet: ['Tablet (iPad)', 820, 1180], mobile: ['Mobile', 390, 844] };
let previewDevice = 'mobile';
let previewFocus = { section: 'banners', slide: 0 };
let previewTimer = 0;

function renderContentPreview() {
    const [label, w, h] = PREVIEW_DEVICES[previewDevice];
    setTimeout(fitContentPreview, 0);
    return `
        <section class="admin-card admin-preview" aria-labelledby="preview-title">
            <div class="admin-preview-head">
                <h2 id="preview-title" class="type-md text-ink">Preview</h2>
                <div class="admin-chips" role="group" aria-label="Screen">${Object.entries(PREVIEW_DEVICES).map(([id, [name, dw]]) =>
                    `<button type="button" aria-pressed="${id === previewDevice}" onclick="setPreviewDevice('${id}')">${name} <span>${dw}px</span></button>`).join('')}</div>
                <div class="admin-chips" role="group" aria-label="Show">
                    <button type="button" aria-pressed="${previewFocus.section !== 'event'}" onclick="showPreviewSection('banners')">Carousel</button>
                    <button type="button" aria-pressed="${previewFocus.section === 'promo'}" onclick="showPreviewSection('promo')">Red Series</button>
                    <button type="button" aria-pressed="${previewFocus.section === 'event'}" onclick="showPreviewSection('event')">Event</button>
                </div>
            </div>
            <p class="text-xs text-mute">Your changes show here as you type or add a photo, before you save. Visitors see them once you save.</p>
            <div class="admin-preview-stage"><iframe id="content-preview" title="Homepage preview, ${label}, ${w} pixels wide" src="./?preview=admin" width="${w}" height="${h}" style="width:${w}px;height:${h}px" onload="pushContentPreview()"></iframe></div>
        </section>`;
}

// The frame is drawn at the device's real width and scaled down to fit the panel
function fitContentPreview() {
    const stage = document.querySelector('.admin-preview-stage'), frame = document.getElementById('content-preview');
    if (!stage || !frame) return;
    const [, w, h] = PREVIEW_DEVICES[previewDevice];
    const scale = Math.min(1, stage.clientWidth / w, (window.innerHeight * 0.75) / h);
    frame.style.transform = `scale(${scale})`;
    stage.style.height = `${Math.round(h * scale)}px`;
    frame.style.marginLeft = `${Math.max(0, Math.round((stage.clientWidth - w * scale) / 2))}px`;
}
window.addEventListener('resize', () => fitContentPreview());

function pushContentPreview() {
    const frame = document.getElementById('content-preview');
    try {
        if (frame && frame.contentWindow && frame.contentWindow.applyPreviewDraft) {
            frame.contentWindow.applyPreviewDraft({ banners: bannerSlides(), event: eventFields(), promo: promoFields(), holiday: holidayFields(), focus: previewFocus });
        }
    } catch (err) { console.warn('Preview not updated:', err); }
}

// Typing updates the preview a moment after the last key, without redrawing the admin
function contentPreviewChanged(focus) {
    if (focus) previewFocus = focus;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(pushContentPreview, 150);
}

function setPreviewDevice(id) {
    previewDevice = id;
    renderApp();
}

function showPreviewSection(section) {
    previewFocus = section === 'banners' ? { section, slide: previewFocus.slide || 0 } : section === 'promo' ? { section, open: true } : { section };
    const order = ['banners', 'promo', 'event'];
    document.querySelectorAll('.admin-preview [aria-label="Show"] button').forEach((b, k) => b.setAttribute('aria-pressed', String(order[k] === section)));
    pushContentPreview();
}

function renderAdminContent() {
    const edit = siteEdits.event, d = eventFields();
    return `
        <div class="content-workspace">
        <div class="content-forms">
        ${HOLIDAY_HIDDEN ? '' : renderHolidayEditor()}
        ${renderBannerEditor()}
        ${renderPromoEditor()}
        <form data-no-prefill onsubmit="saveEventEdit(event)" class="admin-card grid gap-5 max-w-3xl" novalidate>
            <div>
                <h2 class="type-md text-ink">Homepage event</h2>
                <p class="text-sm text-mute mt-1">The event story on the homepage: its text, the wide header photo and the photos beside the story.${edit && edit.updated_by ? ` Last edited by ${escapeHtml(adminName(edit.updated_by))}.` : ''}</p>
            </div>
            <div class="field"><label for="ae-title">Title</label><input id="ae-title" name="title" type="text" required value="${escapeHtml(d.title)}" oninput="setEventField('title', this.value)"></div>
            <div class="field"><label for="ae-date">Date and place</label><input id="ae-date" name="date" type="text" value="${escapeHtml(d.date)}" oninput="setEventField('date', this.value)"></div>
            <div class="field"><label for="ae-text">Story (a blank line between paragraphs)</label><textarea id="ae-text" name="text" rows="12" oninput="setEventText(this.value)">${escapeHtml(d.text.join('\n\n'))}</textarea></div>

            <div class="grid gap-2">
                <div class="admin-banner-bar">
                    <span class="text-sm font-semibold text-ink">Header photo ${photoSize('eventHeader')}</span>
                    <span class="admin-photo-actions">
                        <label for="ae-header" class="link text-xs">${photoBusy === 'event:header' ? 'Uploading…' : 'Replace photo'}</label>
                        <input id="ae-header" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" onchange="chooseEventHeader(this)">
                    </span>
                </div>
                <div class="admin-event-header">${d.header ? `<img src="${escapeHtml(d.header)}" alt="">` : '<span class="text-xs text-mute">No photo yet</span>'}</div>
                <div class="field"><label for="ae-header-alt">What the header shows or says</label><input id="ae-header-alt" type="text" value="${escapeHtml(d.headerAlt)}" placeholder="Leave empty to use the title" oninput="setEventField('headerAlt', this.value)"></div>
                <p class="text-xs text-mute">The header is always a wide strip: a photo of another shape is cropped to it, as the preview shows.</p>
                <label class="flex items-center gap-2 text-sm"><input type="checkbox"${d.effects ? ' checked' : ''} onchange="setEventEffects(this.checked)"> Show the Halloween bats and spider over the header</label>
            </div>

            <div class="grid gap-3">
                <div class="admin-banner-bar">
                    <span class="text-sm font-semibold text-ink">Photos beside the story ${photoSize('eventPhoto')}</span>
                    <span class="admin-photo-actions">
                        <label for="ae-photos" class="link text-xs">${photoBusy === 'event:photos' ? 'Uploading…' : 'Add photos'}</label>
                        <input id="ae-photos" type="file" multiple accept="image/jpeg,image/png,image/webp" class="sr-only" onchange="addEventPhotos(this)">
                    </span>
                </div>
                <p class="text-xs text-mute -mt-1">They scroll in two columns, so use at least 4. Portrait photos fill the columns best.</p>
                ${d.photos.map((p, i) => `<div class="admin-story-photo">
                    <div class="admin-story-img"><img src="${escapeHtml(p.image)}" alt="" loading="lazy"></div>
                    <div class="grid gap-2 min-w-0">
                        <div class="field"><label for="ae-p-${i}">What photo ${i + 1} shows</label><input id="ae-p-${i}" type="text" value="${escapeHtml(p.alt || '')}" oninput="setEventPhotoAlt(${i}, this.value)"></div>
                        <span class="admin-photo-actions">
                            <button type="button" onclick="moveEventPhoto(${i}, -1)" class="link text-xs"${i === 0 ? ' disabled' : ''}>Move up</button>
                            <button type="button" onclick="moveEventPhoto(${i}, 1)" class="link text-xs"${i === d.photos.length - 1 ? ' disabled' : ''}>Move down</button>
                            <button type="button" onclick="removeEventPhoto(${i})" class="link text-xs">Remove</button>
                        </span>
                    </div>
                </div>`).join('')}
            </div>

            <div class="flex flex-wrap gap-4 items-center">
                <button type="submit" class="btn btn-primary min-h-[2.5rem] px-4 text-sm"${photoBusy ? ' disabled' : ''}>Save</button>
                <a href="./" data-route="home" class="link text-sm">See the homepage</a>
                ${edit ? '<button type="button" onclick="resetEventEdit()" class="link text-sm">Undo edits</button>' : ''}
            </div>
        </form>
        </div>
        ${renderContentPreview()}
        </div>`;
}

function setEventField(key, value) {
    eventFields()[key] = value.trim();
    contentPreviewChanged({ section: 'event' });
}

function setEventText(value) {
    eventFields().text = value.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean);
    contentPreviewChanged({ section: 'event' });
}

function setEventEffects(on) {
    eventFields().effects = on;
    contentPreviewChanged({ section: 'event' });
}

function setEventPhotoAlt(i, value) {
    eventFields().photos[i].alt = value.trim();
    contentPreviewChanged({ section: 'event' });
}

// The photo goes on the draft it was chosen for, even if the page is redrawn during the upload
async function chooseEventHeader(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const draft = eventFields();
    previewFocus = { section: 'event' };
    photoBusy = 'event:header';
    renderApp();
    try {
        draft.header = await uploadSitePhoto(file, 'event');
        showToast('Photo uploaded. Save the event to put it on the site.');
    } catch (err) {
        showToast(`Not uploaded: ${err.message}.`);
    }
    photoBusy = '';
    renderApp();
}

async function addEventPhotos(input) {
    const files = [...(input.files || [])];
    if (!files.length) return;
    const draft = eventFields();
    previewFocus = { section: 'event' };
    photoBusy = 'event:photos';
    renderApp();
    let failed = 0;
    for (const file of files) {
        try {
            draft.photos.push({ image: await uploadSitePhoto(file, 'event', { max: EVENT_PHOTO_MAX, jpeg: true }), alt: '' });
        } catch (err) {
            failed++;
            console.warn('Photo not uploaded:', err);
        }
        renderApp();
    }
    photoBusy = '';
    showToast(failed ? `${failed} of ${files.length} photos didn't upload. Please try those again.` : 'Photos uploaded. Save the event to put them on the site.');
    renderApp();
}

function moveEventPhoto(i, by) {
    const list = eventFields().photos;
    list.splice(i + by, 0, list.splice(i, 1)[0]);
    renderApp();
}

function removeEventPhoto(i) {
    eventFields().photos.splice(i, 1);
    renderApp();
}

async function saveEventEdit(e) {
    e.preventDefault();
    const d = eventFields();
    const missing = [[d.title, 'a title'], [d.text.length, 'its story'], [d.header, 'a header photo'], [d.photos.length >= 2, 'at least 2 photos']].find(([value]) => !value);
    if (missing) { showToast(`The event needs ${missing[1]}.`); return; }
    if (await saveSiteEdit('event', clone(d), 'Homepage event saved. It is on the homepage now.')) {
        eventDraft = null;
        renderApp();
    }
}

function resetEventEdit() {
    if (!confirm('Go back to the original event? This removes your edited text and photos from the homepage.')) return;
    eventDraft = null;
    saveSiteEdit('event', null, 'Back to the original event.');
}

// --- Bundles: the costing workbook's Bundles sheet (master admins only), as one table grouped by build with each
// group's cost. Lines can be edited, added and deleted; the database stamps who changed what. Filters, edits and
// saves redraw the results only, so the search box keeps its focus while typing ---
let bundleFilter = { product: '', config: '', type: '', build: '', part: '', q: '' };
// The quick part filters above the table (matched to the sheet's Part column, any case)
const BUNDLE_PARTS = [['', 'All parts'], ['body', 'Body'], ['seat', 'Seat'], ['canopy', 'Canopy']];
let bundleEditing = null; // a line's sheet_row, or { group } for a new line in that group

// The sheet's Option column is kept in the color column; cost_usd is a line's unit cost, in its currency: USD, or PHP
// for a local brand's part (2026-11-17: the sheet marks those "Pesos" beside the amount in its USD column)
const BUNDLE_FIELDS = [['sku', 'SKU'], ['product', 'Product'], ['config', 'Config'], ['type', 'Type'], ['part', 'Part'], ['color', 'Option'],
    ['description', 'Description'], ['qty', 'Qty'], ['cost_usd', 'Cost'], ['currency', 'Currency']];
const isPesoLine = b => String((b && b.currency) || '').toUpperCase() === 'PHP';
// A cost in its own currency: ₱ for a local part, $ for the rest
function formatCost(n, b) {
    return isPesoLine(b) ? formatPhp(n) : formatUsd(n);
}
// The mark under a local part's cost: priced in pesos, not converted from dollars
const LOCAL_MARK = '<span class="cost-local" title="A local part, priced in pesos: no exchange rate or freight">Local ₱</span>';
let bundleView = 'builds'; // 'builds' and 'parts' (the admin's own bundles), 'bundles' (the old sheet lines), 'usd', 'zoho'

function formatUsd(n) {
    return n == null ? '' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// A line's total in USD: its unit cost times its quantity (a line without a quantity counts once)
function bundleLineUsd(b) {
    return b.cost_usd == null ? null : Number(b.cost_usd) * (b.qty == null ? 1 : Number(b.qty));
}

// A side-table cell as text: its value (or error), and its formula
function bundleExtraText(cell) {
    return `${cell.e != null ? cell.e : cell.v != null ? cell.v : ''}${cell.f ? ` (${cell.f})` : ''}`;
}

function bundleGroupName(b) {
    return b.product || b.config || b.type ? [b.product, b.config, b.type].filter(Boolean).join(' · ') : 'Side tables (columns K–V)';
}

// The tab shows the bundles, or the USD SKU list the bundles' costs come from
// --- Photos on SKUs and bundle lines (2026-11-12): from Zoho Inventory, by SKU (sku_photos, copied by the email
// script). A SKU Zoho has no photo for can get one here, for the website (sku_site_photos); failing both, what the
// website already has for it ---
const skuIndexes = new WeakMap();

// A row of one of the SKU lists, by SKU (each list indexed once; a changed list is a new array)
function bySku(list, sku) {
    if (!list || !sku) return null;
    let map = skuIndexes.get(list);
    if (!map) { map = new Map(list.map(x => [x.sku, x])); skuIndexes.set(list, map); }
    return map.get(String(sku).trim()) || null;
}

function zohoPhoto(sku) { return (bySku(pageData && pageData.skuPhotos, sku) || {}).url || ''; }
function ownPhoto(sku) { return (bySku(pageData && pageData.skuSitePhotos, sku) || {}).url || ''; }
function zohoItem(sku) { return bySku(pageData && pageData.zohoItems, sku); }

// Who may add a photo for a SKU (as for the site's other photos, plus the price manager)
function canAddSkuPhotos() { return ['master', 'marketing', 'pricing'].includes((currentAdmin() || {}).role); }

function bundleLinePhoto(b) {
    return zohoPhoto(b.sku) || ownPhoto(b.sku) || siteSkuPhoto(b.sku) || bundleOptionPhoto(b);
}

// Body, Seat and Canopy lines: a real photo of their colour. Body: Club Car's close-up of the front panel in that
// colour (the team's Drive colour folder, saved 2026-11-11 as image/Options/body-panel-*.jpg); canopy: the Golfer 2
// Scratch with that canopy, from the site's colour preview (image/Options/canopy-*.jpg); seats: the site's seat
// photos (image/Seats)
const BUNDLE_SEAT_PHOTOS = {
    'White': 'standard-white', 'Beige': 'standard-beige', 'Black': 'standard-black', 'Gray': 'standard-grey', 'Grey': 'standard-grey',
    'Tsunami Red': 'tsunami-red-front', 'Tsunami Blue': 'tsunami-blue-front', 'Tsunami Gray': 'tsunami-grey-front',
    'Camello': 'classic-camello', 'Black & Gray': 'classic-black-grey'
};
const BUNDLE_BODY_PHOTOS = ['White', 'Black', 'Cashmere', 'Sangria', 'Sapphire', 'Green', 'Platinum'];

function bundleOptionPhoto(b) {
    const part = String(b.part || '').trim().toLowerCase(), option = String(b.color || '').trim();
    if (part === 'body' && BUNDLE_BODY_PHOTOS.includes(option)) return `image/Options/body-panel-${option.toLowerCase()}.jpg`;
    if (part === 'seat' && BUNDLE_SEAT_PHOTOS[option]) return `image/Seats/${BUNDLE_SEAT_PHOTOS[option]}.jpg`;
    const canopy = part === 'canopy' && (option.match(/\b(White|Beige|Black)\b/) || [])[1];
    return canopy ? `image/Options/canopy-${canopy.toLowerCase()}.jpg` : '';
}

// Until Zoho Inventory has a photo for the SKU, the list shows what the website already has (2026-11-11): the accessory's photo on the
// site, matched by SKU, or for a Body, Seat or Canopy line, its colour as on the site's colour picker
// Bundle SKUs matched by hand to the real photos in image/Options (from the team's Drive folders; three added
// 2026-11-11: the overhead console, the AGM battery and the Nokken chrome wheel). The item's name on the site
// (OPTION_PHOTOS in app.js) decided the match where the SKU isn't on the site
const SKU_SITE_PHOTOS = {
    'SJK-0136': 'bag-cover-black', 'SJK-1536': 'bag-cover-black', 'SJK-1038': 'bag-cover-beige', 'SJK-1040': 'bag-cover-white',
    'SJK-0344': 'bag-cover-magnetic-black', 'SJK-0347': 'bag-cover-magnetic-beige',
    'SJK-0154': 'mirror-5-panel', 'SJK-1146': 'mirror-side',
    'SJK-0248': 'ball-washer', 'SJK-0257': 'caddy-cooler', 'SJK-1394': 'sand-bottle', 'SJK-1374': 'caddy-stand', 'SJK-1375': 'floor-mat-gc',
    'SJK-1354': 'steering-scorecard', 'SJK-1355': 'steering-premium', 'SJK-1510': 'charge-wireless',
    'SJK-0787': 'audio-cc-soundbar', 'SJK-1564': 'audio-gc-soundbar-27', 'SJK-1565': 'audio-gc-soundbar-27',
    'SJK-0880': 'overhead-storage-console',
    'SJK-1506': 'windshield-clear', 'SJK-1854': 'windshield-tinted',
    'SJK-1507': 'battery-trojan-agm', 'SJK-1813': 'battery-trojan-8v', 'SJK-1597': 'battery-battlite',
    'SJK-1770': 'wheel-8-steel', 'SJK-1939': 'wheel-8-steel', 'SJK-0259': 'wheel-10-5spoke-gunmetal',
    'SJK-1540': 'wheel-12-triton-23105', 'SJK-1541': 'wheel-12-triton-215', 'SJK-1890': 'wheel-12-hela-215', 'SJK-1893': 'wheel-12-hela-215',
    'SJK-1895': 'wheel-14-zeus-kraken', 'SJK-1896': 'wheel-14-aerion-chrome-kraken', 'SJK-1897': 'wheel-14-nokken-chrome',
    'SJK-1898': 'wheel-14-aerion-gloss-kraken', 'SJK-1899': 'wheel-14-athena-gloss-kraken',
    'SJK-1579': 'lift-gc-35', 'SJK-1542': 'fender-tempo-3', 'SJK-1993': 'brush-guard',
    'SJK-1514': 'flip-genesis'
};
// The bare cart (Unit lines): the base Golfer 2 build photo
const SKU_SITE_PHOTO_FILES = { 'SJK-1512': 'image/Products/builds/golfer-2-golfer.jpg' };

function siteSkuPhoto(sku) {
    if (!sku) return '';
    if (SKU_SITE_PHOTO_FILES[sku]) return SKU_SITE_PHOTO_FILES[sku];
    if (SKU_SITE_PHOTOS[sku]) return `image/Options/${SKU_SITE_PHOTOS[sku]}.jpg`;
    const item = ACCESSORY_CATALOG.flatMap(g => g.items).find(i => i.sku === sku && (i.image || i.product));
    return item ? item.image || (findProductRef(item.product) || {}).image || '' : '';
}

// The bundles' Option names, as the site names the same colours
const BUNDLE_SWATCH_NAMES = {
    'Platinum': 'Platinum Grey', 'Camello': 'Premium Camello', 'Black & Gray': 'Premium Black and Grey', 'GC Black': 'GC Black Premium Seat',
    'Tsunami Red': 'Tsunami Silver Red & Black', 'Tsunami Blue': 'Tsunami Silver Blue & Black', 'Tsunami Gray': 'Tsunami Silver Grey & Black'
};

function bundleSwatch(b) {
    const part = String(b.part || '').trim().toLowerCase();
    if (!['body', 'seat', 'canopy'].includes(part) || !b.color) return '';
    const name = BUNDLE_SWATCH_NAMES[String(b.color).trim()] || String(b.color).trim();
    if (part === 'body') return (COLOR_FAMILIES.tempo.body.flatMap(g => g.colors).find(c => c.name === name) || {}).hex || '';
    if (part === 'seat') return TRIM_COLOR_HEX[name] || '';
    return getTrimHex('canopy', name) || '';
}

// A SKU's stand-in: its site photo, or the colour of a bundle line that uses it
function skuStandIn(sku) {
    const lines = sku ? (pageData.bundles || []).filter(b => b.sku === sku) : [];
    const optionPhoto = lines.map(bundleOptionPhoto).find(Boolean) || '';
    const line = lines.find(b => bundleSwatch(b));
    return { photo: siteSkuPhoto(sku) || optionPhoto, swatch: line ? bundleSwatch(line) : '' };
}

function linePhotoThumb(url, swatch = '') {
    const inner = url ? `<img src="${escapeHtml(url)}" alt="" loading="lazy">`
        : swatch ? `<span class="line-swatch" style="background: ${escapeHtml(swatch)}"></span>` : '';
    return `<span class="line-photo">${inner}</span>`;
}

// The photo in a SKU or bundle line form: filled in from Zoho as the SKU is typed (previewSkuPhoto). When Zoho has
// none, Add photo puts one in for the website straight away (no Save needed)
function skuPhotoField(sku, span) {
    sku = String(sku || '').trim();
    const zoho = zohoPhoto(sku), own = zoho ? '' : ownPhoto(sku), standIn = zoho || own ? {} : skuStandIn(sku);
    const note = !sku ? 'Fill in the SKU: its photo comes from Zoho Inventory.'
        : zoho ? 'From Zoho Inventory.'
        : !pageData.skuPhotos ? 'Photos from Zoho Inventory aren\'t set up yet.'
        : own ? 'Added here, for the website: Zoho Inventory has no photo for this SKU. A photo added to the item in Zoho replaces it.'
        : `No photo in Zoho Inventory for this SKU${standIn.photo || standIn.swatch ? ': showing the website\'s for now' : ''}.${canAddSkuPhotos() ? ' Add one here for the website, or to the item in Zoho.' : ''}`;
    return `<div class="field ${span}" data-sku-photo="${span}" data-sku="${escapeHtml(sku)}"><span class="text-sm">Photo</span>
        <div class="flex flex-wrap items-center gap-4 mt-1">
            ${linePhotoThumb(zoho || own || standIn.photo, standIn.swatch).replace('line-photo', 'line-photo line-photo-lg')}
            ${sku && !zoho && canAddSkuPhotos() ? skuPhotoButtons(sku, own, 'btn btn-outline min-h-[2.5rem] px-4 text-sm') : ''}
            <p class="text-xs text-mute basis-full">${note}</p>
        </div>
    </div>`;
}

// Add photo (or Replace photo, and Remove photo) for a SKU's website photo
function skuPhotoButtons(sku, own, style) {
    return `<label class="${style} cursor-pointer"><span>${own ? 'Replace photo' : 'Add photo'}</span><input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" data-sku="${escapeHtml(sku)}" onchange="chooseSkuPhoto(this)"></label>
        ${own ? `<button type="button" data-sku="${escapeHtml(sku)}" onclick="removeSkuPhoto(this)" class="link text-xs">Remove photo</button>` : ''}`;
}

// Typing a SKU: its photo, and (when the description is still empty) the Zoho item's name
function previewSkuPhoto(input) {
    const form = input.form;
    const field = form && form.querySelector('[data-sku-photo]');
    if (field) field.outerHTML = skuPhotoField(input.value, field.dataset.skuPhoto);
    const item = zohoItem(input.value), description = form && form.querySelector('[name="description"]');
    if (item && description && !description.value.trim()) description.value = item.name;
}

async function chooseSkuPhoto(input) {
    const file = input.files && input.files[0], sku = input.dataset.sku;
    if (!file || !sku) return;
    input.previousElementSibling.textContent = 'Uploading…';
    try {
        const url = await uploadSitePhoto(file, 'skus');
        const { data: saved, error } = await sb.from('sku_site_photos').upsert({ sku, url, updated_at: new Date().toISOString() }).select('sku, url').single();
        if (error) throw error;
        pageData.skuSitePhotos = [...(pageData.skuSitePhotos || []).filter(p => p.sku !== sku), saved];
        showToast(`Photo added for ${sku}.`);
    } catch (err) {
        showToast(`Not added: ${err.message}.`);
    }
    refreshSkuPhoto(input);
}

async function removeSkuPhoto(button) {
    const sku = button.dataset.sku;
    if (!confirm(`Remove the photo added for ${sku}?`)) return;
    const { error } = await sb.from('sku_site_photos').delete().eq('sku', sku);
    if (error) { showToast(`Not removed: ${error.message}.`); return; }
    pageData.skuSitePhotos = (pageData.skuSitePhotos || []).filter(p => p.sku !== sku);
    showToast(`Photo removed for ${sku}.`);
    refreshSkuPhoto(button);
}

// After a photo is added or removed: the form's photo field (the rest of an open form is left as typed), or the
// Zoho items list; the other lists follow when the form is saved or closed
function refreshSkuPhoto(el) {
    const field = el.closest('[data-sku-photo]');
    if (field) field.outerHTML = skuPhotoField(field.dataset.sku, field.dataset.skuPhoto);
    else refreshZohoItems();
}

// Above the lists: where the items and photos come from, when they were last copied, and a way to copy them now
function renderSkuPhotoSync({ skuPhotoSync: s }) {
    if (!s) return '<p class="text-sm text-mute mb-6">Items and photos from Zoho Inventory aren\'t set up yet: re-run supabase/schema.sql, then follow "Zoho Inventory" in the email script\'s setup notes.</p>';
    const time = t => new Date(t).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
    const copying = s.requested_at && (!s.synced_at || new Date(s.requested_at) > new Date(s.synced_at));
    const count = (n, word) => `${(n || 0).toLocaleString('en-PH')} ${word}${n === 1 ? '' : 's'}`;
    // A partial copy is progress, not a failure: amber, like copying
    const partial = /^Copied part/.test(s.error || '');
    // Class names written out in full, so the CSS build keeps them
    const dot = s.error && !partial ? 'adm-dot-bad' : copying || partial || !s.synced_at ? 'adm-dot-wait' : 'adm-dot-good';
    return `<div class="adm-status">
        <div>
            <p><span class="adm-dot ${dot}" aria-hidden="true"></span>Zoho Inventory, copied every hour:
                ${s.synced_at ? `last copied ${time(s.synced_at)} · ${count(s.items, 'item')} · ${count(s.photos, 'photo')}` : 'not copied yet'}${copying ? ' · copying now…' : ''}</p>
            ${s.error ? `<p class="${partial ? 'text-mute' : 'golfer-error'} mt-1">${escapeHtml(s.error)}</p>` : ''}
            ${'sheet_rows' in s ? `<p class="mt-1">Stock sheet (the stock check): ${s.sheet_synced_at ? `last copied ${time(s.sheet_synced_at)} · ${count(s.sheet_rows, 'SKU')}` : 'not copied yet'}</p>
            ${s.sheet_error ? `<p class="golfer-error mt-1">${escapeHtml(s.sheet_error)}</p>` : ''}` : '<p class="text-mute mt-1">Stock sheet: not set up yet (run supabase/schema.sql)</p>'}
        </div>
        <button type="button" onclick="requestSkuPhotos(this)" class="adm-btn">Get items from Zoho now</button>
    </div>`;
}

async function requestSkuPhotos(button) {
    button.disabled = true;
    const { error } = await sb.rpc('request_sku_photos');
    button.disabled = false;
    if (error) { showToast(`Not asked: ${error.message}.`); return; }
    if (pageData.skuPhotoSync) pageData.skuPhotoSync.requested_at = new Date().toISOString();
    renderApp();
    showToast('Asked Zoho for the items and photos. They take a few minutes; reload the page to see them.');
}

// --- The Zoho items tab: every active Zoho Inventory item, to add to the USD SKU list or a bundle, and to give a
// photo when Zoho has none ---
let zohoQuery = '';
const ZOHO_ITEMS_SHOWN = 60; // rows drawn at once; searching narrows the rest

// --- Stock from Zoho Inventory (2026-11-12): each item's available stock (all locations), against what a quotation
// needs (qty x carts). Information only: nothing is blocked by it ---
const STOCK_CLASS = { ok: 'stock-ok', short: 'stock-short', out: 'stock-out', none: 'stock-none' };

function stockNumber(n) {
    return Number(n).toLocaleString('en-PH', { maximumFractionDigits: 2 });
}

function sheetStock(sku) { return bySku(pageData && pageData.stockSheet, sku); }

// { kind, text } for a SKU (needed: how many this quotation needs), or null before any stock is copied. The quantity
// is the team's stock sheet's total on hand (2026-11-12: the sheet is the stock check); Zoho's available stock only for
// a SKU the sheet doesn't have. Just whether it's in stock: in stock, not enough for this quotation, or out of stock
function stockStatus(sku, needed = 0) {
    const zohoReady = pageData && pageData.zohoItems && pageData.zohoItems.some(i => 'available_stock' in i);
    const sheetReady = pageData && pageData.stockSheet && pageData.stockSheet.length;
    if (!zohoReady && !sheetReady) return null;
    const item = zohoItem(sku), sheet = sheetStock(sku);
    if (!sku || (!item && !sheet)) return { kind: 'none', text: 'Not on the stock sheet' };
    const figure = sheet && sheet.total != null ? sheet.total : item && item.available_stock != null ? item.available_stock : null;
    if (figure == null) return { kind: 'none', text: 'No stock figure' };
    const have = Number(figure);
    if (have <= 0) return { kind: 'out', text: 'Out of stock' };
    if (needed && have < needed) return { kind: 'short', text: `Not enough · ${stockNumber(have)} of ${stockNumber(needed)}` };
    return { kind: 'ok', text: `In stock · ${stockNumber(have)}` };
}

function stockBadge(status) {
    return status ? `<span class="stock-badge ${STOCK_CLASS[status.kind]}">${escapeHtml(status.text)}</span>` : '';
}

// What a quotation line needs: its qty for each cart
function stockNeeded(qt, l) {
    return Number(l.qty == null ? 1 : l.qty) * Number(qt.units || 1);
}

// "2 lines short, 1 out of stock · as of 2:00 PM", over the quotation's lines
function stockSummary(qt) {
    const statuses = qt.lines.map(l => stockStatus(l.sku, stockNeeded(qt, l))).filter(Boolean);
    if (!statuses.length) return '';
    const count = kind => statuses.filter(s => s.kind === kind).length;
    const parts = [[count('short'), 'not enough'], [count('out'), 'out of stock'], [count('none'), 'not on the stock sheet']]
        .filter(([n]) => n).map(([n, word]) => `${n} line${n === 1 ? '' : 's'} ${word}`);
    const time = d => new Date(d).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
    const s = pageData.skuPhotoSync || {};
    const when = s.sheet_synced_at ? ` · stock sheet as of ${time(s.sheet_synced_at)}` : s.synced_at ? ` · Zoho as of ${time(s.synced_at)}` : '';
    const bad = count('short') + count('out');
    return `<p class="text-sm mt-4"><span class="stock-badge ${bad ? STOCK_CLASS.short : STOCK_CLASS.ok}">Stock</span> ${parts.length ? escapeHtml(parts.join(', ')) : 'Everything in stock'}${escapeHtml(when)}</p>`;
}

let zohoInStock = false; // the Items tab: only items with stock

function renderZohoItems({ zohoItems }) {
    if (!zohoItems) return '<p class="measure">Zoho items aren\'t set up yet: re-run supabase/schema.sql, then follow "Zoho Inventory" in the email script\'s setup notes.</p>';
    if (!zohoItems.length) return '<p class="measure">No Zoho items copied yet. Press "Get items from Zoho now", or wait for the next hourly copy.</p>';
    const hasStock = zohoItems.some(i => 'available_stock' in i) || !!(pageData.stockSheet && pageData.stockSheet.length);
    return `
        <div class="adm-toolbar">
            <div class="field adm-grow"><label for="zi-q">Search SKU, name or category</label><input id="zi-q" type="search" value="${escapeHtml(zohoQuery)}" oninput="setZohoQuery(this.value)"></div>
            ${hasStock ? `<label class="flex items-center gap-2 text-sm pb-2"><input type="checkbox"${zohoInStock ? ' checked' : ''} onchange="zohoInStock = this.checked; refreshZohoItems()"> In stock only</label>` : ''}
        </div>
        <div id="zoho-item-results">${renderZohoItemRows(zohoItems)}</div>`;
}

function setZohoQuery(value) {
    zohoQuery = value;
    refreshZohoItems();
}

function refreshZohoItems() {
    const box = document.getElementById('zoho-item-results');
    if (box && pageData && pageData.zohoItems) box.innerHTML = renderZohoItemRows(pageData.zohoItems);
}

function renderZohoItemRows(list) {
    const words = zohoQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matches = list.filter(i => words.every(w => `${i.sku} ${i.name} ${i.category}`.toLowerCase().includes(w))
        && (!zohoInStock || Number((sheetStock(i.sku) || {}).total != null ? sheetStock(i.sku).total : i.available_stock) > 0));
    const shown = matches.slice(0, ZOHO_ITEMS_SHOWN);
    const inUsd = sku => bySku(pageData.skuUsd, sku);
    if (!matches.length) return '<p class="measure">No Zoho items match.</p>';
    return `
        <p class="adm-count-line">${matches.length} item${matches.length === 1 ? '' : 's'}${matches.length > shown.length ? `, showing the first ${shown.length}: search to find the rest` : ''}</p>
        <div class="admin-table-wrap"><table class="admin-table bundle-table">
            <thead><tr><th>Photo</th><th>SKU</th><th>Name</th><th>Category</th><th>Stock</th><th><span class="sr-only">Actions</span></th></tr></thead>
            <tbody>${shown.map(i => {
                const zoho = zohoPhoto(i.sku), own = zoho ? '' : ownPhoto(i.sku);
                const sku = escapeHtml(i.sku);
                return `<tr>
                    <td><div class="flex items-center gap-3">${linePhotoThumb(zoho || own)}
                        ${!zoho && canAddSkuPhotos() ? `<span class="flex flex-col items-start gap-1">${skuPhotoButtons(i.sku, own, 'link text-xs')}</span>` : ''}</div>
                        ${own ? '<p class="text-xs text-mute mt-1">Added here</p>' : ''}</td>
                    <td class="whitespace-nowrap">${sku}</td>
                    <td>${escapeHtml(i.name)}${i.unit ? `<p class="text-xs text-mute mt-1">Unit: ${escapeHtml(i.unit)}</p>` : ''}</td>
                    <td>${escapeHtml(i.category)}</td>
                    <td class="whitespace-nowrap">${stockBadge(stockStatus(i.sku))}</td>
                    <td class="whitespace-nowrap">
                        ${inUsd(i.sku) ? '<span class="text-xs text-mute mr-3">In the USD list</span>' : `<button type="button" data-sku="${sku}" onclick="addZohoItemTo('usd', this.dataset.sku)" class="link text-xs mr-3">Add to USD list</button>`}
                        <button type="button" data-sku="${sku}" onclick="addZohoItemTo('bundles', this.dataset.sku)" class="link text-xs">Add to bundle</button>
                    </td>
                </tr>`;
            }).join('')}</tbody>
        </table></div>`;
}

// Opens a new USD SKU list row, or a new bundle line (in the build the filters show), filled in with the item
let skuUsdPrefill = null;

function addZohoItemTo(where, sku) {
    const item = zohoItem(sku) || { sku, name: '' };
    bundleEditing = skuUsdEditing = skuUsdPrefill = null;
    if (where === 'usd') {
        bundleView = 'usd';
        skuUsdEditing = 'new';
        skuUsdPrefill = { sku: item.sku, description: item.name };
    } else {
        bundleView = 'bundles';
        bundleEditing = { group: { product: bundleFilter.product || '', config: bundleFilter.config || '', type: bundleFilter.type || '', sku: item.sku, description: item.name } };
    }
    renderApp();
    const next = document.getElementById(where === 'usd' ? 'se-usd' : 'be-product');
    if (next) { next.scrollIntoView({ block: 'center' }); next.focus(); }
}

// --- Bundles, the admin's own (2026-11-18; supabase/schema.sql bundle_items, bundle_builds, bundle_options,
// bundle_option_items). Builds: pick a build and see its slots; in each slot one option can be ticked Included
// (the default, what the build comes with) and the rest are its other choices; a slot with nothing ticked is an
// upgrade. Each option lists the parts it brings and their quantities. Parts list: each part once, with its cost and
// currency, so fixing it there fixes every build. Changes save at once; the database stamps who made them ---
async function loadBundleBasis() {
    const [items, builds, options, links] = await Promise.all([
        allRows(() => sb.from('bundle_items').select('*').order('description')),
        allRows(() => sb.from('bundle_builds').select('*').order('sort')),
        allRows(() => sb.from('bundle_options').select('*').order('sort')),
        allRows(() => sb.from('bundle_option_items').select('*').order('sort'))
    ]);
    // When the bundles were last read from the team's sheet (null until schema.sql adds it)
    const sync = await rows(sb.from('bundle_sync').select('*').eq('id', 1).maybeSingle()).catch(() => null);
    return { items, builds, options, links, sync };
}

let basisBuild = null;    // the build shown (id)
let basisPartQuery = '';
let basisPartEditing = null; // an item's id, or 'new'

const basisName = b => `${b.product} · ${b.config} · ${b.type}`;
const basisItemLabel = i => `${i.sku ? i.sku + ' · ' : ''}${i.description}`;

// After a change: the four tables again, and the screen redrawn where it was
async function refreshBasis() {
    try { pageData.basis = await loadBundleBasis(); } catch (err) { showToast(`Couldn't reload: ${err.message || err}`); }
    const y = scrollY;
    renderApp();
    scrollTo(0, y);
}

async function basisWrite(query, done) {
    const { error } = await query;
    if (error) {
        showToast(/bundle_options_one_default/.test(error.message) ? 'A slot can have only one default.'
            : /violates foreign key/.test(error.message) ? 'That part is still used in a build. Remove it from the builds first.'
            : /duplicate key/.test(error.message) ? 'That already exists.' : `Not saved: ${error.message}`);
        return false;
    }
    if (done) showToast(done);
    await refreshBasis();
    return true;
}

function renderBasisBuilds({ basis }) {
    if (!basis) return '<p class="measure">The new bundles aren\'t in the database yet. Run supabase/schema.sql in the Supabase SQL Editor, then supabase/private/bundles-v2-data.sql.</p>';
    if (!basis.builds.length) return '<p class="measure">No builds yet. Run supabase/private/bundles-v2-data.sql in the Supabase SQL Editor to load them from the Bundles sheet.</p>';
    const build = basis.builds.find(b => b.id === basisBuild) || basis.builds[0];
    basisBuild = build.id;
    const items = new Map(basis.items.map(i => [i.id, i]));
    const opts = basis.options.filter(o => o.build_id === build.id);
    const slots = [];
    opts.forEach(o => { let sl = slots.find(x => x.name.toLowerCase() === o.slot.toLowerCase()); if (!sl) slots.push(sl = { name: o.slot, options: [] }); sl.options.push(o); });
    const partsOf = o => basis.links.filter(l => l.option_id === o.id).map(l => ({ ...l, item: items.get(l.item_id) })).filter(l => l.item);
    // An option's cost: dollars and pesos apart
    const optionCost = parts => {
        const sum = peso => parts.filter(p => p.item.cost != null && isPesoLine(p.item) === peso).reduce((t, p) => t + Number(p.item.cost) * Number(p.qty), 0);
        const has = peso => parts.some(p => p.item.cost != null && isPesoLine(p.item) === peso);
        return [has(false) ? formatUsd(sum(false)) : '', has(true) ? formatPhp(sum(true)) : ''].filter(Boolean).join(' + ');
    };
    const included = slots.map(sl => sl.options.find(o => o.is_default)).filter(Boolean);
    const includedParts = included.flatMap(partsOf);
    return `
        <div class="adm-toolbar">
            <div class="field adm-grow"><label for="basis-build">Build</label>
                <select id="basis-build" onchange="basisBuild = Number(this.value); renderApp()">
                    ${basis.builds.map(b => `<option value="${b.id}"${b.id === build.id ? ' selected' : ''}>${escapeHtml(basisName(b))}</option>`).join('')}
                </select></div>
            <button type="button" onclick="addBasisSlot()" class="btn btn-outline adm-toolbar-end">Add a slot</button>
        </div>
        <datalist id="basis-items">${basis.items.map(i => `<option value="${escapeHtml(basisItemLabel(i))}"></option>`).join('')}</datalist>
        ${renderBundleSync(basis.sync)}
        <p class="adm-count-line">${escapeHtml(basisName(build))}: ${slots.length} slots, ${included.length} included by default${includedParts.length ? ` · included cost ${optionCost(includedParts)}` : ''}. Tick <b>Included</b> for what the build comes with; a slot with nothing ticked is an upgrade, only added when chosen.</p>
        ${slots.map(sl => `
            <div class="basis-slot">
                <div class="basis-slot-head">
                    <h3>${escapeHtml(sl.name)}</h3>
                    <span class="basis-tag${sl.options.some(o => o.is_default) ? ' is-included' : ''}">${sl.options.some(o => o.is_default) ? 'Included' : 'Upgrade'}</span>
                    <span class="flex-1"></span>
                    ${sl.options.some(o => o.is_default) ? `<button type="button" onclick="setBasisDefault(${build.id}, ${escapeHtml(JSON.stringify(sl.name))}, null)" class="link text-xs">Make it an upgrade</button>` : ''}
                    <button type="button" onclick="addBasisOption(${build.id}, ${escapeHtml(JSON.stringify(sl.name))})" class="link text-xs">Add an option</button>
                </div>
                <div class="admin-table-wrap"><table class="admin-table basis-table">
                    <thead><tr><th scope="col">Included</th><th scope="col">Option</th><th scope="col">Parts it brings</th><th scope="col" class="text-right">Cost</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
                    <tbody>${sl.options.map(o => { const parts = partsOf(o); return `<tr${o.is_default ? ' class="is-default"' : ''}>
                        <td><input type="radio" name="def-${build.id}-${escapeHtml(sl.name)}" aria-label="Included: ${escapeHtml(o.option)}"${o.is_default ? ' checked' : ''} onchange="setBasisDefault(${build.id}, ${escapeHtml(JSON.stringify(sl.name))}, ${o.id})"></td>
                        <td class="font-semibold">${escapeHtml(o.option)}</td>
                        <td>${parts.map(p => `<div class="basis-part">
                                <span>${escapeHtml(p.item.sku || 'no SKU')} · ${escapeHtml(p.item.description)}</span>
                                <label class="basis-qty">×<input type="text" inputmode="decimal" value="${Number(p.qty)}" aria-label="Quantity" onchange="setBasisQty(${o.id}, ${p.item_id}, this.value)"></label>
                                <button type="button" onclick="removeBasisPart(${o.id}, ${p.item_id})" class="link text-xs">Remove</button>
                            </div>`).join('') || '<span class="text-mute text-xs">No parts yet</span>'}
                            <div class="basis-add"><input type="text" list="basis-items" placeholder="Add a part: SKU or name" aria-label="Add a part to ${escapeHtml(o.option)}" onchange="addBasisPart(${o.id}, this)"></div></td>
                        <td class="text-right whitespace-nowrap">${optionCost(parts)}${parts.some(p => isPesoLine(p.item)) ? LOCAL_MARK : ''}</td>
                        <td class="whitespace-nowrap"><button type="button" onclick="renameBasisOption(${o.id})" class="link text-xs mr-3">Rename</button><button type="button" onclick="deleteBasisOption(${o.id})" class="link text-xs">Delete</button></td>
                    </tr>`; }).join('')}</tbody>
                </table></div>
            </div>`).join('')}`;
}

// The sheet the bundles come from (2026-11-18): when it was last read, any problem, and a button to read it now.
// What came from the sheet is changed in the sheet: the next sync puts it back as the sheet has it
function renderBundleSync(sync) {
    if (!sync) return '';
    const when = t => t ? new Date(t).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '';
    return `<div class="bundle-sync">
        <p>${sync.synced_at ? `Read from the Bundles sheet ${when(sync.synced_at)} (${sync.options} options)` : 'Not read from the Bundles sheet yet.'}
            Changes to the bundles are made in the sheet; it's read every hour when it changes. Options added here (like the paints) are kept.</p>
        ${sync.error ? `<p class="golfer-error">${escapeHtml(sync.error)}</p>` : ''}
        ${can('bundles.view') ? '<button type="button" onclick="syncBundlesNow(this)" class="btn btn-outline min-h-[2.25rem] px-4 text-sm">Sync from the sheet now</button>' : ''}
    </div>`;
}

async function syncBundlesNow(button) {
    button.disabled = true;
    const { error } = await sb.rpc('request_bundles_sync');
    if (error) { button.disabled = false; showToast(`Not started: ${error.message}`); return; }
    showToast('Reading the Bundles sheet… this takes about a minute.');
    // The script answers within a minute or so: look again then
    setTimeout(refreshBasis, 45000);
    setTimeout(refreshBasis, 90000);
}

function basisFind(id) {
    return pageData.basis.options.find(o => o.id === id);
}

// One default per slot: the old one is cleared first (the database allows only one)
async function setBasisDefault(buildId, slot, optionId) {
    const same = pageData.basis.options.filter(o => o.build_id === buildId && o.slot.toLowerCase() === slot.toLowerCase());
    const { error } = await sb.from('bundle_options').update({ is_default: false }).in('id', same.filter(o => o.is_default).map(o => o.id));
    if (error) { showToast(`Not saved: ${error.message}`); return; }
    if (optionId == null) { await refreshBasis(); showToast(`${slot} is now an upgrade.`); return; }
    await basisWrite(sb.from('bundle_options').update({ is_default: true }).eq('id', optionId), `${basisFind(optionId).option} is now included.`);
}

async function addBasisSlot() {
    const slot = (prompt('New slot (for example Lights, Floor mat):') || '').trim();
    if (!slot) return;
    const option = (prompt(`Its first option (for example the part's name):`) || '').trim();
    if (!option) return;
    await basisWrite(sb.from('bundle_options').insert({ build_id: basisBuild, slot, option, sort: 100000 }), `${slot} added.`);
}

async function addBasisOption(buildId, slot) {
    const option = (prompt(`New option for ${slot}:`) || '').trim();
    if (!option) return;
    const last = Math.max(0, ...pageData.basis.options.filter(o => o.build_id === buildId && o.slot.toLowerCase() === slot.toLowerCase()).map(o => o.sort));
    await basisWrite(sb.from('bundle_options').insert({ build_id: buildId, slot, option, sort: last + 1 }), `${option} added.`);
}

async function renameBasisOption(id) {
    const o = basisFind(id);
    const option = (prompt('Option name:', o.option) || '').trim();
    if (!option || option === o.option) return;
    await basisWrite(sb.from('bundle_options').update({ option }).eq('id', id), 'Renamed.');
}

async function deleteBasisOption(id) {
    const o = basisFind(id);
    if (!confirm(`Delete the option "${o.option}" from ${o.slot}? Its parts stay in the parts list.`)) return;
    await basisWrite(sb.from('bundle_options').delete().eq('id', id), 'Option deleted.');
}

async function addBasisPart(optionId, input) {
    const text = input.value.trim();
    if (!text) return;
    const item = pageData.basis.items.find(i => basisItemLabel(i) === text)
        || pageData.basis.items.find(i => i.sku && i.sku.toLowerCase() === text.toLowerCase());
    if (!item) { showToast('Pick a part from the list, or add it in the Parts list first.'); return; }
    await basisWrite(sb.from('bundle_option_items').insert({ option_id: optionId, item_id: item.id, qty: 1, sort: 1000 }), `${item.description} added.`);
}

async function setBasisQty(optionId, itemId, value) {
    const qty = parseAmount(String(value));
    if (!qty || Number.isNaN(qty) || qty <= 0) { showToast('Quantity must be more than 0.'); await refreshBasis(); return; }
    await basisWrite(sb.from('bundle_option_items').update({ qty }).eq('option_id', optionId).eq('item_id', itemId));
}

async function removeBasisPart(optionId, itemId) {
    await basisWrite(sb.from('bundle_option_items').delete().eq('option_id', optionId).eq('item_id', itemId), 'Part removed from the option.');
}

// --- Parts list ---
function renderBasisParts({ basis }) {
    if (!basis) return '<p class="measure">The new bundles aren\'t in the database yet. Run supabase/schema.sql in the Supabase SQL Editor, then supabase/private/bundles-v2-data.sql.</p>';
    const used = new Map();
    basis.links.forEach(l => used.set(l.item_id, (used.get(l.item_id) || 0) + 1));
    const q = basisPartQuery.toLowerCase();
    const shown = basis.items.filter(i => !q || `${i.sku} ${i.description}`.toLowerCase().includes(q));
    const form = i => `<tr class="bundle-editing"><td colspan="6">
        <form data-no-prefill onsubmit="saveBasisPart(event, ${i.id == null ? 'null' : i.id})" class="grid sm:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div class="field"><label for="bp-sku">SKU</label><input id="bp-sku" name="sku" type="text" list="zoho-skus" autocomplete="off" value="${escapeHtml(i.sku || '')}"></div>
            <div class="field sm:col-span-2 lg:col-span-3"><label for="bp-description">Description</label><input id="bp-description" name="description" type="text" required value="${escapeHtml(i.description || '')}"></div>
            <div class="field"><label for="bp-cost">Cost</label><input id="bp-cost" name="cost" type="text" inputmode="decimal" value="${i.cost == null ? '' : Math.round(Number(i.cost) * 100) / 100}"></div>
            <div class="field"><label for="bp-currency">Currency</label><select id="bp-currency" name="currency">${[['USD', 'USD ($)'], ['PHP', 'PHP (₱), a local part']].map(([v, t]) => `<option value="${v}"${(isPesoLine(i) ? 'PHP' : 'USD') === v ? ' selected' : ''}>${t}</option>`).join('')}</select></div>
            <p class="text-xs text-mute sm:col-span-3 lg:col-span-6">Cost is per unit. A PHP cost goes into quotations as it is; a USD cost is converted with the exchange rate and freight.${i.id != null && used.get(i.id) ? ` Used in ${used.get(i.id)} option${used.get(i.id) === 1 ? '' : 's'}: a change here changes them all.` : ''}</p>
            <div class="flex gap-4 items-center sm:col-span-3 lg:col-span-6">
                <button type="submit" class="btn btn-primary min-h-[2.5rem] px-4 text-sm">${i.id == null ? 'Add part' : 'Save'}</button>
                <button type="button" onclick="basisPartEditing = null; renderApp()" class="link text-sm">Cancel</button>
            </div>
        </form></td></tr>`;
    return `
        <div class="adm-toolbar">
            <div class="field adm-grow"><label for="bp-q">Search description or SKU</label><input id="bp-q" type="search" value="${escapeHtml(basisPartQuery)}" oninput="basisPartQuery = this.value; refreshBasisParts()"></div>
            <button type="button" onclick="basisPartEditing = 'new'; renderApp()" class="btn btn-primary adm-toolbar-end">Add a part</button>
        </div>
        <div id="basis-parts">${renderBasisPartRows(shown, used, form)}</div>`;
}

function renderBasisPartRows(shown, used, form) {
    return `<p class="adm-count-line">${shown.length} part${shown.length === 1 ? '' : 's'}</p>
        <div class="admin-table-wrap"><table class="admin-table">
            <thead><tr><th scope="col">SKU</th><th scope="col">Description</th><th scope="col" class="text-right">Cost</th><th scope="col">Used in</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
            <tbody>${basisPartEditing === 'new' ? form({}) : ''}${shown.map(i => basisPartEditing === i.id ? form(i) : `<tr>
                <td class="whitespace-nowrap">${escapeHtml(i.sku || '—')}</td>
                <td>${escapeHtml(i.description)}${i.updated_by ? `<p class="text-xs text-mute mt-1">edited by ${escapeHtml(adminName(i.updated_by))}</p>` : ''}</td>
                <td class="text-right whitespace-nowrap">${formatCost(i.cost, i)}${isPesoLine(i) ? LOCAL_MARK : ''}</td>
                <td class="text-xs text-mute">${used.get(i.id) ? `${used.get(i.id)} option${used.get(i.id) === 1 ? '' : 's'}` : 'not used'}</td>
                <td class="whitespace-nowrap"><button type="button" onclick="basisPartEditing = ${i.id}; renderApp()" class="link text-xs mr-3">Edit</button><button type="button" onclick="deleteBasisPart(${i.id})" class="link text-xs">Delete</button></td>
            </tr>`).join('')}</tbody>
        </table></div>`;
}

// Typing in the search redraws the list only, so the box keeps its focus
function refreshBasisParts() {
    const box = document.getElementById('basis-parts');
    if (!box) return;
    const basis = pageData.basis, q = basisPartQuery.toLowerCase();
    const used = new Map();
    basis.links.forEach(l => used.set(l.item_id, (used.get(l.item_id) || 0) + 1));
    box.innerHTML = renderBasisPartRows(basis.items.filter(i => !q || `${i.sku} ${i.description}`.toLowerCase().includes(q)), used, () => '');
}

async function saveBasisPart(e, id) {
    e.preventDefault();
    const data = new FormData(e.target);
    const cost = parseAmount(String(data.get('cost') || ''));
    if (Number.isNaN(cost)) { showToast('Cost must be a number.'); return; }
    const part = { sku: String(data.get('sku') || '').trim(), description: String(data.get('description') || '').trim(), cost,
        currency: data.get('currency') === 'PHP' ? 'PHP' : 'USD' };
    if (!part.description) { showToast('A part needs a description.'); return; }
    basisPartEditing = null;
    await basisWrite(id == null ? sb.from('bundle_items').insert(part) : sb.from('bundle_items').update(part).eq('id', id), id == null ? 'Part added.' : 'Part saved.');
}

async function deleteBasisPart(id) {
    const i = pageData.basis.items.find(x => x.id === id);
    if (!confirm(`Delete "${i.description}" from the parts list?`)) return;
    await basisWrite(sb.from('bundle_items').delete().eq('id', id), 'Part deleted.');
}

function renderAdminBundles(data) {
    const views = [['builds', 'Builds'], ['parts', 'Parts list'], ['bundles', 'Old bundles'], ['usd', 'USD SKU list'], ['zoho', 'Zoho items']];
    const counts = { builds: data.basis && data.basis.builds.length, parts: data.basis && data.basis.items.length, bundles: data.bundles && data.bundles.length, usd: data.skuUsd && data.skuUsd.length, zoho: data.zohoItems && data.zohoItems.length };
    return `
        ${renderSkuPhotoSync(data)}
        <!-- The SKU fields suggest Zoho items: type a SKU or part of a name -->
        <datalist id="zoho-skus">${(data.zohoItems || []).map(i => `<option value="${escapeHtml(i.sku)}" label="${escapeHtml(i.name)}"></option>`).join('')}</datalist>
        <div class="bundle-parts mb-5" role="group" aria-label="Show">
            ${views.map(([id, label]) => `<button type="button" aria-pressed="${bundleView === id}" onclick="showBundleView('${id}')">${label}${counts[id] != null ? `<small>${counts[id].toLocaleString('en-PH')}</small>` : ''}</button>`).join('')}
        </div>
        ${bundleView === 'builds' ? renderBasisBuilds(data) : bundleView === 'parts' ? renderBasisParts(data) : bundleView === 'usd' ? renderSkuUsd(data) : bundleView === 'zoho' ? renderZohoItems(data) : renderBundles(data)}`;
}

function showBundleView(view) {
    bundleView = view;
    bundleEditing = skuUsdEditing = skuUsdPrefill = null;
    renderApp();
}

let skuUsdQuery = '';
let skuUsdEditing = null; // a SKU row's sheet_row, or 'new'

function renderSkuUsd({ skuUsd }) {
    if (!skuUsd) return '<p class="measure">The USD SKU list isn\'t in the database yet. Re-run supabase/schema.sql in the Supabase SQL Editor, then supabase/private/bundles-data.sql.</p>';
    if (!skuUsd.length) return '<p class="measure">No USD SKU list loaded yet. Run supabase/private/bundles-data.sql in the Supabase SQL Editor.</p>';
    return `
        <div class="adm-toolbar">
            <div class="field adm-grow"><label for="su-q">Search description or SKU</label><input id="su-q" type="search" value="${escapeHtml(skuUsdQuery)}" oninput="setSkuUsdQuery(this.value)"></div>
            <button type="button" onclick="editSkuUsd('new')" class="btn btn-primary adm-toolbar-end">Add a SKU</button>
        </div>
        <div id="sku-usd-results">${renderSkuUsdRows(skuUsd)}</div>`;
}

function refreshSkuUsd() {
    const box = document.getElementById('sku-usd-results');
    if (box && pageData && pageData.skuUsd) box.innerHTML = renderSkuUsdRows(pageData.skuUsd);
}

function setSkuUsdQuery(value) {
    skuUsdQuery = value;
    refreshSkuUsd();
}

// Like the bundles: Edit opens the row in place, Add a SKU puts a new row at the top; saves go to the database
function renderSkuUsdRows(list) {
    const q = skuUsdQuery.trim().toLowerCase();
    const shown = list.filter(s => !q || `${s.description || ''} ${s.sku || ''}`.toLowerCase().includes(q));
    return `
        <p class="adm-count-line">${shown.length} SKU${shown.length === 1 ? '' : 's'}</p>
        ${shown.length || skuUsdEditing === 'new' ? `<div class="admin-table-wrap"><table class="admin-table bundle-table">
            <thead><tr><th>Photo</th><th>SKU</th><th>Description</th><th class="text-right">USD</th><th><span class="sr-only">Actions</span></th></tr></thead>
            <tbody>
                ${skuUsdEditing === 'new' ? renderSkuUsdForm(skuUsdPrefill || {}) : ''}
                ${shown.map(s => skuUsdEditing === s.sheet_row ? renderSkuUsdForm(s) : `<tr>
                    <td>${zohoPhoto(s.sku) || ownPhoto(s.sku) ? linePhotoThumb(zohoPhoto(s.sku) || ownPhoto(s.sku)) : (st => linePhotoThumb(st.photo, st.swatch))(skuStandIn(s.sku))}</td>
                    <td class="whitespace-nowrap">${escapeHtml(s.sku)}</td>
                    <td>${escapeHtml(s.description)}${s.source === 'admin' || s.updated_by ? `<p class="text-xs text-mute mt-1">${s.source === 'admin' ? 'added' : 'edited'}${s.updated_by ? ` by ${escapeHtml(adminName(s.updated_by))}` : ''}</p>` : ''}</td>
                    <td class="text-right whitespace-nowrap">${formatUsd(s.usd)}</td>
                    <td class="whitespace-nowrap"><button type="button" onclick="editSkuUsd(${s.sheet_row})" class="link text-xs mr-3">Edit</button><button type="button" onclick="deleteSkuUsd(${s.sheet_row})" class="link text-xs">Delete</button></td>
                </tr>`).join('')}
            </tbody>
        </table></div>` : '<p class="measure">No SKUs match.</p>'}`;
}

function renderSkuUsdForm(s) {
    const isNew = s.sheet_row == null;
    return `<tr class="bundle-editing"><td colspan="5">
        <form data-no-prefill onsubmit="saveSkuUsd(event, ${isNew ? 'null' : s.sheet_row})" class="grid sm:grid-cols-[12rem_1fr_10rem] gap-4 items-end">
            <p class="text-sm font-semibold text-ink sm:col-span-3">${isNew ? 'New SKU' : 'Edit SKU'}</p>
            <div class="field"><label for="se-sku">SKU</label><input id="se-sku" name="sku" type="text" list="zoho-skus" autocomplete="off" oninput="previewSkuPhoto(this)" value="${escapeHtml(s.sku || '')}"></div>
            <div class="field"><label for="se-description">Description</label><input id="se-description" name="description" type="text" value="${escapeHtml(s.description || '')}"></div>
            <div class="field"><label for="se-usd">USD</label><input id="se-usd" name="usd" type="text" inputmode="decimal" value="${s.usd == null ? '' : Math.round(Number(s.usd) * 100) / 100}"></div>
            ${skuPhotoField(s.sku, 'sm:col-span-3')}
            <p class="text-xs text-mute sm:col-span-3">Changing a USD cost here doesn't change the bundles' costs; those are edited on the Bundles list.</p>
            <p id="sku-usd-error" class="golfer-error sm:col-span-3" role="alert"></p>
            <div class="flex gap-4 items-center sm:col-span-3">
                <button type="submit" class="btn btn-primary min-h-[2.5rem] px-4 text-sm">${isNew ? 'Add SKU' : 'Save'}</button>
                <button type="button" onclick="editSkuUsd(null)" class="link text-sm">Cancel</button>
            </div>
        </form>
    </td></tr>`;
}

function editSkuUsd(sheetRow) {
    if (sheetRow !== 'new') skuUsdPrefill = null;
    skuUsdEditing = sheetRow;
    refreshSkuUsd();
    const first = document.getElementById('se-sku');
    if (first) first.focus();
}

async function saveSkuUsd(e, sheetRow) {
    e.preventDefault();
    const data = new FormData(e.target);
    const text = key => { const v = String(data.get(key) || '').trim(); return v === '' ? null : v; };
    const row = { sku: text('sku'), description: text('description'), usd: parseAmount(String(data.get('usd') || '')) };
    if (Number.isNaN(row.usd)) { document.getElementById('sku-usd-error').textContent = 'USD must be a number.'; return; }
    if (!row.sku && !row.description) { document.getElementById('sku-usd-error').textContent = 'Enter a SKU or a description.'; return; }
    const button = e.target.querySelector('button[type="submit"]');
    button.disabled = true;
    const query = sheetRow == null
        ? sb.from('sku_usd').insert({ ...row, source: 'admin', sheet_row: Math.max(0, ...pageData.skuUsd.map(s => s.sheet_row)) + 1 }).select().single()
        : sb.from('sku_usd').update(row).eq('sheet_row', sheetRow).select().single();
    const { data: saved, error } = await query;
    button.disabled = false;
    if (error) { document.getElementById('sku-usd-error').textContent = `Not saved: ${error.message}`; return; }
    if (sheetRow == null) pageData.skuUsd.unshift(saved);
    else pageData.skuUsd = pageData.skuUsd.map(s => s.sheet_row === sheetRow ? saved : s);
    skuUsdEditing = skuUsdPrefill = null;
    refreshSkuUsd();
    showToast(sheetRow == null ? 'SKU added.' : 'SKU saved.');
}

async function deleteSkuUsd(sheetRow) {
    const s = pageData.skuUsd.find(x => x.sheet_row === sheetRow);
    if (!s || !confirm(`Delete ${s.sku || s.description}? This can't be undone.`)) return;
    const { error } = await sb.from('sku_usd').delete().eq('sheet_row', sheetRow);
    if (error) { showToast(`Not deleted: ${error.message}`); return; }
    pageData.skuUsd = pageData.skuUsd.filter(x => x.sheet_row !== sheetRow);
    refreshSkuUsd();
    showToast('SKU deleted.');
}

function renderBundles({ bundles }) {
    if (!bundles) return '<p class="measure">The bundles table isn\'t in the database yet. Re-run supabase/schema.sql in the Supabase SQL Editor, then supabase/private/bundles-data.sql.</p>';
    if (!bundles.length) return '<p class="measure">No bundles loaded yet. Run supabase/private/bundles-data.sql in the Supabase SQL Editor.</p>';
    const options = (key, label, valueOf = b => b[key]) => {
        const values = [...new Set(bundles.map(valueOf).filter(Boolean))];
        return `<div class="field"><label for="bf-${key}">${label}</label>
            <select id="bf-${key}" onchange="setBundleFilter('${key}', this.value)">
                <option value="">All</option>${values.map(v => `<option${v === bundleFilter[key] ? ' selected' : ''}>${escapeHtml(v)}</option>`).join('')}
            </select></div>`;
    };
    // Build: a product, config and type together, as the groups are headed (e.g. Golfcarts · 4 seater · Golfer)
    return `
        <div class="adm-toolbar">
            <div class="field adm-grow"><label for="bf-q">Search description or SKU</label><input id="bf-q" type="search" value="${escapeHtml(bundleFilter.q)}" oninput="setBundleFilter('q', this.value)"></div>
            ${options('build', 'Build', bundleGroupName)}${options('product', 'Product')}${options('config', 'Config')}${options('type', 'Type')}
            <button type="button" onclick="addBundleLine(null)" class="btn btn-primary adm-toolbar-end">Add a line</button>
        </div>
        <div class="bundle-parts" role="group" aria-label="Part">
            ${BUNDLE_PARTS.map(([id, label]) => `<button type="button" aria-pressed="${bundleFilter.part === id}" onclick="setBundlePart('${id}')">${label}</button>`).join('')}
        </div>
        <div id="bundle-results">${renderBundleResults(bundles)}</div>`;
}

function refreshBundleResults() {
    const box = document.getElementById('bundle-results');
    if (box && pageData && pageData.bundles) box.innerHTML = renderBundleResults(pageData.bundles);
}

function setBundleFilter(key, value) {
    bundleFilter[key] = value;
    refreshBundleResults();
}

function setBundlePart(part) {
    document.querySelectorAll('.bundle-parts[aria-label="Part"] button').forEach((b, i) => b.setAttribute('aria-pressed', String(BUNDLE_PARTS[i][0] === part)));
    setBundleFilter('part', part);
}

function renderBundleResults(bundles) {
    const q = bundleFilter.q.trim().toLowerCase();
    const shown = bundles.filter(b => ['product', 'config', 'type'].every(k => !bundleFilter[k] || b[k] === bundleFilter[k])
        && (!bundleFilter.build || bundleGroupName(b) === bundleFilter.build)
        && (!bundleFilter.part || (b.part || '').trim().toLowerCase() === bundleFilter.part)
        && (!q || `${b.description || ''} ${b.sku || ''} ${b.part || ''} ${b.color || ''}`.toLowerCase().includes(q)));
    const groups = new Map();
    shown.forEach(b => {
        const key = bundleGroupName(b);
        if (!groups.has(key)) groups.set(key, { sample: b, lines: [] });
        groups.get(key).lines.push(b);
    });
    // A new line being added shows in its group even when the filters hide everything else
    if (bundleEditing && bundleEditing.group && !groups.has(bundleGroupName(bundleEditing.group))) groups.set(bundleGroupName(bundleEditing.group), { sample: bundleEditing.group, lines: [] });
    if (!groups.size) return '<p class="measure">No lines match.</p>';
    // The lines' total in USD, once any of them has a cost
    // The lines' totals once any has a cost: dollars and pesos apart (never added together)
    const cost = lines => {
        const sum = peso => lines.filter(b => b.cost_usd != null && isPesoLine(b) === peso).reduce((t, b) => t + (bundleLineUsd(b) || 0), 0);
        const has = peso => lines.some(b => b.cost_usd != null && isPesoLine(b) === peso);
        return [has(false) ? formatUsd(sum(false)) : '', has(true) ? formatPhp(sum(true)) : ''].filter(Boolean).map(t => ` · ${t}`).join('');
    };
    const cols = 9;
    return `
        <p class="adm-count-line">${shown.length} line${shown.length === 1 ? '' : 's'} in ${groups.size} group${groups.size === 1 ? '' : 's'}${cost(shown)}</p>
        <div class="admin-table-wrap"><table class="admin-table bundle-table">
            ${[...groups].map(([name, { sample, lines }]) => `<tbody>
                <tr class="bundle-group"><th colspan="${cols}">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <span class="flex flex-wrap items-center gap-2">${renderBundleTags(sample, name)}</span>
                        <button type="button" data-group="${escapeHtml(name)}" onclick="addBundleLine(this.dataset.group)" class="link text-xs">Add a line here</button>
                    </div>
                </th></tr>
                <tr class="bundle-columns"><th scope="col">Photo</th><th scope="col">SKU</th><th scope="col">Part</th><th scope="col">Option</th><th scope="col">Description</th><th scope="col" class="text-right">Qty</th><th scope="col" class="text-right" title="USD, or pesos for a local part (marked Local ₱)">Cost</th><th scope="col" class="text-right">Total</th><th scope="col"><span class="sr-only">Actions</span></th></tr>
                ${lines.map(b => bundleEditing === b.sheet_row ? renderBundleForm(b, cols) : renderBundleLine(b)).join('')}
                ${bundleEditing && bundleEditing.group && bundleGroupName(bundleEditing.group) === name ? renderBundleForm(bundleEditing.group, cols) : ''}
            </tbody>`).join('')}
        </table></div>`;
}

// A group's heading: its product, config and type, each as its own labelled tag
function renderBundleTags(sample, name) {
    const tags = [['Product', sample.product], ['Config', sample.config], ['Type', sample.type]].filter(([, v]) => v);
    if (!tags.length) return `<span>${escapeHtml(name)}</span>`;
    return tags.map(([label, value]) => `<span class="bundle-tag"><small>${label}</small>${escapeHtml(value)}</span>`).join('');
}

function renderBundleLine(b) {
    const extra = Object.entries(b.extra || {});
    const edited = b.source === 'admin' ? 'added' : b.updated_by ? 'edited' : '';
    return `<tr>
        <td>${linePhotoThumb(bundleLinePhoto(b), bundleSwatch(b))}</td>
        <td class="whitespace-nowrap">${escapeHtml(b.sku)}</td>
        <td>${escapeHtml(b.part)}</td>
        <td>${escapeHtml(b.color)}</td>
        <td>${escapeHtml(b.description)}${extra.length ? `<p class="text-xs text-mute mt-1">${extra.map(([col, cell]) => `${col}: ${escapeHtml(bundleExtraText(cell))}`).join(' · ')}</p>` : ''}${edited ? `<p class="text-xs text-mute mt-1">${edited}${b.updated_by ? ` by ${escapeHtml(adminName(b.updated_by))}` : ''}</p>` : ''}</td>
        <td class="text-right">${b.qty == null ? '' : Number(b.qty)}</td>
        <td class="text-right whitespace-nowrap">${formatCost(b.cost_usd, b)}${isPesoLine(b) ? LOCAL_MARK : ''}</td>
        <td class="text-right whitespace-nowrap">${formatCost(bundleLineUsd(b), b)}</td>
        <td class="whitespace-nowrap"><button type="button" onclick="editBundleLine(${b.sheet_row})" class="link text-xs mr-3">Edit</button><button type="button" onclick="deleteBundleLine(${b.sheet_row})" class="link text-xs">Delete</button></td>
    </tr>`;
}

// The edit form for a line, or for a new line (no sheet_row yet), across the whole table row
function renderBundleForm(b, cols) {
    const isNew = b.sheet_row == null;
    return `<tr class="bundle-editing"><td colspan="${cols}">
        <form data-no-prefill onsubmit="saveBundleLine(event, ${isNew ? 'null' : b.sheet_row})" class="grid sm:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <p class="text-sm font-semibold text-ink sm:col-span-3 lg:col-span-6">${isNew ? 'New line' : 'Edit line'}</p>
            ${BUNDLE_FIELDS.map(([key, label]) => key === 'currency' ? `<div class="field"><label for="be-currency">Currency</label><select id="be-currency" name="currency">${[['USD', 'USD ($)'], ['PHP', 'PHP (₱), a local part']].map(([v, t]) => `<option value="${v}"${(isPesoLine(b) ? 'PHP' : 'USD') === v ? ' selected' : ''}>${t}</option>`).join('')}</select></div>` : `<div class="field${key === 'description' ? ' sm:col-span-3 lg:col-span-3' : ''}"><label for="be-${key}">${label}</label>
                <input id="be-${key}" name="${key}" type="text"${key === 'sku' ? ' list="zoho-skus" autocomplete="off" oninput="previewSkuPhoto(this)"' : ''}${key === 'qty' || key === 'cost_usd' ? ' inputmode="decimal"' : ''} value="${escapeHtml(b[key] == null ? '' : key === 'cost_usd' ? Math.round(Number(b[key]) * 100) / 100 : key === 'qty' ? Number(b[key]) : b[key])}"></div>`).join('')}
            ${skuPhotoField(b.sku, 'sm:col-span-3 lg:col-span-6')}
            ${b.cost_usd_formula ? `<p class="text-xs text-mute sm:col-span-3 lg:col-span-6">In the sheet this cost came from ${escapeHtml(b.cost_usd_formula)}. Cost is per unit; the total is cost × qty.</p>` : ''}
            <p class="text-xs text-mute sm:col-span-3 lg:col-span-6">A PHP cost goes into quotations as it is; a USD cost is converted with the exchange rate and freight.</p>
            <p id="bundle-error" class="golfer-error sm:col-span-3 lg:col-span-6" role="alert"></p>
            <div class="flex gap-4 items-center sm:col-span-3 lg:col-span-6">
                <button type="submit" class="btn btn-primary min-h-[2.5rem] px-4 text-sm">${isNew ? 'Add line' : 'Save'}</button>
                <button type="button" onclick="cancelBundleEdit()" class="link text-sm">Cancel</button>
            </div>
        </form>
    </td></tr>`;
}

function editBundleLine(sheetRow) {
    bundleEditing = sheetRow;
    refreshBundleResults();
    const first = document.getElementById('be-sku');
    if (first) first.focus();
}

// A new line, filled in with the product, config and type of the group it's added to (or of the filters)
function addBundleLine(groupName) {
    const sample = (groupName && pageData.bundles.find(b => bundleGroupName(b) === groupName)) || {};
    bundleEditing = { group: { product: sample.product || bundleFilter.product || '', config: sample.config || bundleFilter.config || '', type: sample.type || bundleFilter.type || '' } };
    refreshBundleResults();
    const first = document.getElementById('be-sku');
    if (first) first.focus();
}

function cancelBundleEdit() {
    bundleEditing = null;
    refreshBundleResults();
}

// "$1,234.50" or "1234.5" -> 1234.5; blank -> null; anything else -> NaN
function parseAmount(text) {
    const t = text.trim().replace(/[$₱,\s]|USD/gi, '');
    return t === '' ? null : Number(t);
}

async function saveBundleLine(e, sheetRow) {
    e.preventDefault();
    const data = new FormData(e.target);
    const line = {};
    BUNDLE_FIELDS.forEach(([key]) => { const v = String(data.get(key) || '').trim(); line[key] = v === '' ? null : v; });
    line.currency = String(line.currency || '').toUpperCase() === 'PHP' ? 'PHP' : 'USD';
    for (const key of ['qty', 'cost_usd']) {
        line[key] = parseAmount(line[key] || '');
        if (Number.isNaN(line[key])) { document.getElementById('bundle-error').textContent = `${key === 'qty' ? 'Qty' : 'Cost'} must be a number.`; return; }
    }
    const button = e.target.querySelector('button[type="submit"]');
    button.disabled = true;
    const query = sheetRow == null
        ? sb.from('bundles').insert({ ...line, source: 'admin', sheet_row: Math.max(0, ...pageData.bundles.map(b => b.sheet_row)) + 1 }).select().single()
        : sb.from('bundles').update(line).eq('sheet_row', sheetRow).select().single();
    const { data: saved, error } = await query;
    button.disabled = false;
    if (error) { document.getElementById('bundle-error').textContent = `Not saved: ${error.message}`; return; }
    if (sheetRow == null) pageData.bundles.push(saved);
    else pageData.bundles = pageData.bundles.map(b => b.sheet_row === sheetRow ? saved : b);
    bundleEditing = null;
    refreshBundleResults();
    showToast(sheetRow == null ? 'Line added.' : 'Line saved.');
}

async function deleteBundleLine(sheetRow) {
    const b = pageData.bundles.find(x => x.sheet_row === sheetRow);
    if (!b || !confirm(`Delete "${b.description || b.part || 'this line'}"? This can't be undone.`)) return;
    const { error } = await sb.from('bundles').delete().eq('sheet_row', sheetRow);
    if (error) { showToast(`Not deleted: ${error.message}`); return; }
    pageData.bundles = pageData.bundles.filter(x => x.sheet_row !== sheetRow);
    refreshBundleResults();
    showToast('Line deleted.');
}

// --- Quotations: a priced offer for a quote request, built from the bundle for the request's model and build.
// A sales manager prepares it (prices are USD x rate x (1 + freight) x (1 + margin), and any line can be typed
// over), submits it; a master admin approves it or returns it with a note; then it is emailed to the customer as a
// PDF by the email script (google-apps-script/golfcarts-mail.gs), as are the notices for each step. The database's workflow trigger decides
// which step each role may take ---
const QUOTATION_STATUS_LABELS = { draft: 'Draft', submitted: 'Waiting for approval', approved: 'Approved', returned: 'Returned', sent: 'Sent' };
const QUOTATION_VAT = 0.12; // prices include 12% VAT; costs are net of it
const QUOTATION_TERMS = 'Prices are in Philippine pesos (PHP) and include 12% VAT. This quotation is valid for 15 days from its date. Delivery lead time is confirmed on order.';
// The builder's categories as the bundles name them
const BUNDLE_PRODUCTS = { 'The Golfer': 'Golfcarts', 'Lifestyle & Private Use': 'Lifestyle' };
// Parts a build always carries, whatever was chosen; and parts where exactly one choice applies, matched to a row of the request
const BUNDLE_ALWAYS = new Set(['unit', '2+2 kit', 'stretch kit']);
const BUNDLE_CHOICE_ROWS = { body: 'Body color', seat: 'Seat', canopy: 'Canopy', battery: 'Battery' };
const MATCH_STOPWORDS = new Set(['with', 'and', 'the', 'for', 'of', 'in', 'on', 'kit', 'unit', 'set', 'gc', 'cc', 'club', 'car']);
// The builder and the bundles name some things differently
// (and the sheet's own spellings: 5 pannel, Chome inserts, Kaken tire)
const MATCH_SYNONYMS = { grey: 'gray', cleaner: 'washer', headlight: 'light', taillight: 'light', panel: 'pannel', chrome: 'chome', kraken: 'kaken' };
// Parts matched against their own row of the request (the builder's group of that title, app.js
// getTempoOptionGroups), not all of it: one best option, and any other the row names in full that isn't part of
// it (8in rims bring their wheel cover; Side Mirror + 5 pannel doesn't bring Side Mirror too). Choosing Triton wheels must not bring the Hela line too because both say 12in. Multi parts
// take every option the row names. No row: the part wasn't chosen.
const BUNDLE_PART_ROWS = {
    wheel: ['Wheels and tires'], '14in wheel': ['Wheels and tires'], windshield: ['Windshield'], mirror: ['Mirrors'],
    'steeing wheel': ['Steering wheel'], light: ['Lighting'], 'bag cover': ['Bag cover'], 'accessories 1': ['Sand bottle'],
    'accessories 2': ['Golf accessory, left side'], 'accessories 3': ['Golf accessory, right side'], 'caddy stand': ['Caddy stand'],
    'add-on': ['Audio', 'Audio and storage'], charger: ['Charging'], 'speed code': ['Speed code'], floormat: ['Floor mat'],
    'lift kit upgrade': ['Lift kit']
};
const BUNDLE_MULTI_PARTS = new Set(['add-on']);
// Parts whose option is made of several pieces (front and rear body, seat back and bottom), all of them needed
const BUNDLE_MULTIPIECE = new Set(['body', 'seat']);

let quotationOpen = null;   // the id of the quotation shown in the editor
let quotationDraft = null;  // its working copy while it's edited

function rowValue(rows, label) {
    const row = (rows || []).find(([k]) => k === label);
    return row ? String(row[1]) : '';
}

// Words to match on: lower case, inch sizes as "8in", plurals as singulars, filler words dropped
// Names the builder and the bundles write differently as whole phrases (2026-11-18): "GC floor mat" is the bundle's
// "GC Premium Floormat", "Apple CarPlay" its "Club Car Overhead Entertainment Carplay"
const MATCH_PHRASES = [[/floor\s*mat/g, 'floormat'], [/apple\s+carplay/g, 'overhead entertainment carplay']];

// The words a Body / Seat / Canopy / Battery choice's name may have around the colour or type itself (2026-11-18):
// "Classic Premium Seat Camello" is the option "Camello", "4 Pass Onward Canopy White" is "2+2 White", "Battlite
// lithium" is "Lithium". Everything else in the name must be in the option's name too, and the other way round
const CHOICE_FILLER = {
    body: ['body', 'panel', 'color', 'colour'],
    seat: ['classic', 'premium', 'seat', 'front', 'rear', 'bench', 'cushion'],
    canopy: ['pass', 'passenger', 'canopy', 'onward', '2+2', '4+2', 'top'],
    battery: ['battery', 'battlite', 'trojan', '8v', '48v', 'lead', 'acid', 'deep', 'cycle', '100ah', 'ion', 'upgrade']
};
function choiceCore(part, text) {
    // The filler written the way matchWords writes words ("pass" becomes "pas", as plurals lose their s)
    const filler = new Set(matchWords((CHOICE_FILLER[part] || []).join(' ')));
    return [...new Set(matchWords(text).filter(w => !filler.has(w)))].sort().join(' ');
}

function matchWords(text) {
    return MATCH_PHRASES.reduce((t, [re, to]) => t.replace(re, to), String(text || '').toLowerCase()).replace(/(\d+)\s*(?:"|''|in\b|inch(?:es)?\b)/g, '$1in')
        .split(/[^a-z0-9+]+/).filter(w => w.length >= 2 && !MATCH_STOPWORDS.has(w)).map(w => w.replace(/(?<=[a-z]{3})s$/, ''))
        .map(w => MATCH_SYNONYMS[w] || w);
}

// How much of a name appears in the text: the share of its words found (0 to 1), and how many (to prefer the
// more specific of two full matches, e.g. "Tsunami Gray" over "Gray")
function matchScore(name, text) {
    const have = new Set(matchWords(text));
    const words = matchWords(name);
    const found = words.filter(w => have.has(w)).length;
    return { share: words.length ? found / words.length : 0, found };
}

function betterMatch(a, b) {
    return a.share - b.share || a.found - b.found;
}

// The bundle group for a request: its model page (category and seats) and the build it chose, e.g. Golfcarts · 2 seater · Scratch
function bundleGroupForQuote(quote) {
    const product = PRODUCTS_DATA.find(p => p.slug === quote.slug)
        || PRODUCTS_DATA.find(p => `${p.name} (${categoryLabel(p.category)})` === quote.model);
    const build = rowValue(quote.rows, 'Build');
    if (!product || !product.layout || !build || !BUNDLE_PRODUCTS[product.category]) return null;
    return [BUNDLE_PRODUCTS[product.category], `${product.layout} seater`, build].join(' · ');
}

// The bundle lines a request's build points at: the parts it always carries, the one Body / Seat / Canopy / Battery
// option its choices name, and any other option its choices mention. Returns the lines and the choice parts it
// couldn't match, for the person preparing it to pick
function suggestBundleLines(quote, group, bundles) {
    const groupLines = bundles.filter(b => bundleGroupName(b) === group);
    const parts = new Map();
    groupLines.forEach(b => {
        const part = (b.part || '').trim();
        if (!parts.has(part)) parts.set(part, new Map());
        const options = parts.get(part), option = (b.color || '').trim();
        if (!options.has(option)) options.set(option, []);
        options.get(option).push(b);
    });
    // Matched against what was chosen, not the questions: "Ball and club cleaner or cooler" must not pick the cooler
    const choiceLabels = new Set(Object.values(BUNDLE_CHOICE_ROWS));
    const otherText = (quote.rows || []).filter(([k]) => !choiceLabels.has(k) && k !== 'Model' && k !== 'Build').map(r => r[1]).join(' ');
    const picked = [], unmatched = [], missing = [];
    for (const [part, options] of parts) {
        const key = part.toLowerCase();
        // A build with one canopy (the 4 and 4+2 canopy set) carries it, whatever the request calls it
        if (BUNDLE_ALWAYS.has(key) || (key === 'canopy' && options.size === 1)) {
            options.forEach(lines => picked.push(...lines));
            continue;
        }
        if (BUNDLE_PART_ROWS[key]) {
            const own = BUNDLE_PART_ROWS[key].map(label => rowValue(quote.rows, label)).filter(Boolean).join(' ');
            if (!own) continue;
            const scored = [...options].map(([option, lines]) => { const name = matchWords(option).length ? option : lines[0].description; return { option, lines, words: matchWords(name), score: matchScore(name, own) }; });
            const best = scored.reduce((a, x) => (!a || betterMatch(x.score, a.score) > 0 ? x : a), null);
            if (!best || best.score.share < 0.5) continue; // e.g. the 14in part when a 12in wheel was chosen
            const chosen = BUNDLE_MULTI_PARTS.has(key) ? scored.filter(x => x.score.share >= 0.5) : scored.filter(x => x === best || (x.score.share === 1 && !x.words.every(w => best.words.includes(w))));
            chosen.forEach(x => picked.push(...x.lines));
            continue;
        }
        const target = BUNDLE_CHOICE_ROWS[key] ? rowValue(quote.rows, BUNDLE_CHOICE_ROWS[key]) : otherText;
        // A Body / Seat / Canopy / Battery choice takes only the option of the same name (2026-11-18): never the nearest
        // one ("Chameleon (7 colors) Green Blue" is not "Green"). Not there: a line with the choice as it was made,
        // without a SKU or price, to be filled in (missing), so the quotation says what the customer chose
        if (BUNDLE_CHOICE_ROWS[key]) {
            if (!target || /^standard$/i.test(target.trim())) { unmatched.push(part); continue; }
            const same = [...options].find(([option]) => choiceCore(key, option) && choiceCore(key, option) === choiceCore(key, target));
            if (same) picked.push(...same[1]);
            else missing.push(missingLine(part, target));
            continue;
        }
        // An option is matched by its name, or by its description when its name has no words to match (e.g. "8in" does)
        const scored = [...options].map(([option, lines]) => {
            const name = matchWords(option).length ? option : lines[0].description;
            return { option, lines, words: matchWords(name), score: matchScore(name, target) };
        });
        const best = scored.reduce((a, s) => (!a || betterMatch(s.score, a.score) > 0 ? s : a), null);
        if (!best || best.score.share < 0.5) {
            if (BUNDLE_CHOICE_ROWS[key]) unmatched.push(part);
            continue;
        }
        // A choice part takes its one best option. Others also take any other option that matches, unless it's a
        // variant of the best one (8in rims bring their wheel cover; Sand bottle doesn't bring Sand bottle 2pcs)
        const chosen = BUNDLE_CHOICE_ROWS[key] ? [best] : scored.filter(s => s === best
            || (s.score.share >= 0.5 && !best.words.every(w => s.words.includes(w))));
        for (const s of chosen) {
            if (s.lines.length === 1 || BUNDLE_MULTIPIECE.has(key)) { picked.push(...s.lines); continue; }
            // Several different items under one option (e.g. three light kits): the one whose description matches best, if one does
            const byDescription = s.lines.map(l => ({ l, score: matchScore(l.description, target) })).sort((a, b) => betterMatch(b.score, a.score));
            if (betterMatch(byDescription[0].score, byDescription[1].score) > 0) picked.push(byDescription[0].l);
            else unmatched.push(`${part} (${s.lines.length} choices)`);
        }
    }
    // An upgrade chosen in the builder that nothing in this build's bundle answers (a 14" wheel the bundle doesn't carry,
    // a floor mat on a build without one): its line too, as chosen, to be filled in. "None", "Standard", "No
    // headlight" and the like aren't choices
    const pickedParts = new Set(picked.map(b => (b.part || '').trim().toLowerCase()));
    const labels = new Map();
    Object.entries(BUNDLE_PART_ROWS).forEach(([p, ls]) => ls.forEach(l => labels.set(l, [...(labels.get(l) || []), p])));
    for (const [label, partsFor] of labels) {
        const value = rowValue(quote.rows, label);
        if (!value || /^(none|no\b|standard|not included|included\b)/i.test(value.trim())) continue;
        if (!partsFor.some(p => pickedParts.has(p))) missing.push(missingLine(label, value));
    }
    missing.forEach(m => unmatched.push(`${m.part}: ${m.description} (not in the bundles; add its SKU and price)`));
    picked.sort((a, b) => a.sheet_row - b.sheet_row);
    return { lines: [...picked.map(bundleToQuotationLine), ...missing], unmatched };
}

// A quotation's lines from the bundles (2026-11-18, the builder following the bundles). With the admin's own bundles
// loaded (Builds tab): the options the request chose by id (body, seat, canopy, battery) take exactly their parts;
// the other choices (upgrades, until they carry ids too) are matched by name as before; and every slot with an
// Included option the request didn't choose another for takes that one, so the build's standard parts are always in.
// Without them, the old sheet lines as before
function quotationBundleLines(quote, group) {
    const basis = pageData.basis;
    const build = group && basis && basis.builds.find(b => bundleGroupName(b) === group);
    if (!build) return group && pageData.bundles ? suggestBundleLines(quote, group, pageData.bundles) : { lines: [], unmatched: [] };
    // The build's options as lines (the shape the old sheet lines had)
    const items = new Map(basis.items.map(i => [i.id, i]));
    const lines = [];
    basis.options.filter(o => o.build_id === build.id).forEach(o => basis.links.filter(l => l.option_id === o.id).forEach((l, k) => {
        const it = items.get(l.item_id);
        if (it) lines.push({ sheet_row: o.id * 1000 + k, product: build.product, config: build.config, type: build.type, part: o.slot, color: o.option,
            description: it.description, sku: it.sku, qty: Number(l.qty), cost_usd: it.cost == null ? null : Number(it.cost), currency: it.currency,
            option_id: o.id, is_default: o.is_default });
    }));
    const slotOf = l => String(l.part || '').trim().toLowerCase();
    // A slot's answer to a row of the request: the wheels and the 14in wheels answer the same "Wheels and tires"
    const rowKey = p => (BUNDLE_PART_ROWS[p] || [BUNDLE_CHOICE_ROWS[p] || p]).join('|');
    const ids = new Set((quote.bundle_options || []).map(Number));
    const direct = lines.filter(l => ids.has(l.option_id));
    // An option chosen that has no parts yet (a paint added to the builder before its SKU and cost): its line as
    // chosen, to be filled in
    const empty = basis.options.filter(o => o.build_id === build.id && ids.has(o.id) && !lines.some(l => l.option_id === o.id));
    const chosenSlots = new Set([...direct.map(slotOf), ...empty.map(o => String(o.slot).trim().toLowerCase())]);
    const rows = (quote.rows || []).filter(([k]) => ![...chosenSlots].some(s => BUNDLE_CHOICE_ROWS[s] === k || (BUNDLE_PART_ROWS[s] || []).includes(k)));
    const res = suggestBundleLines({ ...quote, rows }, group, lines.filter(l => !chosenSlots.has(slotOf(l))));
    const answered = new Set([...direct, ...res.lines.filter(l => !l.missing)].map(l => rowKey(slotOf(l))));
    empty.forEach(o => answered.add(rowKey(String(o.slot).trim().toLowerCase())));
    // A choice kept as chosen (not in the bundles) answers its row too: the Included one doesn't go in beside it
    res.lines.filter(l => l.missing).forEach(l => {
        const p = Object.keys(BUNDLE_CHOICE_ROWS).find(k => BUNDLE_CHOICE_ROWS[k] === l.part || k === slotOf(l));
        answered.add(rowKey(p || slotOf(l)));
        Object.entries(BUNDLE_PART_ROWS).forEach(([k, ls]) => { if (ls.includes(l.part)) answered.add(rowKey(k)); });
    });
    const defaults = lines.filter(l => l.is_default && !answered.has(rowKey(slotOf(l))));
    defaults.forEach(l => answered.add(rowKey(slotOf(l))));
    const out = [...direct, ...defaults].map(bundleToQuotationLine);
    const picked = res.lines.filter(l => !l.missing), missing = [...empty.map(o => missingLine(o.slot, o.option)), ...res.lines.filter(l => l.missing)];
    empty.forEach(o => res.unmatched.push(`${o.slot}: ${o.option} (no parts in the bundles yet; add its SKU and price)`));
    const all = [...out, ...picked].sort((x, y) => x.sheet_row - y.sheet_row);
    // Choice parts the request didn't name ("Standard") are answered by the defaults: not a thing to check
    const unmatched = res.unmatched.filter(u => !(BUNDLE_CHOICE_ROWS[String(u).toLowerCase()] && answered.has(rowKey(String(u).toLowerCase()))));
    return { lines: [...all, ...missing], unmatched };
}

// A choice the bundles don't have, as the customer made it: no SKU, cost or price until someone adds them
function missingLine(part, value) {
    return { sheet_row: null, sku: '', part, option: value, description: value, qty: 1, cost_usd: null, price_php: null, manual: false, missing: true };
}

// Body and seat lines are always Qty 1 (2026-11-17): a colour picked is its pair of SKUs (front and rear panel, seat
// back and bottom), one of each, whatever Qty the Bundles sheet has; sales types more for a second bench. Other
// parts (wheels x4, batteries x6, two sand bottles) keep the sheet's Qty
const BUNDLE_QTY_ONE = new Set(['body', 'seat']);

function bundleToQuotationLine(b) {
    const qty = BUNDLE_QTY_ONE.has(String(b.part || '').trim().toLowerCase()) || b.qty == null ? 1 : Number(b.qty);
    return { sheet_row: b.sheet_row, sku: b.sku || '', part: b.part || '', option: b.color || '', description: b.description || '',
        qty, cost_usd: b.cost_usd == null ? null : Number(b.cost_usd), ...(isPesoLine(b) ? { currency: 'PHP' } : {}), price_php: null, manual: false };
}

// A line's peso cost (USD x rate x (1 + freight), net of VAT), to the centavo, and its unit selling price, VAT
// inclusive (2026-11-16): the margin is the gross profit on the price net of VAT, so price = cost / (1 - margin) x 1.12,
// to the centavo, as on the team's sheet (no rounding to hundreds, which moved the GP off the one entered); none at
// 100% or more
// A local part's cost is in pesos already (currency PHP, 2026-11-17): no exchange rate and no import freight
function quotationCostPhp(qt, line) {
    if (line.cost_usd == null) return null;
    if (isPesoLine(line)) return Math.round(Number(line.cost_usd) * 100) / 100;
    return Math.round(Number(line.cost_usd) * Number(qt.exchange_rate) * (1 + Number(qt.freight_pct) / 100) * 100) / 100;
}

function quotationFormulaPrice(qt, line) {
    const cost = quotationCostPhp(qt, line);
    const margin = Number(qt.margin_pct) / 100;
    return cost == null || !(margin < 1) ? null : Math.round(cost / (1 - margin) * (1 + QUOTATION_VAT) * 100) / 100;
}

// Lines priced by the formula follow the quotation's rate, freight and margin; typed prices stay as typed
function repriceQuotation(qt) {
    qt.lines = qt.lines.map(l => (l.manual ? l : { ...l, price_php: quotationFormulaPrice(qt, l) }));
    return qt;
}

// The price per cart rounded up to the next hundred pesos (2026-11-16, the "Rounded" line on the team's sheet)
function roundedPrice(exact) {
    return Math.ceil(Math.round(exact * 100) / 10000 - 1e-9) * 100;
}

function quotationTotals(qt) {
    const perCartExact = qt.lines.reduce((s, l) => s + Number(l.price_php || 0) * Number(l.qty == null ? 1 : l.qty), 0);
    const cost = qt.lines.reduce((s, l) => s + Number(quotationCostPhp(qt, l) || 0) * Number(l.qty == null ? 1 : l.qty), 0);
    const units = Number(qt.units || 1), discount = Number(qt.discount_php || 0), totalCost = cost * units;
    // As on the team's sheet: the exact total (VAT inclusive) and its GP, net of VAT; then the total the customer pays,
    // the price per cart rounded up to the next hundred pesos. Approval goes by the exact GP, as the database does
    const perCart = roundedPrice(perCartExact), exact = perCartExact * units - discount, total = perCart * units - discount;
    const net = exact / (1 + QUOTATION_VAT), vat = exact - net, gp = net - totalCost;
    return { perCart, perCartExact, cost, units, discount, exact, total, net, vat, totalCost, gp, margin: net ? gp / net * 100 : 0, unpriced: qt.lines.filter(l => l.price_php == null).length };
}

// Approval by margin (the margin hierarchy for carts, 2026-11-11): under 15%, the GM; 15 to 25%, the sales manager or
// the GM; over 25%, the Sales Executive, so submitting approves it. The database (quotation_approvers in
// supabase/schema.sql) sets and enforces it; the admin shows it
const QUOTATION_GM = 'jamesugarte@sjkguahan.com';
const QUOTATION_SALES_MANAGER = 'jerusvergara@sjkguahan.com';

function quotationApprovers(margin) {
    return margin < 15 ? [QUOTATION_GM] : margin <= 25 ? [QUOTATION_SALES_MANAGER, QUOTATION_GM] : [];
}

function approverNames(list) {
    return list.map(e => e === QUOTATION_GM ? 'James (GM)' : e === QUOTATION_SALES_MANAGER ? 'Jerus (sales manager)' : adminName(e)).join(' or ');
}

// Whether the signed-in person may approve or return this quotation now
function approvesQuotation(qt) {
    const admin = currentAdmin();
    return !!admin && qt.status === 'submitted' && (qt.approvers || []).includes(admin.email);
}

function formatPhp(n) {
    return n == null ? '' : '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// The photo of the request's model and build for the PDF, as the original file on the website (the built site
// also has a .webp copy beside each photo; the PDF needs the JPEG or PNG)
function quotationPhoto(quote) {
    const product = PRODUCTS_DATA.find(p => p.slug === quote.slug);
    if (!product) return '';
    const set = getProductBuildSet(product);
    const level = set && set.builds.find(b => b.name === rowValue(quote.rows, 'Build'));
    const photo = (level && product.buildPhotos && product.buildPhotos[level.id]) || product.image || '';
    return photo.replace(/\.webp$/i, '');
}

// From a quote request: a draft quotation priced with today's settings, with the lines its build points at
async function prepareQuotation(quoteId) {
    const quote = pageData.quotes.find(q => q.id === quoteId);
    const pricing = pageData.pricing;
    if (!quote || !pricing) { showToast('Quotations aren\'t set up in the database yet. Re-run supabase/schema.sql.'); return; }
    const group = bundleGroupForQuote(quote);
    const suggested = quotationBundleLines(quote, group);
    const draft = repriceQuotation({
        quote_id: quote.id, reference: quote.reference,
        customer: { name: quote.name, email: quote.email, phone: quote.phone, branch: quote.branch },
        // "Golfer 2 · Scratch Golfer": the build as the site names it
        title: [rowValue(quote.rows, 'Model') || quote.model, (b => { const level = Object.values(TEMPO_LINES).flatMap(l => l.levels).find(l => l.name === b); return level ? buildLabel(level) : b; })(rowValue(quote.rows, 'Build'))].filter(Boolean).join(' · '),
        build_rows: quote.rows || [], build_group: group, units: Math.max(1, parseInt(quote.quantity, 10) || 1), lines: suggested.lines,
        exchange_rate: pricing.exchange_rate, freight_pct: pricing.freight_pct, margin_pct: pricing.margin_pct, terms: QUOTATION_TERMS,
        notes: quote.notes || '', photo: quotationPhoto(quote)
    });
    if ('warranty' in pricing) Object.assign(draft, { pdf_extra: quotationPdfExtra(draft), warranty: pricing.warranty || '' });
    const { data: saved, error } = await sb.from('quotations').insert(draft).select().single();
    if (error) { showToast(`The quotation could not be created: ${error.message}`); return; }
    pageData.quotations.unshift(saved);
    showToast(group
        ? `Draft quotation created from ${group}${suggested.unmatched.length ? `. Check: ${suggested.unmatched.join(', ')}` : ''}.`
        : 'Draft quotation created. No bundle matches this model; add its lines by hand.');
    openQuotation(saved.id);
}

function openQuotation(id) {
    const qt = pageData.quotations.find(x => x.id === id);
    if (!qt) return;
    quotationOpen = id;
    quotationDraft = JSON.parse(JSON.stringify(qt));
    adminTab = 'quotations';
    renderApp();
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
    loadQuotationEmails(id);
}

function closeQuotation() {
    quotationOpen = null;
    quotationDraft = null;
    renderApp();
}

function renderAdminQuotations(data) {
    if (!data.quotations || !data.pricing) return '<p class="measure">Quotations aren\'t in the database yet. Re-run supabase/schema.sql in the Supabase SQL Editor.</p>';
    if (quotationOpen && data.quotations.some(x => x.id === quotationOpen)) return renderQuotationEditor(data);
    const p = data.pricing;
    // The pipeline's filter: Draft includes the returned ones
    const list = data.quotations.filter(qt => !quotationFilter || qt.status === quotationFilter || (quotationFilter === 'draft' && qt.status === 'returned'));
    return `
        <form data-no-prefill onsubmit="savePricingSettings(event)" class="admin-card grid sm:grid-cols-4 gap-5 items-end max-w-4xl mb-10">
            <div class="sm:col-span-4">
                <h2 class="type-md text-ink">Pricing</h2>
                <p class="text-sm text-mute mt-1">A line's price is USD cost × exchange rate × (1 + freight) × (1 + margin), rounded to the nearest ₱100. Accounting sets the rate and freight; new quotations take them and keep them. The salesman chooses each quotation's margin.${p.updated_by ? ` Last changed by ${escapeHtml(adminName(p.updated_by))}.` : ''}</p>
            </div>
            ${[['exchange_rate', 'Exchange rate (₱ per $1)'], ['freight_pct', 'Freight %']].map(([key, label]) => `
                <div class="field"><label for="ps-${key}">${label}</label><input id="ps-${key}" name="${key}" type="text" inputmode="decimal" value="${Number(p[key])}"${can('pricing.edit') ? '' : ' disabled'}></div>`).join('')}
            ${'warranty' in p ? `<div class="field sm:col-span-4"><label for="ps-warranty">Warranty (page 2 of every quotation PDF)</label>
                <textarea id="ps-warranty" name="warranty" rows="4" placeholder="e.g. 2 years on the battery, 1 year on the motor and controller…"${can('pricing.edit') ? '' : ' disabled'}>${escapeHtml(p.warranty)}</textarea>
                <p class="text-xs text-mute mt-1">A quotation picks this up when it's next saved.</p></div>` : ''}
            ${can('pricing.edit') ? '<button type="submit" class="btn btn-primary min-h-[3rem] px-5 text-sm">Save pricing</button>' : '<p class="text-xs text-mute">Set by accounting (the price manager).</p>'}
        </form>
        <h2 class="type-md text-ink mb-4">Quotations</h2>
        ${list.length ? `<div class="admin-table-wrap"><table class="admin-table">
            <thead><tr><th>Reference</th><th>Customer</th><th>Build</th><th class="text-right">Total</th><th>Status</th><th>Updated</th><th><span class="sr-only">Open</span></th></tr></thead>
            <tbody>${list.map(qt => `<tr>
                <td class="whitespace-nowrap">${escapeHtml(qt.reference)}</td>
                <td>${escapeHtml((qt.customer || {}).name)}</td>
                <td>${escapeHtml(qt.title)}</td>
                <td class="text-right whitespace-nowrap">${formatPhp(quotationTotals(qt).total)}</td>
                <td><span class="quotation-status quotation-${qt.status}">${QUOTATION_STATUS_LABELS[qt.status]}</span></td>
                <td class="text-xs text-mute whitespace-nowrap">${qt.updated_at ? `${formatShortDate(qt.updated_at)} · ${escapeHtml(adminName(qt.updated_by))}` : ''}</td>
                <td><button type="button" onclick="openQuotation(${qt.id})" class="link text-xs">Open</button></td>
            </tr>`).join('')}</tbody>
        </table></div>` : (quotationFilter ? '<p class="measure">No quotations at this stage.</p>' : `<p class="measure">No quotations yet.${can('quotations.prepare') ? ' In Quote requests, choose <b>Prepare quotation</b> on a request.' : ' Sales managers prepare them from the quote requests.'}</p>`)}`;
}

async function savePricingSettings(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const values = {};
    for (const key of ['exchange_rate', 'freight_pct']) {
        values[key] = parseAmount(String(data.get(key) || ''));
        if (values[key] == null || Number.isNaN(values[key]) || values[key] < 0) { showToast('Enter numbers for the rate and freight.'); return; }
    }
    if (data.has('warranty')) values.warranty = String(data.get('warranty')).trim();
    const { data: saved, error } = await sb.from('pricing_settings').update(values).eq('id', 1).select().single();
    if (error) { showToast(`Not saved: ${error.message}`); return; }
    pageData.pricing = saved;
    renderApp();
    showToast('Pricing saved. New quotations use it.');
}

// The editor: the customer and build, the priced lines, and the steps this quotation can take next
function renderQuotationEditor(data) {
    const qt = quotationDraft;
    const saved = data.quotations.find(x => x.id === qt.id);
    // The price manager reviews a quotation as it was submitted, and doesn't change it
    const prepares = can('quotations.prepare');
    const editable = prepares && (qt.status === 'draft' || qt.status === 'returned');
    const t = quotationTotals(qt);
    const c = qt.customer || {};
    const groupLines = qt.build_group && data.bundles ? data.bundles.filter(b => bundleGroupName(b) === qt.build_group) : [];
    const inQuote = new Set(qt.lines.map(l => l.sheet_row).filter(Boolean));
    const groups = data.bundles ? [...new Set(data.bundles.filter(b => b.product && b.product !== 'competitor').map(bundleGroupName))] : [];
    const dirty = JSON.stringify(qt) !== JSON.stringify(saved);
    const num = (field, value, attrs = '') => editable
        ? `<input type="text" inputmode="decimal" value="${value == null ? '' : value}" onchange="${field}" class="quotation-num" ${attrs}>`
        : (value == null ? '' : value);
    return `
        <p><button type="button" onclick="closeQuotation()" class="link text-sm">← All quotations</button></p>
        <div class="flex flex-wrap items-start justify-between gap-6 mt-6">
            <div>
                <p class="text-sm text-mute">Quotation ${escapeHtml(qt.reference)}</p>
                <h2 class="type-lg text-ink mt-1">${escapeHtml(qt.title || 'Quotation')}</h2>
                <p class="text-sm mt-2">${escapeHtml(c.name)} · <a class="link" href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a> · ${escapeHtml(c.phone)}${c.branch ? ` · ${escapeHtml(c.branch)}` : ''}</p>
            </div>
            <div class="text-right">
                <span class="quotation-status quotation-${qt.status}">${QUOTATION_STATUS_LABELS[qt.status]}</span>
                <p class="text-xs text-mute mt-2">${[qt.prepared_by && `Prepared by ${adminName(qt.prepared_by)}`, qt.submitted_by && `submitted by ${adminName(qt.submitted_by)}`,
                    qt.reviewed_by && `${qt.status === 'returned' ? 'returned' : 'approved'} by ${adminName(qt.reviewed_by)}`, qt.sent_by && `sent by ${adminName(qt.sent_by)} ${formatShortDate(qt.sent_at)}`].filter(Boolean).map(escapeHtml).join(' · ')}</p>
            </div>
        </div>
        ${qt.review_note && (qt.status === 'returned' || qt.status === 'draft') ? `<p class="quotation-note mt-6"><b>Returned by ${escapeHtml(adminName(qt.reviewed_by))}:</b> ${escapeHtml(qt.review_note)}</p>` : ''}

        <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-8">
            <div class="field lg:col-span-2"><label for="qe-group">Bundle</label>
                <select id="qe-group" onchange="setQuotationGroup(this.value)"${editable ? '' : ' disabled'}>
                    <option value="">None</option>${groups.map(g => `<option${g === qt.build_group ? ' selected' : ''}>${escapeHtml(g)}</option>`).join('')}
                </select></div>
            <div class="field"><span class="text-sm">Exchange rate</span><p>${qt.exchange_rate} <span class="text-xs text-mute">set by accounting</span></p></div>
            <div class="field"><span class="text-sm">Freight %</span><p>${qt.freight_pct} <span class="text-xs text-mute">set by accounting</span></p></div>
            <div class="field"><label for="qe-margin">GP %</label>${editable ? `<input id="qe-margin" type="text" inputmode="decimal" value="${qt.margin_pct}" onchange="setQuotationNumber('margin_pct', this.value)">` : `<p>${qt.margin_pct}</p>`}</div>
        </div>
        ${editable && qt.build_group ? `<p class="text-sm mt-3"><button type="button" onclick="rebuildQuotationLines()" class="link">Fill lines from this bundle again</button> <span class="text-mute">(replaces the lines below with the ones the request's build points at)</span></p>` : ''}

        <div class="admin-table-wrap mt-6"><table class="admin-table bundle-table">
            <thead><tr><th>SKU</th><th>Part</th><th>Option</th><th>Description</th><th title="Shown with its own price in the PDF. The other lines are one package price.">Upgrade</th><th class="text-right">Qty</th><th title="Stock on hand on the team's stock sheet (all branches), against qty x number of carts">Stock</th><th class="text-right" title="USD, or pesos for a local part (marked Local ₱)">Cost</th><th class="text-right" title="In pesos: a USD cost x rate x (1 + freight); a local part's as it is">Cost (₱)</th><th class="text-right">Price (₱)</th><th class="text-right">Amount (₱)</th>${editable ? '<th><span class="sr-only">Remove</span></th>' : ''}</tr></thead>
            <tbody>${qt.lines.map((l, i) => `<tr>
                <td class="whitespace-nowrap">${escapeHtml(l.sku)}</td>
                <td>${escapeHtml(l.part)}</td>
                <td>${escapeHtml(l.option)}</td>
                <td>${escapeHtml(l.description)}${l.missing ? '<p class="golfer-error text-xs">Not in the bundles: add its SKU and price</p>' : ''}</td>
                <td class="text-center">${editable ? `<input type="checkbox" onchange="setQuotationUpgrade(${i}, this.checked)" aria-label="Upgrade"${l.upgrade ? ' checked' : ''}>` : (l.upgrade ? 'Yes' : '')}</td>
                <td class="text-right">${num(`setQuotationLine(${i}, 'qty', this.value)`, l.qty)}</td>
                <td class="whitespace-nowrap">${stockBadge(stockStatus(l.sku, stockNeeded(qt, l)))}</td>
                <td class="text-right whitespace-nowrap">${formatCost(l.cost_usd, l)}${isPesoLine(l) ? LOCAL_MARK : ''}</td>
                <td class="text-right whitespace-nowrap text-mute">${formatPhp(quotationCostPhp(qt, l))}</td>
                <td class="text-right whitespace-nowrap">${editable ? num(`setQuotationLine(${i}, 'price_php', this.value)`, l.price_php) : formatPhp(l.price_php)}${l.manual ? `<p class="text-xs text-mute">typed${editable ? ` · <button type="button" onclick="useFormulaPrice(${i})" class="link">use formula</button>` : ''}</p>` : ''}${l.price_php == null ? '<p class="golfer-error text-xs">No price</p>' : ''}</td>
                <td class="text-right whitespace-nowrap">${formatPhp(Number(l.price_php || 0) * Number(l.qty == null ? 1 : l.qty))}</td>
                ${editable ? `<td><button type="button" onclick="removeQuotationLine(${i})" class="link text-xs">Remove</button></td>` : ''}
            </tr>`).join('') || `<tr><td colspan="12" class="text-mute">No lines yet.</td></tr>`}</tbody>
        </table></div>
        ${editable && QUOTATION_ADD_LINES ? `<div class="flex flex-wrap gap-4 items-end mt-4">
            <div class="field grow max-w-2xl"><label for="qe-add">Add a line from the bundle</label>
                <select id="qe-add" onchange="addQuotationLine(this.value)">
                    <option value="">Choose…</option>
                    ${groupLines.filter(b => !inQuote.has(b.sheet_row)).map(b => `<option value="${b.sheet_row}">${escapeHtml([b.part, b.color, b.description].filter(Boolean).join(' · '))}</option>`).join('')}
                </select></div>
            <button type="button" onclick="addQuotationLine('blank')" class="btn btn-outline min-h-[3rem] px-4 text-sm">Add a blank line</button>
        </div>` : ''}

        <div class="grid lg:grid-cols-2 gap-8 mt-8">
            <div class="grid gap-5">
                <div class="field"><label for="qe-notes">Notes for the customer</label><textarea id="qe-notes" rows="3" onchange="setQuotationText('notes', this.value)"${editable ? '' : ' disabled'}>${escapeHtml(qt.notes)}</textarea></div>
                <div class="field"><label for="qe-terms">Terms</label><textarea id="qe-terms" rows="3" onchange="setQuotationText('terms', this.value)"${editable ? '' : ' disabled'}>${escapeHtml(qt.terms)}</textarea></div>
            </div>
            <dl class="quotation-totals">
                <div><dt>Price per cart</dt><dd>${formatPhp(t.perCart)}</dd></div>
                <div><dt>Number of carts</dt><dd>${editable ? `<input type="text" inputmode="numeric" value="${qt.units}" onchange="setQuotationNumber('units', this.value)" class="quotation-num" aria-label="Number of carts">` : qt.units}</dd></div>
                <div><dt>Discount</dt><dd>${editable ? `<input type="text" inputmode="decimal" value="${Number(qt.discount_php)}" onchange="setQuotationNumber('discount_php', this.value)" class="quotation-num" aria-label="Discount in pesos">` : `− ${formatPhp(qt.discount_php)}`}</dd></div>
                <div class="text-mute"><dt>Landed cost</dt><dd>${formatPhp(t.totalCost)}</dd></div>
                <div class="text-mute"><dt>GP %</dt><dd>${t.total ? `${t.margin.toFixed(2)}% · ${formatPhp(t.gp)}` : ''}</dd></div>
                <div class="text-mute"><dt>Net of VAT</dt><dd>${formatPhp(t.net)}</dd></div>
                <div class="text-mute"><dt>Add VAT 12%</dt><dd>${formatPhp(t.vat)}</dd></div>
                <div class="text-mute"><dt>Total (VAT inclusive)</dt><dd>${formatPhp(t.exact)}</dd></div>
                <div class="quotation-total"><dt>Rounded</dt><dd>${formatPhp(t.total)}</dd></div>
            </dl>
        </div>
        ${stockSummary(qt)}
        <p class="text-sm mt-4"><b>Approval:</b> ${escapeHtml(quotationApprovalText(qt, t))}</p>
        ${t.unpriced ? `<p class="golfer-error mt-4">${t.unpriced} line${t.unpriced === 1 ? ' has' : 's have'} no price yet.</p>` : ''}

        <div class="quotation-actions mt-8">
            ${editable ? `<button type="button" onclick="saveQuotation()" class="btn btn-outline min-h-[2.75rem] px-5 text-sm"${dirty ? '' : ' disabled'}>Save draft</button>
                <button type="button" onclick="saveQuotation('submitted')" class="btn btn-primary min-h-[2.75rem] px-5 text-sm"${t.unpriced || !qt.lines.length ? ' disabled' : ''}>${quotationApprovers(t.margin).length ? 'Submit for approval' : 'Submit (approved straight away)'}</button>` : ''}
            ${approvesQuotation(qt) ? `
                <button type="button" onclick="reviewQuotation('approved')" class="btn btn-primary min-h-[2.75rem] px-5 text-sm">Approve</button>
                <button type="button" onclick="reviewQuotation('returned')" class="btn btn-outline min-h-[2.75rem] px-5 text-sm">Return with a note</button>` : ''}
            ${qt.status === 'submitted' && !approvesQuotation(qt) ? `<p class="text-sm text-mute">Waiting for ${escapeHtml(approverNames(qt.approvers || []) || 'approval')} to approve it.</p>` : ''}
            ${(qt.status === 'draft' || qt.status === 'returned') && !prepares ? '<p class="text-sm text-mute">A sales manager is still preparing it.</p>' : ''}
            ${qt.status === 'approved' && prepares ? `<button type="button" onclick="sendQuotation()" class="btn btn-primary min-h-[2.75rem] px-5 text-sm">Send to ${escapeHtml(c.email || 'the customer')}</button>` : ''}
            ${qt.status !== 'approved' && qt.status !== 'sent' && prepares ? `<button type="button" onclick="sendNotApproved()" aria-disabled="true" class="btn btn-primary min-h-[2.75rem] px-5 text-sm opacity-50 cursor-not-allowed">Send to ${escapeHtml(c.email || 'the customer')}</button>` : ''}
            ${qt.status === 'approved' && !prepares ? '<p class="text-sm text-mute">Approved. The sales manager sends it to the customer.</p>' : ''}
            ${(qt.status === 'submitted' || qt.status === 'approved') && prepares ? `<button type="button" onclick="reopenQuotation()" class="link text-sm">Edit (needs approval again)</button>` : ''}
            <button type="button" onclick="previewQuotation()" class="btn btn-outline min-h-[2.75rem] px-5 text-sm">Preview PDF</button>
            ${qt.status === 'approved' || qt.status === 'sent' ? '<button type="button" onclick="downloadPss()" class="btn btn-outline min-h-[2.75rem] px-5 text-sm">PSS.xlsx</button>' : ''}
            ${canDeleteQuotation(qt) ? `<button type="button" onclick="deleteQuotation()" class="link text-sm">Delete</button>` : ''}
        </div>
        ${dirty && editable ? '<p class="text-xs text-mute mt-3">Unsaved changes. The PDF preview shows the last saved version.</p>' : ''}
        ${renderQuotationEmails(qt)}`;
}

// Who approves it: for a draft, at its margin now; once submitted, as the database set it
function quotationApprovalText(qt, t) {
    if (qt.status === 'draft' || qt.status === 'returned') {
        const list = quotationApprovers(t.margin);
        return list.length ? `at ${t.margin.toFixed(1)}% gross profit, ${approverNames(list)} approves it.` : `over 25% gross profit: approved when you submit it.`;
    }
    if (qt.status === 'submitted') return `waiting for ${approverNames(qt.approvers || [])}.`;
    if (!(qt.approvers || []).length && qt.reviewed_by === qt.submitted_by) return `approved on submit by ${adminName(qt.reviewed_by)} (margin over 25%).`;
    return `approved by ${adminName(qt.reviewed_by)}.`;
}

// "Add a line from the bundle" and "Add a blank line" under a quotation's lines: hidden for now (the user's choice,
// 2026-11-11). true brings them back
const QUOTATION_ADD_LINES = false;

function setQuotationNumber(key, text) {
    const value = parseAmount(text);
    if (value == null || Number.isNaN(value) || value < 0 || (key === 'units' && (value < 1 || !Number.isInteger(value)))) { showToast('Enter a number.'); renderApp(); return; }
    quotationDraft[key] = value;
    if (key === 'margin_pct') repriceQuotation(quotationDraft);
    renderApp();
}

function setQuotationText(key, text) {
    quotationDraft[key] = text;
    renderApp();
}

function setQuotationLine(i, key, text) {
    const value = parseAmount(text);
    if (Number.isNaN(value) || (value != null && value < 0)) { showToast('Enter a number.'); renderApp(); return; }
    const line = { ...quotationDraft.lines[i], [key]: value };
    if (key === 'price_php') line.manual = value != null;
    quotationDraft.lines[i] = line;
    renderApp();
}

function setQuotationUpgrade(i, on) {
    quotationDraft.lines[i] = { ...quotationDraft.lines[i], upgrade: on };
    renderApp();
}

function useFormulaPrice(i) {
    const line = { ...quotationDraft.lines[i], manual: false };
    line.price_php = quotationFormulaPrice(quotationDraft, line);
    quotationDraft.lines[i] = line;
    renderApp();
}

function removeQuotationLine(i) {
    quotationDraft.lines.splice(i, 1);
    renderApp();
}

function addQuotationLine(value) {
    if (!value) return;
    if (value === 'blank') {
        const part = prompt('Part (e.g. Add-on)') || '';
        const description = prompt('Description') || '';
        if (!part && !description) return;
        // Lines added after the bundle's are upgrades: priced on their own in the PDF
        quotationDraft.lines.push({ sheet_row: null, sku: '', part, option: '', description, qty: 1, cost_usd: null, price_php: null, manual: true, upgrade: true });
    } else {
        const b = pageData.bundles.find(x => x.sheet_row === Number(value));
        if (!b) return;
        const line = { ...bundleToQuotationLine(b), upgrade: true };
        line.price_php = quotationFormulaPrice(quotationDraft, line);
        quotationDraft.lines.push(line);
    }
    renderApp();
}

function setQuotationGroup(group) {
    quotationDraft.build_group = group || null;
    renderApp();
}

function rebuildQuotationLines() {
    if (quotationDraft.lines.length && !confirm('Replace the lines with the ones the request\'s build points at?')) return;
    const quote = pageData.quotes.find(q => q.id === quotationDraft.quote_id) || { rows: quotationDraft.build_rows, slug: null };
    const suggested = quotationBundleLines(quote, quotationDraft.build_group);
    quotationDraft.lines = suggested.lines;
    repriceQuotation(quotationDraft);
    renderApp();
    if (suggested.unmatched.length) showToast(`Check: ${suggested.unmatched.join(', ')}`);
}

// The quotation's content as the database stores it
function quotationContent(qt) {
    const { customer, title, build_rows, build_group, units, lines, exchange_rate, freight_pct, margin_pct, discount_php, notes, terms } = qt;
    return { customer, title, build_rows, build_group, units, lines, exchange_rate, freight_pct, margin_pct, discount_php, notes, terms };
}

// The PDF's pages 2 and 3 as they should be now (once schema.sql has added their columns): the model's specifications,
// the warranty from the pricing settings, and upgrades the model can take, with page 3 drawn as one picture
// (pdf_extra.page3, below). Not part of the content, so storing them doesn't send an approved quotation back to draft;
// a sent one keeps what it was sent with.
async function quotationPdfFields(qt) {
    if (!('pdf_extra' in qt) || qt.status === 'sent') return {};
    const pdf_extra = quotationPdfExtra(qt);
    // Page 3's picture is drawn again only when what's on it changed; if it can't be drawn, the PDF has its plain page 3
    // PAGE3_DESIGN: raise it when the page's design or the cart cut-outs change, so every page 3 is drawn again
    const key = JSON.stringify([PAGE3_DESIGN, qt.reference, qt.photo, pdf_extra.offers.map(o => [o.group, o.name, o.image])]);
    const before = qt.pdf_extra || {};
    if (before.page3 && before.page3Key === key) Object.assign(pdf_extra, { page3: before.page3, page3Key: key });
    else if (pdf_extra.offers.length) {
        try {
            pdf_extra.page3 = await saveQuotationPage3(qt, await drawQuotationPage3(qt, pdf_extra.offers));
            pdf_extra.page3Key = key;
        } catch (err) {
            console.warn('Page 3 not drawn:', err);
            showToast(`Page 3 picture not made (${err.message}); the PDF uses the plain page 3.`);
        }
    }
    return { pdf_extra, warranty: (pageData.pricing && pageData.pricing.warranty) || '' };
}

// --- The quotation PDF's page 3 (2026-11-12), drawn here as one A4 picture, because the PDF converter in the email
// script keeps text and pictures but drops every background. On the designer's background (image/pdf/page3-bg.jpg):
// the logo and quotation number, the headline, the customer's cart standing on the golf course (its cut-out from
// scripts/pdf-carts.mjs), the upgrades on eight white cards, the "More from" bubble and the company line. No date:
// the picture is made when the quotation is saved, and page 1 carries the date it's sent ---
const PAGE3_DESIGN = 2; // 2: cleaner cart cut-outs (2026-11-12)
const PAGE3 = { w: 1240, h: 1754, margin: 70, slate: '#4E6276', ink: '#151714', mute: '#6B6C64', green: '#749E35' };

function loadPageImage(src) {
    return new Promise(resolve => {
        if (!src) { resolve(null); return; }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => { console.warn('Page 3: picture did not load:', src); resolve(null); };
        img.src = src;
    });
}

// The cart's cut-out, named as scripts/pdf-carts.mjs names it
function cartCutoutPath(photo) {
    const slug = String(photo || '').replace(/^\/?image\//i, '').replace(/\.[a-z0-9]+$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return slug ? `image/pdf/cart/${slug}.webp` : '';
}

// Words onto lines no wider than width
function pageLines(ctx, text, width) {
    const lines = [];
    let line = '';
    String(text || '').split(/\s+/).filter(Boolean).forEach(word => {
        const next = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; } else line = next;
    });
    if (line) lines.push(line);
    return lines;
}

function pageRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// A picture inside a box, whole and centred (contain)
function pageFit(ctx, img, x, y, w, h, align = 'center') {
    const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    ctx.drawImage(img, x + (w - dw) / 2, align === 'bottom' ? y + h - dh : y + (h - dh) / 2, dw, dh);
}

async function drawQuotationPage3(qt, offers) {
    const { w: W, h: H, margin: M } = PAGE3;
    const serif = '"Newsreader Variable", Georgia, serif', sans = '"Instrument Sans Variable", Arial, sans-serif';
    await Promise.all([`800 64px ${serif}`, `700 36px ${sans}`, `400 20px ${sans}`].map(f => document.fonts.load(f).catch(() => null)));
    const [bg, logo, cutout, photo, ...offerImages] = await Promise.all([
        loadPageImage('image/pdf/page3-bg.jpg'), loadPageImage('image/GCPH_logo.png'), loadPageImage(cartCutoutPath(qt.photo)),
        loadPageImage(qt.photo), ...offers.map(o => loadPageImage(o.image))]);
    if (!bg) throw new Error('the page 3 background (image/pdf/page3-bg.jpg) did not load');
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    // The background, covering the sheet
    const s = Math.max(W / bg.naturalWidth, H / bg.naturalHeight);
    ctx.drawImage(bg, (W - bg.naturalWidth * s) / 2, 0, bg.naturalWidth * s, bg.naturalHeight * s);

    // The header: logo, "UPGRADES & ACCESSORIES" and the quotation number, and a green rule
    if (logo) pageFit(ctx, logo, M, 48, 150, 74);
    ctx.textAlign = 'right';
    ctx.fillStyle = PAGE3.ink;
    ctx.font = `700 25px ${sans}`;
    ctx.letterSpacing = '2px';
    ctx.fillText('UPGRADES & ACCESSORIES', W - M, 84);
    ctx.letterSpacing = '0px';
    ctx.font = `400 19px ${sans}`;
    ctx.fillStyle = '#3D403B';
    ctx.fillText(`Quotation ${qt.reference}`, W - M, 112);
    ctx.fillStyle = PAGE3.green;
    ctx.fillRect(M + 300, 132, W - 2 * M - 300, 5);

    // The headline and its words
    ctx.textAlign = 'left';
    ctx.fillStyle = PAGE3.ink;
    ctx.font = `800 70px ${serif}`;
    ctx.fillText('ELEVATE YOUR RIDE', M, 238);
    ctx.font = `700 38px ${sans}`;
    ctx.fillText('TRANSFORM YOUR CART', M, 296);
    ctx.fillText('INTO A MASTERPIECE', M, 340);
    ctx.font = `400 20px ${sans}`;
    ctx.fillStyle = '#2B2D29';
    pageLines(ctx, 'Every journey deserves first-class comfort, style and performance. Make your Club Car yours with upgrades designed to turn heads. Tell us what you need: we\'ll price it and make it yours.', 470)
        .forEach((line, i) => ctx.fillText(line, M, 388 + i * 29));

    // The customer's cart on the golf course: its cut-out, or (without one) its photo on a white card
    if (cutout) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 10;
        pageFit(ctx, cutout, 590, 300, 590, 470, 'bottom');
        ctx.restore();
    } else if (photo) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 26;
        pageRoundRect(ctx, 660, 330, 500, 380, 18);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();
        pageFit(ctx, photo, 680, 350, 460, 340);
    }

    // Eight upgrades, two rows of four white cards
    const gap = 22, cols = 4, cardW = (W - 2 * M - gap * (cols - 1)) / cols, cardH = 296, top = 880;
    offers.slice(0, 8).forEach((o, i) => {
        const x = M + (i % cols) * (cardW + gap), y = top + Math.floor(i / cols) * (cardH + gap);
        ctx.save();
        ctx.shadowColor = 'rgba(21, 23, 20, 0.28)';
        ctx.shadowBlur = 22;
        ctx.shadowOffsetY = 8;
        pageRoundRect(ctx, x, y, cardW, cardH, 18);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();
        pageRoundRect(ctx, x + 12, y + 12, cardW - 24, 168, 12);
        ctx.fillStyle = '#F1F2EE';
        ctx.fill();
        if (offerImages[i]) {
            ctx.save();
            pageRoundRect(ctx, x + 12, y + 12, cardW - 24, 168, 12);
            ctx.clip();
            pageFit(ctx, offerImages[i], x + 18, y + 18, cardW - 36, 156);
            ctx.restore();
        }
        ctx.textAlign = 'center';
        ctx.fillStyle = PAGE3.mute;
        ctx.font = `600 13px ${sans}`;
        ctx.letterSpacing = '1.5px';
        ctx.fillText(String(o.group || '').toUpperCase(), x + cardW / 2, y + 208);
        ctx.letterSpacing = '0px';
        ctx.fillStyle = PAGE3.ink;
        ctx.font = `700 19px ${sans}`;
        pageLines(ctx, o.name, cardW - 28).slice(0, 3).forEach((line, l) => ctx.fillText(line, x + cardW / 2, y + 236 + l * 23));
    });

    // "More from Golfcarts.ph": a white bubble with a green edge and a tail, then the company line
    const bx = M, by = 1540, bw = W - 2 * M, bh = 120;
    ctx.save();
    ctx.shadowColor = 'rgba(21, 23, 20, 0.2)';
    ctx.shadowBlur = 16;
    pageRoundRect(ctx, bx, by, bw, bh, 16);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(bx + 40, by + bh - 2);
    ctx.lineTo(bx + 40, by + bh + 34);
    ctx.lineTo(bx + 82, by + bh - 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.fill();
    pageRoundRect(ctx, bx, by, bw, bh, 16);
    ctx.lineWidth = 3;
    ctx.strokeStyle = PAGE3.green;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + 40, by + bh);
    ctx.lineTo(bx + 40, by + bh + 34);
    ctx.lineTo(bx + 82, by + bh);
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = PAGE3.ink;
    ctx.font = `700 22px ${sans}`;
    ctx.fillText('More from Golfcarts.ph', bx + 30, by + 42);
    ctx.font = `400 18px ${sans}`;
    ctx.fillStyle = '#2B2D29';
    pageLines(ctx, 'Golf carts, lifestyle carts, resort shuttles and utility carts, plus parts and service at our branches in Manila · Cebu · Laguna · Clark. See the full range at golfcarts.ph or call (02) 7745-5089.', bw - 60)
        .slice(0, 2).forEach((line, i) => ctx.fillText(line, bx + 30, by + 72 + i * 26));
    ctx.textAlign = 'center';
    ctx.font = `400 15px ${sans}`;
    ctx.fillStyle = '#2B2D29';
    ctx.fillText('Golfcarts.ph by SJK Guahan Inc. · golfcarts.ph · info@golfcarts.ph · (02) 7745-5089', W / 2, H - 26);

    return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('the picture could not be made'))), 'image/jpeg', 0.88));
}

// Saved in the site's photo storage (quotations/), where the email script fetches it for the PDF
async function saveQuotationPage3(qt, blob) {
    const path = `quotations/${String(qt.reference || 'quotation').replace(/[^\w-]+/g, '')}-${Date.now()}.jpg`;
    const { error } = await sb.storage.from(SITE_PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
    if (error) throw new Error(error.message);
    return sb.storage.from(SITE_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

// Stores them if they changed (before a preview), keeping any unsaved edits in the editor
async function refreshQuotationPdfFields() {
    const fields = await quotationPdfFields(quotationDraft);
    const saved = pageData.quotations.find(x => x.id === quotationOpen);
    if (!saved || !Object.keys(fields).some(k => JSON.stringify(fields[k]) !== JSON.stringify(saved[k]))) return;
    const { data, error } = await sb.from('quotations').update(fields).eq('id', quotationOpen).select().single();
    if (error) throw new Error(error.message);
    pageData.quotations = pageData.quotations.map(x => x.id === data.id ? data : x);
    Object.assign(quotationDraft, fields, { updated_by: data.updated_by, updated_at: data.updated_at });
}

const PDF_OFFER_LIMIT = 8; // two rows of four on page 3

function quotationPdfExtra(qt) {
    const quote = pageData.quotes.find(q => q.id === qt.quote_id) || {};
    const product = findProductRef(quote.slug)
        || PRODUCTS_DATA.find(p => `${p.name} (${categoryLabel(p.category)})` === quote.model || p.name === quote.model)
        || findProductRef(rowValue(qt.build_rows, 'Model'));
    if (!product) return { specs: [], offers: [] };
    // The model page's specifications, as edited in Products
    const specs = getDetailSpecGroups(product).flatMap(g => g.rows).filter(([, v]) => v && v !== 'N/A');
    // What the model can still take, minus what the customer already chose; one from each group in turn, so the
    // page shows a spread
    const chosen = (qt.build_rows || []).map(r => String(r[1] || '')).join(' | ').toLowerCase();
    const groups = getCompatibleAccessoryGroups(product.name, null).map(g => ({ group: g.group, items: g.items
        .map(i => ({ group: g.group, name: i.name, image: String(i.image || (findProductRef(i.product) || {}).image || '').replace(/\.webp$/i, '') }))
        .filter(i => i.image && !chosen.includes(i.name.toLowerCase())) }));
    const offers = [];
    for (let round = 0; offers.length < PDF_OFFER_LIMIT && groups.some(g => g.items[round]); round++) {
        groups.forEach(g => { if (g.items[round] && offers.length < PDF_OFFER_LIMIT) offers.push(g.items[round]); });
    }
    return { specs, offers };
}

async function writeQuotation(change, message) {
    const { data: saved, error } = await sb.from('quotations').update({ ...(await quotationPdfFields(quotationDraft)), ...change }).eq('id', quotationOpen).select().single();
    if (error) { showToast(`Not saved: ${error.message}`); return false; }
    pageData.quotations = pageData.quotations.map(x => x.id === saved.id ? saved : x);
    quotationDraft = JSON.parse(JSON.stringify(saved));
    renderApp();
    showToast(message);
    return true;
}

function saveQuotation(status) {
    const self = status === 'submitted' && !quotationApprovers(quotationTotals(quotationDraft).margin).length;
    return writeQuotation({ ...quotationContent(quotationDraft), ...(status ? { status } : {}) },
        self ? 'Approved: the margin is over 25%. The PDF and PSS are ready.' : status === 'submitted' ? 'Submitted for approval.' : 'Draft saved.');
}

function reviewQuotation(status) {
    let note = '';
    if (status === 'returned') {
        note = prompt('What should be changed?');
        if (note == null || !note.trim()) return;
    }
    return writeQuotation({ status, review_note: note.trim() }, status === 'approved' ? 'Approved. The PDF and PSS are ready, and it can be sent to the customer.' : 'Returned to the sales executive.');
}

function reopenQuotation() {
    if (!confirm('Edit this quotation? It goes back to draft and needs approval again.')) return;
    return writeQuotation({ status: 'draft' }, 'Back to draft.');
}

// Who may delete a quotation: super admins, until it's sent; a sent one only by the accounts in
// QUOTATION_DELETE_SENT (2026-11-18, the user's request: Donna, to clear test quotations). The database lets any
// super admin delete (quotations_delete), so this is the admin's own guard against removing a real customer's record
const QUOTATION_DELETE_SENT = ['donnavalonda@sjkguahan.com'];
function canDeleteQuotation(qt) {
    if (!can('quotes.delete')) return false;
    return qt.status !== 'sent' || QUOTATION_DELETE_SENT.includes(String((account.staff && account.staff.email) || '').toLowerCase());
}

async function deleteQuotation() {
    const sent = quotationDraft.status === 'sent';
    if (!confirm(sent
        ? `Delete quotation ${quotationDraft.reference}? It was already emailed to the customer. Only delete it if it's a test. This can't be undone.`
        : `Delete quotation ${quotationDraft.reference}? This can't be undone.`)) return;
    const { error } = await sb.from('quotations').delete().eq('id', quotationOpen);
    if (error) { showToast(`Not deleted: ${error.message}`); return; }
    pageData.quotations = pageData.quotations.filter(x => x.id !== quotationOpen);
    closeQuotation();
    showToast('Quotation deleted.');
}

// The Google Apps Script google-apps-script/golfcarts-mail.gs makes the PDF and sends the emails; it reads the
// quotation with this sign-in, so the database decides whether this person may. Its web app address (ends in /exec),
// the same as the Vault secret "mail_script_url"; empty until the script is deployed.
const MAIL_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwNA4eL7w0NfTsaZESEoG7b19GssWgHvaZGigk6dEGZLF4fDjlCOW-5g17rh46Bvk6WZA/exec'; // the gcph deployment (2026-11-12)
const EMAIL_KINDS = { quotation_submitted: 'Approval request to Jerus or James', quotation_approved: 'Approved notice to the sales executive',
    quotation_returned: 'Returned notice to the sales executive', quotation_sent: 'Quotation to the customer' };
const quotationEmails = {}; // quotation id -> its email_log rows

async function quotationMail(action) {
    const { data } = await sb.auth.getSession();
    const token = data.session && data.session.access_token;
    if (!token) throw new Error('sign in again.');
    if (!MAIL_SCRIPT_URL) throw new Error('the email script isn\'t set up yet (MAIL_SCRIPT_URL in account.js).');
    // Plain text, so the browser sends it to Apps Script directly (a JSON content type would need a CORS check
    // Apps Script doesn't answer)
    const res = await fetch(MAIL_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, id: quotationOpen, token })
    });
    let result = {};
    try { result = await res.json(); } catch (err) { /* no JSON: the status says enough */ }
    if (!res.ok || !result.ok) throw new Error(result.error || `the email script answered ${res.status}.`);
    if (result.pdf) return new Blob([Uint8Array.from(atob(result.pdf), ch => ch.charCodeAt(0))], { type: 'application/pdf' });
    return result;
}

// The emails sent about a quotation (newest first), shown in its editor
async function loadQuotationEmails(id) {
    try {
        quotationEmails[id] = await rows(sb.from('email_log').select('*').eq('ref_table', 'quotations').eq('ref_id', id).order('created_at', { ascending: false }));
    } catch (err) {
        quotationEmails[id] = null;
    }
    if (quotationOpen === id) renderApp();
}

function renderQuotationEmails(qt) {
    const log = quotationEmails[qt.id];
    if (log === undefined) return '';
    const lastSent = (log || []).find(e => e.kind === 'quotation_sent');
    const resend = qt.status === 'sent'
        ? `<button type="button" onclick="resendQuotation()" class="adm-btn">${lastSent && lastSent.status === 'failed' ? 'Try sending again' : 'Email the customer again'}</button>` : '';
    const body = log === null ? '<p class="text-sm text-mute">The email log isn\'t in the database yet. Re-run supabase/schema.sql.</p>'
        : !log.length ? `<p class="text-sm text-mute">No emails yet${qt.status === 'sent' ? '. If none appears within a minute, check the email script (its Executions page in Apps Script).' : '.'}</p>`
        : `<div class="admin-table-wrap"><table class="admin-table">
            <thead><tr><th>Email</th><th>To</th><th>When</th><th>Result</th></tr></thead>
            <tbody>${log.map(e => `<tr>
                <td>${escapeHtml(EMAIL_KINDS[e.kind] || e.kind)}</td>
                <td>${escapeHtml(e.to_addresses)}</td>
                <td class="whitespace-nowrap">${new Date(e.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                <td>${e.status === 'sent' ? '<span class="quotation-status quotation-approved">Sent</span>'
                    : `<span class="quotation-status quotation-returned">Failed</span><p class="text-xs text-mute mt-1">${escapeHtml(e.error)}</p>`}</td>
            </tr>`).join('')}</tbody>
        </table></div>`;
    return `
        <section class="mt-10" aria-labelledby="qe-emails">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-3"><h3 id="qe-emails" class="type-md text-ink">Emails</h3>${resend}</div>
            ${body}
        </section>`;
}

async function previewQuotation() {
    // Opened before the wait, so the browser doesn't block it as a pop-up
    const win = window.open('', '_blank');
    try {
        // The price manager previews it as stored (the database lets them approve or return it, nothing else)
        if (can('quotations.prepare')) await refreshQuotationPdfFields();
        const url = URL.createObjectURL(await quotationMail('preview'));
        if (win) win.location = url; else window.open(url, '_blank');
    } catch (err) {
        if (win) win.close();
        showToast(`The PDF could not be made: ${err.message}`);
    }
}

// The Send button shows before approval too, greyed out (the user's choice, 2026-11-11): pressing it says why
function sendNotApproved() {
    const qt = quotationDraft;
    showToast(qt.status === 'submitted'
        ? `Waiting for approval by ${approverNames(qt.approvers || [])}. It can be sent once approved.`
        : 'Waiting for approval. Submit it for approval first; it can be sent once approved.');
}

// Marking it sent is what emails it: the database tells the email script, which sends the PDF and logs the email
async function sendQuotation() {
    const c = quotationDraft.customer || {};
    if (!confirm(`Email quotation ${quotationDraft.reference} to ${c.email}? It can't be changed after this.`)) return;
    const id = quotationOpen;
    if (!await writeQuotation({ status: 'sent' }, `Sending to ${c.email}…`)) return;
    // The email goes out within seconds; its result shows once it's logged
    for (const wait of [3000, 5000, 8000]) {
        await new Promise(resolve => setTimeout(resolve, wait));
        await loadQuotationEmails(id);
        const sent = (quotationEmails[id] || []).find(e => e.kind === 'quotation_sent');
        if (sent) { showToast(sent.status === 'sent' ? `Quotation emailed to ${c.email}.` : `The email failed: ${sent.error}`); return; }
    }
}

async function resendQuotation() {
    try {
        await quotationMail('resend');
        showToast('Quotation emailed again.');
    } catch (err) {
        showToast(`Not sent: ${err.message}`);
    }
    loadQuotationEmails(quotationOpen);
}

// --- PSS (Product Specification Sheet): the second document of an approved quotation, as an Excel file laid out like
// the team's PSS sheet. Filled from the quotation; what's only known later (serial, charger, P/O, delivery, the
// payment split, local costs) is left for the team to fill in Excel, where the totals and GP are formulas ---
const PSS_PEOPLE = { [QUOTATION_GM]: 'James Ugarte', [QUOTATION_SALES_MANAGER]: 'Jerus Vergara', 'jasperbuiza@sjkguahan.com': 'Jasper Buiza', 'reycubar@sjkguahan.com': 'Rey Cubar' };

function loadExcelJs() {
    if (window.ExcelJS) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'vendor/exceljs/exceljs.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('the spreadsheet library didn\'t load'));
        document.head.appendChild(script);
    });
}

// Answers for the product specification, read from the build the customer chose and the quotation's lines
function pssSpec(qt) {
    const rows = qt.build_rows || [];
    const value = label => { const r = rows.find(x => String(x[0]).toLowerCase() === label); return r ? String(r[1]) : ''; };
    const text = rows.map(r => r.join(' ')).concat(qt.lines.map(l => [l.part, l.option, l.description].join(' '))).join(' | ').toLowerCase();
    const yes = re => (re.test(text) ? 'YES' : 'NO');
    const seats = (String(value('model') || qt.title).match(/\b(\d\+\d|\d)\b/) || [])[1] || '';
    const wheels = rows.find(r => /wheel|tire/i.test(r[0]));
    const tire = ((wheels ? String(wheels[1]) : text).match(/(\d{1,2})\s*(?:"|”|in\b|-inch)/) || [])[1];
    const lift = text.match(/(\d(?:\.\d)?)\s*(?:"|”|-inch|in)\s*(?:gc\s*)?lift/);
    return {
        unit: qt.title, seats,
        body: value('body color') || value('body'), canopy: value('canopy'), seat: value('seat'),
        tire: tire ? `${tire}"` : '', rims: yes(/\brims?\b|alloy|aerion|zeus|nokken/),
        sideMirrors: yes(/side mirror|turn signal mirror/), rearMirror: yes(/rear(?:-view| view)? mirror|panoramic/),
        enclosure: yes(/enclosure|weather cover/), bagCover: yes(/bag cover/), upholstery: yes(/upholster|custom seat/),
        cooler: yes(/cooler/), lift: lift ? `YES, ${lift[1]}"` : yes(/lift kit|lifted/), lights: yes(/light/),
        washer: yes(/ball washer|ball cleaner|sand bottle/), battery: value('battery')
    };
}

async function downloadPss() {
    const qt = quotationDraft;
    try {
        await loadExcelJs();
    } catch (err) {
        showToast(`The PSS could not be made: ${err.message}`);
        return;
    }
    const c = qt.customer || {};
    const t = quotationTotals(qt);
    const spec = pssSpec(qt);
    const day = iso => (iso ? new Date(iso) : null);
    const person = email => PSS_PEOPLE[email] || adminName(email);
    const selfApproved = !(qt.approvers || []).length && qt.reviewed_by && qt.reviewed_by === qt.submitted_by;

    const book = new ExcelJS.Workbook();
    book.creator = 'Golfcarts.ph admin';
    const ws = book.addWorksheet('PSS', { pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    ws.columns = [{ width: 26 }, { width: 34 }, { width: 14 }, { width: 8 }, { width: 18 }, { width: 22 }, { width: 18 }, { width: 34 }];
    const money = '#,##0.00';
    const thin = { style: 'thin', color: { argb: 'FFBFBFBF' } };
    const box = cell => { cell.border = { top: thin, left: thin, bottom: thin, right: thin }; };
    const section = title => {
        const r = ws.addRow([title]);
        ws.mergeCells(r.number, 1, r.number, 8);
        r.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF151714' } };
        return r;
    };
    // label, value, label, value across the sheet: labels in bold, values boxed
    const pair = (l1, v1, l2, v2) => {
        const r = ws.addRow([l1, v1, '', '', l2 || '', v2 == null ? '' : v2]);
        ws.mergeCells(r.number, 2, r.number, 4);
        ws.mergeCells(r.number, 6, r.number, 7);
        [1, 5].forEach(i => { r.getCell(i).font = { bold: true }; });
        [2, 6].forEach(i => box(r.getCell(i)));
        return r;
    };
    const dateCell = (cell, d) => { if (d) { cell.value = d; cell.numFmt = 'dd-mmm-yy'; cell.alignment = { horizontal: 'left' }; } };

    const head = ws.addRow(['PRODUCT SPECIFICATION SHEET', '', '', '', 'REF#', qt.reference]);
    ws.mergeCells(head.number, 1, head.number, 4);
    head.getCell(1).font = { bold: true, size: 16 };
    head.getCell(5).font = { bold: true };
    const sub = ws.addRow(['SJK GUAHAN EQUIPMENT', '', '', '', 'Start date', '']);
    sub.getCell(1).font = { bold: true, color: { argb: 'FF6B6B66' } };
    sub.getCell(5).font = { bold: true };
    dateCell(sub.getCell(6), day(qt.reviewed_at));
    const eff = ws.addRow(['', '', '', '', 'Effective date', '']);
    eff.getCell(5).font = { bold: true };
    ws.addRow([]);

    section(`CLIENT'S IDENTIFICATION: ${String(c.name || '').toUpperCase()}`);
    pair('Client / owner', c.name || '', 'Project name', qt.title);
    pair('Office address', '', 'TIN', '');
    pair('Contact person', c.name || '', 'Phone no.', c.phone || '');
    pair('Email', c.email || '', 'Nearest branch', c.branch || '');
    const unit = pair('Unit details', [qt.title, spec.body && `${spec.body} body`, spec.canopy && `${spec.canopy} canopy`, spec.seat && `${spec.seat} seats`].filter(Boolean).join(', '), 'Units', qt.units);
    unit.getCell(2).alignment = { wrapText: true, vertical: 'top' };
    pair('Model', qt.title, 'Serial no.', 'To follow');
    pair('Order no.', '', 'Charger no.', 'To follow');
    pair('Inputted in Zoho?', '', 'Dated', '');
    pair("Customer's P/O no.", '', 'Dated', '');
    ws.addRow([]);

    section('COST ALLOCATION (internal use only)');
    pair('Sales order no.', '', '', '');
    const costHead = ws.addRow(['Description', '', 'Part number', 'Qty', 'Landed cost', 'Local cost', 'Amount', 'Stock (stock sheet)']);
    costHead.font = { bold: true };
    ws.mergeCells(costHead.number, 1, costHead.number, 2);
    const locals = ['PDI', 'Delivery', "Operator's training", 'Others'];
    const lineRows = Math.max(qt.lines.length, locals.length);
    const first = costHead.number + 1;
    for (let i = 0; i < lineRows; i++) {
        const l = qt.lines[i];
        const cost = l ? quotationCostPhp(qt, l) : null;
        const qty = l ? Number(l.qty == null ? 1 : l.qty) * Number(qt.units || 1) : null;
        // the line's stock in Zoho against what the quotation needs, short or out marked in red
        const stock = l ? stockStatus(l.sku, qty) : null;
        const r = ws.addRow([l ? [l.part, l.option, l.description].filter(Boolean).join(' · ') : '', '', l ? l.sku : '', qty, cost == null || !l ? null : Math.round(cost * qty * 100) / 100, locals[i] || '', null,
            stock ? stock.text : '']);
        r.getCell(8).alignment = { wrapText: true, vertical: 'top' };
        ws.mergeCells(r.number, 1, r.number, 2);
        [5, 7].forEach(n => { r.getCell(n).numFmt = money; box(r.getCell(n)); });
        if (stock && (stock.kind === 'short' || stock.kind === 'out')) {
            r.getCell(8).font = { bold: true, color: { argb: 'FF8A2A1C' } };
            r.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6E0DC' } };
        }
    }
    const last = first + lineRows - 1;
    const totals = ws.addRow(['Total machine cost', '', '', '', { formula: `SUM(E${first}:E${last})` }, 'Total local cost', { formula: `SUM(G${first}:G${last})` }]);
    totals.font = { bold: true };
    [5, 7].forEach(n => { totals.getCell(n).numFmt = money; });
    const allocated = ws.addRow(['TOTAL ALLOCATED COST', '', '', '', { formula: `E${totals.number}+G${totals.number}` }, 'GP', null]);
    allocated.font = { bold: true };
    allocated.getCell(5).numFmt = money;
    ws.addRow([]);

    section('PAYMENT TERMS');
    const payHead = ws.addRow(['', '', '%', '', 'Amount', 'Remarks']);
    payHead.font = { bold: true };
    ['Down payment', 'Progress payment', 'Final payment'].forEach(label => {
        const r = ws.addRow([label, '', null, '', null, '']);
        r.getCell(1).font = { bold: true };
        r.getCell(3).numFmt = '0%';
        r.getCell(5).numFmt = money;
        [3, 5].forEach(n => box(r.getCell(n)));
        ws.mergeCells(r.number, 6, r.number, 7);
    });
    const total = ws.addRow(['Total (quotation)', '', '', '', Math.round(t.total * 100) / 100, '']);
    total.font = { bold: true };
    total.getCell(5).numFmt = money;
    const net = ws.addRow(['Total net of VAT', '', '', '', { formula: `E${total.number}/1.12` }, '']);
    net.font = { bold: true };
    net.getCell(5).numFmt = money;
    // GP as on the team's sheet: (net of VAT - total allocated cost) / net of VAT
    allocated.getCell(7).value = { formula: `IF(E${net.number}=0,0,(E${net.number}-E${allocated.number})/E${net.number})` };
    allocated.getCell(7).numFmt = '0.00%';
    ws.addRow([]);

    section('DELIVERY SCHEDULE');
    pair('Delivery date', '', 'Delivery contact', c.name || '');
    pair('Delivery to site', '', 'Contact no.', c.phone || '');
    pair('Special instructions', '', '', '');
    ws.addRow([]);

    section('OTHER REQUIREMENTS');
    pair('Pre-delivery inspection', '', 'Date required', '');
    pair("Operator's training", '', 'Date required', '');
    pair('Free PM service', '', 'No. of visits', '');
    pair('Others', '', '', '');
    ws.addRow([]);

    section('REMARKS');
    const remarkHead = ws.addRow(['#', 'Remark', '', '', '', 'Settled on']);
    remarkHead.font = { bold: true };
    const remarks = [qt.notes].filter(Boolean);
    for (let i = 0; i < 4; i++) {
        const r = ws.addRow([i + 1, remarks[i] || '', '', '', '', '']);
        ws.mergeCells(r.number, 2, r.number, 5);
        r.getCell(2).alignment = { wrapText: true, vertical: 'top' };
        box(r.getCell(2)); box(r.getCell(6));
    }
    ws.addRow([]);

    section('APPROVALS');
    const signHead = ws.addRow(['', 'Name', '', '', 'Signature', 'Date']);
    signHead.font = { bold: true };
    const sign = (role, email, when, note) => {
        const r = ws.addRow([role, email ? person(email) + (note ? ` (${note})` : '') : '', '', '', '', '']);
        ws.mergeCells(r.number, 2, r.number, 4);
        r.getCell(1).font = { bold: true };
        dateCell(r.getCell(6), when);
        [2, 5, 6].forEach(n => box(r.getCell(n)));
    };
    sign('Issued by: Sales Executive', qt.submitted_by || qt.prepared_by, day(qt.submitted_at), selfApproved ? 'approved on submit, margin over 25%' : '');
    sign('Approved by: Sales Manager', qt.reviewed_by === QUOTATION_SALES_MANAGER ? qt.reviewed_by : '', qt.reviewed_by === QUOTATION_SALES_MANAGER ? day(qt.reviewed_at) : null);
    sign('Approved by: GM', qt.reviewed_by === QUOTATION_GM ? qt.reviewed_by : '', qt.reviewed_by === QUOTATION_GM ? day(qt.reviewed_at) : null);
    sign('Service Manager', '', null);

    // The product specification, on its own sheet (the PSS and the unit configuration are kept separately)
    const ps = book.addWorksheet('Product specification', { pageSetup: { paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    ps.columns = [{ width: 34 }, { width: 24 }, { width: 34 }, { width: 24 }];
    const psTitle = ps.addRow([`CARTS & EVs PRODUCT SPECIFICATION: ${c.name || ''}`]);
    ps.mergeCells(psTitle.number, 1, psTitle.number, 4);
    psTitle.getCell(1).font = { bold: true, size: 14 };
    ps.addRow([]);
    const qa = (q1, a1, q2, a2) => {
        const r = ps.addRow([q1, a1 == null ? '' : a1, q2 || '', a2 == null ? '' : a2]);
        [1, 3].forEach(n => { r.getCell(n).font = { bold: true }; });
        [2, 4].forEach(n => { if (r.getCell(n - 1).value) box(r.getCell(n)); });
    };
    const psSection = title => {
        const r = ps.addRow([title]);
        ps.mergeCells(r.number, 1, r.number, 4);
        r.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF151714' } };
    };
    psSection('DESCRIPTION OF EQUIPMENT');
    qa('Type of unit', spec.unit, 'Quantity', qt.units);
    qa('Model / serial number', 'To follow', 'Charger number', 'To follow');
    qa('Controller number', '', '', '');
    psSection('APPLICATION');
    qa('How many seater?', spec.seats, 'Local painting needed?', 'NO');
    qa('Color of the body?', spec.body.toUpperCase(), 'Color of the canopy?', spec.canopy.toUpperCase());
    qa('Color of the seats?', spec.seat.toUpperCase(), 'Ground conditions?', '');
    qa('Side mirrors needed?', spec.sideMirrors, 'Specialized tire needed?', '');
    qa('Rear view mirror needed?', spec.rearMirror, 'Enclosure needed?', spec.enclosure);
    qa('If yes, what kind?', '', 'Bag cover needed?', spec.bagCover);
    qa('What size tire?', spec.tire, 'Custom upholstery needed?', spec.upholstery);
    qa('Rims needed?', spec.rims, 'Cooler?', spec.cooler);
    qa('Lift kit needed? If yes, how many inches?', spec.lift, 'Other requirements?', '');
    qa('Lights included?', spec.lights, 'Ball washer and sand bottle?', spec.washer);
    psSection('STRETCH');
    qa('Is this a stretch project?', 'NO', 'What type of configuration?', spec.seats);
    qa('M&M or Nivel stretch?', 'N/A', 'Lift kit required?', spec.lift);
    psSection('BATTERY');
    qa('Battery', spec.battery, 'Charging time', '');
    qa('Hours of use per day', '', 'Customer informed about the charging time?', '');
    qa('Battery voltage [V]', '', 'Running time suits the application?', '');
    qa('Rated capacity [Ah]', '', 'Power supply at the site meets our requirements?', '');
    qa('Voltage at customer site [V / Hz / phase]', '', '', '');

    const buffer = await book.xlsx.writeBuffer();
    const name = `PSS_${c.name || 'customer'}_${qt.title || qt.reference}`.replace(/[\\/:*?"<>|·]+/g, ' ').replace(/\s+/g, ' ').trim();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    link.download = `${name}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}

// --- Activity log (super admins only): who changed what. The database writes it (log_activity in supabase/schema.sql);
// the admin only reads it, the newest ACTIVITY_LIMIT entries. Filtering redraws the results only, so the search box
// keeps its focus ---
const ACTIVITY_LIMIT = 1000;
const ACTIVITY_SHOWN = 200; // rows drawn at once
let activityFilter = { who: '', area: '', q: '' };

function formatActivityTime(iso) {
    return new Date(iso).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function activityArea(e) {
    if (e.area === 'site_edits' && e.item.startsWith('story:')) return 'Stories';
    if (e.area === 'site_edits') return e.item.startsWith('product:') || e.item.startsWith('accessory:') ? 'Products' : 'Homepage';
    return { quotes: 'Quote requests', quotations: 'Quotations', bundles: 'Bundles', sku_usd: 'USD list', pricing_settings: 'Pricing', staff: 'Staff' }[e.area] || e.area;
}

// One line in plain words: "Approved quotation GC-123"
function activitySentence(e) {
    const del = e.action === 'delete', add = e.action === 'insert';
    const verb = del ? 'Deleted' : add ? 'Added' : 'Edited';
    const change = (e.changes || {}).status;
    if (e.area === 'quotes') return del ? `Deleted request ${e.item}` : `Changed request ${e.item} to ${change ? change.to : 'a new status'}`;
    if (e.area === 'quotations') {
        if (add) return `Prepared quotation ${e.item}`;
        if (del) return `Deleted quotation ${e.item}`;
        const steps = { submitted: 'Submitted', approved: 'Approved', returned: 'Returned', sent: 'Sent to the customer:', draft: 'Reopened' };
        return change && steps[change.to] ? `${steps[change.to]} quotation ${e.item}` : `Edited quotation ${e.item}`;
    }
    if (e.area === 'site_edits') {
        const [kind, id] = e.item.split(':');
        if (kind === 'story') {
            const title = (((e.changes || {}).title || {}).to) || ((BLOGS_DATA.find(p => p.slug === id) || {}).title) || id;
            if (del) return `Deleted story or undid its edits: ${title}`;
            if ((e.changes || {}).removed) return `Removed story: ${title}`;
            return `${add && !isShippedStory(id) ? 'Added' : 'Edited'} story: ${title}`;
        }
        const product = kind === 'product' && PRODUCTS_DATA.find(p => p.slug === id);
        const accessory = kind === 'accessory' && ACCESSORY_CATALOG.flatMap(g => g.items).find(i => i.id === id);
        const name = kind === 'product' ? (product ? product.name : id) : kind === 'accessory' ? `${accessory ? accessory.name : id} photo`
            : e.item === 'banners' ? 'the homepage carousel' : e.item === 'event' ? 'the homepage event' : e.item === 'promo' ? 'the Red Series' : e.item === 'holiday' ? 'the holiday theme' : e.item;
        return del ? `Put back the original of ${name}` : `Edited ${name}`;
    }
    if (e.area === 'bundles') return `${verb} bundle line ${e.item}`;
    if (e.area === 'sku_usd') return `${verb} USD list line ${e.item}`;
    if (e.area === 'pricing_settings') return 'Changed the pricing settings';
    if (e.area === 'staff') {
        if (add) return `Added ${e.item} to staff`;
        if (del) return `Removed ${e.item} from staff`;
        return `Changed the role of ${e.item}`;
    }
    return `${verb} ${e.area} ${e.item}`;
}

function activityValue(field, v) {
    if (v === null || v === undefined || v === '') return '(empty)';
    if (field === 'role' && ADMIN_ROLES[v]) return ADMIN_ROLES[v].label;
    return typeof v === 'string' ? v : JSON.stringify(v);
}

function activityDetails(e) {
    const fields = Object.entries(e.changes || {});
    if (!fields.length) return '';
    return `<details><summary class="text-xs">${fields.length} change${fields.length === 1 ? '' : 's'}</summary>
        <dl class="activity-changes">${fields.map(([field, c]) => `<div>
            <dt>${escapeHtml(field.replace(/_/g, ' '))}</dt>
            <dd><span class="text-mute">${escapeHtml(activityValue(field, c.from))}</span> → ${escapeHtml(activityValue(field, c.to))}</dd>
        </div>`).join('')}</dl>
    </details>`;
}

function renderActivityResults(list) {
    const { who, area, q } = activityFilter;
    const text = q.trim().toLowerCase();
    const found = list.filter(e => (!who || e.who === who) && (!area || activityArea(e) === area)
        && (!text || `${activitySentence(e)} ${e.who} ${JSON.stringify(e.changes)}`.toLowerCase().includes(text)));
    if (!found.length) return '<p class="measure">Nothing matches.</p>';
    return `<div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>When</th><th>Who</th><th>Area</th><th>What</th></tr></thead>
        <tbody>${found.slice(0, ACTIVITY_SHOWN).map(e => `<tr>
            <td class="whitespace-nowrap">${formatActivityTime(e.created_at)}</td>
            <td>${escapeHtml(adminName(e.who))}</td>
            <td class="whitespace-nowrap">${escapeHtml(activityArea(e))}</td>
            <td>${escapeHtml(activitySentence(e))}${activityDetails(e)}</td>
        </tr>`).join('')}</tbody>
    </table></div>
    ${found.length > ACTIVITY_SHOWN ? `<p class="text-sm text-mute mt-3">Showing the newest ${ACTIVITY_SHOWN} of ${found.length}. Filter to narrow it down.</p>` : ''}`;
}

function setActivityFilter(key, value) {
    activityFilter[key] = value;
    const box = document.getElementById('activity-results');
    if (box) box.innerHTML = renderActivityResults(pageData.activity || []);
}

function renderAdminActivity({ activity }) {
    if (activity === null) return '<p class="measure">The log isn\'t in the database yet. Re-run supabase/schema.sql in the Supabase SQL Editor.</p>';
    if (!activity.length) return '<p class="measure">Nothing logged yet. Changes made from now on show here.</p>';
    const people = [...new Set(activity.map(e => e.who))].sort();
    const areas = [...new Set(activity.map(activityArea))].sort();
    const options = (list, chosen, label = x => x) => list.map(x => `<option value="${escapeHtml(x)}"${x === chosen ? ' selected' : ''}>${escapeHtml(label(x))}</option>`).join('');
    return `
        <div class="grid sm:grid-cols-3 gap-4 max-w-3xl mb-5">
            <div class="field"><label for="al-who">Person</label><select id="al-who" onchange="setActivityFilter('who', this.value)"><option value="">Everyone</option>${options(people, activityFilter.who, adminName)}</select></div>
            <div class="field"><label for="al-area">Area</label><select id="al-area" onchange="setActivityFilter('area', this.value)"><option value="">All areas</option>${options(areas, activityFilter.area)}</select></div>
            <div class="field"><label for="al-q">Search</label><input id="al-q" type="search" value="${escapeHtml(activityFilter.q)}" oninput="setActivityFilter('q', this.value)" placeholder="A reference, a model, a price…"></div>
        </div>
        <div id="activity-results">${renderActivityResults(activity)}</div>`;
}

// --- Zoho leads: each quote request and whether the email script got it into Zoho CRM (table zoho_leads) ---
const ZOHO_LIMIT = 500;
let zohoFilter = '';
const ZOHO_STALE_MS = 10 * 60 * 1000; // a lead still waiting this long never got an answer, and can be sent again

function zohoState(lead) {
  if (lead.status === 'pending' && Date.now() - new Date(lead.updated_at).getTime() > ZOHO_STALE_MS) return 'stuck';
  return lead.status;
}
const zohoNeedsSending = lead => ['failed', 'stuck'].includes(zohoState(lead));
// [label, classes]: the classes are written out in full so the style build keeps them
const ZOHO_STATES = { sent: ['In Zoho', 'zoho-state zoho-sent'], failed: ['Failed', 'zoho-state zoho-failed'], pending: ['Sending…', 'zoho-state zoho-pending'], stuck: ['No answer', 'zoho-state zoho-stuck'] };

function zohoHomeNote(list) {
  if (!list) return 'Whether each quote request reached Zoho CRM';
  const failed = list.filter(zohoNeedsSending).length;
  return failed ? `${failed} not in Zoho yet: send again` : 'Every quote request reached Zoho CRM';
}

function renderAdminZoho({ zohoLeads }) {
  if (zohoLeads === null) return '<p class="measure">The Zoho list isn\'t in the database yet. Re-run supabase/schema.sql in the Supabase SQL Editor.</p>';
  const count = s => zohoLeads.filter(l => (s === 'failed' ? zohoNeedsSending(l) : zohoState(l) === s)).length;
  const chips = [['', 'All', zohoLeads.length], ['sent', 'In Zoho', count('sent')], ['failed', 'Not in Zoho', count('failed')], ['pending', 'Sending', count('pending')]];
  const shown = zohoLeads.filter(l => !zohoFilter || (zohoFilter === 'failed' ? zohoNeedsSending(l) : zohoState(l) === zohoFilter));
  return `
    <div class="zoho-filter" role="group" aria-label="Show">${chips.map(([id, label, n]) => `<button type="button" aria-pressed="${zohoFilter === id}" onclick="setZohoFilter('${id}')">${label} <span>${n}</span></button>`).join('')}</div>
    ${!zohoLeads.length ? '<p class="measure">No quote requests yet. Each new request shows here once it arrives.</p>'
      : !shown.length ? '<p class="measure">None.</p>'
      : `<div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>Received</th><th>Request</th><th>Name</th><th>Cart</th><th>Zoho</th><th>Details</th><th><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>${shown.map(l => {
          const state = zohoState(l);
          const detail = state === 'sent' ? `Lead ${escapeHtml(l.zoho_id)}`
            : state === 'failed' ? escapeHtml(l.error || 'No reason given')
            : state === 'stuck' ? 'The email script didn\'t answer. Send it again.'
            : 'Waiting for Zoho';
          return `<tr>
            <td class="whitespace-nowrap">${formatActivityTime(l.created_at)}</td>
            <td class="whitespace-nowrap">${escapeHtml(l.reference)}</td>
            <td class="zoho-name">${escapeHtml(l.name)}</td>
            <td>${escapeHtml(l.model)}</td>
            <td><span class="${ZOHO_STATES[state][1]}">${ZOHO_STATES[state][0]}</span></td>
            <td class="zoho-detail">${detail}${l.attempts > 1 ? ` <span class="text-xs text-mute">· ${l.attempts} tries</span>` : ''}</td>
            <td>${zohoNeedsSending(l) ? `<button type="button" onclick="retryZohoLead(${Number(l.quote_id)})" class="link text-xs whitespace-nowrap">Send again</button>` : ''}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`}`;
}

function setZohoFilter(id) {
  zohoFilter = id;
  renderApp();
}

// The database marks it as sending and asks the email script again; the list refreshes once Zoho has had time to answer
async function retryZohoLead(id) {
  const { error } = await sb.rpc('retry_zoho_lead', { ref_id: id });
  if (error) { showToast(`Not sent: ${error.message}`); return; }
  const lead = pageData && (pageData.zohoLeads || []).find(l => Number(l.quote_id) === id);
  if (lead) Object.assign(lead, { status: 'pending', error: '', updated_at: new Date().toISOString() });
  renderApp();
  showToast('Sending it to Zoho again. The list refreshes in a few seconds.');
  setTimeout(() => { if (currentPage === 'admin' && adminTab === 'zoho') reloadPageData(); }, 8000);
}

// --- Staff: who gets the admin, and as what (master admins only). Each person still signs up once with their
// work email and confirms it; their password is theirs, kept by Supabase ---
function renderAdminUsers({ staff }) {
    const me = currentAdmin().email;
    const roleOptions = selected => Object.entries(ADMIN_ROLES).map(([id, r]) => `<option value="${id}"${id === selected ? ' selected' : ''}>${r.label}</option>`).join('');
    return `
        <div class="admin-table-wrap"><table class="admin-table">
            <thead><tr><th>Email</th><th>Role</th><th>Added</th><th><span class="sr-only">Actions</span></th></tr></thead>
            <tbody>${staff.map(u => `<tr>
                <td>${escapeHtml(u.email)}${u.email === me ? ' <span class="text-xs text-mute">(you)</span>' : ''}</td>
                <td>${u.email === me ? ADMIN_ROLES[u.role].label
                    : `<select aria-label="Role of ${escapeHtml(u.email)}" onchange="setStaffRole('${escapeHtml(u.email)}', this.value)">${roleOptions(u.role)}</select>`}</td>
                <td>${formatShortDate(u.added_at)}</td>
                <td>${u.email === me ? '' : `<button type="button" onclick="removeStaff('${escapeHtml(u.email)}')" class="link text-xs">Remove</button>`}</td>
            </tr>`).join('')}</tbody>
        </table></div>
        <form data-no-prefill onsubmit="addStaff(event)" class="admin-card grid sm:grid-cols-[1fr_14rem_auto] gap-5 items-end mt-8 max-w-3xl">
            <div class="field"><label for="au-email">Add someone</label><input id="au-email" name="email" required type="email" placeholder="name@sjkguahan.com"></div>
            <div class="field"><label for="au-role">Role</label><select id="au-role" name="role">${roleOptions('sales')}</select></div>
            <button type="submit" class="btn btn-primary px-5 text-sm">Add</button>
            <p class="text-xs text-mute sm:col-span-3">They then sign up on the site with that email (Be a Golfer → Sign up), confirm it from their inbox, and log in.</p>
        </form>
        <div class="mt-12 max-w-3xl">
            <h2 class="type-md text-ink">What each role can do</h2>
            <div class="admin-table-wrap mt-4"><table class="admin-table">
                <thead><tr><th>Access</th>${Object.values(ADMIN_ROLES).map(r => `<th>${r.label}</th>`).join('')}</tr></thead>
                <tbody>${ADMIN_PERMISSION_LABELS.map(([p, label]) => `<tr><td>${label}</td>${Object.values(ADMIN_ROLES).map(r => `<td>${r.can.includes(p) ? 'Yes' : '—'}</td>`).join('')}</tr>`).join('')}</tbody>
            </table></div>
        </div>`;
}

async function staffChange(query, message) {
    const { error } = await query;
    showToast(error ? `Not saved: ${error.message}` : message);
    reloadPageData();
}

function addStaff(e) {
    e.preventDefault();
    if (!e.target.reportValidity()) return;
    const data = new FormData(e.target);
    const email = data.get('email').trim().toLowerCase(), role = data.get('role');
    staffChange(sb.from('staff').insert({ email, role }), `${email} added as ${ADMIN_ROLES[role].label}.`);
}

function setStaffRole(email, role) {
    staffChange(sb.from('staff').update({ role }).eq('email', email), `${email} is now ${ADMIN_ROLES[role].label}.`);
}

function removeStaff(email) {
    if (!confirm(`Remove admin access for ${email}?`)) return;
    staffChange(sb.from('staff').delete().eq('email', email), `${email} removed.`);
}

function downloadJson(data, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
}

// Everything on the admin, as a JSON file
function exportAdminData() {
    if (!pageData || !pageData.quotes) return;
    const exported = new Date().toISOString();
    downloadJson({ exported, by: currentAdmin().email, quotes: pageData.quotes, golfers: pageData.golfers, siteEdits: Object.values(siteEdits), bundles: pageData.bundles, skuUsd: pageData.skuUsd },
        `golfcarts-admin-${exported.slice(0, 10)}.json`);
}

// The quote requests as a spreadsheet (CSV, opens in Excel or Google Sheets)
function exportAdminQuotes() {
    if (!pageData || !pageData.quotes) return;
    const cell = v => {
        let s = String(v == null ? '' : v);
        if (/^[=+\-@]/.test(s)) s = "'" + s; // so a customer's text can't run as a spreadsheet formula
        return `"${s.replace(/"/g, '""')}"`;
    };
    const head = ['Reference', 'Date', 'Status', 'Name', 'Email', 'Phone', 'Model', 'Quantity', 'Branch', 'Source', 'Build', 'Notes', 'Status by', 'Status changed'];
    const lines = pageData.quotes.map(q => [q.reference, q.created_at ? new Date(q.created_at).toLocaleString('en-PH') : '', q.status, q.name, q.email, q.phone, q.model, q.quantity, q.branch, q.source,
        (q.rows || []).filter(r => Array.isArray(r)).map(r => `${r[0]}: ${r[1]}`).join('; '), q.notes, q.status_by, q.status_at ? new Date(q.status_at).toLocaleString('en-PH') : '']);
    const csv = '﻿' + [head, ...lines].map(r => r.map(cell).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `golfcarts-quotes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeGolferModal(); });
window.addEventListener('DOMContentLoaded', refreshGolferUI);
