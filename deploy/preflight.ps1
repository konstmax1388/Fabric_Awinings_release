# Локально повторить проверки CI перед деплоем (из корня репозитория: .\deploy\preflight.ps1).
# Не обязательно, если CI на GitHub уже зелёный для того же коммита.
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "==> backend: pip, check, pytest"
Push-Location (Join-Path $root "backend")
try {
    python -m pip install -q -r requirements.txt
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    python manage.py check
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    python -m pytest -q --tb=short
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally { Pop-Location }

Write-Host "==> frontend: npm ci, build"
Push-Location (Join-Path $root "frontend")
try {
    npm ci
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally { Pop-Location }

Write-Host "==> admin-ui: npm ci, build"
Push-Location (Join-Path $root "admin-ui")
try {
    npm ci
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally { Pop-Location }

Write-Host "==> Preflight OK."
