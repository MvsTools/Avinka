-- ============================================================================
-- Opzeggen ruimt de leerlinggegevens op (AVG)
-- ----------------------------------------------------------------------------
-- ⭐ DE REGEL, in één zin: GEGEVENS OVER KINDEREN BEWAREN WIJ MAXIMAAL 90 DAGEN.
--
-- Wie 90 dagen geen abonnement meer heeft, raakt zijn gegevens OVER KINDEREN
-- kwijt: klassen, rapporten, plattegronden, agenda-afspraken, taken en de
-- duo-overdracht.
--
-- ⚠️ Zeg overal "90 dagen", niet "3 maanden" (besluit eigenaar 8-8-2026).
-- Het is tastbaarder, het is exact wat de code doet, en het is hetzelfde getal
-- als wis-oude-rapporten in retention.sql. Daarmee heeft het hele platform één
-- bewaartermijn voor alles wat over kinderen gaat, en dat is een regel die je
-- aan een directeur of een jurist kunt uitleggen. "3 maanden" is vaag: dat kan
-- 89 of 92 dagen zijn.
--
-- ⭐ WAT BLIJFT: het eigen vakwerk van de leerkracht (lesontwerpen, werkbladen,
-- draaiboeken). Daar staat geen kind in, er is dus geen reden om het te wissen,
-- en het is precies het "oh ja, die staan op Avinka" waardoor iemand terugkomt.
-- De grens loopt tussen GEGEVENS OVER KINDEREN en EIGEN WERK, niet tussen
-- belangrijk en onbelangrijk. Zie k_bewaren in stap 4.
--
-- Het account zelf blijft ook bestaan (inloggegevens, de instellingen-rij, de
-- betaalhistorie, de verwijzingscode): boekhoudplicht, terugkomen zonder gedoe,
-- en een gewist account breekt de verwijzingsketen.
--
-- 🔑 WAAROM 90 DAGEN EN NIET 30 (besluit eigenaar 8-8-2026, na een
-- ronde twijfel). Met 30 dagen viel het wissen precies in de zomervakantie:
-- opzeggen op 15 juli betekende verwijderen op 14 augustus, twee weken vóór de
-- schoolstart, met een waarschuwingsmail in een schoolmailbox waar niemand
-- kijkt. Dat raakt uitsluitend de leerkracht die van plan was terug te komen.
-- 90 dagen overleeft elke zomervakantie en is voor voornamen van kinderen een
-- beter verhaal dan een half jaar.
--
-- ⚠️ Dit is nadrukkelijk GEEN drukmiddel om mensen te laten doorbetalen. Een
-- verwijderregel als retentietruc raakt alleen je terugkerende klanten en kost
-- je meer dan hij oplevert; het jaarabonnement staat op eigen benen (juli en
-- augustus gratis). Verwijderen is hier een opruimregel, niet een verkoopmiddel.
--
-- ⚠️ DRIE SLOTEN, en ze zitten aan elkaar vast. Lees dit voor je iets wijzigt.
--
--  1. NOOIT bij abon_status = 'actief'. Dat is de veilige uitzondering,
--     ongeacht wat de datumvelden zeggen.
--  2. NOOIT zonder waarschuwingsmail. wijs_verwijder_klasdata() wist alleen bij
--     wie minstens p_respijt dagen eerder is gemaild. De mail is dus niet
--     alleen netjes, hij is technisch de sleutel: geen mail = geen verwijdering.
--     En omdat de mailroute zichzelf uitzet zolang BETALINGEN_LIVE uit staat
--     (dan verloopt er namelijk niets en houdt iedereen toegang), kan deze
--     taak vandaag bij niemand toeslaan. Dat is de bedoeling.
--  3. NOOIT bij een klas waar een BETALENDE collega aan hangt. Een duo-koppel
--     hangt met cascade aan de klas, dus de klas van een opzegger wissen haalt
--     ook de rapporten en de overdracht weg bij iemand die gewoon betaalt.
--
-- 🔑 Waarom niet op abon_status trigggeren: niets zet dat veld automatisch op
-- 'verlopen' zolang Mollie er niet is. We rekenen daarom op de datumvelden.
-- ============================================================================

