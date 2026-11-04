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
            account.staff = (await rows(sb.from('staff').select('email, role').eq('email', user.email.toLowerCase()).maybeSingle())) || null;
            if (!account.staff) account.golfer = (await rows(sb.from('golfers').select('*').eq('id', user.id).maybeSingle())) || null;
        } catch (err) { console.warn('Account could not be loaded:', err); }
    }
    account.ready = true;
    pageData = null;
    refreshGolferUI();
    prefillGolferForms();
    if (currentPage === 'golfer' || currentPage === 'admin') renderApp();
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
// customer's acknowledgement and the staff's notice (the database calls quotation-mail). Resolves { error } ---
async function recordQuote(fields, slug) {
    if (!sb) return { error: new Error('Requests can\'t be sent from this page') };
    let quoteRows = [];
    try { quoteRows = JSON.parse(fields.rows || '[]'); } catch (e) { /* rows stay empty */ }
    const text = v => (v == null ? '' : String(v));
    const { error } = await sb.from('quotes').insert({
        reference: text(fields.reference), golfer_id: currentGolfer() ? currentGolfer().id : null, source: text(fields.source),
        name: text(fields.name), email: text(fields.email), phone: text(fields.phone), model: text(fields.model),
        quantity: text(fields.quantity), branch: text(fields.branch), notes: text(fields.notes), rows: quoteRows,
        // The model page it came from, so its quotation can be priced from that model's bundle
        slug: slug || null
    });
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
        label: 'Master admin',
        can: ['quotes.view', 'quotes.status', 'quotes.delete', 'quotations.prepare', 'quotations.approve', 'pricing.edit', 'golfers.view', 'golfers.news', 'products.edit', 'content.edit', 'bundles.view', 'export.quotes', 'export.all', 'users.manage']
    },
    // Works the leads: quotes and golfers. Prices, site text, a full customer export and staff management stay with master admins
    sales: {
        label: 'Sales manager',
        can: ['quotes.view', 'quotes.status', 'quotations.prepare', 'golfers.view', 'golfers.news', 'export.quotes']
    }
};

const ADMIN_PERMISSION_LABELS = [
    ['quotes.view', 'See quotes'], ['quotes.status', 'Change quote status'], ['quotes.delete', 'Delete quotes'],
    ['golfers.view', 'See golfers'], ['golfers.news', 'Copy news emails'], ['products.edit', 'Edit products and prices'],
    ['quotations.prepare', 'Prepare, submit and send quotations'], ['quotations.approve', 'Approve or return quotations'],
    ['pricing.edit', 'Set exchange rate, freight and margin'],
    ['content.edit', 'Edit site content'], ['bundles.view', 'See and edit bundles'], ['export.quotes', 'Export quotes'], ['export.all', 'Export all data'], ['users.manage', 'Manage staff']
];

let adminTab = 'quotes';

function can(permission) {
    const admin = currentAdmin();
    return !!(admin && ADMIN_ROLES[admin.role] && ADMIN_ROLES[admin.role].can.includes(permission));
}

function adminName(email) {
    return email ? email.split('@')[0] : '';
}

// --- Site edits (product text and prices, the homepage event): read by every visitor, written by master admins ---
// The text as shipped, so an edit can be undone
const ADMIN_ORIGINALS = {
    products: Object.fromEntries(PRODUCTS_DATA.map(p => [p.slug, { tagline: p.tagline || '', description: p.description || '' }])),
    event: { title: HOME_EVENT.title, date: HOME_EVENT.date, text: HOME_EVENT.text.slice() }
};
// From the site_edits table: { 'product:<slug>': { value, updated_by }, event: { ... } }
let siteEdits = {};

function applyAdminEdits() {
    PRODUCTS_DATA.forEach(p => Object.assign(p, ADMIN_ORIGINALS.products[p.slug], (siteEdits[`product:${p.slug}`] || {}).value));
    Object.assign(HOME_EVENT, ADMIN_ORIGINALS.event, (siteEdits.event || {}).value);
}

// Pre-rendered pages carry the shipped text, so a page with edits is drawn again once they arrive
async function loadSiteEdits({ rerender = true } = {}) {
    if (!sb) return;
    try {
        const list = await rows(sb.from('site_edits').select('key, value, updated_by'));
        siteEdits = Object.fromEntries(list.map(r => [r.key, r]));
        applyAdminEdits();
        if (rerender && list.length && currentPage !== 'admin' && currentPage !== 'golfer') renderApp();
    } catch (err) { console.warn('Site edits not loaded:', err); }
}
loadSiteEdits();

async function saveSiteEdit(key, value, message) {
    const { error } = value ? await sb.from('site_edits').upsert({ key, value }) : await sb.from('site_edits').delete().eq('key', key);
    if (error) { showToast(`Not saved: ${error.message}`); return; }
    await loadSiteEdits({ rerender: false });
    renderApp();
    showToast(message);
}

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

