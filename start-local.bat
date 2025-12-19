@echo off
echo Starting MongoDB locally...
start "MongoDB" mongod --dbpath data

timeout /t 3 /nobreak > nul

echo Starting BookMySeat Server...
npm start

pause