# =============================================================================
# Secret Scanner Guardrail for TutorHub
# Scans git-tracked files for committed secrets, credentials, or dangerous placeholders.
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "Scanning repository files for committed secrets..." -ForegroundColor Cyan

$root = (Get-Item $PSScriptRoot).Parent.FullName
$trackedFiles = git -C $root ls-files

$suspiciousPatterns = @(
    "super_secret_jwt_key",
    "RAOCTALYCPWNZGUPWSLTSOBNYMNYIDJA",
    "0b9cb1f3daeb2808451dd2c03aa9b87f",
    "443778f48446753997677d6f59725b4f",
    "AKIA[0-9A-Z]{16}",
    "-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----"
)

$violations = @()

foreach ($relPath in $trackedFiles) {
    if ($relPath -match "^docs/|scan-secrets\.ps1|StartupSecretGuardTests\.cs") {
        continue
    }

    $fullPath = Join-Path $root $relPath
    if (-not (Test-Path $fullPath)) { continue }

    $lines = Get-Content $fullPath -ErrorAction SilentlyContinue
    if ($null -eq $lines) { continue }

    $lineNum = 0
    foreach ($line in $lines) {
        $lineNum++
        foreach ($pattern in $suspiciousPatterns) {
            if ($line -match $pattern) {
                $violations += ("{0}:{1} - matches pattern '{2}'" -f $relPath, $lineNum, $pattern)
            }
        }
    }
}

if ($violations.Count -gt 0) {
    Write-Host "POTENTIAL SECRETS FOUND IN TRACKED FILES:" -ForegroundColor Red
    $violations | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
    exit 1
} else {
    Write-Host "SECRET SCAN PASS: No committed secrets detected in tracked files." -ForegroundColor Green
    exit 0
}
