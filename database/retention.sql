-- ════════════════════════════════════════════════════════════════════════
--  Wijs — automatische opschoning van rapportconcepten (AVG-bewaartermijn)
--
--  Plak dit in Supabase → SQL Editor → Run. Veilig opnieuw te draaien.
--
--  Wat het doet: elke nacht om 03:00 verwijdert het rapportconcepten in
--  public.rapporten die 90 dagen niet meer zijn bewerkt (updated_at).
--  Blijf je aan een rapport werken, dan blijft het staan (de klok reset bij
--  elke bewerking). De handmatige "Hele klas opnieuw"-knop blijft ook werken.
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

-- Controle (optioneel): toont de geplande taken.
-- select jobname, schedule, command from cron.job;
