-- ============================================================================
-- De mail dat je proefperiode is verlopen
-- ----------------------------------------------------------------------------
-- Vast klaargemaakt vóór Mollie live gaat (zie mail-verzendstraat/golive-
-- checklist): de route zelf (src/app/api/cron/proef-verlopen/route.ts)
-- verstuurt bewust NIETS zolang NEXT_PUBLIC_BETALINGEN_LIVE uit staat, want
-- tot die tijd verandert er bij het verlopen van een proef niets (zie
-- src/lib/abonnement.ts, heeftToegang()) en zou de mail iets beweren dat niet
-- waar is.
--
-- Zelfde opzet als migratie-proef-herinnering.sql, met een EIGEN slotveld —
-- niet hetzelfde veld hergebruiken, anders telt "al de herinnering gehad"
-- mee als "al de verlopen-mail gehad" en andersom.
-- ============================================================================

begin;

-- ── 1. Onthouden dat de mail verstuurd is ──────────────────────────────────
-- Zelfde reden als bij proef_herinnering_op: een slot, geen administratie.
alter table public.instellingen
  add column if not exists proef_verlopen_op timestamptz;

-- ── 2. Wie is er net verlopen? ─────────────────────────────────────────────
-- Security definer, want het mailadres staat in auth.users.
--
-- De voorwaarden:
--   proef_verlopen_op is null     -> nog niet gemaild (het slot hierboven)
--   abon_status = 'proef'         -> nooit een plan gekozen; wie al betaalt of
--                                    opgezegd heeft hoort hier niet bij
--   proef_eindigt <= now()        -> echt voorbij, niet de herinnering vooraf
--   binnen p_dagen terug          -> venster naar het verleden, standaard 3
--                                    dagen, zodat een gemiste dag (storing,
--                                    taak niet gedraaid) niet meteen overslaat
create or replace function public.wijs_proef_verlopen(p_dagen int default 3)
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
  where i.proef_verlopen_op is null
    and coalesce(i.abon_status, 'proef') = 'proef'
    and i.proef_eindigt is not null
    and i.proef_eindigt <= now()
    and i.proef_eindigt >= now() - make_interval(days => p_dagen)
    and u.email is not null
  order by i.proef_eindigt;
$$;

-- ⚠️ Geeft mailadressen van ANDERE gebruikers terug — alleen de geplande taak
-- (servicesleutel) mag hem aanroepen, nooit 'authenticated'.
revoke execute on function public.wijs_proef_verlopen(int) from public, anon, authenticated;
grant  execute on function public.wijs_proef_verlopen(int) to service_role;

commit;

-- ============================================================================
-- CONTROLE: wie zou er nu een verlopen-mail krijgen?
-- ============================================================================
-- select * from public.wijs_proef_verlopen(3);
