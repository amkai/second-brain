@echo off
title Second Brain
cd /d "%~dp0\.."
echo Starting Second Brain...
echo Client: http://localhost:5173
echo Server: http://localhost:3001
echo.
echo Press Ctrl+C to stop.
echo.
call npm run dev
pause
