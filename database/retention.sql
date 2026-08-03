-- ════════════════════════════════════════════════════════════════════════
--  Avinka — automatische opschoning (AVG-bewaartermijnen)
--
--  Plak dit in Supabase → SQL Editor → Run. Veilig opnieuw te draaien.
--
--  Twee nachtelijke taken:
--   1. Rapportconcepten (public.rapporten) die 90 dagen niet zijn bewerkt.
--      Blijf je aan een rapport werken, dan blijft het staan (de klok reset
--      bij elke bewerking). De handmatige "Hele klas opnieuw"-knop blijft ook
--      gewoon werken.
--   2. Overdracht-briefjes (public.duo_overdracht) die 30 dagen niet zijn
--      bijgewerkt. Een briefje verdwijnt normaal doordat je een nieuw briefje
--      schrijft — maar wie stopt met schrijven (ziek, andere groep, uit
--      dienst) liet er anders eentje eeuwig staan.
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

-- Controle (optioneel): toont de geplande taken.
-- select jobname, schedule, command from cron.job;
