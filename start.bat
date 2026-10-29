@echo off
setlocal
title CampusConnect Placement System

echo =======================================================
echo    CampusConnect - Starting College Placement System
echo =======================================================
echo.
echo Mode: DEMO MODE (In-memory PL/SQL Logic Engine)
echo Backend will run at:  http://localhost:5000
echo Frontend will run at: http://localhost:5173
echo.
echo Launching services...
echo (Press Ctrl+C in this window anytime to stop both services)
echo.

:: Launch browser after 3 seconds in the background
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

:: Run the unified Node runner
node run-dev.js

pause
