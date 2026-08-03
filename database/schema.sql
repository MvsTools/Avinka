-- ════════════════════════════════════════════════════════════════════════
--  Avinka — database-schema
--
--  NB: databasefuncties hebben nog de historische prefix `wijs_` (de oude
--  werknaam van het platform, nu Avinka). Bewust niet hernoemd: het is
--  onzichtbaar voor gebruikers en hernoemen van live DB-objecten is risicovol
--  (afhankelijkheden + de maandelijkse cron-taak). Functioneel identiek.
--
--  Plak dit volledige bestand in Supabase → SQL Editor → Run.
--  Het is veilig om opnieuw te draaien (idempotent): bestaande tabellen
--  blijven staan, beleid wordt vernieuwd.
--
--  Beveiliging: elke tabel heeft Row Level Security (RLS). Een leerkracht kan
--  UITSLUITEND zijn eigen rijen zien/bewerken. Dat bewaakt de database zelf —
--  niemand kan daar in de app omheen.
-- ════════════════════════════════════════════════════════════════════════

-- ── Hulp: updated_at automatisch bijwerken ──────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 1) INSTELLINGEN (voorkeuren) — één rij per gebruiker ────────────────
create table if not exists public.instellingen (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  schoolnaam     text default '',
  standaardgroep text default '',
  toon           text default 'warm',       -- centrale schrijf-voorkeuren: de tools
  taalniveau     text default 'standaard',  -- vullen deze straks automatisch voor
  lengte         text default 'gemiddeld',  -- (overschrijfbaar per tool)
  aanspreekvorm  text default 'je',         -- 'je' | 'u' (alleen Oudercontact)
  ref_code       text,        -- eigen uitnodigingscode (voor de invite-link)
  verwezen_door  text,        -- de code van wie deze gebruiker uitnodigde
  -- ── Abonnement (Fase 2, Mollie) ──────────────────────────────────────
  abon_plan        text,                       -- 'start' | 'compleet' | 'pro' (null = nog op proef)
  abon_vorm        text,                       -- 'maand' | 'jaar'
  abon_status      text default 'proef',       -- 'proef' | 'actief' | 'opgezegd' | 'verlopen'
  proef_eindigt    timestamptz default now() + interval '7 days',
  periode_eindigt  timestamptz,               -- einde van de betaalde periode
  start_tool       text,                       -- gekozen tool bij het Start-pakket
  start_tool_sinds date,                       -- wanneer voor het laatst gewisseld (max 1×/maand)
  mollie_customer_id text,                     -- Mollie-klant (voor terugkerende incasso)
  mollie_payment_id  text,                     -- lopende betaling (om terugkomst te verifiëren)
  -- Bèta die de eigenaar per account handmatig aanzet (zie wijs_admin_zet_beta_eigen_format).
  beta_eigen_format boolean not null default false,
  -- Welke ouder-app de leerkracht gebruikt: '' | 'parro' | 'social_schools' |
  -- 'isy' | 'konnect'. Bepaalt of en welke "open in ..."-knop de tools tonen
  -- bij een bericht. Parro/Social Schools hebben een vast inlogadres; Isy en
  -- Konnect werken per school/organisatie, dus die vullen communicatie_url zelf in.
  communicatie_app text not null default '',
  communicatie_url text not null default '',
  -- Welk leerlingvolgsysteem: '' | 'parnassys' | 'esis'. ParnasSys heeft één
  -- vast inlogadres; Esis werkt per school, dus die vult lvs_url zelf in.
  lvs_systeem    text not null default '',
  lvs_url        text not null default '',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
-- MIGRATIE voor een bestaande database (één keer draaien in de Supabase SQL Editor):
--   alter table public.instellingen add column if not exists taalniveau text default 'standaard';
--   alter table public.instellingen add column if not exists lengte text default 'gemiddeld';
--   alter table public.instellingen add column if not exists aanspreekvorm text default 'je';
--   alter table public.instellingen add column if not exists ref_code text;
--   alter table public.instellingen add column if not exists verwezen_door text;
--   alter table public.instellingen add column if not exists abon_plan text;
--   alter table public.instellingen add column if not exists abon_vorm text;
--   alter table public.instellingen add column if not exists abon_status text default 'proef';
--   alter table public.instellingen add column if not exists proef_eindigt timestamptz default now() + interval '7 days';
--   alter table public.instellingen add column if not exists periode_eindigt timestamptz;
--   alter table public.instellingen add column if not exists start_tool text;
--   alter table public.instellingen add column if not exists start_tool_sinds date;
--   alter table public.instellingen add column if not exists mollie_customer_id text;
--   alter table public.instellingen add column if not exists mollie_payment_id text;
--   alter table public.instellingen add column if not exists beta_eigen_format boolean not null default false;
--   alter table public.instellingen add column if not exists communicatie_app text not null default '';
--   alter table public.instellingen add column if not exists lvs_systeem text not null default '';
--   alter table public.instellingen add column if not exists lvs_url text not null default '';
--   alter table public.instellingen add column if not exists communicatie_url text not null default '';
create index if not exists idx_instellingen_verwezen on public.instellingen(verwezen_door);

-- ── 2) KLASSEN — je klassenlijst (meerdere klassen per leerkracht mogelijk) ───
--  leerlingen      = platte namenlijst (text[]) — blijft bestaan zodat de
--                    bestaande tools ongewijzigd blijven werken.
--  leerlingen_data = rijkere lijst per leerling [{naam, geslacht}] — voor
--                    profielen, geslacht (hij/zij) en koppeling met rapporten.
--  actief          = welke klas de tools invullen (één actieve klas per user).
create table if not exists public.klassen (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  naam            text default '',
  leerlingen      text[] default '{}',
  leerlingen_data jsonb not null default '[]'::jsonb,
  actief          boolean not null default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- MIGRATIE voor een bestaande database (draai dit één keer in de Supabase SQL Editor):
--   alter table public.klassen drop constraint if exists klassen_user_id_key;
--   alter table public.klassen add column if not exists leerlingen_data jsonb not null default '[]'::jsonb;
--   alter table public.klassen add column if not exists actief boolean not null default true;

-- ── 3) TEKSTEN — bewaarde teksten-bibliotheek ───────────────────────────
create table if not exists public.teksten (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  titel       text not null default 'Naamloze tekst',
  inhoud      text not null,
  tool        text,
  created_at  timestamptz default now()
);

-- ── Indexen (snel zoeken per gebruiker) ─────────────────────────────────
create index if not exists idx_klassen_user on public.klassen(user_id);
create index if not exists idx_teksten_user on public.teksten(user_id);

-- ── Triggers voor updated_at ────────────────────────────────────────────
drop trigger if exists trg_instellingen_updated on public.instellingen;
create trigger trg_instellingen_updated
  before update on public.instellingen
  for each row execute function public.set_updated_at();

drop trigger if exists trg_klassen_updated on public.klassen;
create trigger trg_klassen_updated
  before update on public.klassen
  for each row execute function public.set_updated_at();

-- ── ROW LEVEL SECURITY ──────────────────────────────────────────────────
alter table public.instellingen enable row level security;
alter table public.klassen      enable row level security;
alter table public.teksten      enable row level security;

-- Beleid: iedereen mag alleen zijn EIGEN rijen (lezen + schrijven).
drop policy if exists "eigen instellingen" on public.instellingen;
create policy "eigen instellingen" on public.instellingen
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "eigen klassen" on public.klassen;
create policy "eigen klassen" on public.klassen
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "eigen teksten" on public.teksten;
create policy "eigen teksten" on public.teksten
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Tabel-rechten ───────────────────────────────────────────────────────
-- Ingelogde gebruikers mogen de tabellen gebruiken; RLS hierboven bepaalt
-- vervolgens dat ze alleen bij hun EIGEN rijen kunnen. (anon = niet ingelogd
-- krijgt bewust niets.)
grant select, insert, update, delete on public.instellingen to authenticated;
grant select, insert, update, delete on public.klassen      to authenticated;
grant select, insert, update, delete on public.teksten      to authenticated;

-- ── 4) RAPPORTEN — opgeslagen rapportteksten per kind (Rapporten) ──────
-- Concept/afgeronde rapportteksten zodat een leerkracht over meerdere sessies
-- kan werken. Bewaartermijn-gedachte: tijdelijk, met "wissen"-knop in de tool.
create table if not exists public.rapporten (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  naam        text not null,
  verhaal     text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id, naam)
);
create index if not exists idx_rapporten_user on public.rapporten(user_id);

drop trigger if exists trg_rapporten_updated on public.rapporten;
create trigger trg_rapporten_updated
  before update on public.rapporten
  for each row execute function public.set_updated_at();

alter table public.rapporten enable row level security;
drop policy if exists "eigen rapporten" on public.rapporten;
create policy "eigen rapporten" on public.rapporten
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.rapporten to authenticated;