// The admin's sections, grouped as the sidebar shows them: [id, label, permission, page title]
const ADMIN_SECTIONS = [
    ['Work', [['quotes', 'Quote requests', 'quotes.view'], ['quotations', 'Quotations', 'quotations.prepare'], ['golfers', 'Golfers', 'golfers.view']]],
    ['Catalog', [['bundles', 'Bundles', 'bundles.view'], ['products', 'Products', 'products.edit'], ['content', 'Site content', 'content.edit']]],
    ['Team', [['users', 'Staff', 'users.manage']]]
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
    if (!can('quotations.prepare') || !data.quotations) return '';
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
    const headings = {
        quotes: ['Quote requests', data ? `${plural(quotes.length, 'request')}, ${quotes.filter(q => q.status === 'New').length} new` : '',
            `${can('export.quotes') ? '<button type="button" onclick="exportAdminQuotes()" class="adm-btn">Export quotes</button>' : ''}`],
        quotations: ['Quotations', data ? `${plural(quotations.length, 'quotation')}, ${quotations.filter(q => q.status === 'submitted').length} waiting for approval` : '', ''],
        golfers: ['Golfers', data ? `${plural((data.golfers || []).length, 'member')}, ${(data.golfers || []).filter(g => g.news).length} want member news` : '', ''],
        bundles: ['Bundles', 'Cost lines for each build, in USD. Quotations are priced from these.', ''],
        products: ['Products', 'The tagline and description on each model page.', ''],
        content: ['Site content', 'The event story on the homepage.', ''],
        users: ['Staff', 'Who can use the admin, and as what.', `${can('export.all') ? '<button type="button" onclick="exportAdminData()" class="adm-btn">Export all data</button>' : ''}`]
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
        const costs = can('bundles.view') || can('quotations.prepare');
        const [quotes, golfers, builds, staff, bundles, skuUsd, quotations, pricing] = await Promise.all([
            rows(sb.from('quotes').select('*').order('created_at', { ascending: false })),
            rows(sb.from('golfers').select('*').order('joined_at', { ascending: false })),
            rows(sb.from('saved_builds').select('golfer_id')),
            can('users.manage') ? rows(sb.from('staff').select('*').order('added_at')) : Promise.resolve([]),
            costs ? rows(sb.from('bundles').select('*').order('sheet_row')).catch(() => null) : Promise.resolve([]),
            costs ? rows(sb.from('sku_usd').select('*').order('sheet_row')).catch(() => null) : Promise.resolve([]),
            can('quotations.prepare') ? rows(sb.from('quotations').select('*').order('created_at', { ascending: false })).catch(() => null) : Promise.resolve([]),
            can('quotations.prepare') ? rows(sb.from('pricing_settings').select('*').eq('id', 1).maybeSingle()).catch(() => null) : Promise.resolve(null)
        ]);
        return { quotes, golfers, builds, staff, bundles, skuUsd, quotations, pricing };
    });
    const sections = ADMIN_SECTIONS.map(([group, items]) => [group, items.filter(([, , p]) => can(p))]).filter(([, items]) => items.length);
    const allowed = sections.flatMap(([, items]) => items.map(([id]) => id));
    if (!allowed.includes(adminTab)) adminTab = allowed[0];
    const needsData = ['quotes', 'quotations', 'golfers', 'bundles', 'users'].includes(adminTab);
    const ready = data && !data.error;
    const body = data && data.error ? renderLoadError(data.error)
        : needsData && !data ? '<p class="text-mute" role="status">Loading…</p>'
        : { quotes: renderAdminQuotes, quotations: renderAdminQuotations, golfers: renderAdminGolfers, products: renderAdminProducts,
            content: renderAdminContent, bundles: renderAdminBundles, users: renderAdminUsers }[adminTab](data);
    // Counts beside the sidebar items: new requests, and quotations waiting on this person
    const counts = ready ? {
        quotes: data.quotes.filter(q => q.status === 'New').length,
        quotations: (data.quotations || []).filter(q => can('quotations.approve') ? q.status === 'submitted' : q.status === 'returned').length
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
                        <p class="adm-nav-group">${group}</p>
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

function renderAdminQuotes({ quotes: allQuotes, golfers, quotations }) {
    if (!allQuotes.length) return '<p class="measure">No quote requests yet. Every request sent from the site lands here and in the quotes Google Sheet.</p>';
    // The pipeline's New requests filter: requests that don't have a quotation yet and are still open
    const priced = new Set((quotations || []).map(q => q.quote_id));
    const quotes = quoteFilter === 'open' ? allQuotes.filter(q => !priced.has(q.id) && q.status !== 'Lost' && q.status !== 'Sold') : allQuotes;
    if (!quotes.length) return '<p class="measure">Every open request has a quotation.</p>';
    const canDelete = can('quotes.delete');
    const pricing = can('quotations.prepare') && quotations;
    // The quote's quotation: open it, or prepare one from the quote's build
    const quotationCell = q => {
        const qt = quotations.find(x => x.quote_id === q.id);
        return qt ? `<button type="button" onclick="openQuotation(${qt.id})" class="link text-xs">Open</button> <span class="quotation-status quotation-${qt.status}">${QUOTATION_STATUS_LABELS[qt.status]}</span>`
            : `<button type="button" onclick="prepareQuotation(${q.id})" class="link text-xs">Prepare quotation</button>`;
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

function renderAdminProducts() {
    return `<div class="space-y-4">${PRODUCTS_DATA.filter(p => p.category !== 'Accessories').map(p => {
        const edit = siteEdits[`product:${p.slug}`];
        return `
        <details class="admin-card">
            <summary><span class="font-semibold text-ink">${escapeHtml(p.name)}</span> <span class="text-mute">${escapeHtml(categoryLabel(p.category))}</span>${edit ? ` <span class="admin-badge">Edited${edit.updated_by ? ` by ${escapeHtml(adminName(edit.updated_by))}` : ''}</span>` : ''}</summary>
            <form data-no-prefill onsubmit="saveProductEdit(event, '${p.slug}')" class="grid sm:grid-cols-2 gap-x-6 gap-y-5 pt-5">
                <div class="field sm:col-span-2"><label for="ap-tag-${p.slug}">Tagline</label><input id="ap-tag-${p.slug}" name="tagline" type="text" value="${escapeHtml(p.tagline)}"></div>
                <div class="field sm:col-span-2"><label for="ap-desc-${p.slug}">Description</label><textarea id="ap-desc-${p.slug}" name="description" rows="3">${escapeHtml(p.description)}</textarea></div>
                <div class="sm:col-span-2 flex flex-wrap gap-4 items-center">
                    <button type="submit" class="btn btn-primary min-h-[2.5rem] px-4 text-sm">Save</button>
                    ${edit ? `<button type="button" onclick="resetProductEdit('${p.slug}')" class="link text-sm">Undo edits</button>` : ''}
                </div>
            </form>
        </details>`;
    }).join('')}</div>`;
}

function saveProductEdit(e, slug) {
    e.preventDefault();
    const data = new FormData(e.target);
    saveSiteEdit(`product:${slug}`, { tagline: data.get('tagline').trim(), description: data.get('description').trim() }, 'Product saved.');
}

function resetProductEdit(slug) {
    saveSiteEdit(`product:${slug}`, null, 'Back to the original text.');
}

function renderAdminContent() {
    const edit = siteEdits.event;
    return `
        <form data-no-prefill onsubmit="saveEventEdit(event)" class="admin-card grid gap-5 max-w-3xl">
            <div>
                <h2 class="type-md text-ink">Homepage event</h2>
                <p class="text-sm text-mute mt-1">The event story on the homepage. The photos stay as they are.${edit && edit.updated_by ? ` Last edited by ${escapeHtml(adminName(edit.updated_by))}.` : ''}</p>
            </div>
            <div class="field"><label for="ae-title">Title</label><input id="ae-title" name="title" type="text" required value="${escapeHtml(HOME_EVENT.title)}"></div>
            <div class="field"><label for="ae-date">Date and place</label><input id="ae-date" name="date" type="text" value="${escapeHtml(HOME_EVENT.date)}"></div>
            <div class="field"><label for="ae-text">Story (a blank line between paragraphs)</label><textarea id="ae-text" name="text" rows="12">${escapeHtml(HOME_EVENT.text.join('\n\n'))}</textarea></div>
            <div class="flex flex-wrap gap-4 items-center">
                <button type="submit" class="btn btn-primary min-h-[2.5rem] px-4 text-sm">Save</button>
                <a href="./" data-route="home" class="link text-sm">See the homepage</a>
                ${edit ? '<button type="button" onclick="resetEventEdit()" class="link text-sm">Undo edits</button>' : ''}
            </div>
        </form>`;
}

function saveEventEdit(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    saveSiteEdit('event', { title: data.get('title').trim(), date: data.get('date').trim(), text: data.get('text').split(/\n\s*\n/).map(t => t.trim()).filter(Boolean) }, 'Homepage event saved.');
}

function resetEventEdit() {
    saveSiteEdit('event', null, 'Back to the original event.');
}

// --- Bundles: the costing workbook's Bundles sheet (master admins only), as one table grouped by build with each
// group's cost. Lines can be edited, added and deleted; the database stamps who changed what. Filters, edits and
// saves redraw the results only, so the search box keeps its focus while typing ---
let bundleFilter = { product: '', config: '', type: '', build: '', part: '', q: '' };
// The quick part filters above the table (matched to the sheet's Part column, any case)
const BUNDLE_PARTS = [['', 'All parts'], ['body', 'Body'], ['seat', 'Seat'], ['canopy', 'Canopy']];
let bundleEditing = null; // a line's sheet_row, or { group } for a new line in that group

// The sheet's Option column is kept in the color column; cost_usd is a line's unit cost
const BUNDLE_FIELDS = [['sku', 'SKU'], ['product', 'Product'], ['config', 'Config'], ['type', 'Type'], ['part', 'Part'], ['color', 'Option'],
    ['description', 'Description'], ['qty', 'Qty'], ['cost_usd', 'Cost (USD)']];
let bundleView = 'bundles'; // or 'usd', the USD SKU list

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
function renderAdminBundles(data) {
    const views = [['bundles', 'Bundles'], ['usd', 'USD SKU list']];
    return `
        <div class="bundle-parts mb-8" role="group" aria-label="Show">
            ${views.map(([id, label]) => `<button type="button" aria-pressed="${bundleView === id}" onclick="showBundleView('${id}')">${label}</button>`).join('')}
        </div>
        ${bundleView === 'usd' ? renderSkuUsd(data) : renderBundles(data)}`;
}

function showBundleView(view) {
    bundleView = view;
    bundleEditing = skuUsdEditing = null;
    renderApp();
}

let skuUsdQuery = '';
let skuUsdEditing = null; // a SKU row's sheet_row, or 'new'

function renderSkuUsd({ skuUsd }) {
    if (!skuUsd) return '<p class="measure">The USD SKU list isn\'t in the database yet. Re-run supabase/schema.sql in the Supabase SQL Editor, then supabase/private/bundles-data.sql.</p>';
    if (!skuUsd.length) return '<p class="measure">No USD SKU list loaded yet. Run supabase/private/bundles-data.sql in the Supabase SQL Editor.</p>';
    return `
        <div class="field max-w-md mb-6"><label for="su-q">Search description or SKU</label><input id="su-q" type="search" value="${escapeHtml(skuUsdQuery)}" oninput="setSkuUsdQuery(this.value)"></div>
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
        <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
            <p class="text-sm">${shown.length} SKU${shown.length === 1 ? '' : 's'}</p>
            <button type="button" onclick="editSkuUsd('new')" class="btn btn-outline min-h-[2.5rem] px-4 text-sm">Add a SKU</button>
        </div>
        ${shown.length || skuUsdEditing === 'new' ? `<div class="admin-table-wrap"><table class="admin-table bundle-table">
            <thead><tr><th>SKU</th><th>Description</th><th class="text-right">USD</th><th><span class="sr-only">Actions</span></th></tr></thead>
            <tbody>
                ${skuUsdEditing === 'new' ? renderSkuUsdForm({}) : ''}
                ${shown.map(s => skuUsdEditing === s.sheet_row ? renderSkuUsdForm(s) : `<tr>
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
    return `<tr class="bundle-editing"><td colspan="4">
        <form data-no-prefill onsubmit="saveSkuUsd(event, ${isNew ? 'null' : s.sheet_row})" class="grid sm:grid-cols-[12rem_1fr_10rem] gap-4 items-end">
            <p class="text-sm font-semibold text-ink sm:col-span-3">${isNew ? 'New SKU' : 'Edit SKU'}</p>
            <div class="field"><label for="se-sku">SKU</label><input id="se-sku" name="sku" type="text" value="${escapeHtml(s.sku || '')}"></div>
            <div class="field"><label for="se-description">Description</label><input id="se-description" name="description" type="text" value="${escapeHtml(s.description || '')}"></div>
            <div class="field"><label for="se-usd">USD</label><input id="se-usd" name="usd" type="text" inputmode="decimal" value="${s.usd == null ? '' : Math.round(Number(s.usd) * 100) / 100}"></div>
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
    skuUsdEditing = null;
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
        <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
            ${options('build', 'Build', bundleGroupName)}${options('product', 'Product')}${options('config', 'Config')}${options('type', 'Type')}
            <div class="field"><label for="bf-q">Search description or SKU</label><input id="bf-q" type="search" value="${escapeHtml(bundleFilter.q)}" oninput="setBundleFilter('q', this.value)"></div>
        </div>
        <div class="bundle-parts mb-6" role="group" aria-label="Part">
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
    const cost = lines => lines.some(b => b.cost_usd != null) ? ` · ${formatUsd(lines.reduce((s, b) => s + (bundleLineUsd(b) || 0), 0))}` : '';
    const cols = 8;
    return `
        <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
            <p class="text-sm">${shown.length} line${shown.length === 1 ? '' : 's'} in ${groups.size} group${groups.size === 1 ? '' : 's'}${cost(shown)}</p>
            <button type="button" onclick="addBundleLine(null)" class="btn btn-outline min-h-[2.5rem] px-4 text-sm">Add a line</button>
        </div>
        <div class="admin-table-wrap"><table class="admin-table bundle-table">
            ${[...groups].map(([name, { sample, lines }]) => `<tbody>
                <tr class="bundle-group"><th colspan="${cols}">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <span class="flex flex-wrap items-center gap-2">${renderBundleTags(sample, name)}</span>
                        <button type="button" data-group="${escapeHtml(name)}" onclick="addBundleLine(this.dataset.group)" class="link text-xs">Add a line here</button>
                    </div>
                </th></tr>
                <tr class="bundle-columns"><th scope="col">SKU</th><th scope="col">Part</th><th scope="col">Option</th><th scope="col">Description</th><th scope="col" class="text-right">Qty</th><th scope="col" class="text-right">Cost (USD)</th><th scope="col" class="text-right">Total (USD)</th><th scope="col"><span class="sr-only">Actions</span></th></tr>
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
        <td class="whitespace-nowrap">${escapeHtml(b.sku)}</td>
        <td>${escapeHtml(b.part)}</td>
        <td>${escapeHtml(b.color)}</td>
        <td>${escapeHtml(b.description)}${extra.length ? `<p class="text-xs text-mute mt-1">${extra.map(([col, cell]) => `${col}: ${escapeHtml(bundleExtraText(cell))}`).join(' · ')}</p>` : ''}${edited ? `<p class="text-xs text-mute mt-1">${edited}${b.updated_by ? ` by ${escapeHtml(adminName(b.updated_by))}` : ''}</p>` : ''}</td>
        <td class="text-right">${b.qty == null ? '' : Number(b.qty)}</td>
        <td class="text-right whitespace-nowrap">${formatUsd(b.cost_usd)}</td>
        <td class="text-right whitespace-nowrap">${formatUsd(bundleLineUsd(b))}</td>
        <td class="whitespace-nowrap"><button type="button" onclick="editBundleLine(${b.sheet_row})" class="link text-xs mr-3">Edit</button><button type="button" onclick="deleteBundleLine(${b.sheet_row})" class="link text-xs">Delete</button></td>
    </tr>`;
}

// The edit form for a line, or for a new line (no sheet_row yet), across the whole table row
function renderBundleForm(b, cols) {
    const isNew = b.sheet_row == null;
    return `<tr class="bundle-editing"><td colspan="${cols}">
        <form data-no-prefill onsubmit="saveBundleLine(event, ${isNew ? 'null' : b.sheet_row})" class="grid sm:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <p class="text-sm font-semibold text-ink sm:col-span-3 lg:col-span-6">${isNew ? 'New line' : 'Edit line'}</p>
            ${BUNDLE_FIELDS.map(([key, label]) => `<div class="field${key === 'description' ? ' sm:col-span-3 lg:col-span-3' : ''}"><label for="be-${key}">${label}</label>
                <input id="be-${key}" name="${key}" type="text"${key === 'qty' || key === 'cost_usd' ? ' inputmode="decimal"' : ''} value="${escapeHtml(b[key] == null ? '' : key === 'cost_usd' ? Math.round(Number(b[key]) * 100) / 100 : key === 'qty' ? Number(b[key]) : b[key])}"></div>`).join('')}
            ${b.cost_usd_formula ? `<p class="text-xs text-mute sm:col-span-3 lg:col-span-6">In the sheet this cost came from ${escapeHtml(b.cost_usd_formula)}. Cost is per unit; the total is cost × qty.</p>` : ''}
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
// PDF by the Edge Function quotation-mail, as are the notices for each step. The database's workflow trigger decides
// which step each role may take ---
const QUOTATION_STATUS_LABELS = { draft: 'Draft', submitted: 'Waiting for approval', approved: 'Approved', returned: 'Returned', sent: 'Sent' };
const QUOTATION_TERMS = 'Prices are in Philippine pesos (PHP). This quotation is valid for 15 days from its date. Delivery lead time is confirmed on order.';
// The builder's categories as the bundles name them
const BUNDLE_PRODUCTS = { 'The Golfer': 'Golfcarts', 'Lifestyle & Private Use': 'Lifestyle' };
// Parts a build always carries, whatever was chosen; and parts where exactly one choice applies, matched to a row of the request
const BUNDLE_ALWAYS = new Set(['unit', '2+2 kit', 'stretch kit']);
const BUNDLE_CHOICE_ROWS = { body: 'Body color', seat: 'Seat', canopy: 'Canopy', battery: 'Battery' };
const MATCH_STOPWORDS = new Set(['with', 'and', 'the', 'for', 'of', 'in', 'on', 'kit', 'unit', 'set', 'gc', 'cc', 'club', 'car']);
// The builder and the bundles name some things differently
const MATCH_SYNONYMS = { grey: 'gray', cleaner: 'washer', headlight: 'light', taillight: 'light' };
// Parts whose option is made of several pieces (front and rear body, seat back and bottom), all of them needed
const BUNDLE_MULTIPIECE = new Set(['body', 'seat']);

let quotationOpen = null;   // the id of the quotation shown in the editor
let quotationDraft = null;  // its working copy while it's edited

function rowValue(rows, label) {
    const row = (rows || []).find(([k]) => k === label);
    return row ? String(row[1]) : '';
}

// Words to match on: lower case, inch sizes as "8in", plurals as singulars, filler words dropped
function matchWords(text) {
    return String(text || '').toLowerCase().replace(/(\d+)\s*(?:"|''|in\b|inch(?:es)?\b)/g, '$1in')
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
    const picked = [], unmatched = [];
    for (const [part, options] of parts) {
        const key = part.toLowerCase();
        if (BUNDLE_ALWAYS.has(key) || (key === 'canopy' && options.size === 1 && !rowValue(quote.rows, 'Canopy'))) {
            options.forEach(lines => picked.push(...lines));
            continue;
        }
        const target = BUNDLE_CHOICE_ROWS[key] ? rowValue(quote.rows, BUNDLE_CHOICE_ROWS[key]) : otherText;
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
    picked.sort((a, b) => a.sheet_row - b.sheet_row);
    return { lines: picked.map(bundleToQuotationLine), unmatched };
}

function bundleToQuotationLine(b) {
    return { sheet_row: b.sheet_row, sku: b.sku || '', part: b.part || '', option: b.color || '', description: b.description || '',
        qty: b.qty == null ? 1 : Number(b.qty), cost_usd: b.cost_usd == null ? null : Number(b.cost_usd), price_php: null, manual: false };
}

// A line's peso cost (USD x rate x (1 + freight)) and its unit selling price (that x (1 + margin)), to the centavo
function quotationCostPhp(qt, line) {
    return line.cost_usd == null ? null : Math.round(Number(line.cost_usd) * Number(qt.exchange_rate) * (1 + Number(qt.freight_pct) / 100) * 100) / 100;
}

function quotationFormulaPrice(qt, line) {
    const cost = quotationCostPhp(qt, line);
    return cost == null ? null : Math.round(cost * (1 + Number(qt.margin_pct) / 100) * 100) / 100;
}

// Lines priced by the formula follow the quotation's rate, freight and margin; typed prices stay as typed
function repriceQuotation(qt) {
    qt.lines = qt.lines.map(l => (l.manual ? l : { ...l, price_php: quotationFormulaPrice(qt, l) }));
    return qt;
}

function quotationTotals(qt) {
    const perCart = qt.lines.reduce((s, l) => s + Number(l.price_php || 0) * Number(l.qty == null ? 1 : l.qty), 0);
    const cost = qt.lines.reduce((s, l) => s + Number(quotationCostPhp(qt, l) || 0) * Number(l.qty == null ? 1 : l.qty), 0);
    const units = Number(qt.units || 1), discount = Number(qt.discount_php || 0);
    const total = perCart * units - discount, totalCost = cost * units;
    return { perCart, cost, units, discount, total, totalCost, margin: total ? (total - totalCost) / total * 100 : 0, unpriced: qt.lines.filter(l => l.price_php == null).length };
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
    const suggested = group && pageData.bundles ? suggestBundleLines(quote, group, pageData.bundles) : { lines: [], unmatched: [] };
    const draft = repriceQuotation({
        quote_id: quote.id, reference: quote.reference,
        customer: { name: quote.name, email: quote.email, phone: quote.phone, branch: quote.branch },
        title: [rowValue(quote.rows, 'Model') || quote.model, rowValue(quote.rows, 'Build')].filter(Boolean).join(' · '),
        build_rows: quote.rows || [], build_group: group, units: Math.max(1, parseInt(quote.quantity, 10) || 1), lines: suggested.lines,
        exchange_rate: pricing.exchange_rate, freight_pct: pricing.freight_pct, margin_pct: pricing.margin_pct, terms: QUOTATION_TERMS,
        notes: quote.notes || '', photo: quotationPhoto(quote)
    });
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
                <p class="text-sm text-mute mt-1">A line's price is USD cost × exchange rate × (1 + freight) × (1 + margin). New quotations start with these; each keeps the figures it was priced with.${p.updated_by ? ` Last changed by ${escapeHtml(adminName(p.updated_by))}.` : ''}</p>
            </div>
            ${[['exchange_rate', 'Exchange rate (₱ per $1)'], ['freight_pct', 'Freight %'], ['margin_pct', 'Margin %']].map(([key, label]) => `
                <div class="field"><label for="ps-${key}">${label}</label><input id="ps-${key}" name="${key}" type="text" inputmode="decimal" value="${Number(p[key])}"${can('pricing.edit') ? '' : ' disabled'}></div>`).join('')}
            ${can('pricing.edit') ? '<button type="submit" class="btn btn-primary min-h-[3rem] px-5 text-sm">Save pricing</button>' : '<p class="text-xs text-mute">Set by a master admin.</p>'}
            ${Number(p.margin_pct) === 0 ? '<p class="golfer-error sm:col-span-4">The margin is 0%: quotations would be priced at landed cost.</p>' : ''}
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
        </table></div>` : (quotationFilter ? '<p class="measure">No quotations at this stage.</p>' : '<p class="measure">No quotations yet. In Quote requests, choose <b>Prepare quotation</b> on a request.</p>')}`;
}

async function savePricingSettings(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const values = {};
    for (const key of ['exchange_rate', 'freight_pct', 'margin_pct']) {
        values[key] = parseAmount(String(data.get(key) || ''));
        if (values[key] == null || Number.isNaN(values[key]) || values[key] < 0) { showToast('Enter numbers for the rate, freight and margin.'); return; }
    }
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
    const editable = qt.status === 'draft' || qt.status === 'returned';
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
            <div class="field"><label for="qe-rate">Exchange rate</label>${editable ? `<input id="qe-rate" type="text" inputmode="decimal" value="${qt.exchange_rate}" onchange="setQuotationNumber('exchange_rate', this.value)">` : `<p>${qt.exchange_rate}</p>`}</div>
            <div class="field"><label for="qe-freight">Freight %</label>${editable ? `<input id="qe-freight" type="text" inputmode="decimal" value="${qt.freight_pct}" onchange="setQuotationNumber('freight_pct', this.value)">` : `<p>${qt.freight_pct}</p>`}</div>
            <div class="field"><label for="qe-margin">Margin %</label>${editable ? `<input id="qe-margin" type="text" inputmode="decimal" value="${qt.margin_pct}" onchange="setQuotationNumber('margin_pct', this.value)">` : `<p>${qt.margin_pct}</p>`}</div>
        </div>
        ${editable && qt.build_group ? `<p class="text-sm mt-3"><button type="button" onclick="rebuildQuotationLines()" class="link">Fill lines from this bundle again</button> <span class="text-mute">(replaces the lines below with the ones the request's build points at)</span></p>` : ''}

        <div class="admin-table-wrap mt-6"><table class="admin-table bundle-table">
            <thead><tr><th>SKU</th><th>Part</th><th>Option</th><th>Description</th><th class="text-right">Qty</th><th class="text-right">Cost (USD)</th><th class="text-right">Cost (₱)</th><th class="text-right">Price (₱)</th><th class="text-right">Amount (₱)</th>${editable ? '<th><span class="sr-only">Remove</span></th>' : ''}</tr></thead>
            <tbody>${qt.lines.map((l, i) => `<tr>
                <td class="whitespace-nowrap">${escapeHtml(l.sku)}</td>
                <td>${escapeHtml(l.part)}</td>
                <td>${escapeHtml(l.option)}</td>
                <td>${escapeHtml(l.description)}</td>
                <td class="text-right">${num(`setQuotationLine(${i}, 'qty', this.value)`, l.qty)}</td>
                <td class="text-right whitespace-nowrap">${formatUsd(l.cost_usd)}</td>
                <td class="text-right whitespace-nowrap text-mute">${formatPhp(quotationCostPhp(qt, l))}</td>
                <td class="text-right whitespace-nowrap">${editable ? num(`setQuotationLine(${i}, 'price_php', this.value)`, l.price_php) : formatPhp(l.price_php)}${l.manual ? `<p class="text-xs text-mute">typed${editable ? ` · <button type="button" onclick="useFormulaPrice(${i})" class="link">use formula</button>` : ''}</p>` : ''}${l.price_php == null ? '<p class="golfer-error text-xs">No price</p>' : ''}</td>
                <td class="text-right whitespace-nowrap">${formatPhp(Number(l.price_php || 0) * Number(l.qty == null ? 1 : l.qty))}</td>
                ${editable ? `<td><button type="button" onclick="removeQuotationLine(${i})" class="link text-xs">Remove</button></td>` : ''}
            </tr>`).join('') || `<tr><td colspan="10" class="text-mute">No lines yet.</td></tr>`}</tbody>
        </table></div>
        ${editable ? `<div class="flex flex-wrap gap-4 items-end mt-4">
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
                <div class="quotation-total"><dt>Total</dt><dd>${formatPhp(t.total)}</dd></div>
                <div class="text-mute"><dt>Landed cost</dt><dd>${formatPhp(t.totalCost)}</dd></div>
                <div class="text-mute"><dt>Margin</dt><dd>${t.total ? `${t.margin.toFixed(1)}%` : ''}</dd></div>
            </dl>
        </div>
        ${t.unpriced ? `<p class="golfer-error mt-4">${t.unpriced} line${t.unpriced === 1 ? ' has' : 's have'} no price yet.</p>` : ''}

        <div class="quotation-actions mt-8">
            ${editable ? `<button type="button" onclick="saveQuotation()" class="btn btn-outline min-h-[2.75rem] px-5 text-sm"${dirty ? '' : ' disabled'}>Save draft</button>
                <button type="button" onclick="saveQuotation('submitted')" class="btn btn-primary min-h-[2.75rem] px-5 text-sm"${t.unpriced || !qt.lines.length ? ' disabled' : ''}>Submit for approval</button>` : ''}
            ${qt.status === 'submitted' && can('quotations.approve') ? `
                <button type="button" onclick="reviewQuotation('approved')" class="btn btn-primary min-h-[2.75rem] px-5 text-sm">Approve</button>
                <button type="button" onclick="reviewQuotation('returned')" class="btn btn-outline min-h-[2.75rem] px-5 text-sm">Return with a note</button>` : ''}
            ${qt.status === 'submitted' && !can('quotations.approve') ? '<p class="text-sm text-mute">Waiting for a master admin to approve it.</p>' : ''}
            ${qt.status === 'approved' ? `<button type="button" onclick="sendQuotation()" class="btn btn-primary min-h-[2.75rem] px-5 text-sm">Send to ${escapeHtml(c.email || 'the customer')}</button>` : ''}
            ${qt.status === 'submitted' || qt.status === 'approved' ? `<button type="button" onclick="reopenQuotation()" class="link text-sm">Edit (needs approval again)</button>` : ''}
            <button type="button" onclick="previewQuotation()" class="btn btn-outline min-h-[2.75rem] px-5 text-sm">Preview PDF</button>
            ${can('quotes.delete') && qt.status !== 'sent' ? `<button type="button" onclick="deleteQuotation()" class="link text-sm">Delete</button>` : ''}
        </div>
        ${dirty && editable ? '<p class="text-xs text-mute mt-3">Unsaved changes. The PDF preview shows the last saved version.</p>' : ''}
        ${renderQuotationEmails(qt)}`;
}

function setQuotationNumber(key, text) {
    const value = parseAmount(text);
    if (value == null || Number.isNaN(value) || value < 0 || (key === 'units' && (value < 1 || !Number.isInteger(value)))) { showToast('Enter a number.'); renderApp(); return; }
    quotationDraft[key] = value;
    if (['exchange_rate', 'freight_pct', 'margin_pct'].includes(key)) repriceQuotation(quotationDraft);
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
        quotationDraft.lines.push({ sheet_row: null, sku: '', part, option: '', description, qty: 1, cost_usd: null, price_php: null, manual: true });
    } else {
        const b = pageData.bundles.find(x => x.sheet_row === Number(value));
        if (!b) return;
        const line = bundleToQuotationLine(b);
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
    const suggested = suggestBundleLines(quote, quotationDraft.build_group, pageData.bundles || []);
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

async function writeQuotation(change, message) {
    const { data: saved, error } = await sb.from('quotations').update(change).eq('id', quotationOpen).select().single();
    if (error) { showToast(`Not saved: ${error.message}`); return false; }
    pageData.quotations = pageData.quotations.map(x => x.id === saved.id ? saved : x);
    quotationDraft = JSON.parse(JSON.stringify(saved));
    renderApp();
    showToast(message);
    return true;
}

function saveQuotation(status) {
    return writeQuotation({ ...quotationContent(quotationDraft), ...(status ? { status } : {}) },
        status === 'submitted' ? 'Submitted for approval.' : 'Draft saved.');
}

function reviewQuotation(status) {
    let note = '';
    if (status === 'returned') {
        note = prompt('What should be changed?');
        if (note == null || !note.trim()) return;
    }
    return writeQuotation({ status, review_note: note.trim() }, status === 'approved' ? 'Approved. It can now be sent to the customer.' : 'Returned to the sales manager.');
}

function reopenQuotation() {
    if (!confirm('Edit this quotation? It goes back to draft and needs approval again.')) return;
    return writeQuotation({ status: 'draft' }, 'Back to draft.');
}

async function deleteQuotation() {
    if (!confirm(`Delete quotation ${quotationDraft.reference}? This can't be undone.`)) return;
    const { error } = await sb.from('quotations').delete().eq('id', quotationOpen);
    if (error) { showToast(`Not deleted: ${error.message}`); return; }
    pageData.quotations = pageData.quotations.filter(x => x.id !== quotationOpen);
    closeQuotation();
    showToast('Quotation deleted.');
}

// The Edge Function quotation-mail (supabase/functions/quotation-mail) makes the PDF and sends the emails; it
// checks this sign-in against the staff list itself
const QUOTATION_MAIL_URL = `${SUPABASE_URL}/functions/v1/quotation-mail`;
const EMAIL_KINDS = { quotation_submitted: 'Approval request to master admins', quotation_approved: 'Approved notice to the sales manager',
    quotation_returned: 'Returned notice to the sales manager', quotation_sent: 'Quotation to the customer' };
const quotationEmails = {}; // quotation id -> its email_log rows

async function quotationMail(action) {
    const { data } = await sb.auth.getSession();
    const token = data.session && data.session.access_token;
    if (!token) throw new Error('sign in again.');
    const res = await fetch(QUOTATION_MAIL_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id: quotationOpen })
    });
    if (res.ok && (res.headers.get('content-type') || '').includes('application/pdf')) return res.blob();
    if (res.status === 404) throw new Error('the quotation-mail function isn\'t deployed in Supabase yet.');
    let result = {};
    try { result = await res.json(); } catch (err) { /* no JSON: the status says enough */ }
    if (!res.ok || !result.ok) throw new Error(result.error || `the email service answered ${res.status}.`);
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
        : !log.length ? `<p class="text-sm text-mute">No emails yet${qt.status === 'sent' ? '. If none appears within a minute, check the quotation-mail function in Supabase.' : '.'}</p>`
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
        const url = URL.createObjectURL(await quotationMail('preview'));
        if (win) win.location = url; else window.open(url, '_blank');
    } catch (err) {
        if (win) win.close();
        showToast(`The PDF could not be made: ${err.message}`);
    }
}

// Marking it sent is what emails it: the database tells quotation-mail, which sends the PDF and logs the email
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

function exportAdminQuotes() {
    if (!pageData || !pageData.quotes) return;
    const exported = new Date().toISOString();
    downloadJson({ exported, by: currentAdmin().email, quotes: pageData.quotes }, `golfcarts-quotes-${exported.slice(0, 10)}.json`);
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeGolferModal(); });
window.addEventListener('DOMContentLoaded', refreshGolferUI);