begin;

-- ── 1. Onthouden dát er gewaarschuwd is ────────────────────────────────────
-- Een slot, geen administratie: zonder dit veld mailt de taak elke nacht
-- opnieuw, en zonder gevulde waarde wist stap 3 niets.
alter table public.instellingen
  add column if not exists verwijder_waarschuwing_op timestamptz;

comment on column public.instellingen.verwijder_waarschuwing_op is
  'Wanneer de "je gegevens worden verwijderd"-mail is verstuurd. Leeg = nog niet gemaild, en dan wist wijs_verwijder_klasdata() bij deze gebruiker niets.';

-- ── 2. Tot wanneer had deze gebruiker toegang? ─────────────────────────────
-- Op drie plekken nodig, dus één keer opschrijven.
--
-- greatest() negeert NULL in PostgreSQL, dus dit geeft vanzelf het LAATSTE
-- moment waarop iemand nog binnen mocht: proef_eindigt voor wie nooit betaalde,
-- periode_eindigt voor wie betaalde en opzegde, en de laatste van de twee voor
-- wie eerst proefde, daarna betaalde en toen opzegde. Beide leeg = NULL, en
-- daar rekenen we bewust niets mee (zo'n rij hoort niet te bestaan, maar een
-- ontbrekende datum mag nooit "dus lang geleden" betekenen).
create or replace function public.wijs_toegang_tot(
  p_status  text,
  p_proef   timestamptz,
  p_periode timestamptz
) returns timestamptz
language sql immutable set search_path = public as $$
  select case
           when coalesce(p_status, 'proef') = 'actief' then null
           else greatest(p_proef, p_periode)
         end;
$$;

-- Ook een onschuldige rekenfunctie gaat dicht. Hij leest niets uit de database
-- (je geeft drie waarden mee, je krijgt een datum terug), maar PostgreSQL geeft
-- EXECUTE standaard aan PUBLIC en de huisregel is dat een nieuwe functie in het
-- slot hoort. Zie het slotblok onderaan schema.sql.
revoke execute on function public.wijs_toegang_tot(text, timestamptz, timestamptz) from public, anon, authenticated;
grant  execute on function public.wijs_toegang_tot(text, timestamptz, timestamptz) to service_role;

-- ── 3. Wie moet de waarschuwingsmail krijgen? ──────────────────────────────
-- Standaard op dag 83, zodat er ~7 dagen respijt is vóór dag 90.
--
-- p_max is er voor de verzendreputatie, niet voor de techniek: staat er ooit
-- een berg oude proefaccounts klaar, dan gaat die er in porties uit in plaats
-- van als één blast vanaf een jong afzenderdomein. Wie vandaag niet aan de
-- beurt is, is morgen aan de beurt.
-- ⚠️ Eerst weg, dan opnieuw: de teruggegeven kolommen zijn gewijzigd (abo_tot
-- erbij) en dan weigert "create or replace". Raakt alleen de functie.
drop function if exists public.wijs_verwijder_waarschuwing(int, int);

create function public.wijs_verwijder_waarschuwing(
  p_dag int default 83,
  p_max int default 50
) returns table (
  user_id   uuid,
  email     text,
  voornaam  text,
  wist_op   date,
  -- Sinds wanneer geen abonnement meer. De mail gaat op dag 83, dus een zin
  -- als "je gebruikt Avinka al 90 dagen niet meer" zou op dat moment ONWAAR
  -- zijn. Met deze datum kan de mail de REGEL noemen in plaats van de duur.
  abo_tot   date
)
language sql security definer set search_path = public as $$
  select i.user_id,
         u.email::text,
         coalesce(u.raw_user_meta_data ->> 'first_name', ''),
         -- De datum die in de mail komt te staan, en die moet WAAR zijn. Bij
         -- een gewone gebruiker is dat dag 90; loopt de mail achter (backlog,
         -- storing), dan is het de respijttermijn van 7 dagen die telt, want
         -- dát is wat stap 4 hieronder afdwingt. Nooit een datum beloven die
         -- al voorbij is.
         greatest(
           public.wijs_toegang_tot(i.abon_status, i.proef_eindigt, i.periode_eindigt) + interval '90 days',
           now() + interval '7 days'
         )::date,
         public.wijs_toegang_tot(i.abon_status, i.proef_eindigt, i.periode_eindigt)::date
  from public.instellingen i
  join auth.users u on u.id = i.user_id
  where i.verwijder_waarschuwing_op is null
    and coalesce(i.abon_status, 'proef') <> 'actief'
    and public.wijs_toegang_tot(i.abon_status, i.proef_eindigt, i.periode_eindigt) is not null
    and public.wijs_toegang_tot(i.abon_status, i.proef_eindigt, i.periode_eindigt)
        <= now() - make_interval(days => p_dag)
    and u.email is not null
  order by public.wijs_toegang_tot(i.abon_status, i.proef_eindigt, i.periode_eindigt)
  limit p_max;
