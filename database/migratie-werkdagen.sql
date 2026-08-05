-- ══════════════════════════════════════════════════════════════════════════
--  OP WELKE DAGEN STA JIJ VOOR DE KLAS?  (2026-08-05)
--  Eén keer draaien. Veilig om opnieuw te draaien.
-- ══════════════════════════════════════════════════════════════════════════
--
--  WAAROM
--  Parttime werken is in het basisonderwijs eerder regel dan uitzondering —
--  het platform heeft niet voor niets een duo-functie. Toch gingen we er tot
--  nu toe van uit dat iedereen elke dag werkt. Een taak die op je vrije
--  woensdag afloopt help je niet; die zie je pas als het te laat is.
--
--  Weten we je werkdagen, dan zet Avinka een voorgestelde taak op je laatste
--  werkdag vóór de datum, in plaats van op de dag zelf.
--
--  VORM: een tekst met dagcijfers, 0 = maandag t/m 4 = vrijdag.
--    ''      = niet gezegd → we rekenen met alle vijf de schooldagen
--    '0134'  = maandag, dinsdag, donderdag, vrijdag (woensdag vrij)
--  Bewust geen vijf losse kolommen: dit is één antwoord op één vraag, en zo
--  blijft het uitbreidbaar als er ooit een zesde dag bij komt.

alter table public.instellingen
  add column if not exists werkdagen text not null default '';

-- Alleen de cijfers 0 t/m 4, elk hooguit één keer, in oplopende volgorde. Een
-- tikfout hoort hier te stranden en niet pas in het rooster.
alter table public.instellingen
  drop constraint if exists instellingen_werkdagen_check;
alter table public.instellingen
  add constraint instellingen_werkdagen_check
  check (werkdagen ~ '^(0?1?2?3?4?)$');

-- ── Controle achteraf ─────────────────────────────────────────────────────
--   select werkdagen, count(*) from public.instellingen group by 1;
