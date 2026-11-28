-- Golfcarts.ph database (Supabase / Postgres)
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste this file -> Run.
-- It is safe to run again: it drops and recreates the policies, triggers and functions, and keeps existing rows.
--
-- Who can do what (enforced here, by the database, not by the page):
--   anyone (no account)  send a quote; read the product and homepage edits
--   golfer (member)      their own profile, saved builds and quotes
--   sales manager        read all quotes, golfers and builds; change a quote's status; copy news emails; read the
--                        bundles and pricing; prepare quotations and submit them for approval, send approved ones
--   price manager        read quotes and quotations; edit bundles and pricing settings; approve or return
--                        submitted quotations (and change nothing else on them)
--   marketing            edit products (photos, text, specs), accessory photos and site content
--   super admin          everything: all of the above, plus delete quotes, manage staff, read the activity log
--                        ('master' in the database)
-- Staff are matched by the email they signed in with (see staff below), so the email must be verified: keep
-- "Confirm email" on in Authentication -> Providers -> Email, and use Google sign-in for staff.

-- ---------- Staff: who can use the admin, and as what ----------
create table if not exists public.staff (
    email text primary key check (email = lower(email)),
    role text not null check (role in ('master', 'pricing', 'sales', 'marketing')),
    added_at timestamptz not null default now()
);
-- Marketing (2026-11-05) and price manager (2026-11-06): a table made before them allowed fewer roles
alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff add constraint staff_role_check check (role in ('master', 'pricing', 'sales', 'marketing'));

-- The first staff. Afterwards, super admins change people in the admin's Staff page; running this file again adds
-- anyone missing and leaves the others' roles as they are.
insert into public.staff (email, role) values
    ('donnavalonda@sjkguahan.com', 'master'),
    ('jrowel_algo@sjkguahan.com', 'master'),
    ('jamesugarte@sjkguahan.com', 'master'),
    ('matthew@sjkguahan.com', 'pricing'),
    ('jerusvergara@sjkguahan.com', 'sales'),
    ('jasperbuiza@sjkguahan.com', 'sales'),
    ('michael.serna@sjkguahan.com', 'marketing'),
    ('carlovaldez@sjkguahan.com', 'marketing')
on conflict (email) do nothing;
-- 2026-11-06: Matt moves from super admin to price manager. If he is made a super admin again later, delete this
-- line, or running the file again moves him back.
update public.staff set role = 'pricing' where email = 'matthew@sjkguahan.com' and role = 'master';

-- The page builder (2026-11-16): adding, moving and publishing sections on the site's pages (account.js, "Build this
-- page"). Given person by person, on top of the role; Donna only for now. To give it to someone else:
--   update public.staff set page_builder = true where email = '...';
alter table public.staff add column if not exists page_builder boolean not null default false;
update public.staff set page_builder = true where email = 'donnavalonda@sjkguahan.com';

-- The signed-in person's staff role ('master', 'pricing', 'sales', 'marketing'), or null for golfers and visitors.
-- security definer: it reads staff without going through staff's own policies (which call this function).
create or replace function public.staff_role() returns text
language sql stable security definer set search_path = public as $$
    select role from public.staff where email = lower(auth.jwt() ->> 'email')
$$;

-- Whether an email is on staff (yes / no only), so Be a Golfer's sign-up can send staff to the admin instead of
-- asking for a member's name and number. Anyone may ask; it reveals nothing else about the staff list.
create or replace function public.is_staff_email(check_email text) returns boolean
language sql stable security definer set search_path = public as $$
    select exists (select 1 from public.staff where email = lower(trim(check_email)))
$$;
grant execute on function public.is_staff_email(text) to anon, authenticated;

-- Whether the signed-in person may use the page builder (staff.page_builder, above)
create or replace function public.page_builder() returns boolean
language sql stable security definer set search_path = public as $$
    select coalesce((select page_builder from public.staff where email = lower(auth.jwt() ->> 'email')), false)
$$;

-- ---------- Golfers (members): one profile per member account ----------
create table if not exists public.golfers (
    id uuid primary key references auth.users (id) on delete cascade,
    name text not null,
    email text not null,
    phone text not null default '',
    news boolean not null default true,
    joined_at timestamptz not null default now()
);

-- A new account gets its golfer profile from the sign-up form (name, phone, news are sent as user metadata).
-- Staff emails don't: staff are not members.
create or replace function public.create_golfer_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    if exists (select 1 from public.staff where email = lower(new.email)) then return new; end if;
    insert into public.golfers (id, name, email, phone, news)
    values (new.id,
            coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
            lower(new.email),
            coalesce(new.raw_user_meta_data ->> 'phone', ''),
            coalesce((new.raw_user_meta_data ->> 'news')::boolean, true))
    on conflict (id) do nothing;
    return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
    for each row execute function public.create_golfer_profile();

-- ---------- Saved builds ----------
create table if not exists public.saved_builds (
    id uuid primary key default gen_random_uuid(),
    golfer_id uuid not null default auth.uid() references public.golfers (id) on delete cascade,
    slug text not null,
    title text not null,
    photo text not null default '',
    rows jsonb not null default '[]',
    saved_at timestamptz not null default now()
);

-- ---------- Quotes: every request from the website (the customer and staff are emailed by quotation-mail) ----------
create table if not exists public.quotes (
    id bigint generated always as identity primary key,
    reference text not null,
    -- Set by the page for a logged-in golfer; null for visitors and staff
    golfer_id uuid references public.golfers (id) on delete set null,
    source text not null default '',
    name text not null,
    email text not null,
    phone text not null default '',
    model text not null default '',
    quantity text not null default '',
    branch text not null default '',
    notes text not null default '',
    rows jsonb not null default '[]',
    status text not null default 'New' check (status in ('New', 'Contacted', 'Quoted', 'Sold', 'Lost')),
    status_by text,
    status_at timestamptz,
    created_at timestamptz not null default now()
);
create index if not exists quotes_created_at on public.quotes (created_at desc);
create index if not exists quotes_golfer_id on public.quotes (golfer_id);

-- Who changed a status, and when, comes from the sign-in, not from the page
create or replace function public.stamp_quote_status() returns trigger
language plpgsql as $$
begin
    if new.status is distinct from old.status then
        new.status_by := lower(auth.jwt() ->> 'email');
        new.status_at := now();
    end if;
    return new;
end $$;

drop trigger if exists quotes_stamp_status on public.quotes;
create trigger quotes_stamp_status before update on public.quotes
    for each row execute function public.stamp_quote_status();

-- ---------- Site edits: product text/prices ('product:<slug>') and the homepage event ('event') ----------
create table if not exists public.site_edits (
    key text primary key,
    value jsonb not null,
    updated_by text,
    updated_at timestamptz not null default now()
);

create or replace function public.stamp_site_edit() returns trigger
language plpgsql as $$
begin
    new.updated_by := lower(auth.jwt() ->> 'email');
    new.updated_at := now();
    return new;
end $$;

drop trigger if exists site_edits_stamp on public.site_edits;
create trigger site_edits_stamp before insert or update on public.site_edits
    for each row execute function public.stamp_site_edit();

