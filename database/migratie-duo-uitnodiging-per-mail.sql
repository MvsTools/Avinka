-- ============================================================================
-- De duo-uitnodiging per mail
-- ----------------------------------------------------------------------------
-- Tot nu toe maakt de tool een deelbare link die je zelf doorstuurt. Straks
-- typ je het mailadres van je collega in en gaat het bericht automatisch de
-- deur uit.
--
-- ⚠️ DE KERN VAN DEZE MIGRATIE IS NIET DE KOLOM MAAR DE CONTROLE.
-- Bij een link die je zelf doorstuurt bepaal JIJ wie hem krijgt. Zodra je een
-- adres intypt, bepaalt de TYPEFOUT wie hem krijgt. En achter zo'n uitnodiging
-- zitten de voornamen van je leerlingen, hun rapporten en jullie overdracht.
--
-- Daarom: een uitnodiging die per mail is verstuurd, is alleen te accepteren
-- door wie inlogt met precies dát adres. Belandt hij bij de verkeerde persoon,
-- dan kan die er niets mee.
--
-- Een handmatig doorgestuurde link houdt zijn huidige gedrag (leeg veld = wie
-- de code heeft mag accepteren). Dat verschil is bewust; zie docs/plan-mail.md.
-- ============================================================================

begin;

-- Leeg = de oude link-uitnodiging. Bestaande koppels blijven dus werken.
alter table public.duo_koppels
  add column if not exists uitgenodigd_email text;

-- ── Het voorbeeld vertelt of deze uitnodiging bij JOU past ─────────────────
-- Bewust een ja/nee en niet het adres zelf: is de link bij de verkeerde
-- persoon beland, dan hoeft die niet ook nog te weten voor wie hij bedoeld
-- was. Wie de mail kreeg, weet zijn eigen adres al.
drop function if exists public.duo_koppel_voorbeeld(text);

create function public.duo_koppel_voorbeeld(p_code text)
returns table (
  klas_naam           text,
  status              text,
  uitnodiger_voornaam text,
  schoolnaam          text,
  standaardgroep      text,
  past_bij_mij        boolean
)
language sql security definer set search_path = public as $$
  select k.naam,
         dk.status,
         coalesce(u.raw_user_meta_data ->> 'first_name', ''),
         coalesce(i.schoolnaam, ''),
         coalesce(i.standaardgroep, ''),
         (dk.uitgenodigd_email is null
          or lower(dk.uitgenodigd_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
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

-- ── Accepteren: het slot ───────────────────────────────────────────────────
create or replace function public.duo_koppel_accepteren(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  gevonden_id   uuid;
  uitnodiger    uuid;
  gedeelde_klas uuid;
begin
  update public.duo_koppels
  set gebruiker_b = auth.uid(), status = 'actief'
  where code = p_code and status = 'uitgenodigd' and gebruiker_b is null
    and gebruiker_a <> auth.uid() -- niet je eigen uitnodiging accepteren
    -- Hier zit het slot: is er een adres ingevuld, dan moet jouw eigen adres
    -- dat zijn. Staat het veld leeg, dan is het een doorgestuurde link en
    -- geldt de oude regel.
    and (
      uitgenodigd_email is null
      or lower(uitgenodigd_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  returning id, gebruiker_a, klas_id
       into gevonden_id, uitnodiger, gedeelde_klas;

  if gevonden_id is null then
    return null;
  end if;

  -- School en groep overnemen, maar nooit overschrijven wat de nieuwe collega
  -- zelf al heeft ingevuld.
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

  -- Heb je zelf nog geen klas met leerlingen, dan is deze gedeelde groep
  -- vanaf nu jouw actieve klas.
  if not exists (
    select 1 from public.klassen k
    where k.user_id = auth.uid()
      and coalesce(array_length(k.leerlingen, 1), 0) > 0
  ) then
    insert into public.instellingen (user_id, actieve_duo_klas_id)
    values (auth.uid(), gedeelde_klas)
    on conflict (user_id) do update
    set actieve_duo_klas_id = excluded.actieve_duo_klas_id;
  end if;

  return gevonden_id;
end;
$$;

revoke execute on function public.duo_koppel_accepteren(text) from public, anon;
grant  execute on function public.duo_koppel_accepteren(text) to authenticated;

commit;

-- ============================================================================
-- CONTROLE
-- ============================================================================
-- select column_name from information_schema.columns
-- where table_schema='public' and table_name='duo_koppels'
--   and column_name='uitgenodigd_email';
