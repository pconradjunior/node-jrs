@echo off
setlocal
cd /d "%~dp0"

set "SEA=%~dp0dist\json-rest-server.exe"

if exist "%SEA%" (
  "%SEA%" %*
  exit /b %ERRORLEVEL%
)

if not exist "%~dp0node_modules" (
  echo [run] node_modules not found. Run: npm install
  exit /b 1
)

node "%~dp0bin\jrs.js" %*
exit /b %ERRORLEVEL%