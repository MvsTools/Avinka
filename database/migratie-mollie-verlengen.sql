-- ============================================================================
-- Automatisch verlengen van een betaald abonnement (de maandelijkse incasso)
-- ----------------------------------------------------------------------------
-- Tot nu toe zette Mollie alleen de EERSTE betaling vast (checkout + return).
-- Deze migratie voegt het spoor toe voor de VERVOLGbetalingen: elke maand
-- opnieuw incasseren via het mandaat dat bij de eerste betaling ontstond.
--
-- Eén nieuw veld, en dat is een SLOT, geen administratie: het houdt bij welke
-- verlengbetaling er bij Mollie loopt, zodat de dagelijkse taak (zie
-- src/app/api/cron/mollie-verlengen) een klant niet twee keer tegelijk laat
-- incasseren terwijl de vorige poging nog bij de bank onderweg is (SEPA-
-- incasso duurt dagen, niet seconden).
-- ============================================================================

begin;

alter table public.instellingen
  add column if not exists mollie_verleng_payment_id text;

-- Zelfde slot als op de andere Mollie-velden (zie migratie-fraude-slot.sql):
-- alleen de server (servicesleutel of een security-definer-functie) mag dit
-- veld zetten, een ingelogde gebruiker nooit.
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
    -- Een nieuw account start ALTIJD als proef; we negeren wat de browser
    -- meestuurt (een gewone opslagactie stuurt deze velden niet mee).
    new.abon_plan          := null;
    new.abon_vorm          := null;
    new.abon_status        := 'proef';
    new.proef_eindigt      := now() + interval '7 days';
    new.periode_eindigt    := null;
    new.start_tool         := null;
    new.start_tool_sinds   := null;
    new.mollie_customer_id := null;
    new.mollie_payment_id  := null;
    new.mollie_verleng_payment_id := null;
    new.beta_eigen_format  := false;
    new.ref_code           := null;  -- die deelt de database uit (wijs_ref_code)
    new.verwezen_door      := null;  -- die legt wijs_koppel_verwijzing vast
    new.proef_herinnering_op := null;
    return new;
  end if;

  if new.abon_plan          is distinct from old.abon_plan
  or new.abon_vorm          is distinct from old.abon_vorm
  or new.abon_status        is distinct from old.abon_status
  or new.proef_eindigt      is distinct from old.proef_eindigt
  or new.periode_eindigt    is distinct from old.periode_eindigt
  or new.start_tool         is distinct from old.start_tool
  or new.start_tool_sinds   is distinct from old.start_tool_sinds
  or new.mollie_customer_id is distinct from old.mollie_customer_id
  or new.mollie_payment_id  is distinct from old.mollie_payment_id
  or new.mollie_verleng_payment_id is distinct from old.mollie_verleng_payment_id
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

commit;