$$;

-- ⚠️ Geeft mailadressen van ANDERE gebruikers terug — alleen de geplande taak
-- (servicesleutel) mag hem aanroepen, nooit 'authenticated'.
revoke execute on function public.wijs_verwijder_waarschuwing(int, int) from public, anon, authenticated;
grant  execute on function public.wijs_verwijder_waarschuwing(int, int) to service_role;

-- ── 4. Het verwijderen zelf ────────────────────────────────────────────────
-- Geeft per gebruiker terug wat er weg is, zodat je het kunt nameten en in de
-- taak kunt loggen. Een verwijdering die je niet kunt navertellen is precies
-- het soort stille actie waar dit project al een paar keer op is vastgelopen.
--
-- Volgorde binnen één gebruiker maakt niet uit; alles gaat in één transactie
-- mee met de aanroeper.
-- ⚠️ p_droog = true telt alleen en wist NIETS. Gebruik dat om te controleren
-- wie er in beeld staat; een verwijderfunctie die je alleen kunt testen door
-- hem echt te laten wissen, is een functie die niemand durft te testen.
--
-- ⚠️ De teruggeefvelden heten met opzet NIET rapporten/bestanden/taken. Dat
-- zijn de tabelnamen, en in plpgsql botst een variabele met dezelfde naam met
-- de kolomverwijzing eronder ("column reference is ambiguous"). Dat is precies
-- het soort fout dat pas afgaat op het moment dat de taak voor het eerst iets
-- echt moet wissen.
-- ⚠️ Eerst weg, dan opnieuw: PostgreSQL weigert een "create or replace" zodra
-- de teruggegeven kolommen veranderen ("cannot change return type"). Dit raakt
-- alleen de functie zelf, nooit gegevens.
drop function if exists public.wijs_verwijder_klasdata(int, int, int, boolean);

create function public.wijs_verwijder_klasdata(
  p_dagen   int default 90,
  p_respijt int default 7,
  p_max     int default 200,
  p_droog   boolean default false
) returns table (
  wie               uuid,
  aantal_klassen    int,
  aantal_rapporten  int,
  aantal_bestanden  int,
  aantal_taken      int,
  aantal_agenda     int,
  aantal_bewaard    int
)
language plpgsql security definer set search_path = public as $$
declare
  r record;
  n_klassen   int;
  n_rapporten int;
  n_bestanden int;
  n_taken     int;
  n_agenda    int;
  n_bewaard   int;
  -- ⭐ HET EIGEN VAKWERK VAN DE LEERKRACHT. Dit blijft staan, ook jaren later.
  -- ⚠️ Een WITTE lijst, geen zwarte: alles wat hier niet in staat gaat weg,
  -- inclusief losse bestanden zonder herkomst. Zo valt een zelf getypt bestand
  -- met voornamen erin automatisch aan de veilige kant.
  -- ⚠️ 'plattegrond' hoort er met opzet NIET bij: dat is wel een tool-bestand,
  -- maar er staan voornamen van kinderen in. Tool-bestand betekent hier dus
  -- niet vanzelf "eigen werk".
  k_bewaren constant text[] := array['lesontwerp', 'werkbladen', 'draaiboek'];