-- ── 5) BESTANDEN — mappen + bestanden (teksten, plattegronden) in één boom ──
--  parent_id leeg = in de wortel; anders de map waarin het zit (map-in-map kan).
--  type 'map'  = een map      → kinderen verwijzen ernaar via parent_id
--  type 'tekst' = bewaarde tekst (inhoud)
--  type 'plattegrond' = opgeslagen plattegrond (data = JSON uit Plattegrond)
create table if not exists public.bestanden (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  parent_id   uuid references public.bestanden(id) on delete cascade,
  type        text not null default 'tekst',
  naam        text not null default 'Naamloos',
  inhoud      text,
  data        jsonb,
  tool        text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists idx_bestanden_user on public.bestanden(user_id);
create index if not exists idx_bestanden_parent on public.bestanden(parent_id);

drop trigger if exists trg_bestanden_updated on public.bestanden;
create trigger trg_bestanden_updated
  before update on public.bestanden
  for each row execute function public.set_updated_at();

alter table public.bestanden enable row level security;
drop policy if exists "eigen bestanden" on public.bestanden;
create policy "eigen bestanden" on public.bestanden
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.bestanden to authenticated;

-- MIGRATIE van bestaande bewaarde teksten naar Bestanden (draai één keer):
--   insert into public.bestanden (user_id, parent_id, type, naam, inhoud, tool, created_at)
--   select user_id, null, 'tekst', titel, inhoud, tool, created_at from public.teksten;

-- ── 6) STATISTIEK — cumulatieve tellers per gebruiker (voor "Mijn statistieken") ─
--  tellers = jsonb-map { 'rapport': 12, 'analyse': 3, 'gesprek': 8, ... }.
--  Wordt opgehoogd door de tools bij elke afgeronde actie; nooit verlaagd
--  (dus blijft staan ook als een rapport later verwijderd wordt).
create table if not exists public.statistiek (
  user_id        uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  tellers        jsonb not null default '{}'::jsonb,
  minuten        jsonb not null default '{}'::jsonb,  -- bespaarde minuten per soort (adaptief opgeteld)
  per_dag        jsonb not null default '{}'::jsonb,  -- per dag: { 'YYYY-MM-DD': { m: minuten, n: acties } } voor periode-filters
  streak         int not null default 0,    -- opeenvolgende schooldagen actief
  streak_max     int not null default 0,    -- langste streak ooit (voor het "record")
  -- Verdiende vrijstellingen: elke 10 schooldagen streak (2 weken) verdien je
  -- er één bij, max. 2 in voorraad — die vangt automatisch precies één
  -- gemiste schooldag op zonder dat de streak breekt.
  streak_freezes int not null default 0,
  laatste_actief date,                       -- laatste schooldag waarop iets gedaan is
  updated_at     timestamptz default now()
);
-- MIGRATIE voor een bestaande database (één keer draaien):
--   alter table public.statistiek add column if not exists streak int not null default 0;
--   alter table public.statistiek add column if not exists streak_max int not null default 0;
--   alter table public.statistiek add column if not exists laatste_actief date;
--   alter table public.statistiek add column if not exists minuten jsonb not null default '{}'::jsonb;
--   alter table public.statistiek add column if not exists per_dag jsonb not null default '{}'::jsonb;
--   alter table public.statistiek add column if not exists streak_freezes int not null default 0;
-- EENMALIGE backfill van per_dag: zet het bestaande lifetime-totaal op 1 augustus (begin van
-- het huidige schooljaar), zodat het meetelt in "Dit schooljaar" maar Vandaag/Deze week/Deze
-- maand schoon op echte nieuwe data blijven.
--   update public.statistiek s set per_dag = jsonb_build_object(
--     to_char(case when extract(month from timezone('Europe/Amsterdam', now())) >= 8
--                  then make_date(extract(year from timezone('Europe/Amsterdam', now()))::int, 8, 1)
--                  else make_date(extract(year from timezone('Europe/Amsterdam', now()))::int - 1, 8, 1) end, 'YYYY-MM-DD'),
--     jsonb_build_object(
--       'm', (select coalesce(sum(value::numeric),0) from jsonb_each_text(s.minuten)),
--       'n', (select coalesce(sum(value::numeric),0) from jsonb_each_text(s.tellers))))
--   where (s.per_dag is null or s.per_dag = '{}'::jsonb) and s.tellers <> '{}'::jsonb;
-- BACKFILL bestaande tijdwinst (aantal × oude vaste minuten), zodat huidige totalen blijven:
--   update public.statistiek s set minuten = (
--     select coalesce(jsonb_object_agg(t.key, (t.value)::numeric * v.vast), '{}'::jsonb)
--     from jsonb_each_text(s.tellers) t
--     join (values ('rapport',10),('analyse',120),('gesprek',20),('weekbericht',15),
--                  ('nieuwsbrief',30),('bericht',10),('brief',15),('uitnodiging',20),('plattegrond',15)
--          ) as v(key,vast) on v.key = t.key)
--   where (s.minuten is null or s.minuten = '{}'::jsonb) and s.tellers <> '{}'::jsonb;
drop trigger if exists trg_statistiek_updated on public.statistiek;
create trigger trg_statistiek_updated
  before update on public.statistiek
  for each row execute function public.set_updated_at();
alter table public.statistiek enable row level security;
drop policy if exists "eigen statistiek" on public.statistiek;
create policy "eigen statistiek" on public.statistiek
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.statistiek to authenticated;

-- Community-aggregaat voor "Mijn statistieken" (vergelijking met andere gebruikers).
-- SECURITY DEFINER: leest álle tellers maar geeft ALLEEN totalen/aantallen terug —
-- nooit gegevens van een individuele gebruiker. Daarom veilig voor alle ingelogden.
create or replace function public.wijs_community_stats()
returns jsonb
language sql
security definer
set search_path = public
as $$
  with kv as (
    select key, sum((value)::numeric) as totaal
    from public.statistiek s, jsonb_each_text(s.tellers)
    group by key
  ), mv as (
    select key, sum((value)::numeric) as totaal
    from public.statistiek s, jsonb_each_text(s.minuten)
    group by key
  ), wk as (
    -- Bespaarde minuten per gebruiker per (maandag-)week, uit per_dag. De
    -- 1-augustus-backfill (eenmalige lump van het oude totaal) sluiten we uit,
    -- anders telt die als één enorme "weekpiek" en blaast 'ie het gemiddelde op.
    select s.user_id, date_trunc('week', (d.key)::date) as wkstart,
           sum((d.value->>'m')::numeric) as m
    from public.statistiek s, jsonb_each(s.per_dag) d
    where (d.key)::date <> (case
             when extract(month from timezone('Europe/Amsterdam', now())) >= 8
               then make_date(extract(year from timezone('Europe/Amsterdam', now()))::int, 8, 1)
               else make_date(extract(year from timezone('Europe/Amsterdam', now()))::int - 1, 8, 1)
           end)
    group by s.user_id, date_trunc('week', (d.key)::date)
  )
  select jsonb_build_object(
    'gebruikers', (select count(*)::int from public.statistiek),
    'som', coalesce((select jsonb_object_agg(key, totaal) from kv), '{}'::jsonb),
    'som_minuten', coalesce((select jsonb_object_agg(key, totaal) from mv), '{}'::jsonb),
    -- Langste streak ooit binnen de community.
    'hoogste_streak', coalesce((select max(streak_max)::int from public.statistiek), 0),
    -- Gemiddelde bespaarde minuten per actieve week (alleen weken mét activiteit),
    -- plus het aantal meetpunten zodat de app pas toont vanaf genoeg data.
    'gem_actieve_week', coalesce((select round(avg(m))::int from wk where m > 0), 0),
    'actieve_weken', coalesce((select count(*)::int from wk where m > 0), 0)
  );
$$;
grant execute on function public.wijs_community_stats() to authenticated;

-- Aantal BETALENDE aanmeldingen via een uitnodigingscode (referral-teller).
-- SECURITY DEFINER: geeft alleen een aantal terug, geen gegevens van gebruikers.
-- FRAUDEBESCHERMING: een uitnodiging telt pas mee als de uitgenodigde collega
-- daadwerkelijk een betaald abonnement heeft (abon_status 'actief' of 'opgezegd').
-- Een gratis proef of nepaccount levert dus niets op — dat haalt de hele
-- fraudeprikkel weg (elk betalend account = een echte iDEAL-betaling).
create or replace function public.wijs_aantal_verwijzingen(code text)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int
  from public.instellingen
  where verwezen_door = code and code is not null and code <> ''
    and abon_status in ('actief', 'opgezegd');
$$;
grant execute on function public.wijs_aantal_verwijzingen(text) to authenticated;

-- Aantal uitgenodigde collega's dat nog in de gratis proef zit (nog niet betaald).
-- Puur voor een motiverend tweede getal bij de uitnodiger ("X proberen Avinka nu").
create or replace function public.wijs_aantal_verwijzingen_proef(code text)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int
  from public.instellingen
  where verwezen_door = code and code is not null and code <> ''
    and (abon_status = 'proef' or abon_status is null);
$$;
grant execute on function public.wijs_aantal_verwijzingen_proef(text) to authenticated;

