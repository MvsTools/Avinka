@echo off
setlocal enabledelayedexpansion
REM ============================================================
REM  nieuwe-worktree.bat <letter>
REM  Maakt eenmalig een werk-worktree aan en richt 'm volledig in:
REM   - git worktree + eigen branch werk/<letter>
REM   - .env.local als hardlink (sleutels op een plek beheren)
REM   - geheugen-junction naar de gedeelde bron
REM   - npm install
REM  Geen admin nodig.
REM ============================================================

set "MAIN=C:\dev\wijs-platform"
set "ROOT=C:\dev\wijs-werk"
set "MEMSRC=C:\Users\micha\.claude\projects\C--Users-micha-OneDrive-Desktop-TestWijs\memory"

set "LETTER=%~1"
if "%LETTER%"=="" set /p "LETTER=Welke letter voor deze werkplek (a/b/c)? "
if "%LETTER%"=="" ( echo Geen letter opgegeven. & pause & exit /b 1 )

REM --- poort afleiden uit de letter ---
set "PORT="
if /i "%LETTER%"=="a" set "PORT=3000"
if /i "%LETTER%"=="b" set "PORT=3001"
if /i "%LETTER%"=="c" set "PORT=3002"
if "%PORT%"=="" ( echo Onbekende letter "%LETTER%". Gebruik a, b of c. & pause & exit /b 1 )

set "WT=%ROOT%\%LETTER%"
set "CLPROJ=C:\Users\micha\.claude\projects\C--dev-wijs-werk-%LETTER%"

echo.
echo === Werkplek %LETTER% aanmaken ===
echo     map:    %WT%
echo     branch: werk/%LETTER%
echo     poort:  %PORT%
echo.

if exist "%WT%" ( echo Map %WT% bestaat al. Stoppen. & pause & exit /b 1 )
if not exist "%ROOT%" mkdir "%ROOT%"

cd /d "%MAIN%"
git worktree add "%WT%" -b werk/%LETTER%
if errorlevel 1 ( echo FOUT bij git worktree add. & pause & exit /b 1 )

echo.
echo --- .env.local koppelen (hardlink) ---
if exist "%WT%\.env.local" del "%WT%\.env.local"
mklink /H "%WT%\.env.local" "%MAIN%\.env.local"

echo.
echo --- geheugen koppelen (junction) ---
if not exist "%CLPROJ%" mkdir "%CLPROJ%"
if exist "%CLPROJ%\memory" rmdir "%CLPROJ%\memory" 2>nul
mklink /J "%CLPROJ%\memory" "%MEMSRC%"

echo.
echo --- npm install (kan een paar minuten duren) ---
cd /d "%WT%"
call npm install

echo.
echo === Klaar. Starten met:  start-werkplek.bat %LETTER% ===
pause
endlocal
