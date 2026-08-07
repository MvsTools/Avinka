-- ══════════════════════════════════════════════════════════════════════════
--  ÉÉN GRATIS PROEF PER BRIEVENBUS  (2026-08-05)
--  Eén keer draaien in de Supabase SQL Editor. Veilig om opnieuw te draaien.
-- ══════════════════════════════════════════════════════════════════════════
--
--  WAT DIT WEL EN NIET DOET
--  Wel: `jan+school@gmail.com`, `j.a.n@gmail.com` en `jan@gmail.com` zijn bij
--  Gmail hetzelfde postvak, dus die krijgen samen één gratis week.
--  Niet: iemand tegenhouden die een écht nieuw mailadres aanmaakt. Dat kan
--  niemand zonder betaalgegevens bij de proef te vragen, en dat doen we bewust
--  niet ("7 dagen gratis, geen betaalgegevens" staat op de voorpagina).
--  De echte rem daarop is dat een proef weinig waard is: 40 credits (± €2),
--  zie CREDITS_PER_PLAN in src/lib/abonnement.ts.
--
--  WAT ER GEBEURT BIJ EEN TWEEDE KEER
--  Het account wordt gewoon aangemaakt — geen melding, geen blokkade. Alleen de
--  gratis week is meteen voorbij, en `proef_overgeslagen` vertelt het scherm
--  waarom, zodat er bij de betaalmuur één zin kan staan die het uitlegt.
--  ⚠️ Blokkeren bij het aanmelden is bewust AFGEWEZEN: dan kan een vreemde
--  uitproberen of jouw mailadres een Avinka-account heeft.
--
--  🔧 NOODKNOP: staat er ooit iemand onterecht op de lijst, dan geef je hem
--  meteen weer een gratis week met:
--      delete from public.proef_gebruikt where email_norm = 'adres@voorbeeld.nl';

-- ── 1) Schrijfwijzen van hetzelfde postvak op één noemer ──────────────────
-- ⚠️ Dezelfde regels staan in src/lib/email-normaliseren.ts. Samen bijwerken.
-- Puntjes verdwijnen ALLEEN bij Gmail; bij elke andere provider is
-- jan.jansen@ echt een ander adres dan janjansen@.
create or replace function public.wijs_email_norm(p_email text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  schoon text := lower(trim(coalesce(p_email, '')));
  lokaal text;
  domein text;
begin
  if position('@' in schoon) < 2 then return schoon; end if;
  lokaal := split_part(schoon, '@', 1);
  domein := split_part(schoon, '@', 2);

  if domein = 'googlemail.com' then domein := 'gmail.com'; end if;

  -- Providers die alles achter een '+' als label behandelen. Bewust een lijst
  -- en niet "alle domeinen": bij een schoolserver kan een plus een gewoon
  -- teken in het adres zijn, en dan gooi je twee echte collega's op één hoop.
  if domein in ('gmail.com','outlook.com','outlook.nl','hotmail.com','hotmail.nl',
                'live.com','live.nl','msn.com','icloud.com','me.com',
                'fastmail.com','protonmail.com','proton.me') then
    lokaal := split_part(lokaal, '+', 1);
  end if;

  if domein = 'gmail.com' then
    lokaal := replace(lokaal, '.', '');
  end if;

  return lokaal || '@' || domein;
end;
$$;
-- ⚠️ `grant execute` sluit `anon` NIET buiten: PostgreSQL geeft EXECUTE
-- standaard aan PUBLIC. Zie het slotblok onderaan schema.sql.
revoke execute on function public.wijs_email_norm(text) from public, anon;
grant  execute on function public.wijs_email_norm(text) to authenticated;

-- ── 2) Welke brievenbussen hebben al een gratis week gehad ────────────────
create table if not exists public.proef_gebruikt (
  email_norm   text primary key,
  eerste_user  uuid references auth.users(id) on delete set null,
  aangemaakt   timestamptz not null default now()
);
alter table public.proef_gebruikt enable row level security;
-- Geen policies en geen grants: alleen de functie hieronder (security definer)
-- komt erbij. Een gebruiker hoort deze lijst niet te kunnen lezen — daar staat
-- in wie er een account heeft.

