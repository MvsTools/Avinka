-- ════════════════════════════════════════════════════════════════════════
-- COLLEGA'S BIJ DEZE GROEP — van "paar" naar "groep" (3-8-2026)
-- ════════════════════════════════════════════════════════════════════════
-- Draai dit in één keer. Bestaande gegevens blijven behouden: de ene
-- koppeling, taak en overdracht die er staan verhuizen mee naar hun klas.
--
-- Wat er verandert:
--   * een collega krijgt een ROL ('volledig' of 'meekijken')
--   * je kunt meerdere uitnodigingen tegelijk laten openstaan
--   * gedeelde taken, overdracht en de gedeelde map hangen aan de KLAS,
--     niet meer aan een koppeling (anders zien drie collega's van dezelfde
--     groep elkaars taken niet)

-- ── A) Oude policies eerst weg ──────────────────────────────────────────
-- Postgres weigert een kolom te verwijderen zolang een policy 'm gebruikt.
drop policy if exists "duo taken voor het koppel" on public.duo_taken;
drop policy if exists "duo overdracht voor het koppel" on public.duo_overdracht;
drop policy if exists "duo-partner bestanden" on public.bestanden;
drop policy if exists "duo-partner klas" on public.klassen;
drop policy if exists "duo-partner rapporten" on public.rapporten;

-- ── B) Kolommen omzetten (mét behoud van wat er staat) ──────────────────
alter table public.duo_koppels add column if not exists rol text not null default 'volledig';

-- Meerdere openstaande uitnodigingen mogelijk maken. De oude index telde een
-- openstaande uitnodiging als (jij, jij, klas) — least/greatest negeren NULL —
-- waardoor er maar één tegelijk kon openstaan.
drop index if exists idx_duo_koppels_paar;
create unique index if not exists idx_duo_koppels_lid
  on public.duo_koppels (least(gebruiker_a, gebruiker_b), greatest(gebruiker_a, gebruiker_b), klas_id)
  where gebruiker_b is not null;

-- De gedeelde map verhuist naar de klas.
alter table public.klassen add column if not exists gedeelde_map_id uuid
  references public.bestanden(id) on delete set null;
update public.klassen k
   set gedeelde_map_id = dk.gedeelde_map_id
  from public.duo_koppels dk
 where dk.klas_id = k.id and dk.gedeelde_map_id is not null and k.gedeelde_map_id is null;
alter table public.duo_koppels drop column if exists gedeelde_map_id;

-- Gedeelde taken verhuizen naar de klas.
alter table public.duo_taken add column if not exists klas_id uuid
  references public.klassen(id) on delete cascade;
update public.duo_taken t
   set klas_id = dk.klas_id
  from public.duo_koppels dk
 where dk.id = t.duo_koppel_id and t.klas_id is null;
delete from public.duo_taken where klas_id is null; -- alleen weesrijen zonder koppel
alter table public.duo_taken alter column klas_id set not null;
alter table public.duo_taken drop column if exists duo_koppel_id;
drop index if exists idx_duo_taken_koppel;
create index if not exists idx_duo_taken_klas on public.duo_taken(klas_id);

-- Overdracht verhuist naar de klas: één briefje per groep.
alter table public.duo_overdracht add column if not exists klas_id uuid
  references public.klassen(id) on delete cascade;
update public.duo_overdracht o
   set klas_id = dk.klas_id
  from public.duo_koppels dk
 where dk.id = o.duo_koppel_id and o.klas_id is null;
delete from public.duo_overdracht where klas_id is null;
-- Twee koppels op dezelfde klas zouden nu op één rij uitkomen: nieuwste wint.
delete from public.duo_overdracht a
 using public.duo_overdracht b
 where a.klas_id = b.klas_id and a.bijgewerkt < b.bijgewerkt;
alter table public.duo_overdracht drop constraint if exists duo_overdracht_pkey;
alter table public.duo_overdracht drop column if exists duo_koppel_id;
alter table public.duo_overdracht alter column klas_id set not null;

-- Eén briefje PER PERSOON per groep, zodat je ziet wie wat schreef. Geen
-- gesprek: schrijf je opnieuw, dan vervangt dat je eigen vorige briefje.
delete from public.duo_overdracht where auteur is null; -- kan niet meer bij een naam horen
alter table public.duo_overdracht drop constraint if exists duo_overdracht_auteur_fkey;
alter table public.duo_overdracht alter column auteur set not null;
alter table public.duo_overdracht add constraint duo_overdracht_auteur_fkey
  foreign key (auteur) references auth.users(id) on delete cascade;
alter table public.duo_overdracht add primary key (klas_id, auteur);

-- ── C) Functies ─────────────────────────────────────────────────────────
-- Hoor ik bij deze groep? (eigenaar of gekoppelde collega, welke rol dan ook)
create or replace function public.klas_toegang(p_klas uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.klassen k where k.id = p_klas and k.user_id = auth.uid())
      or exists (
        select 1 from public.duo_koppels dk
        where dk.klas_id = p_klas and dk.status = 'actief' and dk.gebruiker_b = auth.uid()
      );
$$;
grant execute on function public.klas_toegang(uuid) to authenticated;
revoke execute on function public.klas_toegang(uuid) from public, anon;

