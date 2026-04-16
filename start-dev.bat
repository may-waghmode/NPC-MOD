@echo off
echo ========================================
echo   NPC Mode - Starting Dev Servers
echo ========================================
echo.

:: Start backend in a new window
echo [1/2] Starting Backend (port 3000)...
start "NPC-Backend" cmd /k "cd /d %~dp0backend && npm run dev"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak > nul

:: Start frontend in a new window
echo [2/2] Starting Frontend (port 5173)...
start "NPC-Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   Both servers starting!
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:5173
echo   Health:   http://localhost:3000/api/health
echo ========================================
echo.
echo Press any key to close this launcher...
pause > nul