-- ── 7) REVIEWS — beoordelingen van leerkrachten (beloning + testimonials) ──
--  Eén review per gebruiker. mag_tonen = toestemming om de review (met voornaam)
--  op de website/landingspagina te tonen. Voedt de mond-tot-mond-groei.
create table if not exists public.reviews (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  sterren    int not null default 5 check (sterren between 1 and 5),
  tekst      text not null default '',
  mag_tonen  boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
drop trigger if exists trg_reviews_updated on public.reviews;
create trigger trg_reviews_updated
  before update on public.reviews
  for each row execute function public.set_updated_at();
alter table public.reviews enable row level security;
drop policy if exists "eigen reviews" on public.reviews;
create policy "eigen reviews" on public.reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.reviews to authenticated;

-- ── 8) ADMIN — wie mag het admin-dashboard zien + aggregaat-statistieken ──
-- Eigenaar voegt zichzelf één keer toe aan deze tabel (via deze SQL-editor).
-- Een gewone gebruiker kan zichzelf NIET admin maken (geen insert-policy).
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
drop policy if exists admins_self on public.admins;
-- Je mag alleen zien of JE ZELF admin bent (niet de hele lijst).
create policy admins_self on public.admins for select using (auth.uid() = user_id);
grant select on public.admins to authenticated;

-- Ben ik (de ingelogde gebruiker) admin?
create or replace function public.wijs_is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists(select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.wijs_is_admin() to authenticated;

-- Admin-overzicht: alleen aantallen/totalen, nooit persoonsgegevens. Geeft null
-- terug als je geen admin bent (dubbele afscherming naast de pagina/middleware).
create or replace function public.wijs_admin_overzicht()
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.wijs_is_admin() then return null; end if;
  select jsonb_build_object(
    'gebruikers', (select count(*) from auth.users),
    'status', jsonb_build_object(
      'actief',   (select count(*) from public.instellingen where abon_status='actief'),
      'opgezegd', (select count(*) from public.instellingen where abon_status='opgezegd'),
      'verlopen', (select count(*) from public.instellingen where abon_status='verlopen')
    ),
    'plan', jsonb_build_object(
      'start',    (select count(*) from public.instellingen where abon_plan='start'    and abon_status in ('actief','opgezegd')),
      'compleet', (select count(*) from public.instellingen where abon_plan='compleet' and abon_status in ('actief','opgezegd')),
      'pro',      (select count(*) from public.instellingen where abon_plan='pro'      and abon_status in ('actief','opgezegd'))
    ),
    'verwijzingen', jsonb_build_object(
      'uitnodigers', (select count(*) from public.instellingen where ref_code is not null),
      'uitgenodigd', (select count(*) from public.instellingen where verwezen_door is not null),
      'betalend',    (select count(*) from public.instellingen where verwezen_door is not null and abon_status in ('actief','opgezegd'))
    )
  ) into r;
  return r;
end; $$;
grant execute on function public.wijs_admin_overzicht() to authenticated;

-- ── 9) AI-VERBRUIK — gebruiksmetadata per AI-call (voor de admin-kostenmodule) ──
-- ALLEEN metadata: tokens, model, welke tool, tijdstip, user-id. NOOIT de inhoud
-- (geen prompt/antwoord, geen leerlinggegevens). De server-route schrijft hier
-- één rij per AI-aanroep. Gewone gebruikers kunnen NIET lezen (geen select-policy);
-- alleen via de admin-functie hieronder.
create table if not exists public.ai_verbruik (
  id                    bigint generated always as identity primary key,
  user_id               uuid references auth.users(id) on delete set null,
  tool                  text,
  model                 text,
  input_tokens          int not null default 0,
  output_tokens         int not null default 0,
  cache_creation_tokens int not null default 0,
  cache_read_tokens     int not null default 0,
  created_at            timestamptz not null default now()
);
create index if not exists idx_ai_verbruik_created on public.ai_verbruik(created_at);
alter table public.ai_verbruik enable row level security;
drop policy if exists ai_verbruik_insert_self on public.ai_verbruik;
-- Je mag alleen je eigen verbruik wegschrijven (de server-route doet dit namens jou).
create policy ai_verbruik_insert_self on public.ai_verbruik
  for insert with check (auth.uid() = user_id);
grant insert on public.ai_verbruik to authenticated;

-- Admin-verbruik: per (tool, model) de aantallen + tokensommen over de laatste
-- N dagen. Kosten rekenen we in de app uit (instelbare prijstabel). Alleen admin.
create or replace function public.wijs_admin_verbruik(dagen int default 30)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.wijs_is_admin() then return null; end if;
  select coalesce(jsonb_agg(x), '[]'::jsonb) into r from (
    select coalesce(tool,'onbekend')  as tool,
           coalesce(model,'onbekend') as model,
           count(*)                          as calls,
           coalesce(sum(input_tokens),0)          as input,
           coalesce(sum(output_tokens),0)         as output,
           coalesce(sum(cache_creation_tokens),0) as cache_creation,
           coalesce(sum(cache_read_tokens),0)     as cache_read
    from public.ai_verbruik
    where created_at >= now() - (dagen || ' days')::interval
    group by coalesce(tool,'onbekend'), coalesce(model,'onbekend')
  ) x;
  return r;
end; $$;
grant execute on function public.wijs_admin_verbruik(int) to authenticated;

-- ── 10) ADMIN — grafieken over tijd ───────────────────────────────────────

-- Aanmeldingen per maand (groei). Uit auth.users.created_at, alleen admin.
create or replace function public.wijs_admin_groei(maanden int default 12)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.wijs_is_admin() then return null; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.maand), '[]'::jsonb) into r from (
    select date_trunc('month', created_at)::date as maand, count(*) as aantal
    from auth.users
    where created_at >= (date_trunc('month', now()) - ((maanden - 1) || ' months')::interval)
    group by 1
  ) x;
  return r;
end; $$;
grant execute on function public.wijs_admin_groei(int) to authenticated;

-- AI-kosten over tijd: per dag + model (kosten rekenen we in de app). Alleen admin.
create or replace function public.wijs_admin_verbruik_tijd(dagen int default 30)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.wijs_is_admin() then return null; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.dag), '[]'::jsonb) into r from (
    select date_trunc('day', created_at)::date as dag,
           coalesce(model,'onbekend') as model,
           coalesce(sum(input_tokens),0)          as input,
           coalesce(sum(output_tokens),0)         as output,
           coalesce(sum(cache_creation_tokens),0) as cache_creation,
           coalesce(sum(cache_read_tokens),0)     as cache_read
    from public.ai_verbruik
    where created_at >= now() - (dagen || ' days')::interval
    group by 1, 2
  ) x;
  return r;
end; $$;
grant execute on function public.wijs_admin_verbruik_tijd(int) to authenticated;

-- Admin-TIJDWINST: uitgebreidere versie van het community-blok in "Mijn
-- statistieken". Aggregeert de statistiek-tabel over álle gebruikers: totaal
-- bespaarde minuten + acties, een uitsplitsing per soort, een dagreeks over de
-- laatste N dagen (voor de trendgrafiek) en het gemiddelde per actieve week.
-- Alleen totalen/aantallen, nooit persoonsgegevens. Alleen admin.
create or replace function public.wijs_admin_tijdwinst(dagen int default 30)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.wijs_is_admin() then return null; end if;
  with mv as (
    select key, sum(value::numeric) as m
    from public.statistiek, jsonb_each_text(minuten) group by key
  ), kv as (
    select key, sum(value::numeric) as n
    from public.statistiek, jsonb_each_text(tellers) group by key
  ), soort as (
    select coalesce(mv.key, kv.key) as soort,
           coalesce(mv.m, 0) as minuten,
           coalesce(kv.n, 0) as acties
    from mv full outer join kv on mv.key = kv.key
  ), bf as (
    -- De eenmalige 1-augustus-backfill (lump van het oude totaal) sluiten we uit
    -- bij de dag-/week-reeksen, anders blaast die de trend/het gemiddelde op.
    select (case when extract(month from timezone('Europe/Amsterdam', now())) >= 8
                 then make_date(extract(year from timezone('Europe/Amsterdam', now()))::int, 8, 1)
                 else make_date(extract(year from timezone('Europe/Amsterdam', now()))::int - 1, 8, 1) end) as d
  ), dag as (
    select (d.key)::date as dag,
           sum((d.value->>'m')::numeric) as minuten,
           sum((d.value->>'n')::numeric) as acties
    from public.statistiek s, jsonb_each(s.per_dag) d, bf
    where (d.key)::date >= (timezone('Europe/Amsterdam', now())::date - (dagen - 1))
      and (d.key)::date <> bf.d
    group by 1
  ), wk as (
    select s.user_id, date_trunc('week', (d.key)::date) as wkstart,
           sum((d.value->>'m')::numeric) as m
    from public.statistiek s, jsonb_each(s.per_dag) d, bf
    where (d.key)::date <> bf.d
    group by s.user_id, date_trunc('week', (d.key)::date)
  )
  select jsonb_build_object(
    'totaal_minuten', coalesce((select sum(minuten) from soort), 0),
    'totaal_acties', coalesce((select sum(acties) from soort), 0),
    'gebruikers', (select count(*)::int from public.statistiek),
    'gebruikers_actief', (select count(*)::int from public.statistiek where tellers <> '{}'::jsonb),
    'per_soort', coalesce((select jsonb_agg(jsonb_build_object('soort', soort, 'minuten', minuten, 'acties', acties) order by minuten desc) from soort), '[]'::jsonb),
    'per_dag', coalesce((select jsonb_agg(jsonb_build_object('dag', dag, 'minuten', minuten, 'acties', acties) order by dag) from dag), '[]'::jsonb),
    'gem_actieve_week', coalesce((select round(avg(m))::int from wk where m > 0), 0),
    'actieve_weken', coalesce((select count(*)::int from wk where m > 0), 0)
  ) into r;
  return r;
