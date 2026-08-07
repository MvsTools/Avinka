-- ══════════════════════════════════════════════════════════════════════════
--  DE SERVERROL MAG LEZEN VOOR DE RESERVEKOPIE  (2026-08-05)
--  Eén keer draaien. Veilig om opnieuw te draaien.
-- ══════════════════════════════════════════════════════════════════════════
--
--  WAAROM
--  Op het gratis Supabase-plan bestaan er geen automatische back-ups. We maken
--  ze daarom zelf met `scripts/backup-database.mjs`, en dat script leest de
--  tabellen via de serverrol (SUPABASE_SERVICE_ROLE_KEY).
--
--  Die rol mocht bewust bijna niets: `migratie-service-role-rechten.sql` gaf
--  hem alleen rechten op `instellingen` en `statistiek`, want dat is alles wat
--  de server zelf schrijft. Goede keuze — maar een reservekopie moet álles
--  kunnen lezen, anders kopieer je twee van de vijfentwintig tabellen.
--
--  WAT DIT WEL EN NIET DOET
--  Wel: SELECT op alle bestaande tabellen in het openbare schema.
--  Niet: INSERT, UPDATE of DELETE. Schrijven blijft precies zoals het was, dus
--  een fout in de servercode kan hierdoor nooit méér stukmaken dan eerst.
--
--  ⚠️ WAT DIT BETEKENT VOOR DE VEILIGHEID
--  Wie de serverrol-sleutel in handen krijgt, kan hiermee alles LEZEN — ook
--  rapporten en voornamen. Die sleutel staat alleen server-side (.env.local en
--  straks bij Vercel), nooit in de browser, en mag nooit NEXT_PUBLIC_ heten.
--  Intrekken kan altijd met het blok onderaan dit bestand.
--
--  ⚠️ NIEUWE TABEL? Die krijgt dit recht NIET vanzelf. Zet hem er dan bij, of
--  draai dit bestand opnieuw — het blok hieronder loopt alle tabellen langs.

do $$
declare
  t record;
begin
  for t in
    select c.relname
    from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relkind = 'r'
  loop
    execute format('grant select on public.%I to service_role', t.relname);
  end loop;
end $$;

-- ── Controle achteraf ─────────────────────────────────────────────────────
--   Hoort 0 rijen te geven (niets meer dat de serverrol niet mag lezen):
--
--   select c.relname from pg_class c
--   where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
--     and not has_table_privilege('service_role', c.oid, 'select');
--
--   En schrijven hoort NOG STEEDS alleen op instellingen en statistiek te
--   mogen:
--
--   select c.relname from pg_class c
--   where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
--     and has_table_privilege('service_role', c.oid, 'insert');

-- ── Weer intrekken ────────────────────────────────────────────────────────
--   do $$ declare t record; begin
--     for t in select c.relname from pg_class c
--              where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
--                and c.relname not in ('instellingen', 'statistiek')
--     loop execute format('revoke select on public.%I from service_role', t.relname); end loop;
--   end $$;
