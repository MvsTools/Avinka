-- ══════════════════════════════════════════════════════════════════════════
--  KLASLIMIET IN DE DATABASE  (2026-08-05)
--  Eén keer draaien in de Supabase SQL Editor. Veilig om opnieuw te draaien.
-- ══════════════════════════════════════════════════════════════════════════
--
--  HET GAT
--  "Start = 1 groep, Compleet/Pro = 3" werd alleen in het scherm bewaakt
--  (`magNogKlas` in KlasManager.tsx). Wie buiten de app om met de database
--  praat — en dat kan met de sleutel die in elke browser staat — maakte er
--  gewoon tien. Zelfde soort fout als het abonnement dat je zelf kon
--  schrijven (database/migratie-fraude-slot.sql), alleen op een andere tabel.
--
--  DE KEUZE: DE REGEL VOLGT DE DATA, NIET EEN VLAG
--  De grens geldt alleen voor iemand met een BETAALD pakket. Tijdens de proef
--  en zolang betalingen niet live zijn heeft niemand een `abon_plan`, dus er
--  verandert vandaag niets voor gewone accounts. Zo hoeft de database niets te
--  weten van NEXT_PUBLIC_BETALINGEN_LIVE en is er bij de livegang geen tweede
--  schakelaar die je kunt vergeten om te zetten.
--
--  ⚠️ Dat betekent wel: een account dat blijft hangen op 'proef' kent hier geen
--  grens. Dat mag, want zo iemand betaalt ook niet voor "meerdere groepen" —
--  het pakket dat hij zou omzeilen heeft hij niet. De echte afsluiting van een
--  verlopen proef is de toegangscontrole in de proxy en in /api/claude.
--
--  ⚠️ DE AANTALLEN STAAN OOK IN src/lib/abonnement.ts (KLAS_LIMIET).
--  Verander je ze daar, verander ze dan hier ook.

create or replace function public.klassen_limiet_bewaakt()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  st        text;
  pl        text;
  grens     int;
  huidig    int;
begin
  -- Net als bij instellingen_bewaakt(): alleen de browserkant wordt geteld.
  -- ⚠️ BEWUST GEEN `security definer` — de functie moet zien WIE er schrijft.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  select abon_status, abon_plan into st, pl
  from public.instellingen where user_id = new.user_id;

  -- Geen betaald pakket = geen grens (proef en testfase).
  if pl is null or st is null or st not in ('actief', 'opgezegd') then
    return new;
  end if;

  grens := case pl
             when 'start'    then 1
             when 'compleet' then 3
             when 'pro'      then 3
             else 3
           end;

  select count(*) into huidig from public.klassen where user_id = new.user_id;

  if huidig >= grens then
    raise exception 'Je pakket staat % groep(en) toe.', grens
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- Alleen bij INSERT: een bestaande groep bijwerken of hernoemen mag altijd,
-- ook als iemand overstapt naar een kleiner pakket en er dan te veel heeft.
drop trigger if exists trg_klassen_limiet on public.klassen;
create trigger trg_klassen_limiet
  before insert on public.klassen
  for each row execute function public.klassen_limiet_bewaakt();

revoke execute on function public.klassen_limiet_bewaakt() from public, anon;

-- ── Controle achteraf ─────────────────────────────────────────────────────
--   select i.abon_status, i.abon_plan, count(k.id)
--   from public.instellingen i
--   left join public.klassen k on k.user_id = i.user_id
--   group by i.user_id, i.abon_status, i.abon_plan;
