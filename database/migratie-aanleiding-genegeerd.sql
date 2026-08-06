-- ══════════════════════════════════════════════════════════════════════════
--  SEINTJES WEG KUNNEN KLIKKEN  (2026-08-06)
--  Eén keer draaien. Veilig om opnieuw te draaien.
-- ══════════════════════════════════════════════════════════════════════════
--
--  WAAROM
--  "Wat eraan komt" herkent zelf uit de titel wat een afspraak is (soort) en
--  bepaalt daarmee of en wanneer je een seintje krijgt — er is bewust geen
--  scherm meer waar je dat met de hand instelt (zie AfspraakFormulier.tsx).
--  Een gok kan een keer misgaan. In plaats van dat vooraf te laten
--  voorkomen (met een extra vraag die 99% van de tijd voor niets is), kun je
--  een seintje dat niet klopt gewoon wegklikken op het moment dat het er is.
--
--  Elk seintje heeft al een stabiele id (`Aanleiding.id`, zie aanleiding.ts).
--  Deze tabel onthoudt alleen: welke leerkracht heeft welke id wegged.
--
--  Bewust GEEN koppeling naar de afspraak zelf (geen foreign key naar
--  agenda_items): een seintje van de kalender zelf (startweek, overdracht,
--  groep 8-momenten) heeft geen agenda-rij, dus de id is soms synthetisch.

create table if not exists public.aanleiding_genegeerd (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  aanleiding_id text not null,
  aangemaakt    timestamptz not null default now(),
  unique (user_id, aanleiding_id)
);

alter table public.aanleiding_genegeerd enable row level security;
drop policy if exists "eigen genegeerde seintjes" on public.aanleiding_genegeerd;
create policy "eigen genegeerde seintjes" on public.aanleiding_genegeerd
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, delete on public.aanleiding_genegeerd to authenticated;
create index if not exists idx_aanleiding_genegeerd_user on public.aanleiding_genegeerd(user_id);

-- ── Controle achteraf ─────────────────────────────────────────────────────
--   select has_table_privilege('authenticated', 'public.aanleiding_genegeerd', 'select');
--   select has_table_privilege('anon', 'public.aanleiding_genegeerd', 'select'); -- moet false zijn
