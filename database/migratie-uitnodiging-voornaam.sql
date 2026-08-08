-- ============================================================================
-- De duo-uitnodiging persoonlijk maken als we de ontvanger al kennen
-- ----------------------------------------------------------------------------
-- Een uitnodiging gaat naar een e-mailadres. Hoort dat adres al bij een
-- Avinka-account, dan weten we hoe die persoon heet en kan de mail beginnen met
-- "Hallo Marieke,". Zo niet, dan wordt het gewoon "Hallo," — en dat is geen
-- randgeval maar de normale situatie, want je nodigt juist vaak iemand uit die
-- nog geen account heeft.
--
-- ⚠️ DIT IS EEN GEVOELIGE FUNCTIE, ook al ziet hij er onschuldig uit. Wie hem
-- mag aanroepen, kan e-mailadressen intikken en te weten komen (a) of dat adres
-- een Avinka-account heeft en (b) hoe die persoon heet. Dat is precies wat een
-- account-enumeratie is. Daarom:
--   • alleen service_role mag hem aanroepen, NOOIT 'authenticated' of 'anon';
--   • hij wordt alleen server-side aangeroepen, in /api/duo/uitnodigen, waar de
--     uitkomst uitsluitend de aanhef bepaalt van een mail die naar dát adres
--     gaat. De uitnodiger krijgt de uitkomst nooit te zien.
-- Zet hem dus niet open "omdat het handig is in het scherm".
--
-- Ontbreekt de servicesleutel, dan valt de route stil terug op "Hallo," — een
-- persoonlijke aanhef is een extraatje, geen voorwaarde.
-- ============================================================================

begin;

create or replace function public.wijs_voornaam_van_adres(p_email text)
returns text
language sql security definer set search_path = public as $$
  -- Hoofdletterongevoelig vergelijken: Supabase bewaart adressen weliswaar in
  -- kleine letters, maar de aanroeper typt over wat de gebruiker invulde.
  --
  -- ⚠️ Bewust NIET wijs_email_norm(): die haalt punten en +tags weg om één
  -- gratis proef per brievenbus af te dwingen. Hier moet je juist precies het
  -- adres treffen waar de uitnodiging heen gaat, anders groet je iemand met de
  -- naam van zijn buurman.
  select coalesce(u.raw_user_meta_data ->> 'first_name', '')
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
  limit 1;
$$;

revoke execute on function public.wijs_voornaam_van_adres(text) from public, anon, authenticated;
grant  execute on function public.wijs_voornaam_van_adres(text) to service_role;

commit;

-- ============================================================================
-- CONTROLE
-- ============================================================================
-- Kent hij een bestaand adres?
--   select public.wijs_voornaam_van_adres('iemand@school.nl');
-- Een onbekend adres hoort leeg (NULL) terug te geven, geen fout:
--   select public.wijs_voornaam_van_adres('bestaatniet@example.com') is null;
-- En staat hij echt dicht?
--   select has_function_privilege('authenticated',
--            'public.wijs_voornaam_van_adres(text)', 'execute');   -- hoort false
