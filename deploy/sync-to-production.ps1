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
        $v = $parts[1].Trim()
        if ($k) { $result[$k] = $v }
    }
    return $result
}

$cfg = Get-DeployEnv -Path $EnvFile
$sshTarget = $cfg["DEPLOY_SSH_TARGET"]
$appPath = $cfg["DEPLOY_APP_PATH"]
$branch = if ($cfg.ContainsKey("DEPLOY_GIT_BRANCH") -and $cfg["DEPLOY_GIT_BRANCH"]) { $cfg["DEPLOY_GIT_BRANCH"] } else { "main" }
$service = if ($cfg.ContainsKey("DEPLOY_SYSTEMD_SERVICE") -and $cfg["DEPLOY_SYSTEMD_SERVICE"]) { $cfg["DEPLOY_SYSTEMD_SERVICE"] } else { "fabrika-gunicorn" }
$skipSystemd = ($cfg.ContainsKey("DEPLOY_SKIP_SYSTEMD") -and $cfg["DEPLOY_SKIP_SYSTEMD"] -eq "1")

if (-not $sshTarget) { throw "DEPLOY_SSH_TARGET is missing in $EnvFile" }
if (-not $appPath) { throw "DEPLOY_APP_PATH is missing in $EnvFile" }

Write-Host "==> $sshTarget -> $appPath (branch $branch)"

$remoteLines = @(
    "set -euo pipefail"
    "cd `"$appPath`""
    "git fetch origin `"$branch`""
    "git checkout `"$branch`""
    "git reset --hard `"origin/$branch`""
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
    "mv -T frontend/dist/staff.new frontend/dist/staff"
    "rm -rf `"`$STAFF_TMP`""
    "cd backend"
    "if [ -f ../.env ]; then set -a; source ../.env; set +a; fi"
    "source .venv/bin/activate"
    "pip install -q -r requirements-prod.txt"
    "python manage.py migrate --noinput"
    "python manage.py collectstatic --noinput"
)

if (-not $skipSystemd) {
    $remoteLines += "sudo systemctl restart `"$service`""
} else {
    $remoteLines += "echo '(systemd restart skipped: DEPLOY_SKIP_SYSTEMD=1)'"
}

$remoteScript = ($remoteLines -join "`n") + "`n"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($remoteScript)

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "ssh"
$escapedTarget = $sshTarget.Replace('"', '\"')
$psi.Arguments = "-o BatchMode=yes -o StrictHostKeyChecking=accept-new `"$escapedTarget`" bash"
$psi.RedirectStandardInput = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false

$proc = New-Object System.Diagnostics.Process
$proc.StartInfo = $psi
$null = $proc.Start()
$proc.StandardInput.BaseStream.Write($bytes, 0, $bytes.Length)
$proc.StandardInput.Close()
$stdout = $proc.StandardOutput.ReadToEnd()
$stderr = $proc.StandardError.ReadToEnd()
$proc.WaitForExit()

if ($stdout) { Write-Host $stdout }
if ($stderr) { Write-Host $stderr }

if ($proc.ExitCode -ne 0) {
    throw "Deploy failed with exit code $($proc.ExitCode)."
}

Write-Host "==> Done."
