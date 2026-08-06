-- ══════════════════════════════════════════════════════════════════════════
--  FRAUDE-SLOT OP `instellingen`  (2026-08-05)
--  Eén keer draaien in de Supabase SQL Editor. Veilig om opnieuw te draaien.
-- ══════════════════════════════════════════════════════════════════════════
--
--  HET GAT DAT DIT DICHT ZET
--  De policy "eigen instellingen" is `for all` op je eigen rij, en er zat geen
--  slot op de kolommen. Elke ingelogde gebruiker kon dus met de sleutel die
--  sowieso in zijn browser staat zijn eigen rij bijwerken:
--
--    abon_status    -> 'actief'   = gratis volledige toegang
--    abon_plan      -> 'pro'      = het duurste AI-model
--    proef_eindigt  -> ver weg    = proef die nooit afloopt
--    verwezen_door  -> eigen code = jezelf uitnodigen
--    ref_code       -> zelf kiezen of die van een ander overnemen
--
--  Daarmee viel ook de fraudebescherming op de uitnodigingen om: die leunt op
--  "een uitnodiging telt pas als die collega BETAALT" (wijs_aantal_verwijzingen),
--  en `abon_status` schreef de uitgenodigde zelf.
--
--  DE REGEL DIE HIERONDER STAAT
--  Alles wat geld waard is, schrijft de SERVER. De browser mag het lezen en
--  verder niets. Wie het toch probeert krijgt een fout te zien, geen stilte.
--
--  ⚠️ GEVOLG VOOR MOLLIE: de routes /api/mollie/checkout en /api/mollie/return
--  zetten het abonnement nu met de SERVICESLEUTEL (SUPABASE_SERVICE_ROLE_KEY in
--  de omgevingsvariabelen). Zonder die sleutel kan een betaling niet meer
--  worden vastgelegd. Vul hem in vóór je betalingen aanzet.

-- ── 1) Een uitnodigingscode mag maar bij één account horen ────────────────
-- Zonder deze index kunnen twee accounts dezelfde code voeren en tellen ze
-- elkaars aanmeldingen mee.
create unique index if not exists idx_instellingen_ref_code
  on public.instellingen(ref_code)
  where ref_code is not null;

-- ── 2) De wachter ─────────────────────────────────────────────────────────
-- ⚠️ BEWUST GEEN `security definer`: de functie moet juist zien WIE er schrijft.
-- PostgREST zet de rol op 'authenticated' (browser) of 'anon'. De servicesleutel
-- draait als 'service_role' en een security-definer-functie als de eigenaar van
-- die functie; die twee horen er wél door.
create or replace function public.instellingen_bewaakt()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;  -- server of security-definer-functie: mag alles
  end if;

  if tg_op = 'INSERT' then
    -- Een nieuw account start ALTIJD als proef. Wat de browser meestuurt telt
    -- niet mee; we negeren het in plaats van te weigeren, want een gewone
    -- opslagactie stuurt deze velden helemaal niet mee.
    new.abon_plan          := null;
    new.abon_vorm          := null;
    new.abon_status        := 'proef';
    new.proef_eindigt      := now() + interval '7 days';
    new.periode_eindigt    := null;
    new.start_tool         := null;
    new.start_tool_sinds   := null;
    new.mollie_customer_id := null;
    new.mollie_payment_id  := null;
    new.beta_eigen_format  := false;
    new.ref_code           := null;  -- die deelt de database uit (wijs_ref_code)
    new.verwezen_door      := null;  -- die legt wijs_koppel_verwijzing vast
    new.proef_herinnering_op := null;
    return new;
  end if;

  -- UPDATE: deze velden wijzigen kan geen echte handeling van de gebruiker
  -- zijn, dus dit is altijd iemand die aan de sleutel zit. Hard weigeren.
  if new.abon_plan          is distinct from old.abon_plan
  or new.abon_vorm          is distinct from old.abon_vorm
  or new.abon_status        is distinct from old.abon_status
  or new.proef_eindigt      is distinct from old.proef_eindigt
  or new.periode_eindigt    is distinct from old.periode_eindigt
  or new.start_tool         is distinct from old.start_tool
  or new.start_tool_sinds   is distinct from old.start_tool_sinds
  or new.mollie_customer_id is distinct from old.mollie_customer_id
  or new.mollie_payment_id  is distinct from old.mollie_payment_id
  or new.beta_eigen_format  is distinct from old.beta_eigen_format
  or new.ref_code           is distinct from old.ref_code
  or new.verwezen_door      is distinct from old.verwezen_door
  or new.proef_herinnering_op is distinct from old.proef_herinnering_op
  then
    raise exception 'Deze velden worden door de server bepaald (abonnement en uitnodigingen).'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_instellingen_bewaakt on public.instellingen;
