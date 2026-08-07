-- ══════════════════════════════════════════════════════════════════════════
--  WELK TOETSSYSTEEM GEBRUIKT DEZE SCHOOL?  (2026-08-05)
--  Eén keer draaien. Veilig om opnieuw te draaien.
-- ══════════════════════════════════════════════════════════════════════════
--
--  WAAROM
--  Een school werkt met IEP óf met Cito, bijna nooit met allebei. Toch krijgt
--  iedereen nu eerst een keuzescherm met twee tegels, elke keer opnieuw. Weten
--  we welk systeem jij gebruikt, dan slaan we die keuze over — en kunnen we
--  ook zeggen wáár je je toetsen klaarzet in plaats van "in het
--  leerlingvolgsysteem".
--
--  Dit hoort bij de twee instellingen die er al staan (`lvs_systeem` en
--  `communicatie_app`): samen vormen ze "zo werkt onze school".
--
--  WAARDEN: '' (niet gezegd) | iep | cito | dia | boom | beide
--  Leeg blijft leeg: dan verandert er niets en krijg je gewoon de keuze.
--
--  Dia (Diataal) en Boom (Boom test onderwijs) zijn de twee andere grote
--  leerlingvolgsystemen in het basisonderwijs. Toetsanalyse leest hun export
--  nog niet in; kiest iemand ze toch, dan zegt de tool dat gewoon eerlijk.
--  Zo zien we in de cijfers hoeveel scholen erop zitten — anders haken die
--  mensen stil af en weten we nooit of het bouwen waard is.

alter table public.instellingen
  add column if not exists toets_systeem text not null default '';

-- Alleen de waarden die het scherm kent: een tikfout hoort hier te stranden en
-- niet pas in de tool. De lijst is later op 5-8 verruimd met dia en boom. Een
-- check-constraint bevat geen gegevens, dus vervangen kost niets; de bestaande
-- waarden blijven gewoon staan.
alter table public.instellingen
  drop constraint if exists instellingen_toets_systeem_check;
alter table public.instellingen
  add constraint instellingen_toets_systeem_check
  check (toets_systeem in ('', 'iep', 'cito', 'dia', 'boom', 'beide'));

-- ── Controle achteraf ─────────────────────────────────────────────────────
--   select toets_systeem, count(*) from public.instellingen group by 1;
