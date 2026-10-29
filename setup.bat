@echo off
setlocal
title CampusConnect Setup

echo =======================================================
echo     CampusConnect - College Placement System Setup
echo =======================================================
echo.

:: Check Node.js installation
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please download and install Node.js (v18 or higher recommended) from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
for /f "tokens=*" %%v in ('npm -v') do set NPM_VERSION=%%v

echo Detected Node.js: %NODE_VERSION%
echo Detected npm:     %NPM_VERSION%
echo.

echo [1/3] Installing backend dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [2/3] Installing frontend dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [3/3] Validating build...
cd server
call npm run build
if %errorlevel% neq 0 (
    echo [WARNING] Server build had warnings or errors.
)
cd ..

cd client
call npm run build
if %errorlevel% neq 0 (
    echo [WARNING] Client build had warnings or errors.
)
cd ..

echo.
echo =======================================================
echo  Setup Completed Successfully!
echo =======================================================
echo To start the application, simply run:
echo    start.bat
echo or:
echo    npm run dev
echo.
pause
