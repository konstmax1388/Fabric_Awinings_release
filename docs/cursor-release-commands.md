# Команды релиза в терминале Cursor (Windows, PowerShell)

Порядок: **поднять `VERSION` → зафиксировать изменения в git → `push` → деплой на сервер** через `deploy/sync-to-production.ps1`.

Перед началом откройте терминал **в корне репозитория** (там же, где лежат `VERSION`, `backend/`, `frontend/`, `deploy/`).

---

## 1. Перейти в корень проекта (при необходимости)

Замените путь, если у вас другой:

```powershell
Set-Location E:\PRO_WORK\Fabric_Awinings
```

---

## 2. Поднять patch-версию в `VERSION` (3.0.14 → 3.0.15)

Одна команда: читает первую строку `VERSION`, увеличивает последний сегмент и перезаписывает файл.

```powershell
$raw = (Get-Content -Raw -LiteralPath "VERSION").Trim()
$parts = $raw -split '\.'
if ($parts.Count -lt 3) { throw "VERSION must be like 3.0.14" }
$parts[2] = [string]([int]$parts[2] + 1)
$new = $parts[0] + "." + $parts[1] + "." + $parts[2]
[System.IO.File]::WriteAllText((Resolve-Path "VERSION").Path, $new, [System.Text.UTF8Encoding]::new($false))
Write-Host "VERSION -> $new"
```

Если предпочитаете **вручную** — откройте `VERSION` в редакторе, увеличьте число, сохраните, затем продолжайте с шага 3.

---

## 3. Просмотр изменений (по желанию)

```powershell
git status
```

---

## 4. Добавить в коммит то, что входит в релиз

**Только уже отслеживаемые** изменённые/удалённые файлы (без новых неотслеживаемых):

```powershell
git add -u
```

Если в релизе есть **новые** файлы — добавьте их явно, например:

```powershell
git add path\to\file
```

или, осознавая риск лишнего:

```powershell
git add -A
```

`VERSION` после шага 2 обязательно должен попасть в коммит (при `git add -u` он попадёт, если файл уже в репозитории).

---

## 5. Коммит с сообщением

Подставьте своё осмысленное описание (в кавычках):

```powershell
git commit -m "chore: release 3.0.15 — кратко что изменилось"
```

Номер в сообщении **подставьте вручную** под фактическое значение из `VERSION` (или прочитайте: `Get-Content VERSION`).

---

## 6. Пуш в удалённый репозиторий

```powershell
git push
```

Если ветка не `main` или нужен другой remote — используйте свою привычную команду, например `git push origin main`.

---

## 7. Деплой на production (с вашего ПК)

Нужен настроенный **`deploy/.env.deploy`** (скопирован с `deploy/.env.deploy.example`, заданы `DEPLOY_SSH_TARGET`, `DEPLOY_APP_PATH` и т.д.). См. [deploy/DEPLOY-MECHANISM.md](../deploy/DEPLOY-MECHANISM.md).

```powershell
.\deploy\sync-to-production.ps1
```

Скрипт по SSH сделает `git pull` на сервере, сборку фронта, миграции, статику, перезапуск gunicorn (если не отключено в `.env.deploy`).

---

## Минимальный сценарий «всё подряд» (после правок в коде)

Скопируйте блок целиком, **исправьте** путь `Set-Location` и смысловую часть в коммите (текст после `—`).

```powershell
Set-Location E:\PRO_WORK\Fabric_Awinings

$raw = (Get-Content -Raw -LiteralPath "VERSION").Trim()
$parts = $raw -split '\.'
$parts[2] = [string]([int]$parts[2] + 1)
$new = $parts[0] + "." + $parts[1] + "." + $parts[2]
[System.IO.File]::WriteAllText((Resolve-Path "VERSION").Path, $new, [System.Text.UTF8Encoding]::new($false))
Write-Host "VERSION -> $new"

git add -u
git status
git commit -m "chore: release $new — кратко что изменилось"
git push
.\deploy\sync-to-production.ps1
```

Если в релизе есть **неотслеживаемые** файлы, перед `git commit` выполните `git add` для них (см. шаг 4).

---

## Проверка после выкладки

- `https://ваш-домен/api/health/`
- при необходимости `/admin/`

---

## Важно

- В **один** релизный коммит обычно входит и **поднятие `VERSION`**, и **содержимое** правок — так принято в этом проекте при push + deploy.
- Секреты и `deploy/.env.deploy` **не** коммитьте.
