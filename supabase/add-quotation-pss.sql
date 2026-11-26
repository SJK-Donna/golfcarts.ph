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

-- Check: select count(*) from public.quotation_pss;
