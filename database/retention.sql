-- ════════════════════════════════════════════════════════════════════════
--  Avinka — automatische opschoning (AVG-bewaartermijnen)
--
--  Plak dit in Supabase → SQL Editor → Run. Veilig opnieuw te draaien.
--
--  Drie nachtelijke taken:
--   1. Rapportconcepten (public.rapporten) die 90 dagen niet zijn bewerkt.
--      Blijf je aan een rapport werken, dan blijft het staan (de klok reset
--      bij elke bewerking). De handmatige "Hele klas opnieuw"-knop blijft ook
--      gewoon werken.
--   2. Overdracht-briefjes (public.duo_overdracht) die 30 dagen niet zijn
--      bijgewerkt. Een briefje verdwijnt normaal doordat je een nieuw briefje
--      schrijft — maar wie stopt met schrijven (ziek, andere groep, uit
--      dienst) liet er anders eentje eeuwig staan.
--   3. Technische AI-logs (public.ai_verbruik) ouder dan 24 maanden.
--      ⚠️ Deze stond in /privacy §9 beloofd ("maximaal 24 maanden") maar werd
--      NERGENS uitgevoerd — de tabel groeide eeuwig door. Toegevoegd 9-8-2026.
--      Er staat geen inhoud in, alleen wie / welke tool / welk model / hoeveel
--      tokens, precies zoals de privacyverklaring zegt.
--
--  Lukt de eerste regel niet? Zet dan eerst "pg_cron" aan via
--  Dashboard → Database → Extensions, en draai daarna alleen de cron.schedule.
-- ════════════════════════════════════════════════════════════════════════

-- 1) De "wekker" (pg_cron) aanzetten als die er nog niet is.
create extension if not exists pg_cron;

-- 2) Dagelijkse opruim-taak (03:00). Zelfde naam = wordt bijgewerkt, niet gedupliceerd.
select cron.schedule(
  'wis-oude-rapporten',
  '0 3 * * *',
  $$delete from public.rapporten where updated_at < now() - interval '90 days'$$
);

-- 3) Overdracht-briefjes opruimen (03:15). Een briefje hoort bij het hier en nu:
--    "waar ik gebleven ben, wat er morgen moet". Is het een maand niet
--    bijgewerkt, dan is het geen overdracht meer maar een oude notitie over een
--    klas — precies wat we hier niet willen laten staan.
select cron.schedule(
  'wis-oude-overdracht',
  '15 3 * * *',
  $$delete from public.duo_overdracht where bijgewerkt < now() - interval '30 days'$$
);

-- 4) Technische AI-logs opruimen (03:45).
--
--    WAAROM 24 MAANDEN EN GEEN ANDER GETAL: omdat dat op /privacy §9 staat.
--    De termijn is hier niet gekozen maar overgenomen — de belofte was er al,
--    alleen de uitvoering ontbrak. Verander je het getal hier, verander dan
--    eerst die pagina (of andersom), anders staat er weer iets dat niet waar is.
--
--    ⚠️ NIET meegenomen, en dat is expres:
--    * `statistiek` (jouw bespaarde tijd, per dag) — dat is geen technisch log
--      maar jouw eigen overzicht; dat mag je niet onder je vandaan wissen.
--    * `toestemmingen` — dat is juist het BEWIJS dat je akkoord ging; die hoor
--      je te bewaren zolang het account bestaat, niet op te ruimen.
--    * `proef_gebruikt` — het slot tegen een tweede gratis proef per
--      brievenbus. Opruimen zet dat slot weer open.
--    Het verschil: een log dient ons, de andere drie dienen jou of de wet.
select cron.schedule(
  'wis-oude-logs',
  '45 3 * * *',
  $$delete from public.ai_verbruik where created_at < now() - interval '24 months'$$
);

-- 5) Agenda-afspraken van oude schooljaren opruimen (04:00).
--
--    "Wij bewaren dit schooljaar en het vorige" was tot 9-8-2026 alleen waar
--    voor wat je te ZIEN kreeg. De afspraken zelf bleven staan zolang je
--    abonnement liep, en daar kunnen voornamen in staan (een zelf toegevoegde
--    afspraak wordt niet gemaskeerd — bewuste keuze, zie schema.sql).
--
--    ⚠️ DEZE TAAK ALLEEN IS NIET GENOEG, en dat is het echte inzicht: bij het
--    verversen wordt álles van een gekoppelde agenda weggegooid en opnieuw
--    ingelezen, zonder datumgrens. Een schoolagenda bevat vaak jaren
--    geschiedenis, dus de eerstvolgende verversing zette alles gewoon terug.
--    De grens zit daarom óók bij het binnenhalen (`oudsteBewaardeDag` in
--    src/lib/planning/schooljaar.ts). Deze taak ruimt op wat er al ligt en
--    vangt agenda's op die vóór die wijziging zijn ingelezen.
--
--    De grens: 1 augustus van het vorige schooljaar. De "- 7 months" laat het
--    jaar op 1 augustus omslaan, precies zoals een schooljaar dat doet.
--    ⚠️ Dezelfde grens staat in TypeScript. Verander je hem hier, verander hem
--    daar dan ook.
select cron.schedule(
  'wis-oude-afspraken',
  '0 4 * * *',
  $$delete from public.agenda_items
    where coalesce(tot_datum, datum) < make_date(extract(year from (now() - interval '7 months'))::int - 1, 8, 1)$$
);

-- Controle (optioneel): toont de geplande taken.
-- select jobname, schedule, command from cron.job;
--
-- Wat de opruiming van oude schooljaren vandaag zou raken:
--   select count(*) filter (
--            where coalesce(tot_datum, datum)
--                  < make_date(extract(year from (now() - interval '7 months'))::int - 1, 8, 1)
--          ) as te_wissen,
--          count(*) as totaal, min(datum) as oudste
--   from public.agenda_items;
--
-- Wat de opruiming van 24 maanden vandaag zou raken:
--   select count(*) filter (where created_at < now() - interval '24 months') as te_wissen,
--          count(*) as totaal, min(created_at) as oudste
--   from public.ai_verbruik;