-- ── 3) De claim ───────────────────────────────────────────────────────────
-- Geeft true als deze brievenbus nog nooit een gratis week heeft gehad (en legt
-- hem dan meteen vast), anders false.
create or replace function public.wijs_proef_claim(p_user uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  adres    text;
  norm     text;
  bestaand uuid;
begin
  select email into adres from auth.users where id = p_user;
  if adres is null or adres = '' then return true; end if;

  norm := public.wijs_email_norm(adres);
  select eerste_user into bestaand from public.proef_gebruikt where email_norm = norm;
  if bestaand is not null and bestaand <> p_user then
    return false;
  end if;

  insert into public.proef_gebruikt (email_norm, eerste_user)
  values (norm, p_user)
  on conflict (email_norm) do nothing;
  return true;
exception when others then
  -- Nooit iemand zijn proef ontnemen door een fout van ons.
  return true;
end;
$$;
revoke execute on function public.wijs_proef_claim(uuid) from public, anon;
grant  execute on function public.wijs_proef_claim(uuid) to authenticated;

-- ── 4) Het scherm moet kunnen uitleggen waarom er geen proef is ───────────
alter table public.instellingen
  add column if not exists proef_overgeslagen boolean not null default false;

-- ── 5) De wachter uit migratie-fraude-slot.sql leert de claim kennen ──────
-- Alleen de INSERT-tak verandert: bij het aanmaken van de rij wordt bepaald of
-- er nog een gratis week in zit. `proef_overgeslagen` gaat mee in de lijst met
-- velden die de browser niet mag wijzigen.
create or replace function public.instellingen_bewaakt()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.abon_plan          := null;
    new.abon_vorm          := null;
    new.abon_status        := 'proef';
    new.periode_eindigt    := null;
    new.start_tool         := null;
    new.start_tool_sinds   := null;
    new.mollie_customer_id := null;
    new.mollie_payment_id  := null;
    new.beta_eigen_format  := false;
    new.ref_code           := null;
    new.verwezen_door      := null;
    new.proef_herinnering_op := null;

    -- Eén gratis week per brievenbus.
    if public.wijs_proef_claim(new.user_id) then
      new.proef_eindigt      := now() + interval '7 days';
      new.proef_overgeslagen := false;
    else
      new.proef_eindigt      := now();   -- meteen voorbij
      new.proef_overgeslagen := true;
    end if;
    return new;
  end if;

  if new.abon_plan          is distinct from old.abon_plan
  or new.abon_vorm          is distinct from old.abon_vorm
  or new.abon_status        is distinct from old.abon_status
  or new.proef_eindigt      is distinct from old.proef_eindigt
  or new.proef_overgeslagen is distinct from old.proef_overgeslagen
  or new.periode_eindigt    is distinct from old.periode_eindigt
  or new.start_tool         is distinct from old.start_tool
  or new.start_tool_sinds   is distinct from old.start_tool_sinds
  or new.mollie_customer_id is distinct from old.mollie_customer_id
  or new.mollie_payment_id  is distinct from old.mollie_payment_id
  or new.beta_eigen_format  is distinct from old.beta_eigen_format
  or new.ref_code           is distinct from old.ref_code
  or new.verwezen_door      is distinct from old.verwezen_door
  or new.proef_herinnering_op is distinct from old.proef_herinnering_op
  then
    raise exception 'Deze velden worden door de server bepaald (abonnement en uitnodigingen).'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- ── 6) Bestaande accounts hun plek op de lijst geven ──────────────────────
-- Zonder dit zou iedereen die er nu al is straks nog één keer "voor het eerst"
-- kunnen zijn met een plus-variant van zijn eigen adres.
insert into public.proef_gebruikt (email_norm, eerste_user, aangemaakt)
select distinct on (public.wijs_email_norm(u.email))
       public.wijs_email_norm(u.email), u.id, u.created_at
from auth.users u
where u.email is not null and u.email <> ''
order by public.wijs_email_norm(u.email), u.created_at
on conflict (email_norm) do nothing;

-- ── Controle achteraf ─────────────────────────────────────────────────────
--   select email_norm, aangemaakt from public.proef_gebruikt order by aangemaakt;
--   select public.wijs_email_norm('J.a.N+school@GoogleMail.com');  -- jan@gmail.com