end; $$;
grant execute on function public.wijs_admin_tijdwinst(int) to authenticated;

-- Maandelijkse momentopname van de abonnement-aantallen (voor de omzetgrafiek).
-- We bewaren AANTALLEN per pakket; de MRR rekent de app uit met de prijzen uit
-- de code (één bron van waarheid). De grafiek bouwt zich op vanaf de eerste snapshot.
create table if not exists public.abon_snapshot (
  maand      date primary key,
  gebruikers int not null default 0,
  start      int not null default 0,
  compleet   int not null default 0,
  pro        int not null default 0,
  gemaakt_op timestamptz not null default now()
);
alter table public.abon_snapshot enable row level security;
-- Geen policies → alleen via de admin-functie leesbaar; de functie schrijft als definer.

create or replace function public.wijs_snapshot_abon()
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.abon_snapshot (maand, gebruikers, start, compleet, pro)
  values (
    date_trunc('month', now())::date,
    (select count(*) from auth.users),
    (select count(*) from public.instellingen where abon_plan='start'    and abon_status in ('actief','opgezegd')),
    (select count(*) from public.instellingen where abon_plan='compleet' and abon_status in ('actief','opgezegd')),
    (select count(*) from public.instellingen where abon_plan='pro'      and abon_status in ('actief','opgezegd'))
  )
  on conflict (maand) do update set
    gebruikers = excluded.gebruikers,
    start      = excluded.start,
    compleet   = excluded.compleet,
    pro        = excluded.pro,
    gemaakt_op = now();
end; $$;
grant execute on function public.wijs_snapshot_abon() to authenticated;

create or replace function public.wijs_admin_snapshots(maanden int default 12)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.wijs_is_admin() then return null; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.maand), '[]'::jsonb) into r from (
    select maand, gebruikers, start, compleet, pro
    from public.abon_snapshot
    where maand >= (date_trunc('month', now()) - ((maanden - 1) || ' months')::interval)::date
  ) x;
  return r;
end; $$;
grant execute on function public.wijs_admin_snapshots(int) to authenticated;

-- ── 11) PROEF-FEEDBACK + CONVERSIE ────────────────────────────────────────
-- Aan het eind van de proef vragen we kort: ga je een abonnement nemen?
-- (zeker / twijfel / nee) + eventueel waarom. Eén antwoord per gebruiker.
create table if not exists public.proef_feedback (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  intentie   text not null check (intentie in ('zeker','twijfel','nee')),
  categorie  text not null default '',  -- snelle keuze (bv. "Prijs"); leeg = niet gekozen
  reden      text not null default '',  -- optionele vrije toelichting
  created_at timestamptz not null default now()
);
-- Als de tabel al bestond zonder categorie-kolom:
alter table public.proef_feedback add column if not exists categorie text not null default '';
alter table public.proef_feedback enable row level security;
drop policy if exists pf_self on public.proef_feedback;
create policy pf_self on public.proef_feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update on public.proef_feedback to authenticated;

-- Conversie-overzicht voor de admin: de funnel + de intentie-uitslag + de
-- laatste redenen. Alleen aantallen/eigen-feedback, geen leerlinggegevens.
create or replace function public.wijs_admin_conversie()
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.wijs_is_admin() then return null; end if;
  select jsonb_build_object(
    'funnel', jsonb_build_object(
      'aangemeld', (select count(*) from auth.users),
      'betalend',  (select count(*) from public.instellingen where abon_status in ('actief','opgezegd')),
      'verlopen',  (select count(*) from public.instellingen where abon_status='verlopen')
    ),
    'intentie', jsonb_build_object(
      'zeker',   (select count(*) from public.proef_feedback where intentie='zeker'),
      'twijfel', (select count(*) from public.proef_feedback where intentie='twijfel'),
      'nee',     (select count(*) from public.proef_feedback where intentie='nee')
    ),
    'categorieen', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.aantal desc), '[]'::jsonb)
      from (
        select intentie, categorie, count(*) as aantal from public.proef_feedback
        where categorie <> '' group by intentie, categorie
      ) x
    ),
    'redenen', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
      from (
        select intentie, reden, created_at from public.proef_feedback
        where reden <> '' order by created_at desc limit 50
      ) x
    )
  ) into r;
  return r;
end; $$;
grant execute on function public.wijs_admin_conversie() to authenticated;

-- ── 12) FEEDBACK — algemene in-app feedback (idee/probleem/compliment) ─────
-- Leerkrachten kunnen op elk moment iets sturen via de feedbackknop in het
-- dashboard. Meerdere berichten per gebruiker mag (eigen id per bericht).
-- pagina = waar de leerkracht was (context); status = nieuw/afgehandeld voor
-- jouw eigen werklijst in admin. Geen leerlinggegevens: vrije tekst van de
-- leerkracht zelf.
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  soort      text not null default 'idee' check (soort in ('idee','probleem','compliment','anders')),
  bericht    text not null,
  pagina     text not null default '',
  tool       text not null default '',     -- slug van de tool (rapportwijs/...) of '' = algemeen dashboard
  categorie  text not null default '',     -- snelle keuze "waar gaat het over?" (per tool anders); '' = niet gekozen
  status     text not null default 'nieuw' check (status in ('nieuw','afgehandeld')),
  created_at timestamptz not null default now()
);
-- Als de tabel al bestond zonder tool/categorie-kolom:
alter table public.feedback add column if not exists tool text not null default '';
alter table public.feedback add column if not exists categorie text not null default '';
alter table public.feedback enable row level security;
-- Leerkracht mag alleen eigen feedback insturen; niemand leest mee (alleen de
-- admin, via de SECURITY DEFINER-functie hieronder).
drop policy if exists fb_insert_self on public.feedback;
create policy fb_insert_self on public.feedback
  for insert with check (auth.uid() = user_id);
grant insert on public.feedback to authenticated;

-- Admin-overzicht: tellingen + de laatste berichten, mét voornaam/e-mail van de
-- INZENDER zodat je kunt terugmailen ("bedankt, opgelost!"). Dit is de eigen
-- account-gegeven van de leerkracht, nooit leerlinggegevens. Admin-gated.
create or replace function public.wijs_admin_feedback(dagen int default 90)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.wijs_is_admin() then return null; end if;
  select jsonb_build_object(
    'totaal', (select count(*) from public.feedback
               where created_at >= now() - (dagen || ' days')::interval),
    'open',   (select count(*) from public.feedback where status='nieuw'),
    'per_soort', (
      select coalesce(jsonb_object_agg(soort, aantal), '{}'::jsonb)
      from (select soort, count(*) as aantal from public.feedback
            where created_at >= now() - (dagen || ' days')::interval
            group by soort) s
    ),
    'per_tool', (
      select coalesce(jsonb_object_agg(coalesce(nullif(tool,''),'dashboard'), aantal), '{}'::jsonb)
      from (select tool, count(*) as aantal from public.feedback
            where created_at >= now() - (dagen || ' days')::interval
            group by tool) t
    ),
    'categorieen', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.aantal desc), '[]'::jsonb)
      from (
        select coalesce(nullif(tool,''),'dashboard') as tool, categorie, count(*) as aantal
        from public.feedback
        where categorie <> '' and created_at >= now() - (dagen || ' days')::interval
        group by 1, categorie
      ) x
    ),
    'items', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
      from (
        select f.id, f.soort, f.bericht, f.pagina, f.tool, f.categorie, f.status, f.created_at,
               coalesce(u.raw_user_meta_data->>'first_name','') as voornaam,
               u.email as email
        from public.feedback f
        join auth.users u on u.id = f.user_id
        where f.created_at >= now() - (dagen || ' days')::interval
        order by f.created_at desc
        limit 200
      ) x
    )
  ) into r;
  return r;
end; $$;
grant execute on function public.wijs_admin_feedback(int) to authenticated;

