# ==============================================================================
# TutorHub Seed Data Loader Script (PowerShell for Windows)
# Nap du lieu mau tu Data.sql vao PostgreSQL container
# ==============================================================================

[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$sqlFile = Join-Path $rootDir "Data.sql"
$envFile = Join-Path $rootDir ".env"

$postgresUser = "tutorhub"
$postgresDb = "tutorhub"
$containerName = "tutorhub-postgres"

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -match "^POSTGRES_USER=(.*)$") {
            $val = $matches[1].Trim().Trim('"').Trim("'")
            if ($val) { $postgresUser = $val }
        }
        if ($line -match "^POSTGRES_DB=(.*)$") {
            $val = $matches[1].Trim().Trim('"').Trim("'")
            if ($val) { $postgresDb = $val }
        }
    }
}

if (-not (Test-Path $sqlFile)) {
    Write-Error "Error: Khong tim thay file $sqlFile"
    exit 1
}

# 1. Kiem tra container Postgres
Write-Host "Dang kiem tra container $containerName..." -ForegroundColor Cyan
$runningContainer = docker ps --filter "name=$containerName" --filter "status=running" --format "{{.Names}}"
if ($runningContainer -notmatch $containerName) {
    Write-Host "Error: Container '$containerName' chua duoc khoi chay!" -ForegroundColor Red
    Write-Host "Hay chay lenh: docker compose up -d postgres" -ForegroundColor Yellow
    exit 1
}

# 2. Kiem tra schema
Write-Host "Kiem tra trang thai schema database..." -ForegroundColor Cyan
$schemaCheck = 'SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ''Users'') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ''wishlist_items'');'
$schemaReady = $schemaCheck | docker exec -i $containerName psql -U $postgresUser -d $postgresDb -tA 2>$null
if ($LASTEXITCODE -ne 0 -or $schemaReady.Trim() -ne "t") {
    Write-Host "Database chua ap dung du migration cho seed data." -ForegroundColor Yellow
    Write-Host "Ban can chay EF Core Migration truoc khi seed data:" -ForegroundColor Yellow
    Write-Host "   dotnet ef database update --project src/backend/TutorHub.Infrastructure --startup-project src/backend/TutorHub.Api" -ForegroundColor Gray
    exit 1
}

# 3. Xac nhan truoc khi TRUNCATE
if (-not $Force) {
    Write-Host "CANH BAO: Thao tac nay se TRUNCATE (xoa sach) du lieu hien tai va nap lai Data.sql!" -ForegroundColor Yellow
    $confirm = Read-Host "Ban co chac chan muon tiep tuc? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Da huy thao tac." -ForegroundColor Gray
        exit 0
    }
}

# 4. Thuc thi nap Data.sql
Write-Host "Dang nap du lieu tu Data.sql vao database '$postgresDb'..." -ForegroundColor Cyan
docker cp $sqlFile "${containerName}:/tmp/Data.sql"
if ($LASTEXITCODE -ne 0) {
    throw "Sao chep Data.sql vao container that bai."
}

docker exec $containerName psql -U $postgresUser -d $postgresDb -v ON_ERROR_STOP=1 -q -f /tmp/Data.sql
if ($LASTEXITCODE -ne 0) {
    throw "Nap seed data that bai; PostgreSQL da rollback transaction."
}

docker exec $containerName rm -f /tmp/Data.sql

Write-Host "Nap du lieu mau thanh cong!" -ForegroundColor Green
Write-Host "Mat khau mac dinh cho tat ca tai khoan: Test@123" -ForegroundColor Green
