-- ══════════════════════════════════════════════════════════════════════════
-- GENERALE REPETITIE VAN HET OPRUIMEN
-- ══════════════════════════════════════════════════════════════════════════
--
-- WAAROM DIT BESTAAT. De opruimmolen (database/migratie-verwijder-klasdata.sql)
-- is per onderdeel getest, maar er was nog nooit één keer echt iets verwijderd.
-- Bewezen was: de selectie klopt, de verwijderregels voeren foutloos uit tegen
-- een onbestaand uuid, en de duo-uitzondering slaat het juiste account over.
-- NIET bewezen: dat een account mét een klas, rapporten, bestanden, taken en
-- agenda-items de hele molen doorgaat en er daarna nul gegevens over kinderen
-- over zijn, terwijl het eigen vakwerk blijft staan.
--
-- Dit bestand maakt een wegwerpaccount, vult het, zet de klok terug, draait de
-- molen, telt na en ruimt zichzelf op. In één keer, zodat de échte controle
-- vlak vóór de livegang één handeling is in plaats van een avond uitzoekwerk.
--
-- DRAAIEN: plak dit hele bestand in de Supabase SQL-editor en voer het uit.
--   Onderaan komt een verslag met per punt geslaagd/mislukt.
--
-- ⚠️ EERST EEN RESERVEKOPIE: node scripts/backup-database.mjs
--    Er is geen testdatabase; dit draait op de echte.
--
-- ⚠️ WAAROM DIT SQL IS EN GEEN SCRIPT MET DE SERVICESLEUTEL. `service_role` mag
--    bewust alleen lezen, plus schrijven in `instellingen` en `statistiek` (zie
--    migratie-service-role-rechten.sql). Testgegevens zaaien zou betekenen dat
--    je die sleutel schrijfrechten geeft op klassen, rapporten en bestanden —
--    precies de tabellen waar hij vanaf moet blijven. Een repetitie hoort de
--    beveiliging niet op te rekken, dus draait hij als `postgres`.
--
-- ⚠️ DE BELANGRIJKSTE VEILIGHEID ZIT IN STAP 6. wijs_verwijder_klasdata() kijkt
--    naar ÁLLE gebruikers, niet alleen naar het wegwerpaccount. Zou er per
--    ongeluk een echte gebruiker in aanmerking komen, dan wist een echte ronde
--    diens klas net zo goed. Daarom draait er eerst een droogloop en breekt
--    alles af zodra daar ook maar één ander account in staat. Haal die controle
--    er nooit uit "omdat het toch altijd goed gaat".
--
-- ⚠️ ALLES OF NIETS. Het draait in één transactie: struikelt een stap, dan
--    rolt de hele repetitie terug en blijft er geen half account achter.
--
-- Over het mailadres: er gaat niets naar dit adres toe. Het account wordt
-- rechtstreeks aangemaakt (dat verstuurt niets) en binnen dezelfde transactie
-- weer verwijderd; de twee mailroutes die het zouden kunnen raken zitten
-- allebei achter BETALINGEN_LIVE, die uit staat. Het adres staat bewust op ons
-- eigen domein, zodat er ook in een gek geval niets bounct bij een vreemde
-- server (zie het geheugen: mail-verzendstraat).
-- ══════════════════════════════════════════════════════════════════════════

-- Het verslag staat BUITEN de transactie, zodat de tabel blijft bestaan als de
-- repetitie halverwege afbreekt. De rijen rollen dan wel mee terug; wat je in
-- dat geval moet lezen is de foutmelding zelf.
drop table if exists repetitie_verslag;
create temp table repetitie_verslag (
  nr       serial,
  geslaagd boolean,
  regel    text
);

begin;

do $$
declare
  v_uid       uuid := gen_random_uuid();
  v_adres     text := 'repetitie-opruiming@avinka.nl';
  v_klas      uuid;
  v_map       uuid;
  v_bron      uuid;
  v_waarsch   record;
  v_droog     record;
  v_echt      record;
  v_vreemden  int;
  v_over      int;
  v_bewaard   text;
  v_in_map    int;
