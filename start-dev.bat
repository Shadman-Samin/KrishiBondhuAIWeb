@echo off
setlocal EnableExtensions
title KrishiBondhu Launcher

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%KrishiBondhuVision"
set "FRONTEND_DIR=%ROOT%KrishiBondhuWeb"
set "BACKEND_PORT=8000"
set "APP_PORT=8001"
set "HEALTH_URL=http://localhost:%BACKEND_PORT%/health"
set "TUNNEL_URL=https://surgery-glowworm-lumpish.ngrok-free.dev"
set "INSPECTOR_URL=http://localhost:4040"

echo ============================================
echo  KrishiBondhu - Public Server Start
echo ============================================
echo.

echo [1/3] Stopping running servers on ports %BACKEND_PORT% / %APP_PORT% ...
for %%P in (%BACKEND_PORT% %APP_PORT% 8080) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":%%P "') do (
    echo   Port %%P - killing PID %%a
    taskkill /F /PID %%a >nul 2>&1
  )
)
echo   Stopping tunnel...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":4040 "') do (
  taskkill /F /PID %%a >nul 2>&1
)
taskkill /F /IM ngrok.exe >nul 2>&1
ping -n 3 127.0.0.1 >nul

echo.
echo [2/3] Building website (bun run build) ...
pushd "%FRONTEND_DIR%"
call bun run build
set "BUILD_OK=%errorlevel%"
popd
if not "%BUILD_OK%"=="0" (
  echo   Build FAILED - fix errors before starting.
  pause
  exit /b 1
)

echo.
echo [3/3] Starting servers ...
where wt >nul 2>&1
if %errorlevel%==0 (
  start "" wt -w 0 nt -d "%FRONTEND_DIR%" cmd /k "node serve.mjs" ; nt -d "%BACKEND_DIR%" cmd /k ".venv\Scripts\python.exe -m uvicorn api.server:app --host 127.0.0.1 --port %BACKEND_PORT%" ; nt -d "%BACKEND_DIR%" cmd /k "ngrok http %BACKEND_PORT% --domain=surgery-glowworm-lumpish.ngrok-free.dev"
) else (
  start "KrishiBondhu App" cmd /k "cd /d %FRONTEND_DIR% && node serve.mjs"
  start "KrishiBondhu Backend" cmd /k "cd /d %BACKEND_DIR% && .venv\Scripts\python.exe -m uvicorn api.server:app --host 127.0.0.1 --port %BACKEND_PORT%"
  start "KrishiBondhu Tunnel" cmd /k "cd /d %BACKEND_DIR% && ngrok http %BACKEND_PORT% --domain=surgery-glowworm-lumpish.ngrok-free.dev"
)

echo.
echo Waiting for backend (%HEALTH_URL%) ...
curl -s -o nul --retry 25 --retry-delay 1 --retry-connrefused %HEALTH_URL%
if %errorlevel%==0 (
  start "" %TUNNEL_URL%
  echo   Backend is up - browser opened to public site.
) else (
  echo   Backend did not respond - check the Backend tab for errors.
)

echo.
echo  NOTE: LM Studio (model at 127.0.0.1:1234) must be running
echo        for the AI Advisor chat to work.
echo  Public URL: %TUNNEL_URL%  (works anywhere, no key needed)
echo  ngrok inspector: %INSPECTOR_URL%
echo  Stack: production SSR app (node serve.mjs :%APP_PORT%) -^>
echo         FastAPI :%BACKEND_PORT% (API + static + HTML proxy) -^> ngrok.
echo  Rebuild is automatic - changes go live after running this again.
echo  Close the terminal window (or press Ctrl+C per tab) to stop.
echo.
echo  Done.
