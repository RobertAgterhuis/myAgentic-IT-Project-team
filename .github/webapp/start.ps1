# Start the Questionnaire & Decisions Manager webapp
# Kills any existing process on the target port before starting

$port = if ($env:PORT) { $env:PORT } else { 3000 }

$conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn) {
    Write-Host "Port $port in use (PID $($conn.OwningProcess)) - stopping..."
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
}

Write-Host "Starting server on port $port..."
$script = Join-Path $PSScriptRoot 'server.js'
node $script