-- Een feedback-item markeren als afgehandeld (of terug naar nieuw). Admin-gated.
create or replace function public.wijs_admin_feedback_status(fid uuid, nieuwe_status text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.wijs_is_admin() then return false; end if;
  if nieuwe_status not in ('nieuw','afgehandeld') then return false; end if;
  update public.feedback set status = nieuwe_status where id = fid;
  return true;
end; $$;
grant execute on function public.wijs_admin_feedback_status(uuid, text) to authenticated;

-- Bèta "eigen schoolsjabloon" (Toetsanalyse) per account aan/uit, op e-mailadres.
-- Admin-gated; instellingen staat alleen "auth.uid() = user_id" toe, dus dit
-- moet via een security-definer functie lopen om een ANDER account te raken.
create or replace function public.wijs_admin_zet_beta_eigen_format(doel_email text, aan boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare doel_id uuid;
begin
  if not public.wijs_is_admin() then return false; end if;
  select id into doel_id from auth.users where lower(email) = lower(doel_email) limit 1;
  if doel_id is null then return false; end if;
  insert into public.instellingen (user_id, beta_eigen_format)
  values (doel_id, aan)
  on conflict (user_id) do update set beta_eigen_format = excluded.beta_eigen_format;
  return true;
end; $$;
grant execute on function public.wijs_admin_zet_beta_eigen_format(text, boolean) to authenticated;

-- Welke accounts de bèta nu aan hebben staan (voor het admin-scherm).
create or replace function public.wijs_admin_beta_eigen_format_lijst()
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.wijs_is_admin() then return null; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.email), '[]'::jsonb) into r
  from (
    select u.email
    from public.instellingen i
    join auth.users u on u.id = i.user_id
    where i.beta_eigen_format = true
  ) x;
  return r;
end; $$;
grant execute on function public.wijs_admin_beta_eigen_format_lijst() to authenticated;

-- ── 13) TAKEN — persoonlijke takenlijst (van to-do naar gedaan) ───────────
-- Eigen takenlijst van de leerkracht. Privé in het account (RLS), gaat nooit
-- naar AI. Afgevinkte taken kun je in de app wissen; geen automatische opschoning.
create table if not exists public.taken (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tekst      text not null,
  gedaan     boolean not null default false,
  deadline   date,
  wekelijks  boolean not null default false,
  created_at timestamptz not null default now(),
  gedaan_op  timestamptz
);
-- Als de tabel al bestond zonder deadline/wekelijks-kolom:
alter table public.taken add column if not exists deadline date;
alter table public.taken add column if not exists wekelijks boolean not null default false;
alter table public.taken enable row level security;
drop policy if exists "eigen taken" on public.taken;
create policy "eigen taken" on public.taken
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.taken to authenticated;
create index if not exists idx_taken_user on public.taken(user_id);

-- ── 14) BOUW-TAKEN — admin-backlog ("nog te bouwen voor de website") ──────
-- Aparte to-do-lijst in de admin-module, los van de persoonlijke takenlijst.
-- Alleen admins (RLS via wijs_is_admin); gaat nooit naar AI.
create table if not exists public.bouw_taken (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tekst      text not null,
  gedaan     boolean not null default false,
  prioriteit text not null default 'normaal' check (prioriteit in ('hoog','normaal','laag')),
  categorie  text not null default 'algemeen' check (categorie in ('algemeen','tools','klein')),
  created_at timestamptz not null default now(),
  gedaan_op  timestamptz
);
-- Als de tabel al bestond zonder categorie-kolom:
alter table public.bouw_taken add column if not exists categorie text not null default 'algemeen';
alter table public.bouw_taken enable row level security;
drop policy if exists "eigen bouw_taken" on public.bouw_taken;
create policy "eigen bouw_taken" on public.bouw_taken
  for all using (auth.uid() = user_id and public.wijs_is_admin())
  with check (auth.uid() = user_id and public.wijs_is_admin());
grant select, insert, update, delete on public.bouw_taken to authenticated;
create index if not exists idx_bouw_taken_user on public.bouw_taken(user_id, created_at desc);

-- ── 15) TOESTEMMINGEN — bewijs van akkoord op voorwaarden + privacy (AVG) ──
-- Append-only bewijstabel: elke registratie- en her-akkoord-actie legt hier de
-- geaccepteerde VERSIES vast (art. 7 AVG, verantwoordingsplicht). De leerkracht
-- mag z'n eigen akkoorden LEZEN (voor de her-akkoord-pop-up in het dashboard);
-- schrijven kan alleen via de SECURITY DEFINER-functies hieronder, zodat de
-- tabel echt append-only blijft (geen insert/update/delete voor de gebruiker).
create table if not exists public.toestemmingen (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  voorwaarden_versie text not null,
  privacy_versie     text not null,
  bron               text not null default 'registratie',
  geaccepteerd_op    timestamptz not null default now()
);
alter table public.toestemmingen enable row level security;
drop policy if exists "eigen toestemmingen lezen" on public.toestemmingen;
create policy "eigen toestemmingen lezen" on public.toestemmingen
  for select using ((select auth.uid()) = user_id);
-- LET OP: alleen SELECT voor de gebruiker. Zonder deze grant krijgt de browser
-- een 403 ("permission denied") en denkt de her-akkoord-pop-up dat er nog geen
-- akkoord is — dan blijft die elke dashboard-lading vragen.
grant select on public.toestemmingen to authenticated;
create index if not exists idx_toestemmingen_user on public.toestemmingen(user_id);

-- Legt een NIEUW akkoord vast na een wijziging van de voorwaarden/privacy
-- (aangeroepen vanuit de her-akkoord-pop-up).
create or replace function public.registreer_herakkoord(p_voorwaarden text, p_privacy text)
returns void language plpgsql security definer set search_path to 'public' as $$
  begin
    if auth.uid() is null then
      raise exception 'niet ingelogd';
    end if;
    insert into public.toestemmingen (user_id, voorwaarden_versie, privacy_versie, bron)
    values (auth.uid(), p_voorwaarden, p_privacy, 'her-akkoord');
  end;
$$;
grant execute on function public.registreer_herakkoord(text, text) to authenticated;

-- Legt het EERSTE akkoord vast bij registratie: leest de versies uit de
-- user-metadata die bij aanmelden zijn meegegeven. Draait als trigger op auth.users.
create or replace function public.registreer_toestemming()
returns trigger language plpgsql security definer set search_path to 'public' as $$
  begin
    if new.raw_user_meta_data ? 'voorwaarden_versie' then
      insert into public.toestemmingen
        (user_id, voorwaarden_versie, privacy_versie, bron, geaccepteerd_op)
      values (
        new.id,
        new.raw_user_meta_data ->> 'voorwaarden_versie',
        coalesce(new.raw_user_meta_data ->> 'privacy_versie',
                 new.raw_user_meta_data ->> 'voorwaarden_versie'),
        coalesce(new.raw_user_meta_data ->> 'akkoord_bron', 'registratie'),
        coalesce((new.raw_user_meta_data ->> 'akkoord_op')::timestamptz, now())
      );
    end if;
    return new;
  end;
$$;
drop trigger if exists on_auth_user_created_toestemming on auth.users;
create trigger on_auth_user_created_toestemming
  after insert on auth.users
  for each row execute function public.registreer_toestemming();

-- Klaar. Je tabellen staan klaar en zijn per gebruiker afgeschermd.

-- ── 16) SCHOOLAGENDA — gekoppelde agenda's en de afspraken eruit ──────────
-- Een leerkracht plakt de agendalink van school (Parro, Social Schools,
-- Outlook of Teams, Google) en Avinka leest daar de afspraken uit. Zo'n link
-- is een sleutel tot die agenda, dus hij staat VERSLEUTELD opgeslagen: de code
-- versleutelt hem met AVINKA_GEHEIM_SLEUTEL, de database ziet alleen ruis.
--
-- AVG: namen van kinderen worden uit de titel gehaald vóór het opslaan
-- (maskeerNamen in src/lib/agenda-ophalen.ts). Wat overblijft is het soort
-- afspraak en het tijdstip, en dat mag gewoon.

create table if not exists public.agenda_bronnen (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  naam          text not null,
  systeem       text not null default 'ics',
  link_geheim   text not null,
  modus         text not null default 'alles',
  kleur         text not null default 'groen',
  actief        boolean not null default true,
  laatst_gelukt timestamptz,
  laatste_fout  text,
  aantal_items  integer not null default 0,
  created_at    timestamptz not null default now()
);
-- Toegestane waarden voor 'modus' en 'systeem' bewaakt de code
-- (src/app/api/agenda/bronnen/route.ts). Bewust geen check-constraints hier:
-- die sneuvelden bij het plakken in de SQL-editor en leveren weinig op.
alter table public.agenda_bronnen enable row level security;
drop policy if exists "eigen agendabronnen" on public.agenda_bronnen;
create policy "eigen agendabronnen" on public.agenda_bronnen
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.agenda_bronnen to authenticated;
create index if not exists idx_agenda_bronnen_user on public.agenda_bronnen(user_id);

create table if not exists public.agenda_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  bron_id    uuid not null references public.agenda_bronnen(id) on delete cascade,
  uid        text not null,
  datum      date not null,
  tot_datum  date not null,
  hele_dag   boolean not null default false,
  begintijd  time,
  eindtijd   time,
  titel      text not null,
  soort      text not null default 'overig',
  tijdvakken smallint not null default 1,
  locatie    text,
  bijgewerkt timestamptz not null default now()
);
alter table public.agenda_items enable row level security;
drop policy if exists "eigen agenda-items" on public.agenda_items;
create policy "eigen agenda-items" on public.agenda_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.agenda_items to authenticated;
create unique index if not exists idx_agenda_items_uniek
  on public.agenda_items(bron_id, uid, datum);
