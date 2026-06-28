@echo off
setlocal
REM ============================================================
REM  start-werkplek.bat <letter>
REM  Opent twee vensters voor deze werkplek:
REM   - de Next dev-server op de juiste poort
REM   - Claude Code in de worktree-map
REM ============================================================

set "ROOT=C:\dev\wijs-werk"

set "LETTER=%~1"
if "%LETTER%"=="" set /p "LETTER=Welke werkplek starten (a/b/c)? "
if "%LETTER%"=="" ( echo Geen letter opgegeven. & pause & exit /b 1 )

set "PORT="
if /i "%LETTER%"=="a" set "PORT=3000"
if /i "%LETTER%"=="b" set "PORT=3001"
if /i "%LETTER%"=="c" set "PORT=3002"
if "%PORT%"=="" ( echo Onbekende letter "%LETTER%". Gebruik a, b of c. & pause & exit /b 1 )

set "WT=%ROOT%\%LETTER%"
if not exist "%WT%" ( echo Werkplek %LETTER% bestaat nog niet. Maak hem eerst met nieuwe-worktree.bat %LETTER%. & pause & exit /b 1 )

echo Werkplek %LETTER% starten op poort %PORT% ...

start "wijs-dev-%LETTER% (poort %PORT%)" cmd /k "cd /d %WT% && set NODE_OPTIONS=--use-system-ca && npx next dev -p %PORT%"
start "claude-%LETTER%" cmd /k "cd /d %WT% && claude"

endlocal
