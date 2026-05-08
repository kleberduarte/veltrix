@echo off
setlocal
set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
rem Perfis Spring do backend (sobrescrever antes de correr, se precisar):
rem   MySQL Docker (porta 3307): local,docker — padrao abaixo
rem   MySQL nativo na 3306:      set VELTRIX_SPRING_PROFILES=local
if not defined VELTRIX_SPRING_PROFILES set "VELTRIX_SPRING_PROFILES=local,docker"

echo ========================================
echo Veltrix — preparando ambiente
echo ========================================
echo.

echo Encerrando processos nas portas 8080 ^(Spring Boot^) e 3000 ^(Next.js^)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\kill-ports.ps1"
echo.

timeout /t 2 /nobreak >nul

echo Iniciando backend e frontend em janelas novas...
echo   Backend:  http://localhost:8080  (perfis: %VELTRIX_SPRING_PROFILES%^)
echo   Frontend: http://localhost:3000
echo.

echo %VELTRIX_SPRING_PROFILES% | findstr /i "docker" >nul 2>&1
if not errorlevel 1 (
  echo Perfis incluem "docker": subindo MySQL ^(compose na porta 3307^)...
  pushd "%ROOT%"
  docker compose up -d
  if errorlevel 1 (
    echo AVISO: docker compose falhou. Confirme que o Docker Desktop esta a correr.
    echo Backend pode falhar com "Communications link failure" ate o MySQL estar disponivel.
  ) else (
    echo Aguardando MySQL aceitar ligacoes em localhost:3307 ^(ate ~90s^)...
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
      "$deadline = (Get-Date).AddSeconds(90); $ok = $false; while ((Get-Date) -lt $deadline) { try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1', 3307); $c.Close(); $ok = $true; break } catch { Start-Sleep -Seconds 2 } }; if (-not $ok) { Write-Host 'AVISO: porta 3307 ainda nao responde; o Spring pode falhar na primeira tentativa.' -ForegroundColor Yellow } else { Write-Host 'MySQL pronto em 127.0.0.1:3307.' }"
  )
  popd
  echo.
)

start "Veltrix - Backend" cmd /k cd /d "%BACKEND%" ^&^& mvn spring-boot:run "-Dspring-boot.run.profiles=%VELTRIX_SPRING_PROFILES%"
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