create index if not exists idx_agenda_items_user_datum
  on public.agenda_items(user_id, datum);

-- De vakantieregio is alleen het vangnet: als jouw schoolagenda de vakanties
-- zelf bevat, zijn die leidend. Scholen wijken af (een tweede week mei, een
-- eigen pinkstervakantie), dus de landelijke lijst is nooit de waarheid.
alter table public.instellingen add column if not exists vakantieregio text;

-- ── 17) BASISROOSTER — je vaste lesweek ───────────────────────────────────
-- Het rooster wordt gemaakt in de weekplanning en stond eerst alleen in de
-- browser (localStorage). Daardoor was je rooster op school een ander dan thuis.
-- Nu hangt het aan je account, per schooljaar.
--
-- We bewaren de vorm van de weekplanning ongewijzigd in `data` (setup + blokken,
-- tijden in minuten). Dat houdt de tool werkend en we vertalen één keer in
-- src/lib/planning/rooster.ts. Er staan GEEN leerlingnamen in: alleen vakken,
-- dagen en tijden.

create table if not exists public.basisrooster (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  schooljaar text not null,                       -- "2026-2027"
  data       jsonb not null default '{}'::jsonb,  -- { setup, blokken, duurVoorkeur }
  bijgewerkt timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.basisrooster enable row level security;
drop policy if exists "eigen basisrooster" on public.basisrooster;
create policy "eigen basisrooster" on public.basisrooster
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.basisrooster to authenticated;
-- Eén rooster per schooljaar. (Later mogelijk meer, bijvoorbeeld bij een
-- duobaan; dan vervalt deze unieke index.)
create unique index if not exists idx_basisrooster_uniek
  on public.basisrooster(user_id, schooljaar);

-- Een week die afwijkt van je basisrooster: uitstapje, toetsweek, geruilde dag.
-- Je basisrooster blijft ongemoeid; hier staat alleen wat er die ene week anders
-- is. Leeg record of geen record = die week volgt gewoon je basisrooster.
create table if not exists public.rooster_week (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  maandag    date not null,                       -- de maandag van die week
  data       jsonb not null default '{}'::jsonb,  -- { blokken }
  bijgewerkt timestamptz not null default now()
);
alter table public.rooster_week enable row level security;
drop policy if exists "eigen roosterweek" on public.rooster_week;
create policy "eigen roosterweek" on public.rooster_week
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.rooster_week to authenticated;
create unique index if not exists idx_rooster_week_uniek
  on public.rooster_week(user_id, maandag);

-- ── 18) BESTAND_DELING — draaiboek delen via leeslink/e-mail ───────────────
-- Deze tabel/RPC/policies draaiden al live (gebouwd op werk/b, zie
-- src/app/api/draaiboek/{delen,publiek,gedeeld-met-mij}/route.ts) maar
-- stonden nog niet in dit bestand — een verse database miste ze. Hier
-- alsnog gedocumenteerd, zonder functionele wijziging. Idempotent: veilig
-- te draaien ook als de tabel al bestaat.
--
-- Eén rij = één deling van één bestand: een leeslink (token, werkt ook
-- zonder inlog) en/of een uitnodiging op e-mailadres (rol bekijken/bewerken,
-- telt mee zodra de uitgenodigde met dat e-mailadres inlogt). Alleen de
-- eigenaar van het bestand kan delen/intrekken; her-delen door een
-- uitgenodigde kan niet (de API-route checkt zelf `bestanden.user_id`).
create table if not exists public.bestand_deling (
  id            uuid primary key default gen_random_uuid(),
  bestand_id    uuid not null references public.bestanden(id) on delete cascade,
  eigenaar      uuid not null references auth.users(id) on delete cascade,
  gedeeld_email text,                 -- optioneel: uitnodiging op e-mailadres
  rol           text not null default 'bewerken', -- 'bekijken' | 'bewerken'
  token         text not null unique, -- voor de anonieme leeslink /gedeeld.html?token=
  created_at    timestamptz default now()
);
create index if not exists idx_bestand_deling_bestand on public.bestand_deling(bestand_id);
create index if not exists idx_bestand_deling_email on public.bestand_deling(gedeeld_email);

alter table public.bestand_deling enable row level security;
drop policy if exists "deling eigen beheren" on public.bestand_deling;
create policy "deling eigen beheren" on public.bestand_deling
  for all using (auth.uid() = eigenaar) with check (auth.uid() = eigenaar);
drop policy if exists "deling voor mij zichtbaar" on public.bestand_deling;
create policy "deling voor mij zichtbaar" on public.bestand_deling
  for select using (lower(gedeeld_email) = lower((auth.jwt() ->> 'email')));
-- Zonder deze grant faalt élke actie op bestanden zodra de policies hierboven
-- meewegen (RLS evalueert de tabel, ook al raakt de query 'm niet direct) —
-- zie het geheugen "bestand-deling-grant": dit is precies de fix die toen
-- handmatig is gedraaid, nu voor een verse database vastgelegd.
grant select, insert, update, delete on public.bestand_deling to authenticated;

-- Extra leesrecht op `bestanden` zelf voor wie een deling op zijn e-mailadres
-- heeft (het "Gedeeld met mij"-tabblad in Bestanden).
drop policy if exists "gedeelde bestanden lezen" on public.bestanden;
create policy "gedeelde bestanden lezen" on public.bestanden
  for select using (
    exists (
      select 1 from public.bestand_deling bd
      where bd.bestand_id = bestanden.id
        and lower(bd.gedeeld_email) = lower((auth.jwt() ->> 'email'))
    )
  );

-- Security-definer functie voor de anonieme leeslink: werkt ook zonder
-- inlog (vandaar security definer, dat omzeilt bewust de RLS hierboven),
-- geeft alleen terug wat bij een geldig token hoort — nooit meer.
create or replace function public.gedeeld_draaiboek(p_token text)
returns table (id uuid, naam text, data jsonb, rol text)
language sql security definer set search_path = public as $$
  select b.id, b.naam, b.data, bd.rol
  from public.bestand_deling bd
  join public.bestanden b on b.id = bd.bestand_id
  where bd.token = p_token
  limit 1;
$$;

-- ── 19) COLLEGA'S BIJ DEZE GROEP — samen één klas draaien ──────────────────
--
-- ⚠️ Heette eerst "duo-collega's" en was toen een PAAR (twee leerkrachten met
-- een duobaan). Sinds 3-8-2026 kunnen het er meer zijn — denk aan een
-- onderwijsassistent erbij. Daarom hangt alles wat gedeeld wordt nu aan de
-- KLAS, niet aan het paar: één takenlijst en één overdracht-briefje per groep,
-- die iederéén ziet die aan die groep hangt. Bij een paar-model zouden twee
-- collega's van dezelfde groep elkaars taken niet zien.
--
-- De tabelnaam `duo_koppels` is blijven staan (te veel verwijzingen om te
-- hernoemen), maar lees hem als LIDMAATSCHAP: gebruiker_a is de eigenaar van
-- de klas die uitnodigt, gebruiker_b de collega, en `rol` bepaalt hoeveel die
-- mag zien.
-- Twee leerkrachten die dezelfde klas delen. Vóór dit blok was ELKE RLS-
-- policy in dit bestand letterlijk "auth.uid() = user_id" — dit is de eerste
-- plek waar een ander account bij je gegevens mag. Daarom: bestaande policies
-- blijven ongewijzigd staan, dit komt er ADDITIEF bij (een extra policy per
-- tabel, geen vervanging). Bijzondere persoonsgegevens horen nergens in deze
-- feature — dat regelt de tool-laag (dezelfde nudge als bij Rapporten), niet
-- de database.

-- Eén rij = één koppel-relatie tussen twee accounts, voor één gezamenlijke
-- klas. Nooit automatisch actief: pas als de uitgenodigde 'm zelf accepteert
-- (zie koppelDuo in db.ts) gaat status naar 'actief' en begint de toegang.
create table if not exists public.duo_koppels (
  id              uuid primary key default gen_random_uuid(),
  gebruiker_a     uuid not null references auth.users(id) on delete cascade,
  -- Leeg zolang de uitnodiging nog niet geaccepteerd is — bij het aanmaken
  -- weet je nog niet wie er straks op de link/code klikt.
  gebruiker_b     uuid references auth.users(id) on delete cascade,
  klas_id         uuid not null references public.klassen(id) on delete cascade,
  status          text not null default 'uitgenodigd', -- 'uitgenodigd' | 'actief'
  -- 'volledig'  = alles, zoals je duo-partner: klas, rapporten, bestanden,
  --               taken en overdracht.
  -- 'meekijken' = de dagelijkse samenwerking (klas, gedeelde map, taken,
  --               overdracht) maar GEEN rapporten. Voor een assistent: die
  --               werkt met de kinderen, maar geschreven oordelen over
  --               kinderen zijn een ander soort gegeven.
  rol             text not null default 'volledig',
  code            text unique,
  created_at      timestamptz default now(),
  constraint duo_verschillende_mensen check (gebruiker_b is null or gebruiker_a <> gebruiker_b)
);
-- Voorkomt dat dezelfde collega twee keer aan dezelfde klas hangt.
-- ⚠️ `where gebruiker_b is not null` is essentieel: bij een openstaande
-- uitnodiging is gebruiker_b nog leeg, en least/greatest negeren NULL — de rij
-- telt dan als (a, a, klas). Zonder deze voorwaarde kun je dus maar één
-- uitnodiging tegelijk laten openstaan, terwijl je juist twee collega's in één
-- keer wilt kunnen vragen.
drop index if exists idx_duo_koppels_paar;
create unique index if not exists idx_duo_koppels_lid
  on public.duo_koppels (least(gebruiker_a, gebruiker_b), greatest(gebruiker_a, gebruiker_b), klas_id)
  where gebruiker_b is not null;
