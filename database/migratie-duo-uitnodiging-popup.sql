-- ============================================================================
-- De uitnodiging als pop-up, met school en groep erbij
-- ----------------------------------------------------------------------------
-- WAAROM
-- Wie via een uitnodigingslink een account aanmaakt, landde op de instellingen-
-- pagina en moest daar naar beneden scrollen om de uitnodiging te vinden. Nu
-- springt hij er meteen overheen. Daarvoor moet de uitnodiging twee dingen
-- weten die hij nog niet wist: van WIE hij komt, en welke school en groep de
-- nieuwe collega kan overnemen.
--
-- WAAROM DIT VIA EEN SECURITY-DEFINER FUNCTIE MOET
-- De uitgenodigde staat op dit moment nog nergens in de koppeltabel en is dus
-- (terecht) een vreemde voor de gegevens van de uitnodiger. RLS blokkeert het
-- lezen van diens instellingen. Deze functie geeft daarom precies drie dingen
-- vrij en niets meer: voornaam, schoolnaam, standaardgroep. Alleen aan wie de
-- geheime code in handen heeft, en alleen zolang de uitnodiging openstaat.
-- ============================================================================

begin;

-- ── 1. Het voorbeeld: wie nodigt uit, en wat kun je overnemen? ──────────────
-- Drop is nodig omdat de teruggegeven kolommen veranderen; dat kan `create or
-- replace` niet.
--
-- ⚠️ LET OP: een DROP gooit ook de rechten weg, en PostgreSQL geeft een NIEUWE
-- functie standaard EXECUTE aan PUBLIC. Zonder de revoke hieronder zou deze
-- functie dus weer openstaan voor uitgelogde bezoekers, en draaien we het werk
-- van migratie-anon-uitsluiten.sql stilletjes terug.
drop function if exists public.duo_koppel_voorbeeld(text);

create function public.duo_koppel_voorbeeld(p_code text)
returns table (
  klas_naam           text,
  status              text,
  uitnodiger_voornaam text,
  schoolnaam          text,
  standaardgroep      text
)
language sql security definer set search_path = public as $$
  select k.naam,
         dk.status,
         coalesce(u.raw_user_meta_data ->> 'first_name', ''),
         coalesce(i.schoolnaam, ''),
         coalesce(i.standaardgroep, '')
  from public.duo_koppels dk
  join public.klassen k on k.id = dk.klas_id
  join auth.users u on u.id = dk.gebruiker_a
  left join public.instellingen i on i.user_id = dk.gebruiker_a
  where dk.code = p_code
    and dk.status = 'uitgenodigd'
    and dk.gebruiker_b is null
  limit 1;
$$;

revoke execute on function public.duo_koppel_voorbeeld(text) from public, anon;
grant  execute on function public.duo_koppel_voorbeeld(text) to authenticated;

-- ── 2. Accepteren vult school en groep vast in ─────────────────────────────
-- Het invullen gebeurt hier en niet in de browser, zodat de meegestuurde waarden
-- niet te vervalsen zijn: de database haalt ze zelf bij de uitnodiger op.
create or replace function public.duo_koppel_accepteren(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  gevonden_id uuid;
  uitnodiger  uuid;
begin
  update public.duo_koppels
  set gebruiker_b = auth.uid(), status = 'actief'
  where code = p_code and status = 'uitgenodigd' and gebruiker_b is null
    and gebruiker_a <> auth.uid() -- niet je eigen uitnodiging accepteren
  returning id, gebruiker_a into gevonden_id, uitnodiger;

  if gevonden_id is null then
    return null;
  end if;

  -- School en groep overnemen. NOOIT overschrijven wat de nieuwe collega zelf
  -- al heeft ingevuld: een bestaande gebruiker die een uitnodiging aanneemt
  -- houdt zijn eigen school. Alleen lege velden worden gevuld.
  insert into public.instellingen as doel (user_id, schoolnaam, standaardgroep)
  select auth.uid(), coalesce(i.schoolnaam, ''), coalesce(i.standaardgroep, '')
  from public.instellingen i
  where i.user_id = uitnodiger
  on conflict (user_id) do update
  set schoolnaam = case
        when coalesce(doel.schoolnaam, '') = '' then excluded.schoolnaam
        else doel.schoolnaam
      end,
      standaardgroep = case
        when coalesce(doel.standaardgroep, '') = '' then excluded.standaardgroep
        else doel.standaardgroep
      end;

  return gevonden_id;
end;
$$;

revoke execute on function public.duo_koppel_accepteren(text) from public, anon;
grant  execute on function public.duo_koppel_accepteren(text) to authenticated;

commit;

-- ============================================================================
-- CONTROLE: hier hoort nog steeds alleen avinka_landing_cijfers en
-- gedeeld_draaiboek uit te komen.
-- ============================================================================
-- select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE');
