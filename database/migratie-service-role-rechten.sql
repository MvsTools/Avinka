-- ══════════════════════════════════════════════════════════════════════════
--  RECHTEN VOOR DE SERVERROL  (2026-08-05)
--  Eén keer draaien in de Supabase SQL Editor. Veilig om opnieuw te draaien.
-- ══════════════════════════════════════════════════════════════════════════
--
--  WAT ER MIS WAS
--  `service_role` — de rol waarmee de server werkt als hij de servicesleutel
--  gebruikt — had in deze database op GEEN ENKELE tabel rechten. Alle grants in
--  schema.sql gaan naar `authenticated`; service_role is er nooit bij gezet,
--  want tot 5-8 gebruikte niets die sleutel.
--
--  Gevolg (gemeten, niet vermoed): elke serverkant-schrijfactie kreeg
--  "42501 permission denied for table ...". Dat trof:
--    - /api/statistiek        (telt de tijdwinst op)
--    - /api/mollie/checkout   (bewaart het betaal-id)
--    - /api/mollie/return     (zet het abonnement actief)
--    - /api/cron/proef-herinnering (vinkt af wie een mail kreeg)
--  De proefherinnering had dus nooit kunnen werken; dat viel niet op omdat
--  SUPABASE_SERVICE_ROLE_KEY tot vandaag leeg stond.
--
--  DE KEUZE: ALLEEN WAT NODIG IS
--  Niet `grant all on all tables`. De server schrijft maar in twee tabellen, en
--  bij een gelekte sleutel is het verschil groot. Prijs: bouw je een nieuwe
--  serverkant-schrijfactie, dan hoort de tabel hier ook in de lijst. Dat faalt
--  luid (permission denied in de serverlog), niet stil.
--
--  ⚠️ Functies zijn een APART recht. `wijs_proef_herinneringen` stond al goed op
--  service_role. Roep je vanaf de server een nieuwe functie aan, geef die dan
--  ook expliciet `grant execute ... to service_role`.

grant select, insert, update on public.instellingen to service_role;
grant select, insert, update on public.statistiek   to service_role;

-- ── Controle achteraf ─────────────────────────────────────────────────────
--   select tablename,
--          has_table_privilege('service_role','public.'||quote_ident(tablename),'INSERT')
--   from pg_tables where schemaname='public' order by 1;
