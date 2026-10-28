$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$solution = Join-Path $repositoryRoot 'src/backend/TutorHub.sln'

if (-not $env:POSTGRES_PASSWORD) {
    $envFile = Join-Path $repositoryRoot '.env'
    if (Test-Path $envFile) {
        $passwordLine = Get-Content $envFile | Where-Object { $_ -match '^POSTGRES_PASSWORD=' } | Select-Object -First 1
        if ($passwordLine) {
            $env:POSTGRES_PASSWORD = ($passwordLine -split '=', 2)[1].Trim().Trim('"').Trim("'")
        }
    }
}

dotnet test $solution --configuration Release @args
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
