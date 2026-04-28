#!/usr/bin/env bash
# См. deploy/push-mirror.ps1
set -euo pipefail
BR="${1:-$(git rev-parse --abbrev-ref HEAD)}"
echo "==> git push origin $BR"
git push origin "$BR"
if git remote get-url release >/dev/null 2>&1; then
  echo "==> git push release $BR"
  git push release "$BR"
else
  echo "==> (no remote 'release', skip second push)"
fi
echo "==> Done."