begin
  for r in
    select i.user_id as uid
    from public.instellingen i
    where coalesce(i.abon_status, 'proef') <> 'actief'
      -- HET SLOT: gemaild, en minstens p_respijt dagen geleden.
      and i.verwijder_waarschuwing_op is not null
      and i.verwijder_waarschuwing_op <= now() - make_interval(days => p_respijt)
      and public.wijs_toegang_tot(i.abon_status, i.proef_eindigt, i.periode_eindigt) is not null
      and public.wijs_toegang_tot(i.abon_status, i.proef_eindigt, i.periode_eindigt)
          <= now() - make_interval(days => p_dagen)
      -- Hangt er een BETALENDE collega aan een van zijn klassen? Dan deze
      -- gebruiker in zijn geheel overslaan, niet alleen die ene klas. Bewust
      -- grof: zijn rapporten en bestanden horen bij dezelfde samenwerking, en
      -- te veel bewaren is hier de goedkope fout.
      and not exists (
        select 1
        from public.duo_koppels dk
        join public.instellingen c
          on c.user_id = case when dk.gebruiker_a = i.user_id
                              then dk.gebruiker_b
                              else dk.gebruiker_a end
        where dk.status = 'actief'
          and (dk.gebruiker_a = i.user_id or dk.gebruiker_b = i.user_id)
          and c.abon_status = 'actief'
      )
    order by public.wijs_toegang_tot(i.abon_status, i.proef_eindigt, i.periode_eindigt)
    limit p_max
  loop
    if p_droog then
      -- Alleen tellen. Zelfde filters als hieronder, zodat de droogloop echt
      -- laat zien wat de echte ronde zou doen.
      select count(*) into n_rapporten from public.rapporten t where t.user_id = r.uid;
      select count(*) into n_taken     from public.taken     t where t.user_id = r.uid;
      select count(*) into n_klassen   from public.klassen   t where t.user_id = r.uid;
      select count(*) into n_bestanden from public.bestanden t
       where t.user_id = r.uid and (t.tool is null or t.tool <> all(k_bewaren));
      select count(*) into n_bewaard   from public.bestanden t
       where t.user_id = r.uid and t.tool = any(k_bewaren);
      select count(*) into n_agenda    from public.agenda_items t where t.user_id = r.uid;
    else
      -- Rapporten EERST, en expliciet op user_id. rapporten.klas_id staat op
      -- "on delete set null", dus wie alleen de klas wist, laat de rapporten
      -- gewoon staan, met voornamen en al. Dat is precies wat weg moet. Niet
      -- op cascade vertrouwen dus.
      with weg as (delete from public.rapporten t where t.user_id = r.uid returning 1)
        select count(*) into n_rapporten from weg;

      -- ⚠️ EERST het eigen vakwerk UIT DE MAPPEN halen, en dan pas wissen.
      -- bestanden.parent_id staat op "on delete cascade", dus een map die weg
      -- gaat sleept alles mee wat erin zit. Zonder deze stap gooi je precies
      -- het lesontwerp weg dat je wilde bewaren, omdat het toevallig in een map
      -- "Groep 8" stond. Ze staan daarna los in Bestanden; de mapindeling gaat
      -- verloren, en dat is de prijs voor het behouden van de inhoud.
      update public.bestanden t
         set parent_id = null
       where t.user_id = r.uid
         and t.tool = any(k_bewaren)
         and t.parent_id is not null;

      select count(*) into n_bewaard from public.bestanden t
       where t.user_id = r.uid and t.tool = any(k_bewaren);

      -- Nu de rest: plattegronden (voornamen), mappen, en alles zonder
      -- herkomst. De witte lijst hierboven bepaalt wat blijft.
      with weg as (
        delete from public.bestanden t
         where t.user_id = r.uid
           and (t.tool is null or t.tool <> all(k_bewaren))
        returning 1
      ) select count(*) into n_bestanden from weg;

      -- Taken hangen aan het account, niet aan de klas, maar ze gaan wel over
      -- de klas ("gesprek met de ouders van Sanne"). Besluit eigenaar 8-8: weg.
      with weg as (delete from public.taken t where t.user_id = r.uid returning 1)
        select count(*) into n_taken from weg;

      -- ⚠️ De agenda moet mee, anders is de belofte "gegevens over kinderen
      -- bewaren wij maximaal 90 dagen" niet waar. Een titel die iemand ZELF
      -- intikt ("Oudergesprek Sanne") wordt namelijk niet gemaskeerd; alleen
      -- het importpad van een gekoppelde agenda haalt namen eruit
      -- (maskeerNamen in src/lib/agenda-opslaan.ts). Besluit eigenaar 8-8:
      -- dat verschil blijft zoals het is, want een zelf getikte naam is
      -- werkdata van een kind dat toch al in je klassenlijst staat. Maar dan
      -- moet die data hier dus wél opgeruimd worden.
      --
      -- ⚠️ agenda_BRONNEN blijft staan, met opzet: daarin zit de (versleutelde)
      -- koppeling naar de agenda van de leerkracht. Komt iemand terug, dan
      -- vullen de geïmporteerde afspraken zichzelf weer. Alleen de zelf
      -- toegevoegde afspraken zijn echt weg, en dat is de bedoeling.
      with weg as (delete from public.agenda_items t where t.user_id = r.uid returning 1)
        select count(*) into n_agenda from weg;

      -- De klassen als laatste. Hieraan hangen met cascade: duo_koppels,
      -- duo_taken, duo_overdracht en duo_overdracht_gelezen. Die gaan dus
      -- vanzelf mee. instellingen.actieve_duo_klas_id staat op "set null" en
      -- geeft daarom geen fout.
      with weg as (delete from public.klassen t where t.user_id = r.uid returning 1)
        select count(*) into n_klassen from weg;
    end if;

    wie              := r.uid;
    aantal_klassen   := n_klassen;
    aantal_rapporten := n_rapporten;
    aantal_bestanden := n_bestanden;
    aantal_taken     := n_taken;
    aantal_agenda    := n_agenda;
    aantal_bewaard   := n_bewaard;
    return next;
  end loop;
