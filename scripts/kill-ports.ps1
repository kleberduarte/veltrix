# Encerra processos em LISTEN nas portas informadas (ex.: backend 8080, Next.js 3000)
param(
    [int[]] $Ports = @(8080, 3000)
)

$ErrorActionPreference = 'SilentlyContinue'

foreach ($port in $Ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $conns) { continue }

    $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) {
        try {
            $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($p) {
                Write-Host "Encerrando PID $procId ($($p.ProcessName)) na porta $port"
                Stop-Process -Id $procId -Force -ErrorAction Stop
            }
        } catch {
            Write-Host "Nao foi possivel encerrar PID ${procId}: $_"
        }
    }
}

Write-Host "Portas verificadas: $($Ports -join ', ')"
