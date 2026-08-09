-- ══════════════════════════════════════════════════════════════════════════
--  BESTANDEN ALLEEN VOOR COMPLEET/PRO — IN DE DATABASE  (2026-08-09)
--  Eén keer draaien in de Supabase SQL Editor. Veilig om opnieuw te draaien.
-- ══════════════════════════════════════════════════════════════════════════
--
--  HET GAT
--  "Bestanden hoort bij Compleet en Pro" werd op drie plekken bewaakt, en alle
--  drie zijn ze te omzeilen door wie buiten de app om met de database praat —
--  en dat kan met de sleutel die in elke browser staat:
--    1. de proxy stuurt een Start-klant weg van /dashboard/mijn-teksten,
--    2. /api/bestanden weigert GET en POST (dat is het pad van de tools),
--    3. het scherm toont de knop niet.
--  Maar het dashboard zelf schrijft RECHTSTREEKS in de tabel (`insertBestand`
--  in src/lib/db.ts), en `authenticated` heeft gewoon INSERT-recht. Wie die
--  aanroep nadoet, heeft Bestanden zonder ervoor te betalen.
--
--  Zelfde soort fout als de klaslimiet (database/migratie-klaslimiet.sql) en
--  het abonnement dat je zelf kon schrijven (migratie-fraude-slot.sql):
--  🔑 de regel stond overal behalve op de plek waar hij niet te omzeilen is.
--
--  DE KEUZE: DE REGEL VOLGT DE DATA, NIET EEN VLAG
--  Net als bij de klaslimiet geldt de grens alleen voor iemand met een BETAALD
--  pakket. Tijdens de proef en zolang betalingen niet live zijn verandert er
--  dus niets, en bij de livegang is er geen tweede schakelaar die je kunt
--  vergeten om te zetten. Nagemeten op 9-8-2026: één account op 'start' (leeg,
--  van de Mollie-test) en één op 'pro' (6 bestanden, mag gewoon) — dus deze
--  migratie raakt vandaag niemand.
--
--  ALLEEN BIJ HET AANMAKEN, EN DAT IS EXPRES
--  Bestaande bestanden blijven te lezen, te wijzigen en te verwijderen. Twee
--  redenen, allebei belangrijker dan de striktheid:
--    * Stap je terug van Compleet naar Start, dan moet je je eigen werk nog
--      kunnen opruimen en meenemen.
--    * ⚠️ /mijn-gegevens (inzage en meenemen, AVG art. 15/20) leest deze
--      tabel. Een slot op SELECT zou de wettelijke inzage breken voor precies
--      de groep die er het vaakst om vraagt: iemand die net is gestopt.
--
--  ⚠️ DEZELFDE REGEL STAAT IN src/lib/abonnement.ts (magBestandenGebruiken).
--  Verandert daar wie er wél bij mag, verander het hier dan ook.

create or replace function public.bestanden_tier_bewaakt()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  st text;
  pl text;
begin
  -- Net als bij klassen_limiet_bewaakt(): alleen de browserkant wordt geteld.
  -- ⚠️ BEWUST GEEN `security definer` — de functie moet zien WIE er schrijft.
  -- De servicesleutel (server-side code, opruimtaken) gaat hier dus langs.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  select abon_status, abon_plan into st, pl
  from public.instellingen where user_id = new.user_id;

  -- Geen betaald pakket = geen grens (proef en testfase).
  if pl is null or st is null or st not in ('actief', 'opgezegd') then
    return new;
  end if;

  if pl = 'start' then
    raise exception 'Bestanden hoort bij Compleet en Pro.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_bestanden_tier on public.bestanden;
create trigger trg_bestanden_tier
  before insert on public.bestanden
  for each row execute function public.bestanden_tier_bewaakt();

revoke execute on function public.bestanden_tier_bewaakt() from public, anon;

-- ── Controle achteraf ─────────────────────────────────────────────────────
--   select tgname, tgenabled from pg_trigger
--   where tgrelid = 'public.bestanden'::regclass and not tgisinternal;
--
--   select i.abon_plan, count(b.id) as bestanden
--   from public.instellingen i
--   left join public.bestanden b on b.user_id = i.user_id
--   group by i.user_id, i.abon_plan;
