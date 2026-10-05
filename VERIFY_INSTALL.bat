@echo off
setlocal EnableExtensions
pushd "%~dp0"
echo GOVINNOVATE installation check
echo Root: %CD%
echo.
if exist "backend\requirements.txt" (echo [OK] backend\requirements.txt) else (echo [MISSING] backend\requirements.txt)
if exist "backend\govinnovate_app.py" (echo [OK] backend\govinnovate_app.py) else (echo [MISSING] backend\govinnovate_app.py)
if exist "frontend\package.json" (echo [OK] frontend\package.json) else (echo [MISSING] frontend\package.json)
if exist "frontend\src\main.jsx" (echo [OK] frontend\src\main.jsx) else (echo [MISSING] frontend\src\main.jsx)
where python.exe >nul 2>&1
if not errorlevel 1 (echo [OK] Python found) else (echo [WARN] python.exe not found; py -3 may still work)
where npm.cmd >nul 2>&1
if not errorlevel 1 (echo [OK] npm found) else (echo [MISSING] npm.cmd not found)
echo.
pause
popd
