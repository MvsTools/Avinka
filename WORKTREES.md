# Met 2 (of 3) Claude Codes tegelijk werken

Deze opzet laat je meerdere Claude Codes naast elkaar aan het platform werken
zonder dat ze elkaars bestanden overschrijven. Elke Claude werkt in een eigen
*worktree*: een aparte map met een eigen branch, maar dezelfde git-geschiedenis.

## De vloot

```
C:\dev\wijs-platform     main      integratie + merge-thuis (hier bouw je niet direct)
C:\dev\wijs-werk\a       werk/a    poort 3000
C:\dev\wijs-werk\b       werk/b    poort 3001
C:\dev\wijs-werk\c       werk/c    poort 3002  (optioneel, later)
```

## Eenmalig opzetten

Draai per werkplek (dubbelklik of vanaf de terminal):

```
scripts\nieuwe-worktree.bat a
scripts\nieuwe-worktree.bat b
```

Dat maakt de worktree, koppelt je `.env.local` (hardlink, dus sleutels beheer
je op een plek) en je geheugen (junction naar de gedeelde bron), en draait
`npm install`. Geen admin-rechten nodig.

## Dagelijks starten

```
scripts\start-werkplek.bat a
scripts\start-werkplek.bat b
```

Elke werkplek opent twee vensters: de dev-server op de eigen poort, en Claude
Code in de juiste map. Tip: je hoeft niet alle dev-servers tegelijk te laten
draaien. Laat alleen die van de werkplek aan die je nu test, dat scheelt
geheugen.

## Werkafspraken (belangrijker dan de techniek)

Worktrees voorkomen botsingen technisch, maar je wilt geen merge-rommel.
Daarom:

1. **Verdeel per gebied, niet per bestand.** Bijvoorbeeld: a = nieuwe tool,
   b = bugfixes en UI-polish. Zo raken twee Claudes nooit hetzelfde aan.
2. **Gedeelde hotspots via een werkplek.** Bestanden die bijna elke tool
   aanraakt (de dashboard-registratiepunten en `public/avinka-leerlijnen.js`)
   bewerk je telkens vanuit dezelfde worktree.
3. **Vaak terug naar main mergen.** Klein en regelmatig samenvoegen geeft
   weinig conflicten. Lang apart bouwen geeft veel.

## Werk samenvoegen

Vanuit de hoofdmap `C:\dev\wijs-platform`:

```
git merge werk/a
git merge werk/b
```

De worktrees blijven gewoon staan voor de volgende klus. De branch loopt door
op de laatste stand.

## Goed om te weten

- **Database**: alle werkplekken praten met dezelfde Supabase. Geen probleem in
  deze opzet, want SQL upload je zelf handmatig. Claude raakt de database niet
  aan.
- **`.env.local`**: gekoppeld als hardlink. Als je je sleutels wijzigt, kloppen
  ze meteen overal. Mocht een editor de link ooit verbreken (sommige editors
  doen "opslaan = nieuw bestand"), draai dan `nieuwe-worktree.bat` opnieuw of
  herstel de hardlink met `mklink /H`.
- **Geheugen**: alle werkplekken delen hetzelfde geheugen en dezelfde
  takenlijst, gekoppeld aan de bestaande bron.
- **Een werkplek weghalen**: `git worktree remove C:\dev\wijs-werk\a` vanuit de
  hoofdmap.
