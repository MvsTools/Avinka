-- ============================================================================
-- MEEKIJKEN WORDT ECHT MEEKIJKEN (8-8-2026)
-- ----------------------------------------------------------------------------
-- Tot nu toe was de rol `meekijken` "alles behalve rapporten": een meekijker
-- kon taken aanmaken en afvinken, een bericht in de overdracht schrijven, en
-- bestanden in de gedeelde map aanmaken, wijzigen en verwijderen. Dat was een
-- bewuste keuze (3-8) toen de rol bedoeld was voor een onderwijsassistent.
--
-- ⚖️ BESLUIT VAN DE EIGENAAR (8-8): een meekijker is eerder een directeur of
-- IB'er, en het woord "meekijken" belooft nul rechten. De rol doet nu wat de
-- naam zegt: ALLES VAN DE GROEP LEZEN, NIETS SCHRIJVEN.
--
-- 🔑 Alle drie de policies hieronder hingen aan `klas_toegang` — en die vraagt
-- alleen "hoor je bij deze groep", niet "welke rol heb je". Daar zat het gat.
-- Lezen blijft `klas_toegang`, schrijven wordt `klas_toegang_volledig`.
--
-- ⚠️ GEVOLG DAT HIERBIJ HOORT: er is hierna geen rol meer voor iemand die wél
-- mag meewerken maar geen rapporten mag schrijven (de onderwijsassistent). Die
-- kan alleen 'volledig' of 'meekijken' krijgen. Bewust: rolprofielen per beroep
-- horen bij de schoollicentie (najaar), niet bij een los account.
--
-- ⚠️ WAT DIT NIET DICHTZET: een meekijker kan nog steeds een EIGEN bestand in
-- de gedeelde map zetten. Niet via de policy hieronder, maar via "eigen
-- bestanden" (auth.uid() = user_id), en permissieve policies tellen bij elkaar
-- op. Dichtzetten vraagt een restrictive policy over de hele bestandentabel;
-- dat raakt élke upload van iedereen en is het risico nu niet waard. Wat hier
-- wél dichtgaat is het gevaarlijke deel: andermans bestanden wijzigen of
-- verwijderen.
-- ============================================================================

-- ── 1. Gedeelde takenlijst ──────────────────────────────────────────────────
drop policy if exists "duo taken voor de groep" on public.duo_taken;
drop policy if exists "duo taken van de groep lezen" on public.duo_taken;
create policy "duo taken van de groep lezen" on public.duo_taken
  for select using (public.klas_toegang(duo_taken.klas_id));
drop policy if exists "duo taken van de groep schrijven" on public.duo_taken;
create policy "duo taken van de groep schrijven" on public.duo_taken
  for all using (public.klas_toegang_volledig(duo_taken.klas_id))
  with check (public.klas_toegang_volledig(duo_taken.klas_id));

-- ── 2. Overdracht ───────────────────────────────────────────────────────────
-- Lezen stond al goed (iedereen bij de groep). Schrijven bleef in je eigen
-- briefje, maar mocht ook als meekijker; dat wordt nu volledige toegang.
drop policy if exists "eigen overdracht schrijven" on public.duo_overdracht;
create policy "eigen overdracht schrijven" on public.duo_overdracht
  for all using (
    auteur = auth.uid() and public.klas_toegang_volledig(duo_overdracht.klas_id)
  )
  with check (
    auteur = auth.uid() and public.klas_toegang_volledig(duo_overdracht.klas_id)
  );

-- ── 3. Bestanden in de gedeelde map ─────────────────────────────────────────
drop policy if exists "duo-partner bestanden" on public.bestanden;
drop policy if exists "gedeelde map lezen" on public.bestanden;
create policy "gedeelde map lezen" on public.bestanden
  for select using (
    exists (
      select 1 from public.klassen k
      where k.gedeelde_map_id is not null
        and public.klas_toegang(k.id)
        and public.binnen_gedeelde_map(bestanden.id, k.gedeelde_map_id)
    )
  );
drop policy if exists "gedeelde map beheren" on public.bestanden;
create policy "gedeelde map beheren" on public.bestanden
  for all using (
    exists (
      select 1 from public.klassen k
      where k.gedeelde_map_id is not null
        and public.klas_toegang_volledig(k.id)
        and public.binnen_gedeelde_map(bestanden.id, k.gedeelde_map_id)
    )
  )
  with check (
    exists (
      select 1 from public.klassen k
      where k.gedeelde_map_id is not null
        and public.klas_toegang_volledig(k.id)
        and public.binnen_gedeelde_map(bestanden.id, k.gedeelde_map_id)
    )
  );

-- ============================================================================
-- VERVOLG, ZELFDE AVOND: DE ROLKEUZE GAAT UIT HET SCHERM
-- ----------------------------------------------------------------------------
-- ⚖️ Besluit eigenaar 8-8-2026, na de vraag of een rol wel bij dit platform
-- past. Voor nu niet: er is één echte situatie, twee leerkrachten die samen één
-- groep draaien. Uitnodigen maakt altijd 'volledig'.
--
-- ⚠️ De kolom en de policies hierboven BLIJVEN staan. Ze zijn correct en kosten
-- niets; bij de schoollicentie wordt de keuze weer aangezet.
--
-- Bestaande meekijk-koppels omzetten, anders hangen ze voorgoed in een rol die
-- nergens meer te wijzigen is. Het was er precies één (een testkoppeling).
update public.duo_koppels set rol = 'volledig' where rol <> 'volledig';
alter table public.duo_koppels alter column rol set default 'volledig';