create index if not exists idx_duo_koppels_a on public.duo_koppels(gebruiker_a);
create index if not exists idx_duo_koppels_b on public.duo_koppels(gebruiker_b);

alter table public.duo_koppels enable row level security;
-- Je mag een koppel zien/bijwerken/verwijderen zodra je er zelf één van de
-- twee partijen in bent. Zolang de uitnodiging nog niet geaccepteerd is,
-- staat de uitgenodigde (nog onbekend, gebruiker_b is dan leeg) hier NIET
-- in — die ziet de uitnodiging daarom via de code, niet via deze policy
-- (zie de twee functies hieronder).
drop policy if exists "eigen duo koppel" on public.duo_koppels;
drop policy if exists "eigen duo koppel lezen" on public.duo_koppels;
create policy "eigen duo koppel lezen" on public.duo_koppels
  for select using (auth.uid() in (gebruiker_a, gebruiker_b));
-- ⚠️ Bijwerken mag ALLEEN de eigenaar van de klas (gebruiker_a). Zodra er
-- rollen bestaan, is "de ander mag deze rij ook bijwerken" een gat: een
-- meekijkende collega zou zijn eigen `rol` op 'volledig' kunnen zetten en zo
-- alsnog bij de rapporten komen. De uitgenodigde heeft bijwerken ook niet
-- nodig — loskoppelen gaat via delete, dat mogen ze allebei.
drop policy if exists "eigen duo koppel bijwerken" on public.duo_koppels;
create policy "eigen duo koppel bijwerken" on public.duo_koppels
  for update using (auth.uid() = gebruiker_a)
  with check (auth.uid() = gebruiker_a);
drop policy if exists "eigen duo koppel verwijderen" on public.duo_koppels;
create policy "eigen duo koppel verwijderen" on public.duo_koppels
  for delete using (auth.uid() in (gebruiker_a, gebruiker_b));
-- Aanmaken: alleen voor een klas die je ZELF bezit. De UI laat toch alleen
-- je eigen klassen zien, maar dat mag nooit de enige bescherming zijn —
-- zonder deze check zou iemand een uitnodiging kunnen aanmaken voor een
-- klas-id die niet van hem is en zo (na acceptatie) samen met een ander
-- account bij andermans klas/rapporten kunnen.
drop policy if exists "eigen duo koppel aanmaken" on public.duo_koppels;
create policy "eigen duo koppel aanmaken" on public.duo_koppels
  for insert with check (
    gebruiker_a = auth.uid()
    and exists (select 1 from public.klassen k where k.id = klas_id and k.user_id = auth.uid())
  );
grant select, insert, update, delete on public.duo_koppels to authenticated;

