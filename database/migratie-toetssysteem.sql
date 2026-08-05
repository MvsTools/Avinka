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
--  WAARDEN: '' (niet gezegd) | iep | cito | beide
--  Leeg blijft leeg: dan verandert er niets en krijg je gewoon de keuze.

alter table public.instellingen
  add column if not exists toets_systeem text not null default '';

-- Alleen de vier waarden die het scherm kent. Een tikfout hoort hier te
-- stranden en niet pas in de tool.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'instellingen_toets_systeem_check'
  ) then
    alter table public.instellingen
      add constraint instellingen_toets_systeem_check
      check (toets_systeem in ('', 'iep', 'cito', 'beide'));
  end if;
end $$;

-- ── Controle achteraf ─────────────────────────────────────────────────────
--   select toets_systeem, count(*) from public.instellingen group by 1;
