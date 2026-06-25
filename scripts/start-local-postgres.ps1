$ErrorActionPreference = "Stop"

$backendDir = Split-Path -Parent $PSScriptRoot
$pgRoot = "C:\Program Files\PostgreSQL\15\bin"
$postgres = Join-Path $pgRoot "postgres.exe"
$initdb = Join-Path $pgRoot "initdb.exe"
$createdb = Join-Path $pgRoot "createdb.exe"
$psql = Join-Path $pgRoot "psql.exe"
$dataDir = Join-Path $backendDir ".local-postgres\data"
$stateDir = Join-Path $backendDir ".local-postgres"
$passwordFile = Join-Path $stateDir "pwfile.txt"
$port = 5433
$dbPassword = "diogo9121"

if (!(Test-Path $postgres)) {
  throw "PostgreSQL 15 not found at $pgRoot"
}

New-Item -ItemType Directory -Force $stateDir | Out-Null

if (!(Test-Path $dataDir)) {
  Set-Content -Path $passwordFile -Value $dbPassword -NoNewline
  & $initdb -D $dataDir -U postgres --pwfile=$passwordFile --auth-host=scram-sha-256 --auth-local=trust
  Remove-Item $passwordFile -Force -ErrorAction SilentlyContinue
}

$isRunning = (Test-NetConnection localhost -Port $port -WarningAction SilentlyContinue).TcpTestSucceeded

if (!$isRunning) {
  Start-Process `
    -FilePath $postgres `
    -ArgumentList @("-D", $dataDir, "-p", "$port") `
    -RedirectStandardOutput (Join-Path $stateDir "postgres.out.log") `
    -RedirectStandardError (Join-Path $stateDir "postgres.err.log") `
    -WindowStyle Hidden

  Start-Sleep -Seconds 2
}

$isRunning = (Test-NetConnection localhost -Port $port -WarningAction SilentlyContinue).TcpTestSucceeded

if (!$isRunning) {
  throw "PostgreSQL local did not start on port $port"
}

$env:PGPASSWORD = $dbPassword
$dbExists = & $psql -h localhost -p $port -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'sistema_gestao';"

if ($dbExists.Trim() -ne "1") {
  & $createdb -h localhost -p $port -U postgres sistema_gestao
}

Write-Host "Local PostgreSQL running on localhost:$port"