begin
  -- ── 1. Wegwerpaccount ────────────────────────────────────────────────────
  delete from auth.users where email = v_adres;   -- restant van een vorige ronde

  insert into auth.users (id, email, raw_user_meta_data, email_confirmed_at, created_at)
  values (v_uid, v_adres, jsonb_build_object('first_name', 'Repetitie'), now(), now() - interval '200 days');

  insert into repetitie_verslag (geslaagd, regel)
  values (true, format('1. Wegwerpaccount %s aangemaakt (%s)', v_adres, v_uid));

  -- ── 2. Een gevulde leerkracht nabouwen ───────────────────────────────────
  -- De klok staat 100 dagen terug: ruim voorbij dag 90, dus deze leerkracht
  -- hoort in beeld te komen.
  insert into public.instellingen
    (user_id, schoolnaam, standaardgroep, abon_plan, abon_vorm, abon_status,
     periode_eindigt, proef_eindigt, verwijder_waarschuwing_op)
  values
    (v_uid, 'De Repetitieschool', 'groep 6', 'compleet', 'maand', 'opgezegd',
     now() - interval '100 days', now() - interval '130 days', null);

  insert into public.klassen (user_id, naam, leerlingen, leerlingen_data)
  values (v_uid, 'Groep 6', array['Sanne','Joris','Fatima'],
          '[{"naam":"Sanne","geslacht":"m"},{"naam":"Joris","geslacht":"j"},{"naam":"Fatima","geslacht":"m"}]'::jsonb)
  returning id into v_klas;

  insert into public.rapporten (user_id, naam, verhaal) values
    (v_uid, 'Sanne', 'Sanne werkt geconcentreerd en helpt anderen graag.'),
    (v_uid, 'Joris', 'Joris heeft een sterke rekenknobbel.');

  -- Een map met BEIDE soorten erin: eigen vakwerk dat moet blijven, en een
  -- plattegrond met voornamen die weg moet. Dit is precies de cascade-val van
  -- 8-8: bestanden.parent_id staat op "on delete cascade", dus wie de map wist
  -- gooit het lesontwerp mee weg.
  insert into public.bestanden (user_id, type, naam)
  values (v_uid, 'map', 'Groep 6 - dit schooljaar')
  returning id into v_map;

  insert into public.bestanden (user_id, parent_id, type, naam, inhoud, data, tool) values
    (v_uid, v_map, 'les',         'Les breuken vergelijken',  'Leerdoel: breuken vergelijken.', null, 'lesontwerp'),
    (v_uid, v_map, 'plattegrond', 'Klasopstelling november',   null, '{"plekken":[{"naam":"Sanne"},{"naam":"Joris"}]}'::jsonb, 'plattegrond'),
    (v_uid, null,  'tekst',       'Werkblad spelling week 12', 'Schrijf de woorden over.', null, 'werkbladen'),
    (v_uid, null,  'tekst',       'Losse notitie over Fatima', 'Fatima heeft extra tijd nodig.', null, null);

  insert into public.taken (user_id, tekst, gedaan) values
    (v_uid, 'Gesprek met de ouders van Sanne inplannen', false),
    (v_uid, 'Rapporten nakijken', true);

  insert into public.agenda_bronnen (user_id, naam, systeem, link_geheim)
  values (v_uid, 'Schoolagenda', 'ics', 'repetitie-nep-link')
  returning id into v_bron;

  insert into public.agenda_items (user_id, bron_id, uid, datum, tot_datum, titel, soort) values
    (v_uid, v_bron, 'repetitie-1', date '2026-05-12', date '2026-05-12', 'Oudergesprek Sanne', 'gesprek'),
    (v_uid, v_bron, 'repetitie-2', date '2026-05-20', date '2026-05-20', 'Studiedag', 'overig');

  insert into repetitie_verslag (geslaagd, regel) values
    (true, '2. Gevuld: 1 klas (3 voornamen), 2 rapporten, 4 bestanden (2 in een map), 2 taken, 1 agendabron + 2 afspraken');

  -- ── 3. Waarschuwingsmail droog draaien ───────────────────────────────────
  select * into v_waarsch
  from public.wijs_verwijder_waarschuwing()
  where user_id = v_uid;

  if not found then
    raise exception 'REPETITIE AFGEBROKEN: het wegwerpaccount komt niet in aanmerking voor de waarschuwingsmail. De selectie in wijs_verwijder_waarschuwing() klopt dan niet.';
  end if;

  insert into repetitie_verslag (geslaagd, regel) values
    (true, format('3. In beeld voor de mail: %s, aanhef "%s", geen abonnement sinds %s, wist op %s',
                  v_waarsch.email, v_waarsch.voornaam, v_waarsch.abo_tot, v_waarsch.wist_op));

  -- De mail belooft een datum. Die moet in de TOEKOMST liggen, anders kondig je
  -- iets aan dat al gebeurd zou zijn. Dit is de fout die op 8-8 werd gevonden:
  -- de mail gaat op dag 83, niet op dag 90.
  insert into repetitie_verslag (geslaagd, regel)
  select v_waarsch.wist_op > current_date,
         format('3a. De beloofde wisdatum (%s) ligt in de toekomst, dus de mail liegt niet', v_waarsch.wist_op);

  -- ── 4. Doen alsof de mail 8 dagen geleden is verstuurd ───────────────────
  -- Het slot eist minstens 7 dagen respijt tussen mail en wissen.
  update public.instellingen
     set verwijder_waarschuwing_op = now() - interval '8 days'
   where user_id = v_uid;

  insert into repetitie_verslag (geslaagd, regel) values
    (true, '4. Waarschuwing gezet op 8 dagen geleden (respijt is 7 dagen)');

  -- ── 5. Droogloop, en de veiligheidsrem ───────────────────────────────────
  select count(*) into v_vreemden
  from public.wijs_verwijder_klasdata(90, 7, 200, true) d
  where d.wie <> v_uid;

  if v_vreemden > 0 then
    raise exception 'REPETITIE AFGEBROKEN: de droogloop raakt % ANDER account(s). Er is niets gewist. Zoek eerst uit waarom die in beeld staan, want een echte ronde zou hun klas en rapporten net zo goed wissen.', v_vreemden;
  end if;

  select * into v_droog
  from public.wijs_verwijder_klasdata(90, 7, 200, true) d
  where d.wie = v_uid;

  if not found then
    raise exception 'REPETITIE AFGEBROKEN: de droogloop vindt niemand, ook het wegwerpaccount niet. Het slot sluit te streng.';
  end if;

  insert into repetitie_verslag (geslaagd, regel) values
    (true, format('5. Droogloop: alleen het wegwerpaccount in beeld. Zou wissen: %s klas, %s rapporten, %s bestanden, %s taken, %s agenda-items; bewaart %s stuks eigen werk',
                  v_droog.aantal_klassen, v_droog.aantal_rapporten, v_droog.aantal_bestanden,
                  v_droog.aantal_taken, v_droog.aantal_agenda, v_droog.aantal_bewaard));

  -- ── 6. Nu echt ───────────────────────────────────────────────────────────
  select * into v_echt
  from public.wijs_verwijder_klasdata(90, 7, 200, false) d
  where d.wie = v_uid;

  if not found then
    raise exception 'REPETITIE AFGEBROKEN: de echte ronde raakte het wegwerpaccount niet, terwijl de droogloop het wél zag.';
  end if;

  insert into repetitie_verslag (geslaagd, regel) values
    (true, format('6. Echt gewist: %s klas, %s rapporten, %s bestanden, %s taken, %s agenda-items; bewaard: %s',
                  v_echt.aantal_klassen, v_echt.aantal_rapporten, v_echt.aantal_bestanden,
                  v_echt.aantal_taken, v_echt.aantal_agenda, v_echt.aantal_bewaard));

  -- ── 7. Natellen: hier gaat het om ────────────────────────────────────────
  insert into repetitie_verslag (geslaagd, regel)
  select count(*) = 0, format('7a. Geen klassen meer (%s over)', count(*)) from public.klassen where user_id = v_uid;

  insert into repetitie_verslag (geslaagd, regel)
  select count(*) = 0, format('7b. Geen concept-rapportteksten meer (%s over)', count(*)) from public.rapporten where user_id = v_uid;

  insert into repetitie_verslag (geslaagd, regel)
  select count(*) = 0, format('7c. Geen taken meer (%s over)', count(*)) from public.taken where user_id = v_uid;

  insert into repetitie_verslag (geslaagd, regel)
  select count(*) = 0, format('7d. Geen agenda-afspraken meer (%s over)', count(*)) from public.agenda_items where user_id = v_uid;

  -- De agendaKOPPELING hoort juist te BLIJVEN: komt iemand terug, dan vullen de
  -- geïmporteerde afspraken zichzelf weer.
  insert into repetitie_verslag (geslaagd, regel)
  select count(*) = 1, format('7e. De agendakoppeling staat er nog (%s), zoals bedoeld', count(*)) from public.agenda_bronnen where user_id = v_uid;

  -- Alleen eigen vakwerk over, en NIET meer in een map: de map is gewist en
  -- zou de inhoud hebben meegesleurd als hij er nog in zat.
  select count(*), string_agg(coalesce(tool, 'geen'), ', ' order by tool),
         count(*) filter (where parent_id is not null)
    into v_over, v_bewaard, v_in_map
  from public.bestanden where user_id = v_uid;

  insert into repetitie_verslag (geslaagd, regel) values
    (v_over = 2 and v_bewaard = 'lesontwerp, werkbladen',
     format('7f. Alleen eigen vakwerk over: %s bestand(en) [%s]', v_over, coalesce(v_bewaard, 'niets')));

  insert into repetitie_verslag (geslaagd, regel) values
    (v_in_map = 0, format('7g. Bewaard werk staat los, niet meer in een map (%s nog in een map)', v_in_map));

  insert into repetitie_verslag (geslaagd, regel)
  select count(*) = 0, format('7h. De plattegrond met voornamen is weg (%s over)', count(*))
  from public.bestanden where user_id = v_uid and type = 'plattegrond';

  insert into repetitie_verslag (geslaagd, regel)
  select count(*) = 0, format('7i. Het bestand zonder herkomst is weg (%s over)', count(*))
  from public.bestanden where user_id = v_uid and tool is null;

  -- Het account en zijn voorkeuren horen te BLIJVEN. Je gooit iemands inlog
  -- niet weg omdat hij zijn abonnement heeft opgezegd.
  insert into repetitie_verslag (geslaagd, regel)
  select count(*) = 1, format('7j. Het account en zijn voorkeuren bestaan nog (%s)', count(*))
  from public.instellingen where user_id = v_uid;

  insert into repetitie_verslag (geslaagd, regel)
  select count(*) = 1, format('7k. De inloggegevens bestaan nog, dus terugkomen kan (%s)', count(*))
  from auth.users where id = v_uid;

  -- ── 8. Opruimen ──────────────────────────────────────────────────────────
  delete from auth.users where id = v_uid;

  insert into repetitie_verslag (geslaagd, regel)
  select count(*) = 0, format('8. Wegwerpaccount en al zijn gegevens verwijderd via de cascade (%s over)', count(*))
  from public.instellingen where user_id = v_uid;
end $$;

commit;

-- ── HET VERSLAG ────────────────────────────────────────────────────────────
select case when geslaagd then 'OK ' else '🔴 ' end || regel as uitkomst
from repetitie_verslag order by nr;

select case
         when count(*) filter (where not geslaagd) = 0
           then '✅ REPETITIE GESLAAGD — nul gegevens over kinderen over, eigen vakwerk bewaard, account intact.'
         else format('🔴 REPETITIE MISLUKT op %s punt(en). Zie de regels hierboven met een rood bolletje.',
                     count(*) filter (where not geslaagd))
       end as eindoordeel
from repetitie_verslag;
