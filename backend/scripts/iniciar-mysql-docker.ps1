# Sobe o MySQL local (Docker): root / 1234, base veltrix, porta no host 3307.
$ErrorActionPreference = "Stop"
$here = $PSScriptRoot
$repoRoot = Resolve-Path (Join-Path $here "..\..")
$compose = Join-Path $repoRoot "docker-compose.yml"
if (-not (Test-Path $compose)) {
    Write-Error "Não encontrado: $compose"
}
Set-Location $repoRoot
docker compose up -d
Write-Host ""
Write-Host "MySQL (Docker): localhost:3307 | root | 1234 | veltrix" -ForegroundColor Cyan
Write-Host "Aguarde ~15–30 s. Depois na pasta backend:" -ForegroundColor Yellow
Write-Host '  mvn spring-boot:run "-Dspring-boot.run.profiles=local,docker"' -ForegroundColor Green
