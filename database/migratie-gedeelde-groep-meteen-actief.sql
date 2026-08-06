-- ============================================================================
-- Accepteren zet de gedeelde groep meteen als je actieve klas
-- ----------------------------------------------------------------------------
-- HET GAT
-- Je accepteert een uitnodiging voor Groep 7, en daarna staat Groep 7 nog
-- steeds niet aan. De tools blijven naar je eigen klas kijken, dus je ziet
-- niets van de groep waar je net bent bijgekomen en je moet zelf bedenken dat
-- je naar Mijn klas moet om te wisselen. Dezelfde soort verstopte stap als de
-- uitnodiging die onderaan de instellingenpagina stond.
--
-- ⚠️ WAAROM NIET ALTIJD
-- Een leerkracht die zelf een groep draait wil niet ineens naar de klas van
-- een ander kijken, alleen omdat hij een uitnodiging aannam. De omschakeling
-- gebeurt daarom alleen als je zelf nog geen klas met leerlingen hebt — dat is
-- precies de onderwijsassistent of ondersteuner voor wie de gedeelde groep de
-- enige groep is.
--
-- Wie wél een eigen klas heeft, krijgt in het scherm een zin te zien waar hij
-- kan wisselen. Niet stilzwijgend niets doen.
-- ============================================================================

begin;

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
  returning id, gebruiker_a, klas_id
       into gevonden_id, uitnodiger, gedeelde_klas;

  if gevonden_id is null then
    return null;
  end if;

  -- School en groep overnemen. NOOIT overschrijven wat de nieuwe collega zelf
  -- al heeft ingevuld: alleen lege velden worden gevuld.
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
  -- vanaf nu jouw actieve klas. Een lege klas telt niet: die maakt het
  -- platform zelf aan bij het aanmelden.
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
