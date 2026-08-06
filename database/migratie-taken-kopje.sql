-- ══════════════════════════════════════════════════════════════════════════
--  KOPJES OP DE TAKENLIJST  (2026-08-06)
--  Eén keer draaien. Veilig om opnieuw te draaien.
-- ══════════════════════════════════════════════════════════════════════════
--
--  WAAROM
--  "Wat eraan komt" gokte bij een activiteit (schoolreis, verkeersexamen)
--  een vaste taak ("Hulpouders en vervoer regelen") — bleek feitelijk onwaar
--  te kunnen zijn (een theorie-examen heeft geen parcours) en verschilt
--  sowieso te veel per school. Die aanname is weggehaald (commit 6267eb5).
--
--  In plaats daarvan: een seintje dat de activiteit noemt, met een knop om
--  er ZELF taken onder te hangen — die krijgen dan een "kopje" (de naam van
--  de activiteit), zodat ze in de takenlijst bij elkaar staan. Geen aanname
--  meer over WAT er moet gebeuren, wel een plek om het zelf te organiseren.
--
--  Nullable en zonder foreign key naar agenda_items: een taak moet ook
--  zonder gekoppelde afspraak kunnen bestaan (de bestaande, kopje-loze taken
--  blijven gewoon werken), en een activiteit kan verwijderd zijn terwijl de
--  taken die je erbij hebt gezet gewoon blijven staan.

alter table public.taken add column if not exists kopje text;

-- ── Controle achteraf ─────────────────────────────────────────────────────
--   select column_name from information_schema.columns
--   where table_name = 'taken' and column_name = 'kopje';
