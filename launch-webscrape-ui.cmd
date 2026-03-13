@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js belum dijumpai. Sila install Node.js dahulu.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo Gagal install dependencies.
    pause
    exit /b 1
  )
)

start "" http://localhost:4173
call npm run app
if errorlevel 1 (
  echo.
  echo Kalau browser dah terbuka, kemungkinan app memang sudah berjalan pada http://localhost:4173
  pause
)
