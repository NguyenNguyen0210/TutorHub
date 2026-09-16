#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Dựng môi trường dev backend TutorHub chỉ với một lệnh.

.DESCRIPTION
    Thứ tự thực hiện:
      1. Nạp .env và kiểm tra các key bắt buộc (fail-fast giống lúc API khởi động).
      2. Kiểm tra PostgreSQL đang lắng nghe.
      3. Build solution (bỏ qua nếu thất bại do API đang chạy giữ file bin).
      4. Áp migration còn thiếu (dotnet ef database update).
      5. Nạp src/backend/seedData.sql — CHỈ khi DB chưa có user, trừ khi dùng -Force.
         (seedData.sql TRUNCATE toàn bộ dữ liệu nghiệp vụ trước khi insert.)
      6. Gọi /health nếu API đang chạy và in tài khoản test.

.PARAMETER Force
    Nạp lại seedData.sql kể cả khi DB đã có dữ liệu (sẽ XOÁ dữ liệu nghiệp vụ hiện tại).

.PARAMETER SkipBuild
    Bỏ bước build (dùng khi bin đã mới, hoặc khi API đang chạy giữ file).

.PARAMETER ApiUrl
    Địa chỉ API dùng cho bước health check. Mặc định http://localhost:5129.

.PARAMETER ConnectionString
    Ghi đè connection string (mặc định lấy từ .env). Dùng khi muốn dựng một DB khác,
    ví dụ DB kiểm thử: -ConnectionString "Host=localhost;Port=5432;Database=probe;Username=tutorhub;Password=123456"

.EXAMPLE
    pwsh ./scripts/dev-bootstrap.ps1
    pwsh ./scripts/dev-bootstrap.ps1 -Force
#>
[CmdletBinding()]
param(
    [switch]$Force,
    [switch]$SkipBuild,
    [string]$ApiUrl = "http://localhost:5129",
    [string]$ConnectionString
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$solution = Join-Path $repoRoot "src/backend/TutorHub.sln"
$seedFile = Join-Path $repoRoot "src/backend/seedData.sql"
$infraProject = Join-Path $repoRoot "src/backend/TutorHub.Infrastructure"
$apiProject = Join-Path $repoRoot "src/backend/TutorHub.Api"

function Write-Step($message) { Write-Host "`n=== $message ===" -ForegroundColor Cyan }
function Write-Ok($message) { Write-Host "  [OK] $message" -ForegroundColor Green }
function Write-Warn($message) { Write-Host "  [!] $message" -ForegroundColor Yellow }
function Write-Err($message) { Write-Host "  [X] $message" -ForegroundColor Red }

function Test-TcpPort {
    param([string]$ComputerName, [int]$Port, [int]$TimeoutMs = 2000)

    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect($ComputerName, $Port, $null, $null)
        if (-not $async.AsyncWaitHandle.WaitOne($TimeoutMs)) { return $false }
        $client.EndConnect($async)
        return $true
    }
    catch { return $false }
    finally { $client.Close() }
}

function Read-DotEnv {
    param([string]$Path)

    $values = @{}
    foreach ($line in Get-Content -Path $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith("#") -or -not $trimmed.Contains("=")) { continue }
        $parts = $trimmed.Split("=", 2)
        $values[$parts[0].Trim()] = $parts[1].Trim().Trim('"', "'")
    }
    return $values
}

