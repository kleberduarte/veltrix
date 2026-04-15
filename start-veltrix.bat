@echo off
setlocal
set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

echo ========================================
echo Veltrix — preparando ambiente
echo ========================================
echo.

echo Encerrando processos nas portas 8080 ^(Spring Boot^) e 3000 ^(Next.js^)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\kill-ports.ps1"
echo.

timeout /t 2 /nobreak >nul

echo Iniciando backend e frontend em janelas novas...
echo   Backend:  http://localhost:8080
echo   Frontend: http://localhost:3000
echo.

start "Veltrix - Backend" cmd /k cd /d "%BACKEND%" ^&^& mvn spring-boot:run
timeout /t 2 /nobreak >nul
start "Veltrix - Frontend" cmd /k cd /d "%FRONTEND%" ^&^& npm run dev

set "URL=http://localhost:3000"
set "CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

echo.
echo Aguardando o frontend compilar ^(primeira vez pode levar mais tempo^)...
timeout /t 8 /nobreak >nul

if defined CHROME (
  echo Abrindo Chrome em modo anonimo: %URL%
  start "" "%CHROME%" --incognito --new-window "%URL%"
) else (
  echo Chrome nao encontrado nos caminhos padrao.
  echo Abra manualmente no navegador: %URL%
)

echo.
echo Pronto. Feche cada janela para parar o processo correspondente.
pause
