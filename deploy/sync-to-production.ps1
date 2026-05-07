param(
    [string]$EnvFile = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($EnvFile)) {
    $EnvFile = Join-Path $PSScriptRoot ".env.deploy"
}

if (-not (Test-Path -LiteralPath $EnvFile)) {
    throw "Missing $EnvFile. Copy deploy/.env.deploy.example to deploy/.env.deploy and fill values."
}

function Get-DeployEnv {
    param([string]$Path)
    $result = @{}
    foreach ($raw in Get-Content -LiteralPath $Path) {
        $line = $raw.Trim()
        if (-not $line -or $line.StartsWith("#")) { continue }
        $parts = $line.Split("=", 2)
        if ($parts.Count -ne 2) { continue }
        $k = $parts[0].Trim()
        $v = $parts[1].Trim().TrimEnd("`r", "`n")
        if ($k) { $result[$k] = $v }
    }
    return $result
}

$cfg = Get-DeployEnv -Path $EnvFile
$sshTarget = $cfg["DEPLOY_SSH_TARGET"]
$appPath = $cfg["DEPLOY_APP_PATH"]
$branch = if ($cfg.ContainsKey("DEPLOY_GIT_BRANCH") -and $cfg["DEPLOY_GIT_BRANCH"]) { $cfg["DEPLOY_GIT_BRANCH"] } else { "main" }
$gitRemote = if ($cfg.ContainsKey("DEPLOY_GIT_REMOTE") -and $cfg["DEPLOY_GIT_REMOTE"]) { $cfg["DEPLOY_GIT_REMOTE"].Trim() } else { "origin" }
$service = if ($cfg.ContainsKey("DEPLOY_SYSTEMD_SERVICE") -and $cfg["DEPLOY_SYSTEMD_SERVICE"]) { $cfg["DEPLOY_SYSTEMD_SERVICE"] } else { "fabrika-gunicorn" }
$skipSystemd = ($cfg.ContainsKey("DEPLOY_SKIP_SYSTEMD") -and $cfg["DEPLOY_SKIP_SYSTEMD"] -eq "1")

if (-not $sshTarget) { throw "DEPLOY_SSH_TARGET is missing in $EnvFile" }
if (-not $appPath) { throw "DEPLOY_APP_PATH is missing in $EnvFile" }

$runPreflight =
    ($cfg.ContainsKey("DEPLOY_RUN_PREFLIGHT") -and $cfg["DEPLOY_RUN_PREFLIGHT"] -eq "1") -or
    ($env:DEPLOY_RUN_PREFLIGHT -eq "1")
if ($runPreflight) {
    $preflightScript = Join-Path $PSScriptRoot "preflight.ps1"
    Write-Host "==> Local preflight (same as CI). To skip: remove DEPLOY_RUN_PREFLIGHT or set DEPLOY_RUN_PREFLIGHT=0"
    & $preflightScript
    if ($LASTEXITCODE -ne 0) {
        throw "Preflight failed (exit $LASTEXITCODE). Fix errors or push only after CI is green."
    }
}

Write-Host "==> $sshTarget -> $appPath (branch $branch, remote $gitRemote)"

$remoteLines = @(
    "set -euo pipefail"
    "cd `"$appPath`""
    "git fetch $gitRemote `"$branch`""
    "git checkout `"$branch`""
    "git reset --hard `"$gitRemote/$branch`""
    ('echo "==> On server after git reset: VERSION=$(cat VERSION 2>/dev/null | head -1) $(git log -1 --oneline) (remote ' + $gitRemote + ')"')
    "export GIT_SHA=`"`$(git rev-parse --short HEAD)`""
    "export BUILD_TIME=`"`$(date -u +%Y-%m-%dT%H:%M:%SZ)`""
    "STAFF_TMP=`"/tmp/fabrika_staff_prev`""
    "rm -rf `"`$STAFF_TMP`""
    "if [ -f frontend/dist/staff/index.html ]; then mkdir -p `"`$STAFF_TMP`"; cp -a frontend/dist/staff/. `"`$STAFF_TMP`"/; fi"
    "cd frontend"
    "if [ -f package-lock.json ]; then npm ci; else npm install; fi"
    "npm run build"
    "if [ -f `"`$STAFF_TMP`"/index.html ]; then mkdir -p dist/staff; cp -a `"`$STAFF_TMP`"/. dist/staff/; fi"
    "cd ../admin-ui"
    "if [ -f package-lock.json ]; then npm ci; else npm install; fi"
    "npm run build"
    "cd .."
    "rm -rf frontend/dist/staff.new"
    "mkdir -p frontend/dist/staff.new"
    "cp -a admin-ui/dist/. frontend/dist/staff.new/"
    "rm -rf frontend/dist/staff.prev"
    "if [ -d frontend/dist/staff ]; then mv -T frontend/dist/staff frontend/dist/staff.prev; fi"
    "mv -T frontend/dist/staff.new frontend/dist/staff"
    "rm -rf frontend/dist/staff.prev"
    "rm -rf `"`$STAFF_TMP`""
    "cd backend"
    "if [ -f ../.env ]; then set -a; source ../.env; set +a; fi"
    "source .venv/bin/activate"
    "pip install -q -r requirements-prod.txt"
    "python manage.py migrate --noinput"
    "python manage.py collectstatic --noinput"
    "python manage.py generate_public_seo_files"
    "cd .."
    "bash deploy/prune-production-tree.sh --drop-sqlite ."
    "cd backend"
    "if [ -f ../.env ]; then set -a; source ../.env; set +a; fi"
    "source .venv/bin/activate"
    "python manage.py generate_public_seo_files"
    "cd .."
)

if (-not $skipSystemd) {
    $remoteLines += "sudo systemctl restart `"$service`""
} else {
    $remoteLines += "echo '(systemd restart skipped: DEPLOY_SKIP_SYSTEMD=1)'"
}

$remoteLines += ""
$remoteLines += 'echo "==> Nginx: one-time as root if /sitemap.xml is still proxied to Django:"'
$remoteLines += "echo `"    sudo bash $appPath/deploy/vps-nginx-remove-seo-proxy-once.sh`""

$remoteScript = (($remoteLines | ForEach-Object { $_ -replace "`r", "" }) -join "`n") + "`n"

# Old: Process + ReadToEnd() hid output until the end and could deadlock when npm filled stderr.

Write-Host "==> Remote deploy: live server log (npm ci, two builds, backend - often 10-20 min). Do not interrupt."
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    throw "ssh not found in PATH."
}
$remoteScript | & ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new $sshTarget "bash -s"

if ($LASTEXITCODE -ne 0) {
    throw "Deploy failed with exit code $($LASTEXITCODE)."
}

Write-Host "==> Done."