-- ---------- Bundles: the Bundles sheet of the costing workbook (Versions costing), one row per sheet row ----------
-- Supplier landed costs, so master admins only. The data is loaded from a private file (supabase/private/), never
-- from this one. Columns A-I of the sheet have their own columns; the sheet's formulas for SKU and Total are kept
-- as text; every other cell of the row (the side tables in columns K-V, error cells) is in extra as
-- {"<column>": {"v": value, "f": formula, "e": error}}.
create table if not exists public.bundles (
    sheet_row int primary key,
    product text,
    config text,
    type text,
    part text,
    color text,
    description text,
    sku text,
    sku_formula text,
    qty numeric,
    total_php numeric,
    total_formula text,
    extra jsonb not null default '{}'
);
-- Edited in the admin: lines added there are marked 'admin' (the sheet's own are 'sheet'), and every change is
-- stamped with who made it and when. total_php is the line's cost; total_formula stays as the sheet had it.
alter table public.bundles add column if not exists source text not null default 'sheet';
alter table public.bundles add column if not exists updated_by text;
alter table public.bundles add column if not exists updated_at timestamptz;

-- From "Bundles and USD sku list": the sheet's Option column is kept in color; cost_usd is a line's unit cost in USD
-- (the sheet's USD column), and its formula is kept as text. total_php stays as the sheet had it, unused by the admin.
alter table public.bundles add column if not exists cost_usd numeric;
alter table public.bundles add column if not exists cost_usd_formula text;
-- The cost's currency (2026-11-17): 'USD', or 'PHP' for a local brand's part (the sheet's "Pesos" lines), whose cost is
-- in pesos and goes into quotations without the exchange rate or freight
alter table public.bundles add column if not exists currency text not null default 'USD';
alter table public.bundles drop constraint if exists bundles_currency_check;
alter table public.bundles add constraint bundles_currency_check check (currency in ('USD', 'PHP'));

-- A photo for the line (2026-11-11), uploaded in the admin; a line without one shows its SKU's photo
alter table public.bundles add column if not exists photo text not null default '';

drop trigger if exists bundles_stamp on public.bundles;
create trigger bundles_stamp before insert or update on public.bundles
    for each row execute function public.stamp_site_edit();

-- ---------- USD SKU list: the usd sheet of "Bundles and USD sku list" (description, SKU, USD cost) ----------
-- Supplier costs, so master admins only; loaded from the same private file as the bundles
create table if not exists public.sku_usd (
    sheet_row int primary key,
    description text,
    sku text,
    usd numeric,
    extra jsonb not null default '{}'
);
-- Edited in the admin like the bundles: SKUs added there are 'admin', and every change is stamped
alter table public.sku_usd add column if not exists source text not null default 'sheet';
alter table public.sku_usd add column if not exists updated_by text;
alter table public.sku_usd add column if not exists updated_at timestamptz;

-- The item's photo (2026-11-11), uploaded in the admin's USD SKU list
alter table public.sku_usd add column if not exists photo text not null default '';

drop trigger if exists sku_usd_stamp on public.sku_usd;
create trigger sku_usd_stamp before insert or update on public.sku_usd
    for each row execute function public.stamp_site_edit();

-- ---------- Quotations: a priced offer for a quote request, built from the bundles ----------
-- A sales manager (or master admin) prepares it from the request's build, prices it in pesos, and submits it; a
-- the GM or sales manager approves it or returns it with a note, by its margin (quotation_approvers below); once
-- approved it is sent to the customer as a PDF (by the
-- Apps Script, which loads it from here with the sender's sign-in). The workflow is enforced by the trigger below.

-- Which model page a request came from, so its quotation can find the bundle for that model
alter table public.quotes add column if not exists slug text;

-- How a USD cost becomes a peso price: USD x exchange rate x (1 + freight %) is the landed cost, net of VAT; the price,
-- VAT inclusive, is that / (1 - margin %) x 1.12 (2026-11-16, account.js quotationFormulaPrice). One row, set by
-- master admins; each quotation keeps the figures it was priced with.
create table if not exists public.pricing_settings (
    id int primary key default 1 check (id = 1),
    exchange_rate numeric not null default 64,
    freight_pct numeric not null default 13,
    margin_pct numeric not null default 0,
    updated_by text,
    updated_at timestamptz
);
insert into public.pricing_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists pricing_settings_stamp on public.pricing_settings;
create trigger pricing_settings_stamp before insert or update on public.pricing_settings
    for each row execute function public.stamp_site_edit();

create table if not exists public.quotations (
    id bigint generated always as identity primary key,
    quote_id bigint references public.quotes (id) on delete set null,
    reference text not null,
    status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'returned', 'sent')),
    -- The customer as on the request: { name, email, phone, branch }
    customer jsonb not null default '{}',
    -- The build as on the request ([label, value] rows), its title, and the bundle group it was priced from
    title text not null default '',
    build_rows jsonb not null default '[]',
    build_group text,
    units int not null default 1 check (units > 0),
    -- [{ sku, part, option, description, qty, cost_usd, price_php, manual }]: price_php is the unit selling price;
    -- manual means a person typed it rather than the rate, freight and margin working it out
    lines jsonb not null default '[]',
    exchange_rate numeric not null,
    freight_pct numeric not null,
    margin_pct numeric not null,
    discount_php numeric not null default 0,
    notes text not null default '',
    terms text not null default '',
    prepared_by text,
    created_at timestamptz not null default now(),
    updated_by text,
    updated_at timestamptz,
    submitted_by text,
    submitted_at timestamptz,
    reviewed_by text,
    reviewed_at timestamptz,
    review_note text not null default '',
    sent_by text,
    sent_at timestamptz
);
create index if not exists quotations_quote_id on public.quotations (quote_id);

-- Who may approve a submitted quotation, by its margin (2026-11-11, the margin hierarchy for carts): under 15%, the
-- GM; 15 to 25%, the sales manager or the GM; over 25%, the Sales Executive, so submitting approves it. Set when it
-- is submitted; empty when it was approved on submit.
alter table public.quotations add column if not exists approvers text[] not null default '{}';

-- A quotation's gross profit after any discount, as the admin and the PSS show it (2026-11-16): the total includes
-- 12% VAT, so (total / 1.12 - landed cost) / (total / 1.12), in %. Landed cost is USD x rate x (1 + freight), to the
-- centavo, per line; a local part's (currency PHP) is its peso cost as it is
create or replace function public.quotation_margin(q public.quotations) returns numeric
language sql immutable as $$
    with per_cart as (
        select coalesce(sum(coalesce((l ->> 'price_php')::numeric, 0) * coalesce((l ->> 'qty')::numeric, 1)), 0) as price,
               coalesce(sum(coalesce(case when l ->> 'currency' = 'PHP' then round((l ->> 'cost_usd')::numeric, 2)
                   else round((l ->> 'cost_usd')::numeric * q.exchange_rate * (1 + q.freight_pct / 100), 2) end, 0)
                   * coalesce((l ->> 'qty')::numeric, 1)), 0) as cost
        from jsonb_array_elements(q.lines) as l
    )
    select case when price * q.units - q.discount_php = 0 then 0
        else ((price * q.units - q.discount_php) / 1.12 - cost * q.units) / ((price * q.units - q.discount_php) / 1.12) * 100 end
    from per_cart
$$;

create or replace function public.quotation_approvers(margin numeric) returns text[]
language sql immutable as $$
    select case
        when margin < 15 then array['jamesugarte@sjkguahan.com']                                  -- GM
        when margin <= 25 then array['jerusvergara@sjkguahan.com', 'jamesugarte@sjkguahan.com']   -- sales manager, or the GM
        else '{}'::text[]                                                                        -- the Sales Executive
    end
$$;

-- The workflow: draft -> submitted -> approved (by margin, above) -> sent, or submitted -> returned -> draft. Changing
-- the content of a submitted or approved quotation takes it back to draft, so a changed price is approved again.
-- A sent quotation no longer changes. Who did what, and when, is stamped from the sign-in. The exchange rate and
-- freight come from the pricing settings (set by accounting, the price manager) and don't change on a quotation.
create or replace function public.quotation_workflow() returns trigger
language plpgsql as $$
declare
    who text := lower(auth.jwt() ->> 'email');
    role text := public.staff_role();
    changed boolean;
begin
    if role is null or role = 'marketing' then raise exception 'Only staff who price quotations can change them'; end if;
    if tg_op = 'INSERT' then
        if role = 'pricing' then raise exception 'Sales managers prepare quotations'; end if;
        if new.status <> 'draft' then raise exception 'A new quotation starts as a draft'; end if;
        select exchange_rate, freight_pct into new.exchange_rate, new.freight_pct from public.pricing_settings where id = 1;
        new.approvers := '{}';
        new.prepared_by := who;
        new.updated_by := who; new.updated_at := now();
        new.submitted_by := null; new.submitted_at := null; new.reviewed_by := null; new.reviewed_at := null;
        new.sent_by := null; new.sent_at := null; new.review_note := '';
        return new;
    end if;
    if old.status = 'sent' then
        -- Its quote request being deleted (2026-11-18): the foreign key only unlinks it (quote_id set to null), and
        -- nothing else on it changes. Without this, a request with a sent quotation (a test one) couldn't be deleted
        if old.quote_id is not null and new.quote_id is null then
            new := old;
            new.quote_id := null;
            return new;
        end if;
        raise exception 'This quotation was sent to the customer and can no longer change';
    end if;
    -- Stamps are the trigger's to set
    new.prepared_by := old.prepared_by; new.created_at := old.created_at;
    new.submitted_by := old.submitted_by; new.submitted_at := old.submitted_at;
    new.reviewed_by := old.reviewed_by; new.reviewed_at := old.reviewed_at;
    new.sent_by := old.sent_by; new.sent_at := old.sent_at;
    new.approvers := old.approvers;
    -- Set by accounting: a quotation keeps the rate and freight it was created with
    new.exchange_rate := old.exchange_rate; new.freight_pct := old.freight_pct;
    changed := (new.customer, new.title, new.build_rows, new.build_group, new.units, new.lines, new.exchange_rate,
                new.freight_pct, new.margin_pct, new.discount_php, new.notes, new.terms, new.quote_id, new.reference)
        is distinct from (old.customer, old.title, old.build_rows, old.build_group, old.units, old.lines, old.exchange_rate,
                old.freight_pct, old.margin_pct, old.discount_php, old.notes, old.terms, old.quote_id, old.reference);
    -- The price manager (accounting) sets the rate and freight in the pricing settings, and doesn't change quotations
    if role = 'pricing' then raise exception 'Quotations are prepared by sales and approved by the sales manager or the GM'; end if;
    if new.status = old.status then
        if changed and old.status in ('submitted', 'approved') then new.status := 'draft'; end if;
        new.review_note := old.review_note;
    elsif new.status = 'submitted' then
        if old.status not in ('draft', 'returned') then raise exception 'Only a draft can be submitted'; end if;
        new.submitted_by := who; new.submitted_at := now();
        new.review_note := old.review_note;
        new.approvers := public.quotation_approvers(public.quotation_margin(new));
        -- Over 25%: the Sales Executive's own approval, given by submitting it
        if cardinality(new.approvers) = 0 then
            new.status := 'approved';
            new.reviewed_by := who; new.reviewed_at := now();
            new.review_note := '';
        end if;
    elsif new.status in ('approved', 'returned') then
        if not (who = any(old.approvers)) then raise exception 'At this margin, only % can approve or return this quotation', array_to_string(old.approvers, ' or '); end if;
        if old.status <> 'submitted' then raise exception 'Only a submitted quotation can be approved or returned'; end if;
        if changed then raise exception 'Approve or return the quotation as it was submitted'; end if;
        new.reviewed_by := who; new.reviewed_at := now();
        if new.status = 'approved' then new.review_note := coalesce(new.review_note, ''); end if;
    elsif new.status = 'sent' then
        if old.status <> 'approved' then raise exception 'Only an approved quotation can be sent'; end if;
        if changed then raise exception 'Send the quotation as it was approved'; end if;
        new.sent_by := who; new.sent_at := now();
        new.review_note := old.review_note;
    elsif new.status = 'draft' then
        new.review_note := old.review_note;
    end if;
    new.updated_by := who; new.updated_at := now();
    return new;
end $$;

drop trigger if exists quotations_workflow on public.quotations;
create trigger quotations_workflow before insert or update on public.quotations
    for each row execute function public.quotation_workflow();

-- Quotations already waiting for approval when the margin rule arrived (2026-11-11) get their approvers. The triggers
-- are off for this one update: it changes nothing else, and the workflow would refuse a change with no sign-in
alter table public.quotations disable trigger user;
update public.quotations q set approvers = public.quotation_approvers(public.quotation_margin(q))
    where status = 'submitted' and cardinality(approvers) = 0;
alter table public.quotations enable trigger user;

-- The model photo for the quotation PDF (a path on the website, e.g. image/Products/builds/golfer-2-golfer.jpg)
alter table public.quotations add column if not exists photo text not null default '';
-- The PDF's page 2 and 3, filled in by the admin when the quotation is saved: the warranty (copied from the pricing
-- settings) and pdf_extra = { specs: [[label, value]], offers: [{ group, name, image }] }, the model's specifications
-- and upgrades it can take. A line in `lines` with "upgrade": true gets its own price; the others are one package price.
alter table public.quotations add column if not exists warranty text not null default '';
alter table public.quotations add column if not exists pdf_extra jsonb not null default '{}';
-- The warranty every quotation carries, set by master admins in the admin's pricing settings
alter table public.pricing_settings add column if not exists warranty text not null default '';

-- The PSS (Product Specification Sheet) of a quotation, editable in the admin (2026-11-26): delivery, local costs,
-- payment split, serial numbers and the other details only known after approval. Kept apart from the quotation, so
-- it can still change once the quotation is approved or sent (the quotation itself is locked by then).
-- Sales managers and super admins edit it; the price manager reads it. Safe to run again.
create table if not exists public.quotation_pss (
    quotation_id bigint primary key references public.quotations (id) on delete cascade,
    data jsonb not null default '{}',
    updated_by text,
    updated_at timestamptz
);

create or replace function public.quotation_pss_stamp() returns trigger
language plpgsql as $$
begin
    new.updated_by := lower(auth.jwt() ->> 'email');
    new.updated_at := now();
    return new;
end $$;

drop trigger if exists quotation_pss_stamp on public.quotation_pss;
create trigger quotation_pss_stamp before insert or update on public.quotation_pss
    for each row execute function public.quotation_pss_stamp();

alter table public.quotation_pss enable row level security;
drop policy if exists quotation_pss_read on public.quotation_pss;
create policy quotation_pss_read on public.quotation_pss for select to authenticated
    using (public.staff_role() in ('master', 'pricing', 'sales'));
drop policy if exists quotation_pss_insert on public.quotation_pss;
create policy quotation_pss_insert on public.quotation_pss for insert to authenticated
    with check (public.staff_role() in ('master', 'sales'));
drop policy if exists quotation_pss_update on public.quotation_pss;
create policy quotation_pss_update on public.quotation_pss for update to authenticated
    using (public.staff_role() in ('master', 'sales')) with check (public.staff_role() in ('master', 'sales'));


-- ---------- Emails: sent by the Google Apps Script google-apps-script/golfcarts-mail.gs, from a Google account ----------
-- The database tells the script when something happened (a quote request arrives; a quotation is submitted,
-- approved, returned or sent): it posts the record and the staff email lists to the script's web app address, with a
-- secret only the two of them know. Both live in Vault: "mail_script_url" (the web app's /exec address) and
-- "notify_secret" (the same as the script's NOTIFY_SECRET property). The script reports each email back through
-- log_mail, with the same secret, and staff see them in the admin.
create extension if not exists pg_net;

create table if not exists public.email_log (
    id bigint generated always as identity primary key,
    kind text not null,          -- request_received, request_staff, quotation_submitted, quotation_approved, quotation_returned, quotation_sent
    ref_table text not null,     -- quotes or quotations
    ref_id bigint not null,
    to_addresses text not null,
    status text not null check (status in ('sent', 'failed')),
    error text not null default '',
    created_at timestamptz not null default now()
);
create index if not exists email_log_ref on public.email_log (ref_table, ref_id);

-- Tells the script about an event; does nothing until both Vault secrets are set, and never stops the change itself
create or replace function public.notify_mail(event text, ref_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare
    secret text;
    script_url text;
    rec jsonb;
begin
    select decrypted_secret into secret from vault.decrypted_secrets where name = 'notify_secret' limit 1;
    select decrypted_secret into script_url from vault.decrypted_secrets where name = 'mail_script_url' limit 1;
    if secret is null or script_url is null then return; end if;
    if event in ('quote_created', 'quote_zoho') then
        select to_jsonb(q) into rec from public.quotes q where q.id = ref_id;
    else
        select to_jsonb(q) into rec from public.quotations q where q.id = ref_id;
    end if;
    perform net.http_post(
        url := script_url,
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object('secret', secret, 'event', event, 'id', ref_id, 'record', rec,
            'staff', jsonb_build_object(
                -- "master": who approves (super admins and the price manager), so the script asks them
                'master', coalesce((select jsonb_agg(email order by email) from public.staff where role in ('master', 'pricing')), '[]'::jsonb),
                'sales', coalesce((select jsonb_agg(email order by email) from public.staff where role = 'sales'), '[]'::jsonb),
                -- "admins": the super admins only (2026-11-13: they also get each new quote request and service booking)
                'admins', coalesce((select jsonb_agg(email order by email) from public.staff where role = 'master'), '[]'::jsonb)))
    );
exception when others then
    raise warning 'mail script not notified: %', sqlerrm;
end $$;
revoke execute on function public.notify_mail(text, bigint) from public, anon, authenticated;

-- The script logs each email it sent (or failed to send). Callable without a sign-in, so the secret is required.
create or replace function public.log_mail(secret text, kind text, ref_table text, ref_id bigint, to_addresses text, status text, error text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
    if secret is null or secret is distinct from (select decrypted_secret from vault.decrypted_secrets where name = 'notify_secret' limit 1) then
        raise exception 'Not allowed';
    end if;
    insert into public.email_log (kind, ref_table, ref_id, to_addresses, status, error)
    values (left(kind, 60), ref_table, ref_id, left(to_addresses, 1000), status, left(coalesce(error, ''), 1000));
end $$;
revoke execute on function public.log_mail(text, text, text, bigint, text, text, text) from public;
grant execute on function public.log_mail(text, text, text, bigint, text, text, text) to anon, authenticated;

create or replace function public.quote_created_mail() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    -- Waits for the script to send it to Zoho CRM (zoho_leads below); never stops the request itself
    begin
        insert into public.zoho_leads (quote_id, reference, name, model) values (new.id, new.reference, new.name, new.model)
        on conflict (quote_id) do nothing;
    exception when others then
        raise warning 'zoho lead not queued: %', sqlerrm;
    end;
    perform public.notify_mail('quote_created', new.id);
    return new;
end $$;

drop trigger if exists quotes_mail on public.quotes;
create trigger quotes_mail after insert on public.quotes
    for each row execute function public.quote_created_mail();

create or replace function public.quotation_status_mail() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    if new.status is distinct from old.status and new.status in ('submitted', 'approved', 'returned', 'sent') then
        perform public.notify_mail('quotation_' || new.status, new.id);
    end if;
    return new;
end $$;

drop trigger if exists quotations_mail on public.quotations;
create trigger quotations_mail after update on public.quotations
    for each row execute function public.quotation_status_mail();

-- ---------- Zoho CRM Leads: each quote request becomes a Lead, sent by the same Apps Script ----------
-- A row per request: waiting ('pending') when it arrives, then 'sent' with the Zoho lead's id, or 'failed' with Zoho's
-- reason. The script reports through log_zoho with the shared secret. Marketing and super admins see the list and can
-- send a failed one again (retry_zoho_lead), so they need no access to the requests themselves: the row keeps only
-- the reference, name and cart.
create table if not exists public.zoho_leads (
    quote_id bigint primary key references public.quotes (id) on delete cascade,
    reference text not null default '',
    name text not null default '',
    model text not null default '',
    status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
    zoho_id text not null default '',
    error text not null default '',
    attempts int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists zoho_leads_created_at on public.zoho_leads (created_at desc);

-- Callable without a sign-in, so the secret is required
create or replace function public.log_zoho(secret text, ref_id bigint, result text, lead_id text default '', error_text text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
    if secret is null or secret is distinct from (select decrypted_secret from vault.decrypted_secrets where name = 'notify_secret' limit 1) then
        raise exception 'Not allowed';
    end if;
    if result not in ('sent', 'failed') then raise exception 'result must be sent or failed'; end if;
    insert into public.zoho_leads (quote_id, reference, name, model, status, zoho_id, error, attempts)
    select q.id, q.reference, q.name, q.model, result, left(coalesce(lead_id, ''), 60), left(coalesce(error_text, ''), 1000), 1
    from public.quotes q where q.id = ref_id
    on conflict (quote_id) do update set status = excluded.status, zoho_id = excluded.zoho_id, error = excluded.error,
        attempts = public.zoho_leads.attempts + 1, updated_at = now();
end $$;
revoke execute on function public.log_zoho(text, bigint, text, text, text) from public;
grant execute on function public.log_zoho(text, bigint, text, text, text) to anon, authenticated;

-- Sends a lead again: one that failed, or one still waiting after 10 minutes (the script never answered)
create or replace function public.retry_zoho_lead(ref_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
    if coalesce(public.staff_role(), '') not in ('master', 'marketing') then raise exception 'Not allowed'; end if;
    update public.zoho_leads set status = 'pending', error = '', updated_at = now()
    where quote_id = ref_id and (status = 'failed' or (status = 'pending' and updated_at < now() - interval '10 minutes'));
    if not found then raise exception 'Only a lead that failed can be sent again'; end if;
    perform public.notify_mail('quote_zoho', ref_id);
end $$;
revoke execute on function public.retry_zoho_lead(bigint) from public, anon;
grant execute on function public.retry_zoho_lead(bigint) to authenticated;

-- ---------- SKU photos from Zoho Inventory (2026-11-12) ----------
-- The admin's USD SKU list and Bundles show each SKU's photo from Zoho Inventory; nobody uploads them by hand. The
-- email script (syncZohoPhotos) copies each item's photo into a Google Drive folder every hour, and when staff press
-- "Get photos from Zoho now" (request_sku_photos), then saves the links here by SKU with the shared secret
-- (save_sku_photos). sku_photo_sync keeps when it last ran and what went wrong, for the admin.
create table if not exists public.sku_photos (
    sku text primary key,
    url text not null,
    zoho_item_id text not null default '',
    updated_at timestamptz not null default now()
);
create table if not exists public.sku_photo_sync (
    id int primary key default 1 check (id = 1),
    synced_at timestamptz,
    photos int not null default 0,
    error text not null default '',
    requested_at timestamptz
);
insert into public.sku_photo_sync (id) values (1) on conflict (id) do nothing;

-- Callable without a sign-in, so the secret is required. complete: the script read every Zoho item, so a SKU that
-- no longer has a photo in Zoho loses it here too
create or replace function public.save_sku_photos(secret text, photos jsonb, error_text text default '', complete boolean default false)
returns void language plpgsql security definer set search_path = public as $$
begin
    if secret is null or secret is distinct from (select decrypted_secret from vault.decrypted_secrets where name = 'notify_secret' limit 1) then
        raise exception 'Not allowed';
    end if;
    insert into public.sku_photos (sku, url, zoho_item_id)
    select distinct on (p->>'sku') p->>'sku', p->>'url', coalesce(p->>'zoho_item_id', '')
    from jsonb_array_elements(coalesce(photos, '[]'::jsonb)) p
    where coalesce(p->>'sku', '') <> '' and coalesce(p->>'url', '') <> ''
    on conflict (sku) do update set url = excluded.url, zoho_item_id = excluded.zoho_item_id, updated_at = now()
        where public.sku_photos.url is distinct from excluded.url;
    if complete then
        delete from public.sku_photos where sku not in (select p->>'sku' from jsonb_array_elements(coalesce(photos, '[]'::jsonb)) p);
    end if;
    update public.sku_photo_sync set synced_at = now(), photos = (select count(*) from public.sku_photos),
        error = left(coalesce(error_text, ''), 1000) where id = 1;
end $$;
revoke execute on function public.save_sku_photos(text, jsonb, text, boolean) from public;
grant execute on function public.save_sku_photos(text, jsonb, text, boolean) to anon, authenticated;

-- "Get photos from Zoho now" in the admin: asks the script to copy them at once
create or replace function public.request_sku_photos() returns void
language plpgsql security definer set search_path = public as $$
begin
    if public.staff_role() is null then raise exception 'Not allowed'; end if;
    update public.sku_photo_sync set requested_at = now() where id = 1;
    perform public.notify_mail('sku_photos', 0);
end $$;
revoke execute on function public.request_sku_photos() from public, anon;
grant execute on function public.request_sku_photos() to authenticated;

-- Every active Zoho Inventory item (2026-11-12), copied by the same script run: the admin's Zoho items tab searches
-- them, adds them to the USD SKU list or a bundle, and the SKU fields suggest them. No prices: costs stay in sku_usd
create table if not exists public.zoho_items (
    sku text primary key,
    item_id text not null default '',
    name text not null default '',
    category text not null default '',
    unit text not null default '',
    has_photo boolean not null default false,
    updated_at timestamptz not null default now()
);
alter table public.sku_photo_sync add column if not exists items int not null default 0;
-- Stock (2026-11-12), copied with the items: available (on hand less what's committed to orders), on hand, and the
-- reorder level set in Zoho, all locations together. Shown on quotation lines, the PSS and the Items tab
alter table public.zoho_items add column if not exists available_stock numeric;
alter table public.zoho_items add column if not exists stock_on_hand numeric;
alter table public.zoho_items add column if not exists reorder_level numeric;

create or replace function public.save_zoho_items(secret text, items jsonb, complete boolean default false)
returns void language plpgsql security definer set search_path = public as $$
begin
    if secret is null or secret is distinct from (select decrypted_secret from vault.decrypted_secrets where name = 'notify_secret' limit 1) then
        raise exception 'Not allowed';
    end if;
    insert into public.zoho_items (sku, item_id, name, category, unit, has_photo, available_stock, stock_on_hand, reorder_level)
    select distinct on (i->>'sku') i->>'sku', coalesce(i->>'item_id', ''), coalesce(i->>'name', ''), coalesce(i->>'category', ''),
        coalesce(i->>'unit', ''), coalesce((i->>'has_photo')::boolean, false),
        nullif(i->>'available_stock', '')::numeric, nullif(i->>'stock_on_hand', '')::numeric, nullif(i->>'reorder_level', '')::numeric
    from jsonb_array_elements(coalesce(items, '[]'::jsonb)) i
    where coalesce(i->>'sku', '') <> ''
    on conflict (sku) do update set item_id = excluded.item_id, name = excluded.name, category = excluded.category,
        unit = excluded.unit, has_photo = excluded.has_photo, available_stock = excluded.available_stock,
        stock_on_hand = excluded.stock_on_hand, reorder_level = excluded.reorder_level, updated_at = now();
    if complete then
        delete from public.zoho_items where sku not in (select i->>'sku' from jsonb_array_elements(coalesce(items, '[]'::jsonb)) i);
    end if;
    update public.sku_photo_sync set items = (select count(*) from public.zoho_items) where id = 1;
end $$;
revoke execute on function public.save_zoho_items(text, jsonb, boolean) from public;
grant execute on function public.save_zoho_items(text, jsonb, boolean) to anon, authenticated;

-- The team's stock sheet (2026-11-12): "LIVE STOCK INVENTORY & REPLENISEMENT MONITORING - PARTS", tab "Live stock
-- Monitoring", copied by the same script run (quantities and remarks only, never its cost tabs): stock per branch,
-- in transit, and the team's remark and movement. Shown beside Zoho's stock on quotations, the PSS and the Items tab
create table if not exists public.stock_sheet (
    sku text primary key,
    cebu numeric,
    manila numeric,
    sta_rosa numeric,
    total numeric,
    in_transit numeric,
    remark text not null default '',
    movement text not null default '',
    updated_at timestamptz not null default now()
);
alter table public.sku_photo_sync add column if not exists sheet_synced_at timestamptz;
alter table public.sku_photo_sync add column if not exists sheet_rows int not null default 0;
alter table public.sku_photo_sync add column if not exists sheet_error text not null default '';

-- The whole tab each time (a SKU taken off the sheet goes from here too). Callable without a sign-in, so the secret is required
create or replace function public.save_stock_sheet(secret text, stock jsonb, error_text text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
    if secret is null or secret is distinct from (select decrypted_secret from vault.decrypted_secrets where name = 'notify_secret' limit 1) then
        raise exception 'Not allowed';
    end if;
    if jsonb_array_length(coalesce(stock, '[]'::jsonb)) > 0 then
        delete from public.stock_sheet where true;
        insert into public.stock_sheet (sku, cebu, manila, sta_rosa, total, in_transit, remark, movement)
        select distinct on (s->>'sku') s->>'sku', nullif(s->>'cebu', '')::numeric, nullif(s->>'manila', '')::numeric,
            nullif(s->>'sta_rosa', '')::numeric, nullif(s->>'total', '')::numeric, nullif(s->>'in_transit', '')::numeric,
            left(coalesce(s->>'remark', ''), 200), left(coalesce(s->>'movement', ''), 60)
        from jsonb_array_elements(stock) s
        where coalesce(s->>'sku', '') <> '';
    end if;
    update public.sku_photo_sync set sheet_synced_at = case when coalesce(error_text, '') = '' then now() else sheet_synced_at end,
        sheet_rows = (select count(*) from public.stock_sheet), sheet_error = left(coalesce(error_text, ''), 1000) where id = 1;
end $$;
revoke execute on function public.save_stock_sheet(text, jsonb, text) from public;
grant execute on function public.save_stock_sheet(text, jsonb, text) to anon, authenticated;

alter table public.stock_sheet enable row level security;
drop policy if exists stock_sheet_read on public.stock_sheet;
create policy stock_sheet_read on public.stock_sheet for select to authenticated using (public.staff_role() is not null);

alter table public.zoho_items enable row level security;
drop policy if exists zoho_items_read on public.zoho_items;
create policy zoho_items_read on public.zoho_items for select to authenticated using (public.staff_role() is not null);

-- A photo added in the admin for a SKU Zoho Inventory has no photo for (2026-11-12), for the website only. Zoho's
-- photo shows instead once the item has one; this one is kept, and the Zoho copy never touches it
create table if not exists public.sku_site_photos (
    sku text primary key,
    url text not null,
    added_by text not null default lower(coalesce(auth.jwt() ->> 'email', '')),
    updated_at timestamptz not null default now()
);
alter table public.sku_site_photos enable row level security;
drop policy if exists sku_site_photos_read on public.sku_site_photos;
create policy sku_site_photos_read on public.sku_site_photos for select to authenticated using (public.staff_role() is not null);
drop policy if exists sku_site_photos_change on public.sku_site_photos;
create policy sku_site_photos_change on public.sku_site_photos for all to authenticated
    using (public.staff_role() in ('master', 'marketing', 'pricing'))
    with check (public.staff_role() in ('master', 'marketing', 'pricing'));

alter table public.sku_photos enable row level security;
drop policy if exists sku_photos_read on public.sku_photos;
create policy sku_photos_read on public.sku_photos for select to authenticated using (public.staff_role() is not null);
alter table public.sku_photo_sync enable row level security;
drop policy if exists sku_photo_sync_read on public.sku_photo_sync;
create policy sku_photo_sync_read on public.sku_photo_sync for select to authenticated using (public.staff_role() is not null);

alter table public.zoho_leads enable row level security;
drop policy if exists zoho_leads_read on public.zoho_leads;
create policy zoho_leads_read on public.zoho_leads for select to authenticated
    using (public.staff_role() in ('master', 'marketing'));

-- ---------- Activity log: who changed what, read by super admins in the admin's Activity log ----------
-- Written here by triggers, not by the page, so a change can't skip it and nobody can edit it from the admin. Records
-- staff changes to quote statuses, quotations, products and site content, bundles, the USD list, pricing and staff.
-- Only signed-in people are logged: a customer's new request isn't an edit, and data loaded in the SQL Editor (such
-- as the private bundles file) has nobody to name.
create table if not exists public.activity_log (
    id bigint generated always as identity primary key,
    created_at timestamptz not null default now(),
    who text not null,
    area text not null,          -- the table: quotes, quotations, site_edits, bundles, sku_usd, pricing_settings, staff
    action text not null check (action in ('insert', 'update', 'delete')),
    item text not null default '', -- which one: a reference, 'product:<slug>', a sheet row, an email
    changes jsonb not null default '{}' -- { field: { from, to } }
);
create index if not exists activity_log_created_at on public.activity_log (created_at desc);

-- A long value (a quotation's lines, a gallery) is kept short, so the log stays small
create or replace function public.activity_value(v jsonb) returns jsonb
language sql immutable as $$
    select case when length(v::text) > 400 then to_jsonb(left(v::text, 400) || '…') else v end
$$;

-- tg_argv[0]: the column that names the row. Stamps and fields the admin refreshes by itself aren't changes anyone
-- made, and a change of nothing else isn't logged. A customer's details stay out, so deleting a request or quotation
-- doesn't leave them here. If logging fails the person's change still goes through, with a warning.
create or replace function public.log_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare
    actor text := lower(auth.jwt() ->> 'email');
    before_row jsonb := '{}';
    after_row jsonb := '{}';
    item_name text;
    diff jsonb := '{}';
    field text;
    skip text[] := array['id', 'sheet_row', 'created_at', 'added_at', 'updated_at', 'updated_by', 'source', 'extra', 'sku_formula', 'total_formula', 'cost_usd_formula',
        'customer', 'build_rows', 'quote_id', 'photo', 'warranty', 'pdf_extra', 'prepared_by', 'submitted_by', 'submitted_at', 'reviewed_by', 'reviewed_at', 'sent_by', 'sent_at'];
begin
    if actor is null then return null; end if;
    if tg_op <> 'INSERT' then before_row := to_jsonb(old); end if;
    if tg_op <> 'DELETE' then after_row := to_jsonb(new); end if;
    item_name := coalesce(after_row ->> tg_argv[0], before_row ->> tg_argv[0], '');
    -- A site edit's changes are the fields inside its value
    if tg_table_name = 'site_edits' then
        before_row := coalesce(before_row -> 'value', '{}');
        after_row := coalesce(after_row -> 'value', '{}');
    end if;
    for field in select jsonb_object_keys(before_row) union select jsonb_object_keys(after_row) loop
        -- Staff can only change a request's status; the rest of it is the customer's
        if field = any(skip) or (tg_table_name = 'quotes' and field <> 'status') then continue; end if;
        if (before_row -> field) is distinct from (after_row -> field) then
            diff := diff || jsonb_build_object(field, jsonb_build_object('from', public.activity_value(before_row -> field), 'to', public.activity_value(after_row -> field)));
        end if;
    end loop;
    if tg_op = 'UPDATE' and diff = '{}' then return null; end if;
    insert into public.activity_log (who, area, action, item, changes) values (actor, tg_table_name, lower(tg_op), item_name, diff);
    return null;
exception when others then
    raise warning 'activity not logged: %', sqlerrm;
    return null;
end $$;

drop trigger if exists quotes_activity on public.quotes;
create trigger quotes_activity after update or delete on public.quotes
    for each row execute function public.log_activity('reference');
drop trigger if exists quotations_activity on public.quotations;
create trigger quotations_activity after insert or update or delete on public.quotations
    for each row execute function public.log_activity('reference');
drop trigger if exists site_edits_activity on public.site_edits;
create trigger site_edits_activity after insert or update or delete on public.site_edits
    for each row execute function public.log_activity('key');
drop trigger if exists bundles_activity on public.bundles;
create trigger bundles_activity after insert or update or delete on public.bundles
    for each row execute function public.log_activity('sheet_row');
drop trigger if exists sku_usd_activity on public.sku_usd;
create trigger sku_usd_activity after insert or update or delete on public.sku_usd
    for each row execute function public.log_activity('sheet_row');
drop trigger if exists pricing_settings_activity on public.pricing_settings;
create trigger pricing_settings_activity after update on public.pricing_settings
    for each row execute function public.log_activity('id');
drop trigger if exists staff_activity on public.staff;
create trigger staff_activity after insert or update or delete on public.staff
    for each row execute function public.log_activity('email');

-- ---------- Row level security: every table locked, then opened per role ----------
alter table public.activity_log enable row level security;
alter table public.staff enable row level security;
alter table public.golfers enable row level security;
alter table public.saved_builds enable row level security;
alter table public.quotes enable row level security;
alter table public.site_edits enable row level security;
alter table public.bundles enable row level security;
alter table public.sku_usd enable row level security;
alter table public.pricing_settings enable row level security;
alter table public.quotations enable row level security;
alter table public.email_log enable row level security;

-- staff: everyone on staff sees their own row (to learn their role); master admins see and manage all
drop policy if exists staff_read on public.staff;
create policy staff_read on public.staff for select to authenticated
    using (email = lower(auth.jwt() ->> 'email') or public.staff_role() = 'master');
drop policy if exists staff_manage on public.staff;
create policy staff_manage on public.staff for all to authenticated
    using (public.staff_role() = 'master') with check (public.staff_role() = 'master');

-- golfers: their own profile; master admins and sales managers read all (not marketing)
drop policy if exists golfers_read on public.golfers;
create policy golfers_read on public.golfers for select to authenticated
    using (id = auth.uid() or public.staff_role() in ('master', 'sales'));
drop policy if exists golfers_update_own on public.golfers;
create policy golfers_update_own on public.golfers for update to authenticated
    using (id = auth.uid()) with check (id = auth.uid());
-- A golfer may change their name, phone and news choice; not their id, email or join date
revoke update on public.golfers from authenticated;
grant update (name, phone, news) on public.golfers to authenticated;

-- saved builds: their own; master admins and sales managers read all
drop policy if exists builds_read on public.saved_builds;
create policy builds_read on public.saved_builds for select to authenticated
    using (golfer_id = auth.uid() or public.staff_role() in ('master', 'sales'));
drop policy if exists builds_insert_own on public.saved_builds;
create policy builds_insert_own on public.saved_builds for insert to authenticated
    with check (golfer_id = auth.uid());
drop policy if exists builds_delete_own on public.saved_builds;
create policy builds_delete_own on public.saved_builds for delete to authenticated
    using (golfer_id = auth.uid());

-- quotes: anyone may send one (as themselves, or with no account), always starting as New
drop policy if exists quotes_insert on public.quotes;
create policy quotes_insert on public.quotes for insert to anon, authenticated
    with check ((golfer_id is null or golfer_id = auth.uid()) and status = 'New' and status_by is null);
drop policy if exists quotes_read on public.quotes;
create policy quotes_read on public.quotes for select to authenticated
    using (golfer_id = auth.uid() or public.staff_role() in ('master', 'pricing', 'sales'));
drop policy if exists quotes_status on public.quotes;
create policy quotes_status on public.quotes for update to authenticated
    using (public.staff_role() in ('master', 'sales')) with check (public.staff_role() in ('master', 'sales'));
drop policy if exists quotes_delete on public.quotes;
create policy quotes_delete on public.quotes for delete to authenticated
    using (public.staff_role() = 'master');
-- Staff change the status only; the customer's request stays as it was sent
revoke update on public.quotes from anon, authenticated;
grant update (status) on public.quotes to authenticated;

-- site edits: read by every visitor (the site applies them); written by master admins and marketing, except what the
-- page builder makes: a page's added sections ('page-sections:<page>') and pages made with it ('custom-page:<slug>'),
-- which only page builders write
drop policy if exists edits_read on public.site_edits;
create policy edits_read on public.site_edits for select to anon, authenticated using (true);
drop policy if exists edits_write on public.site_edits;
create policy edits_write on public.site_edits for all to authenticated
    using (public.staff_role() in ('master', 'marketing') and key not like 'page-sections:%' and key not like 'custom-page:%')
    with check (public.staff_role() in ('master', 'marketing') and key not like 'page-sections:%' and key not like 'custom-page:%');
drop policy if exists edits_page_sections on public.site_edits;
create policy edits_page_sections on public.site_edits for all to authenticated
    using ((key like 'page-sections:%' or key like 'custom-page:%') and public.page_builder())
    with check ((key like 'page-sections:%' or key like 'custom-page:%') and public.page_builder());

-- The page builder's History (2026-11-16): each save of a page's sections is kept here by the trigger below, the last
-- 30 per page; a page cleared keeps a version with no value. Page builders read it; nobody writes it directly
create table if not exists public.page_revisions (
    id bigint generated always as identity primary key,
    key text not null,
    value jsonb,
    saved_by text,
    saved_at timestamptz not null default now()
);
create index if not exists page_revisions_key on public.page_revisions (key, id desc);
alter table public.page_revisions enable row level security;
drop policy if exists page_revisions_read on public.page_revisions;
create policy page_revisions_read on public.page_revisions for select to authenticated using (public.page_builder());

create or replace function public.keep_page_revision() returns trigger
language plpgsql security definer set search_path = public as $$
declare
    k text := case when tg_op = 'DELETE' then old.key else new.key end;
begin
    if k not like 'page-sections:%' then return null; end if;
    insert into public.page_revisions (key, value, saved_by)
    values (k, case when tg_op = 'DELETE' then null else new.value end, lower(auth.jwt() ->> 'email'));
    delete from public.page_revisions where key = k
        and id not in (select id from public.page_revisions where key = k order by id desc limit 30);
    return null;
end $$;

drop trigger if exists site_edits_revision on public.site_edits;
create trigger site_edits_revision after insert or update or delete on public.site_edits
    for each row execute function public.keep_page_revision();

-- Photos uploaded in the admin's Products (product, build, gallery and accessory photos): a public Storage bucket, so
-- the site shows them to everyone; master admins and marketing upload and replace them. JPEG and PNG up to 10 MB
-- (the admin resizes them to 1920px before uploading).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-photos', 'site-photos', true, 10485760, array['image/jpeg', 'image/png'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists site_photos_read on storage.objects;
create policy site_photos_read on storage.objects for select to authenticated
    using (bucket_id = 'site-photos' and public.staff_role() in ('master', 'marketing'));
drop policy if exists site_photos_upload on storage.objects;
create policy site_photos_upload on storage.objects for insert to authenticated
    with check (bucket_id = 'site-photos' and public.staff_role() in ('master', 'marketing', 'pricing')); -- pricing: SKU and bundle photos
-- Sales managers save each quotation's page 3 (drawn in the admin as one picture, account.js drawQuotationPage3), only
-- in the quotations folder (2026-11-12)
drop policy if exists site_photos_quotations on storage.objects;
create policy site_photos_quotations on storage.objects for insert to authenticated
    with check (bucket_id = 'site-photos' and (storage.foldername(name))[1] = 'quotations' and public.staff_role() in ('master', 'sales'));
drop policy if exists site_photos_change on storage.objects;
create policy site_photos_change on storage.objects for update to authenticated
    using (bucket_id = 'site-photos' and public.staff_role() in ('master', 'marketing'))
    with check (bucket_id = 'site-photos' and public.staff_role() in ('master', 'marketing'));
drop policy if exists site_photos_delete on storage.objects;
create policy site_photos_delete on storage.objects for delete to authenticated
    using (bucket_id = 'site-photos' and public.staff_role() in ('master', 'marketing'));

-- bundles and sku_usd: read by staff who price quotations; changed by super admins and the price manager
drop policy if exists bundles_master on public.bundles;
drop policy if exists bundles_read on public.bundles;
create policy bundles_read on public.bundles for select to authenticated
    using (public.staff_role() in ('master', 'pricing', 'sales'));
drop policy if exists bundles_write on public.bundles;
create policy bundles_write on public.bundles for all to authenticated
    using (public.staff_role() in ('master', 'pricing')) with check (public.staff_role() in ('master', 'pricing'));

drop policy if exists sku_usd_master on public.sku_usd;
drop policy if exists sku_usd_read on public.sku_usd;
create policy sku_usd_read on public.sku_usd for select to authenticated
    using (public.staff_role() in ('master', 'pricing', 'sales'));
drop policy if exists sku_usd_write on public.sku_usd;
create policy sku_usd_write on public.sku_usd for all to authenticated
    using (public.staff_role() in ('master', 'pricing')) with check (public.staff_role() in ('master', 'pricing'));

-- ---------- Bundles, the admin's own (2026-11-18): a parts list and each build's basis ----------
-- The admin is now where bundles are kept (the user's choice; the Bundles sheet was loaded once, from
-- supabase/private/bundles-v2-data.sql). Two layers:
--   bundle_items:        each part once: SKU, description, unit cost and its currency (USD, or PHP for a local part)
--   bundle_builds:       a build, e.g. Golfcarts / 2 seater / Pro
--   bundle_options:      a build's choices by slot (Body: White, Green...); at most one per slot is_default, which is
--                        what the build includes when nothing else is chosen; a slot with none is an upgrade
--   bundle_option_items: the parts an option brings, each with its quantity (wheels x4, batteries x6)
-- Same access as the old bundles: read by staff who price quotations, changed by super admins and the price manager.
-- The old bundles and sku_usd tables stay as they were until quotations switch over.
create table if not exists public.bundle_items (
    id bigserial primary key,
    sku text not null default '',
    description text not null,
    cost numeric,
    currency text not null default 'USD' check (currency in ('USD', 'PHP')),
    photo text not null default '',
    note text not null default '',
    updated_by text,
    updated_at timestamptz,
    unique (sku, description)
);
create table if not exists public.bundle_builds (
    id bigserial primary key,
    product text not null,
    config text not null,
    type text not null,
    sort int not null default 0,
    note text not null default '',
    updated_by text,
    updated_at timestamptz,
    unique (product, config, type)
);
create table if not exists public.bundle_options (
    id bigserial primary key,
    build_id bigint not null references public.bundle_builds (id) on delete cascade,
    slot text not null,
    option text not null,
    is_default boolean not null default false,
    sort int not null default 0,
    note text not null default '',
    updated_by text,
    updated_at timestamptz,
    unique (build_id, slot, option)
);
-- One default per slot
create unique index if not exists bundle_options_one_default on public.bundle_options (build_id, lower(slot)) where is_default;
create table if not exists public.bundle_option_items (
    option_id bigint not null references public.bundle_options (id) on delete cascade,
    item_id bigint not null references public.bundle_items (id) on delete restrict,
    qty numeric not null default 1 check (qty > 0),
    sort int not null default 0,
    primary key (option_id, item_id)
);
create index if not exists bundle_option_items_item on public.bundle_option_items (item_id);
-- Locked first (written out, so the SQL Editor's check sees it); opened to staff by the policies below
alter table public.bundle_items enable row level security;
alter table public.bundle_builds enable row level security;
alter table public.bundle_options enable row level security;
alter table public.bundle_option_items enable row level security;

do $$
declare t text;
begin
    foreach t in array array['bundle_items', 'bundle_builds', 'bundle_options'] loop
        execute format('drop trigger if exists %1$s_stamp on public.%1$s', t);
        execute format('create trigger %1$s_stamp before insert or update on public.%1$s for each row execute function public.stamp_site_edit()', t);
        execute format('drop trigger if exists %1$s_activity on public.%1$s', t);
        execute format('create trigger %1$s_activity after insert or update or delete on public.%1$s for each row execute function public.log_activity(%2$L)', t,
            case t when 'bundle_items' then 'description' when 'bundle_builds' then 'type' else 'option' end);
    end loop;
    foreach t in array array['bundle_items', 'bundle_builds', 'bundle_options', 'bundle_option_items'] loop
        execute format('alter table public.%I enable row level security', t);
        execute format('drop policy if exists %1$s_read on public.%1$s', t);
        execute format('create policy %1$s_read on public.%1$s for select to authenticated using (public.staff_role() in (''master'', ''pricing'', ''sales''))', t);
        execute format('drop policy if exists %1$s_write on public.%1$s', t);
        execute format('create policy %1$s_write on public.%1$s for all to authenticated using (public.staff_role() in (''master'', ''pricing'')) with check (public.staff_role() in (''master'', ''pricing''))', t);
    end loop;
end $$;

-- What the website's builder shows (2026-11-18, the user's choice "A": the builder follows the bundles): each build's
-- options by slot, their names, order and default. Names and ids only: no SKUs, parts or costs, so anyone may read
-- it (security definer: the tables themselves stay closed to visitors). A request carries the ids of the options
-- chosen (quotes.bundle_options), and its quotation takes exactly those options' parts
create or replace function public.bundle_catalog() returns jsonb
language sql stable security definer set search_path = public as $$
    select coalesce(jsonb_agg(jsonb_build_object(
        'id', b.id, 'product', b.product, 'config', b.config, 'type', b.type,
        'options', (select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'slot', o.slot, 'option', o.option, 'default', o.is_default)
                        order by o.sort, o.id), '[]'::jsonb)
                    from public.bundle_options o where o.build_id = b.id))
        order by b.sort, b.id), '[]'::jsonb)
    from public.bundle_builds b
$$;
revoke execute on function public.bundle_catalog() from public;
grant execute on function public.bundle_catalog() to anon, authenticated;
-- The options a request chose in the builder (ids of bundle_options), beside its rows of names
alter table public.quotes add column if not exists bundle_options bigint[] not null default '{}';

-- ---------- Bundles, live from the team's sheet (2026-11-18, the user's choice) ----------
-- The email script (google-apps-script/golfcarts-mail.gs, syncBundles) reads the Bundles tab of "Bundles and USD sku
-- list.xlsx" in Drive every hour when the file has changed, and on "Sync from the sheet now" in the admin, and saves
-- it here with the shared secret (save_bundles). The sheet is the master for what came from it (source 'sheet'):
-- each sync updates those options, their parts, costs and defaults, and removes the ones the sheet no longer has.
-- Options added in the admin (source 'admin', e.g. the paints) are kept. An option keeps its id while its build, slot
-- and name stay the same, so requests made before a sync still price right. bundle_sync keeps when it last ran.
alter table public.bundle_options add column if not exists source text not null default 'sheet';
alter table public.bundle_options alter column source set default 'admin';
create table if not exists public.bundle_sync (
    id int primary key default 1 check (id = 1),
    synced_at timestamptz,
    file_modified text not null default '',
    options int not null default 0,
    error text not null default '',
    requested_at timestamptz
);
insert into public.bundle_sync (id) values (1) on conflict (id) do nothing;
alter table public.bundle_sync enable row level security;
drop policy if exists bundle_sync_read on public.bundle_sync;
create policy bundle_sync_read on public.bundle_sync for select to authenticated using (public.staff_role() in ('master', 'pricing', 'sales'));

-- data: { items: [{ sku, description, cost, currency }], options: [{ product, config, type, slot, option, is_default,
-- sort, parts: [{ sku, description, qty }] }] }, already shaped by the script (defaults, the wheel cover, the light kits)
create or replace function public.save_bundles(secret text, data jsonb, error_text text default '', sheet_modified text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
    if secret is null or secret is distinct from (select decrypted_secret from vault.decrypted_secrets where name = 'notify_secret' limit 1) then
        raise exception 'Not allowed';
    end if;
    if coalesce(error_text, '') <> '' or data is null or jsonb_array_length(coalesce(data -> 'options', '[]'::jsonb)) = 0 then
        update public.bundle_sync set error = left(coalesce(nullif(error_text, ''), 'The sheet had no bundle lines'), 1000) where id = 1;
        return;
    end if;
    -- Parts: new ones added, costs and currencies brought up to date
    insert into public.bundle_items (sku, description, cost, currency)
    select coalesce(i ->> 'sku', ''), i ->> 'description', nullif(i ->> 'cost', '')::numeric, case when i ->> 'currency' = 'PHP' then 'PHP' else 'USD' end
    from jsonb_array_elements(data -> 'items') i
    where coalesce(i ->> 'description', '') <> ''
    on conflict (sku, description) do update set cost = excluded.cost, currency = excluded.currency
        where public.bundle_items.cost is distinct from excluded.cost or public.bundle_items.currency is distinct from excluded.currency;
    -- Builds
    insert into public.bundle_builds (product, config, type, sort)
    select distinct on (o ->> 'product', o ->> 'config', o ->> 'type') o ->> 'product', o ->> 'config', o ->> 'type', (o ->> 'build_sort')::int
    from jsonb_array_elements(data -> 'options') o
    on conflict (product, config, type) do nothing;
    -- The sheet's options: kept by build, slot and name (so their ids stay), their order brought up to date
    create temporary table sheet_options on commit drop as
    select b.id as build_id, o ->> 'slot' as slot, o ->> 'option' as option, coalesce((o ->> 'is_default')::boolean, false) as is_default,
           (o ->> 'sort')::int as sort, o -> 'parts' as parts
    from jsonb_array_elements(data -> 'options') o
    join public.bundle_builds b on b.product = o ->> 'product' and b.config = o ->> 'config' and b.type = o ->> 'type';
    insert into public.bundle_options (build_id, slot, option, is_default, sort, source)
    select build_id, slot, option, false, sort, 'sheet' from sheet_options
    on conflict (build_id, slot, option) do update set sort = excluded.sort, source = 'sheet';
    -- Options the sheet no longer has (and that came from it) go, with their parts lists
    delete from public.bundle_options x where x.source = 'sheet'
        and not exists (select 1 from sheet_options s where s.build_id = x.build_id and s.slot = x.slot and s.option = x.option);
    -- Defaults: the sheet's, in the slots it gives one (cleared there first: one per slot)
    update public.bundle_options x set is_default = false
    where x.is_default and exists (select 1 from sheet_options s where s.build_id = x.build_id and lower(s.slot) = lower(x.slot) and s.is_default);
    update public.bundle_options x set is_default = true
    from sheet_options s where s.build_id = x.build_id and s.slot = x.slot and s.option = x.option and s.is_default;
    -- Each sheet option's parts, as the sheet has them now
    delete from public.bundle_option_items l using public.bundle_options x where l.option_id = x.id and x.source = 'sheet';
    insert into public.bundle_option_items (option_id, item_id, qty, sort)
    select x.id, i.id, sum(coalesce(nullif(e.part ->> 'qty', '')::numeric, 1)), min(e.ord)::int
    from sheet_options s
    join public.bundle_options x on x.build_id = s.build_id and x.slot = s.slot and x.option = s.option
    cross join lateral jsonb_array_elements(s.parts) with ordinality as e(part, ord)
    join public.bundle_items i on i.sku = coalesce(e.part ->> 'sku', '') and i.description = e.part ->> 'description'
    group by x.id, i.id
    on conflict (option_id, item_id) do update set qty = excluded.qty, sort = excluded.sort;
    update public.bundle_sync set synced_at = now(), file_modified = coalesce(sheet_modified, ''), error = '',
        options = (select count(*) from sheet_options) where id = 1;
end $$;
revoke execute on function public.save_bundles(text, jsonb, text, text) from public;
grant execute on function public.save_bundles(text, jsonb, text, text) to anon, authenticated;

-- "Sync from the sheet now" in the admin: asks the script to read the sheet at once
create or replace function public.request_bundles_sync() returns void
language plpgsql security definer set search_path = public as $$
begin
    if coalesce(public.staff_role(), '') not in ('master', 'pricing') then raise exception 'Not allowed'; end if;
    update public.bundle_sync set requested_at = now() where id = 1;
    perform public.notify_mail('bundles_sync', 0);
end $$;
revoke execute on function public.request_bundles_sync() from public, anon;
grant execute on function public.request_bundles_sync() to authenticated;

-- pricing settings: read by staff who price quotations, changed by super admins and the price manager
drop policy if exists pricing_read on public.pricing_settings;
create policy pricing_read on public.pricing_settings for select to authenticated
    using (public.staff_role() in ('master', 'pricing', 'sales'));
drop policy if exists pricing_write on public.pricing_settings;
create policy pricing_write on public.pricing_settings for update to authenticated
    using (public.staff_role() = 'pricing') with check (public.staff_role() = 'pricing'); -- accounting (2026-11-11)

-- quotations: staff read, prepare and move them along (the workflow trigger decides which moves each role may
-- make: the price manager only approves or returns); sales managers and super admins create them; only super
-- admins delete one
drop policy if exists quotations_read on public.quotations;
create policy quotations_read on public.quotations for select to authenticated
    using (public.staff_role() in ('master', 'pricing', 'sales'));
drop policy if exists quotations_insert on public.quotations;
create policy quotations_insert on public.quotations for insert to authenticated
    with check (public.staff_role() in ('master', 'sales'));
drop policy if exists quotations_update on public.quotations;
create policy quotations_update on public.quotations for update to authenticated
    using (public.staff_role() in ('master', 'pricing', 'sales')) with check (public.staff_role() in ('master', 'pricing', 'sales'));
drop policy if exists quotations_delete on public.quotations;
create policy quotations_delete on public.quotations for delete to authenticated
    using (public.staff_role() = 'master');

-- activity log: super admins read it; only the trigger writes it, and nobody signed in can change or delete it
drop policy if exists activity_log_read on public.activity_log;
create policy activity_log_read on public.activity_log for select to authenticated
    using (public.staff_role() = 'master');
revoke insert, update, delete, truncate on public.activity_log from anon, authenticated;

-- email log: staff read it (to see whether a quotation reached the customer); only the function writes it
drop policy if exists email_log_read on public.email_log;
create policy email_log_read on public.email_log for select to authenticated
    using (public.staff_role() in ('master', 'pricing', 'sales'));
