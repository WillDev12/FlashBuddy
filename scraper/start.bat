@echo off
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed on this computer.
    echo.
    echo You need Node.js to run the scraper. Install it first, then run this script again.
    echo.
    echo  Windows installer:  https://nodejs.org/en/download/
    echo  Step-by-step guide: See README.txt in this folder.
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0scraper"
echo Installing scraper dependencies...
echo.
echo ^(First run only: Node.js needs to download ~150 MB of packages including a bundled browser.
echo  This usually takes 1-5 minutes. Please wait -- it won't happen next time.^)
echo.
npm install
echo.
if "%PORT%"=="" set PORT=3000
echo ============================================================
echo   Quizlet scraper is up on port %PORT%!
echo   You can now use "Import from URL" in FlashBuddy.
echo   Keep this window open while importing.
echo ============================================================
echo.
node server.js
pause