end;
$$;

-- ⚠️ Deze functie VERWIJDERT gegevens van andere gebruikers. Alleen de
-- geplande taak mag hem aanroepen.
revoke execute on function public.wijs_verwijder_klasdata(int, int, int, boolean) from public, anon, authenticated;
grant  execute on function public.wijs_verwijder_klasdata(int, int, int, boolean) to service_role;

commit;

-- ============================================================================
-- DE NACHTELIJKE TAAK
-- ----------------------------------------------------------------------------
-- Zelfde opzet als database/retention.sql. Draait om 03:30, ná de twee
-- opruimtaken die daar al staan. Zelfde naam = wordt bijgewerkt, niet
-- gedupliceerd.
--
-- Dit mag nu al aan: zolang er geen waarschuwingsmails uitgaan (en die gaan
-- niet uit zolang BETALINGEN_LIVE uit staat) vindt deze taak elke nacht nul
-- rijen. Zet je hem pas later aan, dan is de kans groot dat hij vergeten wordt.
-- ============================================================================

create extension if not exists pg_cron;

select cron.schedule(
  'wis-klasdata-na-opzegging',
  '30 3 * * *',
  $$select * from public.wijs_verwijder_klasdata()$$
);

-- ============================================================================
-- CONTROLE (read-only, verandert niets)
-- ============================================================================
-- Wie zou er nu een waarschuwingsmail krijgen?
--   select * from public.wijs_verwijder_waarschuwing();
--
-- Wat zou de nachtelijke taak wissen, zonder iets te wissen? (droogloop)
--   select * from public.wijs_verwijder_klasdata(90, 7, 200, true);
--
-- Wie is er in beeld, en wanneer? (zonder iets te wissen)
--   select user_id,
--          coalesce(abon_status,'proef')                          as status,
--          public.wijs_toegang_tot(abon_status, proef_eindigt, periode_eindigt)::date as toegang_tot,
--          verwijder_waarschuwing_op::date                        as gewaarschuwd,
--          (public.wijs_toegang_tot(abon_status, proef_eindigt, periode_eindigt) + interval '90 days')::date as dag_90
--     from public.instellingen
--    order by 3 nulls last;
--
-- Staat de taak ingepland?
--   select jobname, schedule, command from cron.job where jobname = 'wis-klasdata-na-opzegging';