create trigger trg_instellingen_bewaakt
  before insert or update on public.instellingen
  for each row execute function public.instellingen_bewaakt();

-- ── 3) De database deelt de uitnodigingscode uit ──────────────────────────
-- Was: de browser verzon een code en schreef die weg. Nu kun je 'm niet zelf
-- kiezen en die van een ander niet overnemen.
create or replace function public.wijs_ref_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  bestaand  text;
  nieuw     text;
  pogingen  int := 0;
  alfabet   constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- zonder verwarrende tekens
begin
  if auth.uid() is null then return null; end if;

  select ref_code into bestaand from public.instellingen where user_id = auth.uid();
  if coalesce(bestaand, '') <> '' then return bestaand; end if;

  loop
    select string_agg(substr(alfabet, 1 + floor(random() * length(alfabet))::int, 1), '')
      into nieuw
      from generate_series(1, 7);
    begin
      insert into public.instellingen as doel (user_id, ref_code)
      values (auth.uid(), nieuw)
      on conflict (user_id) do update
        -- Heeft een gelijktijdige aanroep er net één gezet, dan houden we die.
        set ref_code = coalesce(doel.ref_code, excluded.ref_code)
      returning doel.ref_code into bestaand;
      return bestaand;
    exception when unique_violation then
      pogingen := pogingen + 1;
      if pogingen >= 5 then raise; end if;  -- 31^7 mogelijkheden; dit gebeurt niet
    end;
  end loop;
end;
$$;
revoke execute on function public.wijs_ref_code() from public, anon;
grant  execute on function public.wijs_ref_code() to authenticated;

-- ── 4) Wie jou heeft uitgenodigd: één keer, en met controle ───────────────
-- Vier sloten, allemaal in de database en niet in het scherm:
--   1. je kunt maar één keer gekoppeld worden;
--   2. nooit aan je eigen code;
--   3. de code moet echt van een bestaand account zijn;
--   4. alleen binnen 30 dagen na je aanmelding — een uitnodiging hoort bij het
--      begin van je account, niet bij een klik van een jaar later.
create or replace function public.wijs_koppel_verwijzing(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  mijn_code    text;
  al_gekoppeld text;
  uitnodiger   uuid;
  aangemaakt   timestamptz;
begin
  if auth.uid() is null or coalesce(p_code, '') = '' then return false; end if;

  select ref_code, verwezen_door into mijn_code, al_gekoppeld
  from public.instellingen where user_id = auth.uid();
  if al_gekoppeld is not null then return false; end if;   -- 1
  if mijn_code = p_code then return false; end if;         -- 2

  select user_id into uitnodiger from public.instellingen where ref_code = p_code;
  if uitnodiger is null or uitnodiger = auth.uid() then return false; end if;  -- 3

  select created_at into aangemaakt from auth.users where id = auth.uid();
  if aangemaakt is null or aangemaakt < now() - interval '30 days' then
    return false;                                          -- 4
  end if;

  insert into public.instellingen as doel (user_id, verwezen_door)
  values (auth.uid(), p_code)
  on conflict (user_id) do update
    set verwezen_door = excluded.verwezen_door
    where doel.verwezen_door is null;
  return true;
end;
$$;
revoke execute on function public.wijs_koppel_verwijzing(text) from public, anon;
grant  execute on function public.wijs_koppel_verwijzing(text) to authenticated;

-- ── 5) De teller geeft alleen JOUW aantal terug ───────────────────────────
-- Met een vreemde code kon je eerder de stand van een ander opvragen. Geen
-- lek van gegevens, wel een getal dat niemand anders aangaat.
create or replace function public.wijs_aantal_verwijzingen(code text)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int
  from public.instellingen
  where verwezen_door = code
    and code is not null and code <> ''
    and code = (select ref_code from public.instellingen where user_id = auth.uid())
    and abon_status in ('actief', 'opgezegd');
$$;
revoke execute on function public.wijs_aantal_verwijzingen(text) from public, anon;
grant  execute on function public.wijs_aantal_verwijzingen(text) to authenticated;

create or replace function public.wijs_aantal_verwijzingen_proef(code text)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int
  from public.instellingen
  where verwezen_door = code
    and code is not null and code <> ''
    and code = (select ref_code from public.instellingen where user_id = auth.uid())
    and (abon_status = 'proef' or abon_status is null);
$$;
revoke execute on function public.wijs_aantal_verwijzingen_proef(text) from public, anon;
grant  execute on function public.wijs_aantal_verwijzingen_proef(text) to authenticated;

-- ── Controle achteraf (mag je los draaien) ────────────────────────────────
--   select ref_code, verwezen_door, abon_status from public.instellingen;
--   -- en probeer als ingelogde gebruiker eens:
--   -- update public.instellingen set abon_status='actief' where user_id = auth.uid();
--   -- dat hoort nu te weigeren met "Deze velden worden door de server bepaald".