-- Mag ik ALLES van deze groep? Hier ligt de grens waar rapporten achter liggen.
create or replace function public.klas_toegang_volledig(p_klas uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.klassen k where k.id = p_klas and k.user_id = auth.uid())
      or exists (
        select 1 from public.duo_koppels dk
        where dk.klas_id = p_klas and dk.status = 'actief'
          and dk.gebruiker_b = auth.uid() and dk.rol = 'volledig'
      );
$$;
grant execute on function public.klas_toegang_volledig(uuid) to authenticated;
revoke execute on function public.klas_toegang_volledig(uuid) from public, anon;

-- Wie hoort er bij deze groep, mét naam en mailadres.
create or replace function public.klas_collegas(p_klas uuid)
returns table (user_id uuid, voornaam text, email text, rol text, is_eigenaar boolean)
language sql stable security definer set search_path = public as $$
  select u.id, coalesce(u.raw_user_meta_data ->> 'first_name', ''), u.email::text, 'volledig', true
  from public.klassen k
  join auth.users u on u.id = k.user_id
  where k.id = p_klas and public.klas_toegang(p_klas)
  union all
  select u.id, coalesce(u.raw_user_meta_data ->> 'first_name', ''), u.email::text, dk.rol, false
  from public.duo_koppels dk
  join auth.users u on u.id = dk.gebruiker_b
  where dk.klas_id = p_klas and dk.status = 'actief' and public.klas_toegang(p_klas);
$$;
grant execute on function public.klas_collegas(uuid) to authenticated;
revoke execute on function public.klas_collegas(uuid) from public, anon;

-- Hoorden bij het oude paar-model.
drop function if exists public.duo_partner(uuid);
drop function if exists public.is_duo_partner(uuid);

-- ── D) Nieuwe policies ──────────────────────────────────────────────────
create policy "duo-partner klas" on public.klassen
  for all using (public.klas_toegang_volledig(klassen.id))
  with check (public.klas_toegang_volledig(klassen.id));

drop policy if exists "meekijkende collega klas" on public.klassen;
create policy "meekijkende collega klas" on public.klassen
  for select using (public.klas_toegang(klassen.id));

create policy "duo-partner rapporten" on public.rapporten
  for all using (klas_id is not null and public.klas_toegang_volledig(rapporten.klas_id))
  with check (klas_id is not null and public.klas_toegang_volledig(rapporten.klas_id));

create policy "duo-partner bestanden" on public.bestanden
  for all using (
    exists (
      select 1 from public.klassen k
      where k.gedeelde_map_id is not null
        and public.klas_toegang(k.id)
        and public.binnen_gedeelde_map(bestanden.id, k.gedeelde_map_id)
    )
  )
  with check (
    exists (
      select 1 from public.klassen k
      where k.gedeelde_map_id is not null
        and public.klas_toegang(k.id)
        and public.binnen_gedeelde_map(bestanden.id, k.gedeelde_map_id)
    )
  );

drop policy if exists "duo taken voor de groep" on public.duo_taken;
create policy "duo taken voor de groep" on public.duo_taken
  for all using (public.klas_toegang(duo_taken.klas_id))
  with check (public.klas_toegang(duo_taken.klas_id));

-- Lezen doet iedereen bij de groep; schrijven alleen in je eigen briefje —
-- bij een naam eronder moet je erop kunnen vertrouwen dat die klopt.
drop policy if exists "duo overdracht voor de groep" on public.duo_overdracht;
drop policy if exists "overdracht van de groep lezen" on public.duo_overdracht;
create policy "overdracht van de groep lezen" on public.duo_overdracht
  for select using (public.klas_toegang(duo_overdracht.klas_id));
drop policy if exists "eigen overdracht schrijven" on public.duo_overdracht;
create policy "eigen overdracht schrijven" on public.duo_overdracht
  for all using (auteur = auth.uid() and public.klas_toegang(duo_overdracht.klas_id))
  with check (auteur = auth.uid() and public.klas_toegang(duo_overdracht.klas_id));

-- Leesstand van de overdracht (voor de teller op Start). In de database en niet
-- in de browser: lees je het op je telefoon, dan hoort het op je laptop ook
-- gelezen te zijn.
create table if not exists public.duo_overdracht_gelezen (
  klas_id    uuid not null references public.klassen(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  gelezen_op timestamptz not null default now(),
  primary key (klas_id, user_id)
);
alter table public.duo_overdracht_gelezen enable row level security;
drop policy if exists "eigen leesstand" on public.duo_overdracht_gelezen;
create policy "eigen leesstand" on public.duo_overdracht_gelezen
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.duo_overdracht_gelezen to authenticated;

-- ⚠️ Bijwerken van een koppeling mag alleen de eigenaar van de klas. Anders
-- kan een meekijkende collega zijn eigen rol op 'volledig' zetten en zo alsnog
-- bij de rapporten. Loskoppelen (delete) mogen ze allebei.
drop policy if exists "eigen duo koppel bijwerken" on public.duo_koppels;
create policy "eigen duo koppel bijwerken" on public.duo_koppels
  for update using (auth.uid() = gebruiker_a)
  with check (auth.uid() = gebruiker_a);
