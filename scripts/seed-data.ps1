# ==============================================================================
# TutorHub Seed Data Loader Script (PowerShell for Windows)
# Nạp dữ liệu mẫu từ src/backend/seedData.sql vào PostgreSQL container
# ==============================================================================

[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$sqlFile = Join-Path $rootDir "src\backend\seedData.sql"
$envFile = Join-Path $rootDir ".env"

$postgresUser = "tutorhub"
$postgresDb = "tutorhub"
$containerName = "tutorhub-postgres"

# Đọc cấu hình từ .env nếu tồn tại
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
    Write-Error "❌ Lỗi: Không tìm thấy file $sqlFile"
    exit 1
}

# 1. Kiểm tra container Postgres có đang chạy không
Write-Host "🔍 Đang kiểm tra container $containerName..." -ForegroundColor Cyan
$runningContainer = docker ps --filter "name=$containerName" --filter "status=running" --format "{{.Names}}"
if ($runningContainer -notmatch $containerName) {
    Write-Host "❌ Lỗi: Container '$containerName' chưa được khởi chạy!" -ForegroundColor Red
    Write-Host "💡 Hãy chạy lệnh: docker compose up -d postgres" -ForegroundColor Yellow
    exit 1
}

# 2. Kiểm tra migration mới nhất cần cho seed data.
Write-Host "🔍 Kiểm tra trạng thái schema database..." -ForegroundColor Cyan
$schemaCheck = 'SELECT to_regclass(''public."Users"'') IS NOT NULL AND to_regclass(''public."ConversationAttachments"'') IS NOT NULL'
$schemaReady = docker exec $containerName psql -U $postgresUser -d $postgresDb -tAc $schemaCheck 2>$null
if ($LASTEXITCODE -ne 0 -or $schemaReady.Trim() -ne "t") {
    Write-Host "⚠️  Database chưa áp dụng đủ migration cho seed data hiện tại." -ForegroundColor Yellow
    Write-Host "💡 Bạn cần chạy EF Core Migration trước khi seed data:" -ForegroundColor Yellow
    Write-Host "   dotnet ef database update --project src/backend/TutorHub.Infrastructure --startup-project src/backend/TutorHub.Api" -ForegroundColor Gray
    Write-Host "   (Hoặc đợi container tutorhub-api khởi động hoàn tất nếu chạy full docker compose)" -ForegroundColor Gray
    exit 1
}

# 3. Xác nhận trước khi TRUNCATE nếu không có cờ -Force
if (-not $Force) {
    Write-Host "⚠️  CẢNH BÁO: Thao tác này sẽ TRUNCATE (xóa sạch) dữ liệu hiện tại trong DB và nạp lại seedData.sql!" -ForegroundColor Yellow
    $confirm = Read-Host "👉 Bạn có chắc chắn muốn tiếp tục? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "🚫 Đã hủy thao tác." -ForegroundColor Gray
        exit 0
    }
}

# 4. Thực thi nạp seedData.sql
Write-Host "⏳ Đang nạp dữ liệu từ seedData.sql vào database '$postgresDb'..." -ForegroundColor Cyan
$seedSql = Get-Content -LiteralPath $sqlFile -Raw -Encoding UTF8
$seedSql | docker exec -i $containerName psql -U $postgresUser -d $postgresDb -v ON_ERROR_STOP=1 -q
if ($LASTEXITCODE -ne 0) {
    throw "Nạp seed data thất bại; PostgreSQL đã rollback transaction."
}

Write-Host "✅ Nạp dữ liệu mẫu thành công!" -ForegroundColor Green
Write-Host "🔑 Mật khẩu mặc định cho tất cả tài khoản test: Test@123" -ForegroundColor Green

