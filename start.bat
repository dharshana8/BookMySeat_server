@echo off
echo Starting BookMySeat Server...
echo.
echo Make sure MongoDB is running first!
echo.
cd /d "%~dp0"
npm start
pause