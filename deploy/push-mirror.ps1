# Пуш текущей ветки в origin и в remote "release" (зеркало Fabric_Awinings_release).
# Нужен для деплоя: sync-to-production на VPS делает git fetch у того remote, куда смотрит репозиторий на сервере.
# Использование (из корня репо):  .\deploy\push-mirror.ps1
# Или только main:  .\deploy\push-mirror.ps1 -Branch main

param(
    [string]$Branch = ""
)

$ErrorActionPreference = "Stop"

if (-not $Branch) {
    $Branch = (git rev-parse --abbrev-ref HEAD).Trim()
}

Write-Host "==> git push origin $Branch"
git push "origin" $Branch
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$null = git remote get-url "release" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "==> git push release $Branch"
    git push "release" $Branch
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    Write-Host "==> (no remote named 'release', skip second push)"
}

Write-Host "==> Done."