-- Uitnodiging bekijken via de code, vóór acceptatie (B staat nog niet in de
-- rij, dus de RLS-policy hierboven laat 'm nog niets zien). Geeft alleen
-- weer wat nodig is om de uitnodiging te tonen — geen kinddata.
create or replace function public.duo_koppel_voorbeeld(p_code text)
returns table (klas_naam text, status text)
language sql security definer set search_path = public as $$
  select k.naam, dk.status
  from public.duo_koppels dk
  join public.klassen k on k.id = dk.klas_id
  where dk.code = p_code and dk.status = 'uitgenodigd' and dk.gebruiker_b is null
  limit 1;
$$;
grant execute on function public.duo_koppel_voorbeeld(text) to authenticated;

-- Uitnodiging accepteren: moet via security definer, want vóór dit moment
-- staat de accepterende gebruiker nergens in de rij en mag hij 'm dus niet
-- via een gewone update raken (RLS zou dat blokkeren — terecht).
create or replace function public.duo_koppel_accepteren(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare gevonden_id uuid;
begin
  update public.duo_koppels
  set gebruiker_b = auth.uid(), status = 'actief'
  where code = p_code and status = 'uitgenodigd' and gebruiker_b is null
    and gebruiker_a <> auth.uid() -- niet je eigen uitnodiging accepteren
  returning id into gevonden_id;
  return gevonden_id;
end;
$$;
grant execute on function public.duo_koppel_accepteren(text) to authenticated;

-- Wie hoort er bij deze groep? De eigenaar plus elke collega met een actieve
-- koppeling, mét naam en mailadres. Moet via security definer: `auth.users` is
-- voor gewone gebruikers niet leesbaar en dat hoort zo te blijven. Je krijgt
-- alleen iets terug voor een groep waar je zélf bij hoort, dus met een
-- willekeurig klas-id kun je geen mailadressen van vreemden opvragen.
create or replace function public.klas_collegas(p_klas uuid)
returns table (user_id uuid, voornaam text, email text, rol text, is_eigenaar boolean)
language sql stable security definer set search_path = public as $$
  select u.id,
         coalesce(u.raw_user_meta_data ->> 'first_name', ''),
         u.email::text,
         'volledig',
         true
  from public.klassen k
  join auth.users u on u.id = k.user_id
  where k.id = p_klas and public.klas_toegang(p_klas)
  union all
  select u.id,
         coalesce(u.raw_user_meta_data ->> 'first_name', ''),
         u.email::text,
         dk.rol,
         false
  from public.duo_koppels dk
  join auth.users u on u.id = dk.gebruiker_b
  where dk.klas_id = p_klas and dk.status = 'actief' and public.klas_toegang(p_klas);
$$;
grant execute on function public.klas_collegas(uuid) to authenticated;
revoke execute on function public.klas_collegas(uuid) from public, anon;

-- De twee toegangsvragen die alle policies hieronder stellen. Als functie,
-- want ze worden op vijf plekken gebruikt en moeten overal hetzelfde
-- antwoord geven.
--
-- ⚠️ Allebei security definer: ze kijken in `duo_koppels`, en een meekijkende
-- collega mag díé tabel niet volledig lezen. Zonder definer zou de policy
-- zichzelf in de staart bijten.
create or replace function public.klas_toegang(p_klas uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.klassen k where k.id = p_klas and k.user_id = auth.uid())
      or exists (
        select 1 from public.duo_koppels dk
        where dk.klas_id = p_klas and dk.status = 'actief' and dk.gebruiker_b = auth.uid()
      );
$$;
grant execute on function public.klas_toegang(uuid) to authenticated;
revoke execute on function public.klas_toegang(uuid) from public, anon;

-- Zelfde vraag, maar alleen voor wie álles mag: de eigenaar en collega's met
-- rol 'volledig'. Dit is de grens waar rapporten achter liggen.
create or replace function public.klas_toegang_volledig(p_klas uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.klassen k where k.id = p_klas and k.user_id = auth.uid())
      or exists (
        select 1 from public.duo_koppels dk
        where dk.klas_id = p_klas and dk.status = 'actief'
          and dk.gebruiker_b = auth.uid() and dk.rol = 'volledig'
      );
$$;
grant execute on function public.klas_toegang_volledig(uuid) to authenticated;
revoke execute on function public.klas_toegang_volledig(uuid) from public, anon;

-- Opgeruimd: hoorden bij het oude paar-model.
drop function if exists public.duo_partner(uuid);
drop function if exists public.is_duo_partner(uuid);

-- Klas-koppeling: een collega met rol 'volledig' mag de gezamenlijke klas ook
-- bewerken.
-- ⚖️ BEWUSTE KEUZE van de eigenaar (3-8), niet per ongeluk zo breed: als duo
-- ben je SAMEN verantwoordelijk voor de klas, dus beiden mogen alles — ook
-- verwijderen. Deze policy dus NIET later "veiliger" maken door delete eruit
-- te halen of `user_id` vast te pinnen; dat is eerder overwogen en afgewezen.
drop policy if exists "duo-partner klas" on public.klassen;
create policy "duo-partner klas" on public.klassen
  for all using (public.klas_toegang_volledig(klassen.id))
  with check (public.klas_toegang_volledig(klassen.id));

-- Een meekijkende collega moet de klas wél kúnnen zien — anders weet hij niet
-- eens over welke groep de gedeelde taken gaan. Alleen lezen, niet wijzigen.
drop policy if exists "meekijkende collega klas" on public.klassen;
create policy "meekijkende collega klas" on public.klassen
  for select using (public.klas_toegang(klassen.id));

-- De gedeelde map hoort bij de GROEP, niet bij een koppel: met drie mensen wil
-- je één gedeelde map, niet één per koppeling. (Stond eerst als
-- `gedeelde_map_id` op duo_koppels.)
alter table public.klassen add column if not exists gedeelde_map_id uuid
  references public.bestanden(id) on delete set null;
alter table public.duo_koppels drop column if exists gedeelde_map_id;

-- "Welke klas is voor MIJ actief" mag niet langer alleen de gedeelde
-- klassen.actief-vlag zijn: die kolom hoort bij de eigenaar-rij en twee
-- mensen die aan dezelfde rij zitten te draaien zouden elkaars keuze
-- ongemerkt omgooien (A schakelt naar een andere eigen klas → de vlag op de
-- gedeelde rij klapt óók om, terwijl B 'm nog gebruikt). Daarom een eigen,
-- per-gebruiker wijzer op `instellingen`, los van `klassen.actief`. Leeg =
-- gebruik gewoon de bestaande klassen.actief-volgorde (ongewijzigd gedrag
-- voor iedereen zonder duo-koppel).
alter table public.instellingen add column if not exists actieve_duo_klas_id uuid
  references public.klassen(id) on delete set null;

-- ── Rapporten: gescoped op de gedeelde klas, niet "alles wat ik ooit had" ──
alter table public.rapporten add column if not exists klas_id uuid
  references public.klassen(id) on delete set null;
create index if not exists idx_rapporten_klas on public.rapporten(klas_id);

-- ⚠️ Hier ligt de grens van de rol 'meekijken': rapporten zijn geschreven
-- oordelen over kinderen, en die deel je alleen met een collega die
-- medeverantwoordelijk is voor de groep — niet met iedereen die meehelpt.
-- Vandaar `klas_toegang_volledig` en niet `klas_toegang`.
drop policy if exists "duo-partner rapporten" on public.rapporten;
create policy "duo-partner rapporten" on public.rapporten
  for all using (klas_id is not null and public.klas_toegang_volledig(rapporten.klas_id))
  with check (klas_id is not null and public.klas_toegang_volledig(rapporten.klas_id));

-- Nu klas_id bestaat, moet "eigen rapporten" aangescherpt: zonder deze check
-- zou je een rapport kunnen posten met andermans klas_id — onschadelijk
-- zolang die klas niet gedeeld is, maar zodra die klas ooit een duo-koppel
-- krijgt, zou zo'n rij ineens als (vervalste) gedeelde rij opduiken bij twee
-- willekeurige andere gebruikers. Alleen je eigen klas (of null) mag dus.
-- "duo-partner rapporten" hierboven staat gewoon los toe dat je een NIEUW
-- rapport aanmaakt in een klas die je partner bezit — dat blijft werken.
drop policy if exists "eigen rapporten" on public.rapporten;
create policy "eigen rapporten" on public.rapporten
  for all using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      klas_id is null
      or exists (select 1 from public.klassen k where k.id = klas_id and k.user_id = auth.uid())
    )
  );

-- ── Bestanden: alleen wat in (of onder) de gekozen gedeelde map valt ──────
-- Recursieve helper: loopt parent_id omhoog tot de gedeelde map, of tot de
-- wortel (dan geen deel van de gedeelde map).
create or replace function public.binnen_gedeelde_map(doel uuid, map uuid)
returns boolean language sql stable security definer set search_path = public as $$
  with recursive pad as (
    select id, parent_id from public.bestanden where id = doel
    union all
    select b.id, b.parent_id from public.bestanden b join pad p on b.id = p.parent_id
  )
  select exists (select 1 from pad where id = map);
$$;
-- Zonder dit execute-recht evalueert de policy hieronder niet alleen voor
-- duo-gebruikers, maar voor IEDEREEN die iets in `bestanden` opvraagt —
-- de policy wordt voor elke rij gecheckt, ongeacht of er een duo-koppel is.
grant execute on function public.binnen_gedeelde_map(uuid, uuid) to authenticated;

-- De gedeelde map staat nu op de klas; iedereen die bij de groep hoort mag
-- erin (ook meekijkers — dat is werkmateriaal, geen kindbeoordeling).
drop policy if exists "duo-partner bestanden" on public.bestanden;
create policy "duo-partner bestanden" on public.bestanden
  for all using (
    exists (
      select 1 from public.klassen k
      where k.gedeelde_map_id is not null
        and public.klas_toegang(k.id)
        and public.binnen_gedeelde_map(bestanden.id, k.gedeelde_map_id)
    )
  )
  with check (
    exists (
      select 1 from public.klassen k
      where k.gedeelde_map_id is not null
        and public.klas_toegang(k.id)
        and public.binnen_gedeelde_map(bestanden.id, k.gedeelde_map_id)
    )
  );

-- ── Gedeelde takenlijst: los van je eigen persoonlijke takenlijst ────────
-- ⚠️ Hangt aan de KLAS, niet aan een koppel: anders zien twee collega's van
-- dezelfde groep elkaars taken niet.
create table if not exists public.duo_taken (
  id             uuid primary key default gen_random_uuid(),
  klas_id        uuid not null references public.klassen(id) on delete cascade,
  tekst          text not null,
  gedaan         boolean not null default false,
  toegewezen_aan uuid references auth.users(id) on delete set null,
  aangemaakt_door uuid references auth.users(id) on delete set null default auth.uid(),
  deadline       date,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index if not exists idx_duo_taken_klas on public.duo_taken(klas_id);

drop trigger if exists trg_duo_taken_updated on public.duo_taken;
create trigger trg_duo_taken_updated
  before update on public.duo_taken
  for each row execute function public.set_updated_at();

alter table public.duo_taken enable row level security;
drop policy if exists "duo taken voor het koppel" on public.duo_taken;
drop policy if exists "duo taken voor de groep" on public.duo_taken;
create policy "duo taken voor de groep" on public.duo_taken
  for all using (public.klas_toegang(duo_taken.klas_id))
  with check (public.klas_toegang(duo_taken.klas_id));
grant select, insert, update, delete on public.duo_taken to authenticated;

-- ── Overdracht op Start: ÉÉN rij per koppel, altijd overschreven ─────────
-- Bewust geen groeiend logboek — dat is de belangrijkste privacy-maatregel
-- hier. Elke nieuwe overdracht vervangt de vorige; er ontstaat geen archief
-- van eerdere, mogelijk kind-specifieke opmerkingen.
-- ÉÉN briefje PER PERSOON per groep. Zo zie je wie wat schreef (het leest als
-- een berichtje met een naam erboven) zonder dat er een gesprek ontstaat:
-- schrijf je opnieuw, dan vervangt dat je eigen vorige briefje. Er groeit dus
-- nooit een archief van kind-specifieke opmerkingen — dat blijft hier de
-- belangrijkste privacymaatregel.
create table if not exists public.duo_overdracht (
  klas_id       uuid not null references public.klassen(id) on delete cascade,
  auteur        uuid not null references auth.users(id) on delete cascade,
  tekst         text not null default '',
  bijgewerkt    timestamptz default now(),
  primary key (klas_id, auteur)
);

alter table public.duo_overdracht enable row level security;
drop policy if exists "duo overdracht voor het koppel" on public.duo_overdracht;
drop policy if exists "duo overdracht voor de groep" on public.duo_overdracht;
-- Lezen doet iedereen bij de groep; schrijven alleen in je eigen briefje. Je
-- kunt de woorden van een collega dus niet aanpassen — bij een naam eronder
-- moet je erop kunnen vertrouwen dat die klopt.
drop policy if exists "overdracht van de groep lezen" on public.duo_overdracht;
create policy "overdracht van de groep lezen" on public.duo_overdracht
  for select using (public.klas_toegang(duo_overdracht.klas_id));
drop policy if exists "eigen overdracht schrijven" on public.duo_overdracht;
create policy "eigen overdracht schrijven" on public.duo_overdracht
  for all using (auteur = auth.uid() and public.klas_toegang(duo_overdracht.klas_id))
  with check (auteur = auth.uid() and public.klas_toegang(duo_overdracht.klas_id));

-- Wanneer heb JIJ de overdracht van deze groep voor het laatst gelezen? Nodig
-- voor de teller op Start ("2 nieuwe berichten"). Eén regel per persoon per
-- groep; alleen je eigen regel is van jou.
--
-- Bewust in de database en niet in de browser: lees je het op je telefoon, dan
-- hoort het op je laptop ook gelezen te zijn. localStorage hoort bij een
-- apparaat, niet bij een mens.
create table if not exists public.duo_overdracht_gelezen (
  klas_id   uuid not null references public.klassen(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  gelezen_op timestamptz not null default now(),
  primary key (klas_id, user_id)
);
alter table public.duo_overdracht_gelezen enable row level security;
drop policy if exists "eigen leesstand" on public.duo_overdracht_gelezen;
create policy "eigen leesstand" on public.duo_overdracht_gelezen
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.duo_overdracht_gelezen to authenticated;
grant select, insert, update, delete on public.duo_overdracht to authenticated;
