@echo off
setlocal EnableExtensions
pushd "%~dp0"
set "ROOT=%CD%"
title GOVINNOVATE - SIH 26136
color 5F

echo ============================================
echo        GOVINNOVATE - SIH 26136
echo ============================================
echo Working directory: %ROOT%
echo.

REM ---- Check Python (python or py launcher) ----
set "PYTHON_CMD="
where python.exe >nul 2>&1
if not errorlevel 1 set "PYTHON_CMD=python"
if not defined PYTHON_CMD (
    where py.exe >nul 2>&1
    if not errorlevel 1 set "PYTHON_CMD=py -3"
)
if not defined PYTHON_CMD (
    echo ERROR: Python 3 is not installed or is not available in PATH.
    echo Install Python 3 and enable "Add Python to PATH", then run this file again.
    pause
    popd
    exit /b 1
)

REM ---- Check Node/npm ----
where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js/npm is not installed or is not available in PATH.
    echo Install Node.js LTS, then run this file again.
    pause
    popd
    exit /b 1
)

REM ---- Validate the extracted project ----
if not exist "%ROOT%\backend\govinnovate_app.py" (
    echo ERROR: Backend application file is missing.
    echo Expected: %ROOT%\backend\govinnovate_app.py
    echo Please extract the complete ZIP before running this file.
    pause
    popd
    exit /b 1
)
if not exist "%ROOT%\backend\requirements.txt" (
    echo ERROR: backend\requirements.txt is missing.
    pause
    popd
    exit /b 1
)
if not exist "%ROOT%\frontend\package.json" (
    echo ERROR: frontend\package.json is missing.
    pause
    popd
    exit /b 1
)
if not exist "%ROOT%\frontend\src\main.jsx" (
    echo ERROR: frontend\src\main.jsx is missing.
    pause
    popd
    exit /b 1
)

REM ---- Create backend virtual environment ----
if not exist "%ROOT%\backend\venv\Scripts\python.exe" (
    echo Creating backend virtual environment...
    %PYTHON_CMD% -m venv "%ROOT%\backend\venv"
    if errorlevel 1 (
        echo ERROR: Failed to create the backend virtual environment.
        pause
        popd
        exit /b 1
    )
)

REM ---- Install/check backend packages ----
echo Installing/checking backend packages...
call "%ROOT%\backend\venv\Scripts\python.exe" -m pip install -r "%ROOT%\backend\requirements.txt"
if errorlevel 1 (
    echo ERROR: Backend package installation failed.
    echo Check your internet connection and try again.
    pause
    popd
    exit /b 1
)

REM ---- Install/check frontend packages ----
if not exist "%ROOT%\frontend\node_modules\vite\bin\vite.js" (
    echo Installing frontend packages. This happens only on first run...
    pushd "%ROOT%\frontend"
    call npm.cmd install --no-audit --no-fund
    if errorlevel 1 (
        echo ERROR: Frontend package installation failed.
        popd
        pause
        popd
        exit /b 1
    )
    popd
) else (
    echo Frontend packages already installed.
)

REM ---- Clear old development ports ----
echo Clearing old development ports...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ports=8000,5173; foreach($p in $ports){$c=Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue; foreach($x in $c){Stop-Process -Id $x.OwningProcess -Force -ErrorAction SilentlyContinue}}"

REM ---- Start backend ----
echo Starting backend...
start "GOVINNOVATE Backend" /D "%ROOT%\backend" cmd.exe /k ""%ROOT%\backend\venv\Scripts\python.exe" -m uvicorn --app-dir "%ROOT%\backend" govinnovate_app:app --host 127.0.0.1 --port 8000"

REM ---- Wait for backend health endpoint ----
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; for($i=0;$i-lt60;$i++){try{$r=Invoke-WebRequest 'http://127.0.0.1:8000/api/health' -UseBasicParsing -TimeoutSec 1;if($r.StatusCode -eq 200){$ok=$true;break}}catch{};Start-Sleep -Milliseconds 500}; if($ok){exit 0}else{exit 1}"
if errorlevel 1 (
    echo ERROR: Backend did not start.
    echo Check the "GOVINNOVATE Backend" window for the Python/Uvicorn error.
    pause
    popd
    exit /b 1
)

echo Backend is ready.

REM ---- Start frontend ----
echo Starting frontend...
start "GOVINNOVATE Frontend" /D "%ROOT%\frontend" cmd.exe /k "npm.cmd run dev -- --host 127.0.0.1 --port 5173"

timeout /t 4 /nobreak >nul
start "" http://127.0.0.1:5173

echo.
echo ============================================
echo GOVINNOVATE is running.
echo Browser: http://127.0.0.1:5173
echo API:     http://127.0.0.1:8000/api/health
echo ============================================
echo Keep both server windows open.
echo Close those two windows when you are finished.
echo.
pause
popd
