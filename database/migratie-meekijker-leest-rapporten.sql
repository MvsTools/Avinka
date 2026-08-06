-- ============================================================================
-- Een meekijkende collega mag rapporten LEZEN, maar niet schrijven
-- ----------------------------------------------------------------------------
-- BESLISSING VAN DE EIGENAAR (4-8). Tot nu toe betekende de rol 'meekijken'
-- bij rapporten: helemaal niets, ook niet lezen. Dat bleek onhandig: een
-- onderwijsassistent die met de groep meedraait moet kunnen weten wat er over
-- een kind geschreven is, ook al schrijft hij het zelf niet.
--
-- WAT ER VERANDERT
-- De ene policy "duo-partner rapporten" (for all, volledige toegang) wordt
-- gesplitst in twee: lezen mag iedereen die bij de groep hoort, schrijven
-- alleen wie medeverantwoordelijk is.
--
-- ⚠️ WAAROM DE CONTROLE IN /api/rapporten NU ECHT NODIG IS
-- Door het leesrecht vindt de zoekopdracht "bestaat er al een rapport voor dit
-- kind in deze klas" voortaan ook bij een meekijker een rij. De update die
-- daarop volgt raakt dan nul rijen, en dat geeft in Supabase GEEN foutmelding.
-- Zonder de 403-controle in de route zou opslaan er dus uitzien alsof het
-- lukte terwijl er niets gebeurde. Die controle is daarmee van "netter" naar
-- "noodzakelijk" gegaan; niet weghalen.
-- ============================================================================

begin;

drop policy if exists "duo-partner rapporten" on public.rapporten;

-- Lezen: iedereen die bij de groep hoort, dus ook wie alleen meekijkt.
drop policy if exists "duo-partner rapporten lezen" on public.rapporten;
create policy "duo-partner rapporten lezen" on public.rapporten
  for select using (
    klas_id is not null and public.klas_toegang(rapporten.klas_id)
  );

-- Schrijven, wijzigen en weggooien: alleen met volledige toegang. Rapporten
-- zijn geschreven oordelen over kinderen; die legt vast wie er ook
-- verantwoordelijk voor is.
drop policy if exists "duo-partner rapporten schrijven" on public.rapporten;
create policy "duo-partner rapporten schrijven" on public.rapporten
  for all using (
    klas_id is not null and public.klas_toegang_volledig(rapporten.klas_id)
  )
  with check (
    klas_id is not null and public.klas_toegang_volledig(rapporten.klas_id)
  );

commit;

-- ============================================================================
-- CONTROLE: hier horen nu drie regels op rapporten te staan —
-- "eigen rapporten", "duo-partner rapporten lezen" en
-- "duo-partner rapporten schrijven".
-- ============================================================================
-- select policyname, cmd from pg_policies
-- where schemaname='public' and tablename='rapporten' order by policyname;
