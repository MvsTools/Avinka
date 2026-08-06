-- ============================================================================
-- De herinnering dat je proefperiode bijna afloopt
-- ----------------------------------------------------------------------------
-- Eén mail, twee dagen voor het einde van de proefperiode. De mail dát je
-- proef verlopen IS komt later, samen met Mollie: zolang BETALINGEN_LIVE uit
-- staat verandert er bij het verlopen namelijk niets, en dan zou zo'n mail
-- iets beweren dat niet waar is (zie src/lib/abonnement.ts).
--
-- Twee dingen hier, en de eerste is de belangrijkste.
-- ============================================================================

begin;

-- ── 1. Onthouden dat de mail verstuurd is ──────────────────────────────────
-- ⚠️ Dit veld is niet administratie maar een SLOT. Een geplande taak kan twee
-- keer draaien: bij een herstart, bij een nieuwe poging na een storing, of
-- omdat iemand hem met de hand aanzet om te testen. Zonder dit veld krijgt een
-- leerkracht dan twee of drie keer dezelfde mail, en dat is precies het soort
-- fout waardoor mensen je afzender als ongewenst gaan markeren.
alter table public.instellingen
  add column if not exists proef_herinnering_op timestamptz;

-- ── 2. Wie is er aan de beurt? ─────────────────────────────────────────────
-- Security definer, want het mailadres staat in auth.users en daar mag de app
-- niet zomaar in. Geeft alleen terug wat de mail nodig heeft: adres, voornaam
-- en einddatum. Geen wachtwoorden, geen andere gegevens.
--
-- De voorwaarden, en waarom elke er staat:
--   proef_herinnering_op is null  -> nog niet gemaild (het slot hierboven)
--   abon_status = 'proef'         -> wie al betaalt of opgezegd heeft niet
--   proef_eindigt > now()         -> al verlopen? dan is deze mail te laat en
--                                    is het een ander bericht
--   binnen p_dagen                -> het venster, standaard twee dagen
create or replace function public.wijs_proef_herinneringen(p_dagen int default 2)
returns table (
  user_id       uuid,
  email         text,
  voornaam      text,
  proef_eindigt timestamptz
)
language sql security definer set search_path = public as $$
  select i.user_id,
         u.email::text,
         coalesce(u.raw_user_meta_data ->> 'first_name', ''),
         i.proef_eindigt
  from public.instellingen i
  join auth.users u on u.id = i.user_id
  where i.proef_herinnering_op is null
    and coalesce(i.abon_status, 'proef') = 'proef'
    and i.proef_eindigt is not null
    and i.proef_eindigt > now()
    and i.proef_eindigt <= now() + make_interval(days => p_dagen)
    and u.email is not null
  order by i.proef_eindigt;
$$;

-- ⚠️ Deze functie geeft mailadressen van ANDERE gebruikers terug. Hij hoort
-- dus NIET bij 'authenticated': een gewone leerkracht mag dit nooit opvragen.
-- Alleen de geplande taak (die met de servicesleutel draait) komt erbij.
revoke execute on function public.wijs_proef_herinneringen(int) from public, anon, authenticated;
grant  execute on function public.wijs_proef_herinneringen(int) to service_role;

commit;

-- ============================================================================
-- CONTROLE: wie zou er nu een herinnering krijgen?
-- ============================================================================
-- select * from public.wijs_proef_herinneringen(2);
