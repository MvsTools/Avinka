-- ============================================================================
-- Uitgelogde bezoekers buiten de databasefuncties zetten
-- ----------------------------------------------------------------------------
-- HET PROBLEEM
-- `grant execute on function ... to authenticated` sluit `anon` NIET buiten.
-- PostgreSQL geeft EXECUTE op een nieuwe functie standaard aan PUBLIC, en anon
-- valt onder PUBLIC. Die standaardregel is te herkennen aan de `=X/postgres`
-- vooraan de rechtenlijst: de lege naam vóór het =-teken is PUBLIC.
-- Gemeten op 4-8-2026: van de 29 functies stonden er 22 open voor anon.
--
-- WAT DIT WEL EN NIET IS
-- De meeste van deze functies controleren zelf wie er belt (wijs_admin_*
-- geeft null terug als je geen admin bent). Dit is dus geen open deur, maar
-- een tweede slot op een deur die al op slot zit. Twee functies hadden dat
-- eigen slot NIET: wijs_aantal_verwijzingen en wijs_snapshot_abon.
--
-- WAAROM DIT VEILIG IS VOOR INGELOGDE GEBRUIKERS
-- Nagemeten in pg_proc.proacl: elke functie hieronder heeft een EIGEN regel
-- `authenticated=X`. Het recht van PUBLIC weghalen raakt die eigen regel niet.
-- De drie triggerfuncties onderaan hebben helemaal geen rechtenregel, maar een
-- trigger vraagt niet om EXECUTE-recht van degene die de rij wijzigt: die
-- blijven dus gewoon werken.
--
-- WAT BEWUST OPEN BLIJFT (niet aanpassen)
--   avinka_landing_cijfers()  de cijfers op de voorpagina. Wordt opgehaald met
--                             de publieke sleutel zonder sessie (lib/cijfers.ts).
--                             Staat al goed: public is er al af, anon heeft een
--                             eigen recht. Dit is het model voor de rest.
--   gedeeld_draaiboek(text)   een gedeeld draaiboek moet zonder account te
--                             openen zijn. Anon houdt hier zijn EIGEN recht;
--                             alleen de slordige PUBLIC-regel gaat eraf.
-- ============================================================================

begin;

-- ── 1. De adminfuncties ─────────────────────────────────────────────────────
-- Deze controleren allemaal zelf op wijs_is_admin(). Toch dicht: een uitgelogde
-- bezoeker hoort ze niet eens te kunnen aanroepen.
revoke execute on function public.wijs_admin_overzicht() from public, anon;
revoke execute on function public.wijs_admin_conversie() from public, anon;
revoke execute on function public.wijs_admin_groei(integer) from public, anon;
revoke execute on function public.wijs_admin_snapshots(integer) from public, anon;
revoke execute on function public.wijs_admin_tijdwinst(integer) from public, anon;
revoke execute on function public.wijs_admin_verbruik(integer) from public, anon;
revoke execute on function public.wijs_admin_verbruik_tijd(integer) from public, anon;
revoke execute on function public.wijs_admin_feedback(integer) from public, anon;
revoke execute on function public.wijs_admin_feedback_status(uuid, text) from public, anon;
revoke execute on function public.wijs_admin_beta_eigen_format_lijst() from public, anon;
revoke execute on function public.wijs_admin_zet_beta_eigen_format(text, boolean) from public, anon;

-- wijs_is_admin() zelf. Nagekeken: de enige RLS-regel die hem aanroept staat op
-- bouw_taken, en anon heeft daar geen SELECT-recht, dus die regel wordt voor
-- een uitgelogde bezoeker nooit uitgerekend. Dit breekt dus niets.
revoke execute on function public.wijs_is_admin() from public, anon;

-- ── 2. Zonder eigen slot: hier zat de echte winst ───────────────────────────
-- Deze twee controleren NIET wie er belt.
revoke execute on function public.wijs_aantal_verwijzingen(text) from public, anon;
revoke execute on function public.wijs_aantal_verwijzingen_proef(text) from public, anon;
revoke execute on function public.wijs_snapshot_abon() from public, anon;

-- ── 3. Alleen zinvol mét account ────────────────────────────────────────────
revoke execute on function public.wijs_community_stats() from public, anon;
revoke execute on function public.registreer_herakkoord(text, text) from public, anon;

-- ── 4. Triggerfuncties: horen nooit met de hand aangeroepen te worden ───────
-- Blijven werken; een trigger vraagt niet om EXECUTE-recht van de gebruiker.
revoke execute on function public.registreer_toestemming() from public, anon;
revoke execute on function public.set_updated_at() from public, anon;
revoke execute on function public.rls_auto_enable() from public, anon;

-- ── 5. Blijft open, maar netjes ─────────────────────────────────────────────
-- Anon houdt zijn eigen recht (de deellink moet uitgelogd werken); alleen de
-- brede PUBLIC-regel gaat eraf, zodat het recht een bewuste keuze is en geen
-- restant van een standaardinstelling.
revoke execute on function public.gedeeld_draaiboek(text) from public;

commit;

-- ============================================================================
-- CONTROLE ACHTERAF: hier hoort alleen avinka_landing_cijfers en
-- gedeeld_draaiboek uit te komen. Staat er iets anders bij, dan is dat een
-- functie die na 4-8-2026 is toegevoegd en dezelfde behandeling nodig heeft.
-- ============================================================================
-- select p.proname, pg_get_function_identity_arguments(p.oid) as args
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE')
-- order by p.proname;
