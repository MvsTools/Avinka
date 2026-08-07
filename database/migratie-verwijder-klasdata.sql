-- ============================================================================
-- Opzeggen verwijdert de klasgegevens (AVG)
-- ----------------------------------------------------------------------------
-- Wie 30 dagen geen abonnement meer heeft, raakt zijn KLASGEBONDEN gegevens
-- kwijt: klassen, rapporten, bestanden, taken en de duo-overdracht. Het account
-- zelf blijft bestaan (inloggegevens, de instellingen-rij, de betaalhistorie,
-- de verwijzingscode) — zie het ontwerp in het geheugen: boekhoudplicht,
-- terugkomen zonder gedoe, en een gewist account breekt de verwijzingsketen.
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
-- Standaard op dag 23, zodat er ~7 dagen respijt is vóór dag 30.
--
-- p_max is er voor de verzendreputatie, niet voor de techniek: staat er ooit
-- een berg oude proefaccounts klaar, dan gaat die er in porties uit in plaats
-- van als één blast vanaf een jong afzenderdomein. Wie vandaag niet aan de
-- beurt is, is morgen aan de beurt.
create or replace function public.wijs_verwijder_waarschuwing(
  p_dag int default 23,
  p_max int default 50
) returns table (
  user_id   uuid,
  email     text,
  voornaam  text,
  wist_op   date
)
language sql security definer set search_path = public as $$
  select i.user_id,
         u.email::text,
         coalesce(u.raw_user_meta_data ->> 'first_name', ''),
         -- De datum die in de mail komt te staan, en die moet WAAR zijn. Bij
         -- een gewone gebruiker is dat dag 30; loopt de mail achter (backlog,
         -- storing), dan is het de respijttermijn van 7 dagen die telt, want
         -- dát is wat stap 4 hieronder afdwingt. Nooit een datum beloven die
         -- al voorbij is.
         greatest(
           public.wijs_toegang_tot(i.abon_status, i.proef_eindigt, i.periode_eindigt) + interval '30 days',
           now() + interval '7 days'
         )::date
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
create or replace function public.wijs_verwijder_klasdata(
  p_dagen   int default 30,
  p_respijt int default 7,
  p_max     int default 200,
  p_droog   boolean default false
) returns table (
  wie               uuid,
  aantal_klassen    int,
  aantal_rapporten  int,
  aantal_bestanden  int,
  aantal_taken      int
)
language plpgsql security definer set search_path = public as $$
declare
  r record;
  n_klassen   int;
  n_rapporten int;
  n_bestanden int;
  n_taken     int;
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
      select count(*) into n_bestanden from public.bestanden t where t.user_id = r.uid;
      select count(*) into n_taken     from public.taken     t where t.user_id = r.uid;
      select count(*) into n_klassen   from public.klassen   t where t.user_id = r.uid;
    else
      -- Rapporten EERST, en expliciet op user_id. rapporten.klas_id staat op
      -- "on delete set null", dus wie alleen de klas wist, laat de rapporten
      -- gewoon staan, met voornamen en al. Dat is precies wat weg moet. Niet
      -- op cascade vertrouwen dus.
      with weg as (delete from public.rapporten t where t.user_id = r.uid returning 1)
        select count(*) into n_rapporten from weg;

      -- Bestanden en taken hangen aan het ACCOUNT, niet aan de klas: er is
      -- geen klasfilter om op te selecteren. Besluit van de eigenaar (8-8):
      -- allebei helemaal weg, want van buitenaf is niet te zien welk bestand
      -- voornamen bevat, en de waarschuwingsmail geeft 7 dagen om te
      -- downloaden.
      with weg as (delete from public.bestanden t where t.user_id = r.uid returning 1)
        select count(*) into n_bestanden from weg;

      with weg as (delete from public.taken t where t.user_id = r.uid returning 1)
        select count(*) into n_taken from weg;

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
--   select * from public.wijs_verwijder_klasdata(30, 7, 200, true);
--
-- Wie is er in beeld, en wanneer? (zonder iets te wissen)
--   select user_id,
--          coalesce(abon_status,'proef')                          as status,
--          public.wijs_toegang_tot(abon_status, proef_eindigt, periode_eindigt)::date as toegang_tot,
--          verwijder_waarschuwing_op::date                        as gewaarschuwd,
--          (public.wijs_toegang_tot(abon_status, proef_eindigt, periode_eindigt) + interval '30 days')::date as dag_30
--     from public.instellingen
--    order by 3 nulls last;
--
-- Staat de taak ingepland?
--   select jobname, schedule, command from cron.job where jobname = 'wis-klasdata-na-opzegging';
