-- ══════════════════════════════════════════════════════════════════════════
--  SLOT OP DE STATISTIEKTELLERS  (2026-08-05)
--  Eén keer draaien in de Supabase SQL Editor. Veilig om opnieuw te draaien.
-- ══════════════════════════════════════════════════════════════════════════
--
--  HET GAT
--  `avinka_landing_cijfers` telt `statistiek.minuten` en `statistiek.tellers`
--  van ALLE accounts bij elkaar op — dat is het bord "Avinka in cijfers" op de
--  voorpagina. En elke ingelogde gebruiker kon die twee velden in zijn eigen rij
--  zetten op wat hij wilde. Eén account kon dus "1.284 uur bespaard" op de
--  homepage zetten. Hetzelfde geldt voor `wijs_community_stats` (de vergelijking
--  in Mijn statistieken) en het admin-overzicht.
--
--  Geen geldprobleem, wél een waarheidsprobleem: dat bord staat er juist omdat
--  het klopt, met een statuspil erbij zodat een klein getal geen zwakte is.
--
--  DE OPLOSSING
--  Alleen de server telt op. `/api/statistiek` schrijft sinds 5-8 met de
--  servicesleutel en telt per aanroep precies één actie, met een dagplafond
--  (MAX_ACTIES_PER_DAG) zodat een lusje niets meer oplevert.
--
--  ⚠️ Deze route heeft dus SUPABASE_SERVICE_ROLE_KEY nodig. Staat die niet in
--  .env.local (of in de Vercel-instellingen), dan wordt er NIETS geteld — de
--  route zegt dat ook, in de serverlog en in zijn antwoord.

create or replace function public.statistiek_bewaakt()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- ⚠️ BEWUST GEEN `security definer`: de functie moet zien WIE er schrijft.
  -- De servicesleutel draait als 'service_role' en mag er wél door.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Een rij begint altijd leeg; de route vult hem.
    new.tellers        := '{}'::jsonb;
    new.minuten        := '{}'::jsonb;
    new.per_dag        := '{}'::jsonb;
    new.streak         := 0;
    new.streak_max     := 0;
    new.streak_freezes := 0;
    new.laatste_actief := null;
    return new;
  end if;

  if new.tellers        is distinct from old.tellers
  or new.minuten        is distinct from old.minuten
  or new.per_dag        is distinct from old.per_dag
  or new.streak         is distinct from old.streak
  or new.streak_max     is distinct from old.streak_max
  or new.streak_freezes is distinct from old.streak_freezes
  or new.laatste_actief is distinct from old.laatste_actief
  then
    raise exception 'Je statistieken worden door de server bijgehouden.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_statistiek_bewaakt on public.statistiek;
create trigger trg_statistiek_bewaakt
  before insert or update on public.statistiek
  for each row execute function public.statistiek_bewaakt();

revoke execute on function public.statistiek_bewaakt() from public, anon;

-- ── Controle achteraf ─────────────────────────────────────────────────────
--   select avinka_landing_cijfers();
--   -- en daarna in de app een tool gebruiken; het getal hoort gewoon op te lopen.
