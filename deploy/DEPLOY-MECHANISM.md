# Механизм доработки и выкладки на хостинг

## Что может Cursor (ИИ) в этом проекте

- Менять код **в вашей локальной копии** репозитория, гонять `npm run build`, `manage.py check`, тесты.
- **Не имеет** прямого SSH-доступа к вашему **выделенному серверу / VPS** (или любому хостингу): из песочницы агента до вашей машины этот доступ не настраивается «само». Выкладка на прод — **с вашего ПК** (скрипт) или **из GitHub Actions** (после настройки секретов).

Итого: доработка — здесь в Cursor; **«нажать кнопку и обновить сайт»** — через скрипт ниже или через Actions.

---

## Вариант 1 — минимум после каждой доработки (рекомендуется стартовать с этого)

**Идея:** вы один раз настраиваете SSH и файл `deploy/.env.deploy`, дальше после `git push` на сервере делаете **одну команду** с ПК (или добавляете ярлык).

1. На сервере уже есть клон репозитория, `git`, Node 20+, `backend/.venv`, systemd `fabrika-gunicorn` (или своё имя — поправьте в скрипте).
2. С **вашего ПК** вход по SSH без пароля: `ssh user@host` работает с ключом.
3. Локально:

```bash
cp deploy/.env.deploy.example deploy/.env.deploy
# отредактируйте DEPLOY_SSH_TARGET и DEPLOY_APP_PATH (полный путь к корню проекта на сервере)
```

4. После того как изменения **запушены** в Git (например в `main`):

```bash
bash deploy/sync-to-production.sh
```

Для Windows (PowerShell) есть нативный запуск без Bash:

```powershell
.\deploy\sync-to-production.ps1
```

Скрипт по SSH выполнит: `git pull` → `npm ci && npm run build` в `frontend/` → `migrate` / `collectstatic` в `backend/` → `sudo systemctl restart fabrika-gunicorn`.

Если **sudo** с SSH запрещён хостингом — в `deploy/.env.deploy` задайте `DEPLOY_SKIP_SYSTEMD=1` и перезапускайте Gunicorn вручную из панели один раз после деплоя.

**Windows:** используйте `deploy/sync-to-production.ps1` (предпочтительно) или Git Bash с `.sh`.

---

## Вариант 2 — ещё меньше ручных шагов: GitHub Actions

**Идея:** вы только **пушите** в GitHub; деплой запускаете кнопкой в интерфейсе GitHub (или позже включите автозапуск при push).

1. Репозиторий на GitHub должен быть тем же кодом, с которого клонирован сервер (`git remote` на VPS указывает на него).
2. В GitHub: **Settings → Secrets and variables → Actions** добавьте:
   - `VPS_SSH_HOST` — только хост (например `mail.fabrika-tentov.ru` или IP).
   - `VPS_SSH_USER` — пользователь SSH.
   - `VPS_SSH_PRIVATE_KEY` — приватный ключ (весь PEM); для деплоя лучше отдельный ключ, в `~/.ssh/authorized_keys` на сервере.
   - `VPS_APP_PATH` — абсолютный путь к корню проекта на сервере.
3. На сервере пользователю из `VPS_SSH_USER` нужен **sudo без пароля** только для `systemctl restart fabrika-gunicorn` (или отключите restart в workflow и делайте вручную).
4. Запуск: **Actions → Deploy VPS → Run workflow**.

Файл workflow: [`.github/workflows/deploy-vps.yml`](../.github/workflows/deploy-vps.yml). По умолчанию только **ручной** запуск; автодеплой при каждом push закомментирован внутри файла.

Имя сервиса в workflow сейчас **`fabrika-gunicorn`** — при другом имени измените одну строку в YAML.

---

## Что вы делаете в типичном цикле «доработка → прод»

| Шаг | Кто |
|-----|-----|
| Описать задачу, получить правки в репозитории | Cursor + вы (принятие diff) |
| `git commit` + `git push` в GitHub / в ту ветку, с которой тянет сервер | Вы |
| Обновить прод одной командой **или** кнопкой Actions | Вы (один раз настроив вариант 1 или 2) |

Очистка лишних файлов на сервере (по желанию): `bash deploy/prune-production-tree.sh` — см. [PRODUCTION-VPS.md](PRODUCTION-VPS.md).

---

## Проверка после выкладки

- `https://ваш-домен/api/health/`
- главная, `/admin/`, при необходимости `/staff/`

Логи Gunicorn: `journalctl -u fabrika-gunicorn -f` (имя unit — как у вас).