Push-Location $repoRoot
try {
    # ---------------------------------------------------------------- 1. .env
    Write-Step "1/6  Cấu hình (.env)"
    $envPath = Join-Path $repoRoot ".env"
    if (-not (Test-Path $envPath)) {
        Write-Err "Chưa có .env. Tạo bằng: cp .env.example .env  rồi điền giá trị thật."
        exit 1
    }

    $config = Read-DotEnv -Path $envPath
    Write-Ok "Đã nạp .env ($($config.Count) key)."

    # Bắt buộc để API khởi động được (Options [Required] + ValidateOnStart).
    $requiredAlways = @(
        "Jwt__Secret",
        "RefreshToken__Pepper",
        "VnPay__HashSecret",
        "CloudflareR2__AccountId",
        "CloudflareR2__BucketName",
        "CloudflareR2__AccessKeyId",
        "CloudflareR2__SecretAccessKey"
    )

    $missing = @($requiredAlways | Where-Object {
        -not $config.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($config[$_])
    })

    $environment = if ($config.ContainsKey("ASPNETCORE_ENVIRONMENT")) { $config["ASPNETCORE_ENVIRONMENT"] } else { "" }
    if ($environment -ne "Development") {
        # Ngoài Development, email và CORS là điều kiện khởi động bắt buộc.
        foreach ($key in @("Ses__FromAddress", "Cors__AllowedOrigins")) {
            if (-not $config.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($config[$key])) { $missing += $key }
        }
    }

    if ($missing.Count -gt 0) {
        Write-Err "Thiếu key bắt buộc trong .env: $($missing -join ', ')"
        Write-Warn "API sẽ từ chối khởi động cho tới khi các key này có giá trị."
        exit 1
    }
    Write-Ok "Các key bắt buộc đều đã có giá trị."

    $dbHost = "localhost"
    $dbPort = if ($config["POSTGRES_PORT"]) { [int]$config["POSTGRES_PORT"] } else { 5432 }
    $dbName = if ($config["POSTGRES_DB"]) { $config["POSTGRES_DB"] } else { "tutorhub" }
    $dbUser = if ($config["POSTGRES_USER"]) { $config["POSTGRES_USER"] } else { "tutorhub" }
    $dbPassword = $config["POSTGRES_PASSWORD"]

    # -ConnectionString cho phép nhắm vào DB khác (không cần sửa .env).
    if ($ConnectionString) {
        $parsed = @{}
        foreach ($pair in $ConnectionString.Split(";", [StringSplitOptions]::RemoveEmptyEntries)) {
            $kv = $pair.Split("=", 2)
            if ($kv.Count -eq 2) { $parsed[$kv[0].Trim().ToLowerInvariant()] = $kv[1].Trim() }
        }
        if ($parsed["host"]) { $dbHost = $parsed["host"] }
        if ($parsed["port"]) { $dbPort = [int]$parsed["port"] }
        if ($parsed["database"]) { $dbName = $parsed["database"] }
        if ($parsed["username"]) { $dbUser = $parsed["username"] }
        if ($parsed["password"]) { $dbPassword = $parsed["password"] }
        Write-Ok "Dùng connection string ghi đè (DB: $dbName)."
    }

    # ------------------------------------------------------------ 2. Postgres
    Write-Step "2/6  PostgreSQL"
    if (-not (Test-TcpPort -ComputerName $dbHost -Port $dbPort)) {
        Write-Err "Không kết nối được $dbHost`:$dbPort."
        Write-Warn "Khởi động PostgreSQL (service/container) rồi chạy lại script."
        exit 1
    }
    Write-Ok "PostgreSQL $dbHost`:$dbPort đang lắng nghe."

    $psql = (Get-Command psql -ErrorAction SilentlyContinue).Source
    if (-not $psql) {
        Write-Warn "Không thấy psql trên PATH — bước seed sẽ bỏ qua (migration vẫn chạy được)."
    }

    # --------------------------------------------------------------- 3. Build
    Write-Step "3/6  Build"
    if ($SkipBuild) {
        Write-Warn "Bỏ qua build (-SkipBuild)."
    }
    else {
        $buildOutput = & dotnet build $solution -m:1 -nodeReuse:false 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Ok "Build thành công."
        }
        else {
            Write-Warn "Build thất bại — thường do tiến trình TutorHub.Api đang chạy giữ file trong bin."
            Write-Warn "Tiếp tục với binary hiện có (--no-build)."
            if ($buildOutput | Select-String -Pattern "MSB3021|MSB3027") {
                Write-Warn "Log: đóng API (Stop-Process -Name TutorHub.Api) rồi chạy lại để build sạch."
            }
        }
    }

    # ----------------------------------------------------------- 4. Migrations
    Write-Step "4/6  Migration"
    if ($ConnectionString) {
        $pending = & dotnet ef migrations list --project $infraProject --startup-project $apiProject --no-build --connection $ConnectionString 2>&1 |
            Select-String -Pattern "\(Pending\)" | ForEach-Object { $_.Line.Trim() }
    }
    else {
        $pending = & dotnet ef migrations list --project $infraProject --startup-project $apiProject --no-build 2>&1 |
            Select-String -Pattern "\(Pending\)" | ForEach-Object { $_.Line.Trim() }
    }

    if (-not $pending) {
        Write-Ok "DB đã ở phiên bản migration mới nhất."
    }
    else {
        Write-Host "  Migration còn thiếu:" -ForegroundColor Yellow
        $pending | ForEach-Object { Write-Host "    - $_" }

        if ($ConnectionString) {
            & dotnet ef database update --project $infraProject --startup-project $apiProject --no-build --connection $ConnectionString
        }
        else {
            & dotnet ef database update --project $infraProject --startup-project $apiProject --no-build
        }
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Áp migration thất bại."
            Write-Warn "Nếu lỗi là 'column ... already exists', schema đã bị sửa NGOÀI EF: cần đối chiếu"
            Write-Warn "thủ công rồi ghi lại migration vào __EFMigrationsHistory (xem README, mục Troubleshooting)."
            exit 1
        }
        Write-Ok "Đã áp migration."
    }

    # ----------------------------------------------------------------- 5. Seed
    Write-Step "5/6  Seed dữ liệu mẫu"
    if (-not $psql) {
        Write-Warn "Bỏ qua seed: không có psql."
    }
    else {
        $env:PGPASSWORD = $dbPassword

        # Đếm qua FILE thay vì SQL inline: Windows PowerShell 5.1 làm mất dấu nháy kép khi
        # truyền tham số cho tiến trình native, khiến psql hạ chữ thường tên bảng và báo
        # "relation users does not exist".
        $countFile = Join-Path ([System.IO.Path]::GetTempPath()) "tutorhub-user-count.sql"
        [System.IO.File]::WriteAllText(
            $countFile,
            'SELECT count(*) FROM "Users";',
            (New-Object System.Text.UTF8Encoding($false)))

        $userCount = & $psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -tA -f $countFile 2>$null | Select-Object -First 1
        if ($null -ne $userCount) { $userCount = "$userCount".Trim() }

        if ($Force -or [string]::IsNullOrWhiteSpace($userCount) -or [int]$userCount -eq 0) {
            if ($Force) { Write-Warn "-Force: seedData.sql sẽ XOÁ dữ liệu nghiệp vụ hiện có." }

            & $psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -q -f $seedFile
            if ($LASTEXITCODE -ne 0) {
                Write-Err "Seed thất bại."
                exit 1
            }
            Write-Ok "Đã nạp seedData.sql."
        }
        else {
            Write-Ok "DB đã có $userCount user — bỏ qua seed (dùng -Force nếu muốn nạp lại)."
        }
    }

    # --------------------------------------------------------------- 6. Health
    Write-Step "6/6  Health check"
    try {
        $health = Invoke-RestMethod -Uri "$ApiUrl/health" -TimeoutSec 5
        if ($health.status -eq "Healthy") {
            Write-Ok "API healthy tại $ApiUrl ($($health.checks.PSObject.Properties.Name -join ', '))."
        }
        else {
            Write-Warn "API trả về status '$($health.status)' tại $ApiUrl."
            Write-Host ($health | ConvertTo-Json -Depth 5)
        }
    }
    catch {
        Write-Warn "API chưa chạy tại $ApiUrl (bỏ qua)."
        Write-Host "  Chạy API: dotnet run --project src/backend/TutorHub.Api" -ForegroundColor Gray
        Write-Host "  Swagger:  http://localhost:5129/swagger" -ForegroundColor Gray
    }

    Write-Host "`nXong. Tài khoản seed (mật khẩu chung: Test@123):" -ForegroundColor Cyan
    Write-Host "  admin@tutorhub.com       (Admin)" -ForegroundColor Gray
    Write-Host "  tutor.an@tutorhub.com    (Tutor)" -ForegroundColor Gray
    Write-Host "  student.lan@tutorhub.com (Student)" -ForegroundColor Gray
    Write-Host "  Giả lập thanh toán local: POST $ApiUrl/api/v1/dev/payments/simulate-ipn  { bookingId, success: true }" -ForegroundColor Gray
}
finally {
    Pop-Location
}
