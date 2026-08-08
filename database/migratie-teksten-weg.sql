-- ══════════════════════════════════════════════════════════════════════════
-- DE TABEL `teksten` GAAT ERUIT (8-8-2026)
-- ══════════════════════════════════════════════════════════════════════════
--
-- WAT DIT IS. `teksten` was de eerste "bewaarde teksten"-bibliotheek: je kon
-- een gemaakte tekst opslaan onder een titel. Die is opgevolgd door BESTANDEN
-- (public.bestanden, mappen + bestanden in één boom), en de overzetting stond
-- al als eenmalige migratie in schema.sql. Sindsdien is er niets meer bijge-
-- komen: nul rijen, en de drie functies in src/lib/db.ts (getTeksten,
-- addTekst, deleteTekst) werden door geen enkele pagina meer aangeroepen.
--
-- WAAROM WEG EN NIET LATEN STAAN. De tabel kan voornamen bevatten — een
-- rapporttekst met "Sanne" erin is een gegeven over een kind. Zolang hij
-- bestaat valt hij dus onder de belofte "gegevens over kinderen bewaren wij
-- maximaal 90 dagen" en had hij mee moeten gaan in wijs_verwijder_klasdata()
-- (database/migratie-verwijder-klasdata.sql). Een lege tabel die niemand
-- vult, maar die je wél moet blijven meenemen in elke opruimronde, is precies
-- het soort ding dat over een half jaar vergeten wordt. Weghalen is hier
-- goedkoper dan onderhouden (besluit eigenaar 8-8-2026).
--
-- 🔑 DE REGEL DIE HIERONDER LIGT: wat er niet is, kun je ook niet vergeten op
--    te ruimen. Dat geldt breder — komt er ooit een tabel bij die voornamen
--    kan bevatten, dan hoort hij óf in de opruimfunctie, óf hij hoort er niet
--    te zijn.
--
-- ⚠️ CONTROLEER VÓÓR HET DRAAIEN dat de tabel echt leeg is. Stond hier bij het
--    schrijven op 0; is dat bij jou niet zo, zet de rijen dan eerst over naar
--    `bestanden` met de query die in schema.sql stond, en draai dit daarna pas.
--
--      select count(*) from public.teksten;
--
-- Reservekopie vooraf gemaakt: 2026-08-08-1406 (C:\dev\avinka-backups).

begin;

-- Veiligheidsrem: een gevulde tabel laten we met rust in plaats van hem stil
-- weg te gooien. Dan faalt deze migratie luidruchtig en dat is de bedoeling.
do $$
declare n bigint;
begin
  select count(*) into n from public.teksten;
  if n > 0 then
    raise exception 'teksten bevat % rijen — eerst overzetten naar bestanden, zie schema.sql', n;
  end if;
end $$;

-- Beleid en index verdwijnen automatisch met de tabel; expliciet is duidelijker.
drop policy if exists "eigen teksten" on public.teksten;
drop index  if exists public.idx_teksten_user;
drop table  if exists public.teksten;

commit;

-- ── NAMETEN (verwacht: 0 rijen, dus de tabel bestaat niet meer) ────────────
--   select table_name from information_schema.tables
--    where table_schema = 'public' and table_name = 'teksten';
