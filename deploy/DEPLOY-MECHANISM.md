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

**Лог в консоли:** `sync-to-production.ps1` собирает удалённый bash-скрипт с переводами строк **LF**, записывает во **временный файл** и подаёт в `ssh … bash -s` через **`Start-Process -RedirectStandardInput`** (не через конвейер строки в `ssh`: иначе PowerShell может добавить **CRLF** и удалённый bash падает с `$'\r': command not found`, exit **127**). Вывод **сразу** в консоль; шаги `npm ci` / `npm run build` могут занять **10–20 минут**.

После успешного удалённого сценария тот же скрипт выполняет **отдельный** `ssh` с `sudo systemctl restart …` (обход тех же проблем с концом stdin и явный перезапуск сервиса).

Скрипт по SSH выполнит: `git fetch/checkout/reset` → `npm ci && npm run build` в `frontend/` и `admin-ui/` → `migrate` / `collectstatic` в `backend/` → **`bash deploy/prune-production-tree.sh --drop-sqlite .`** → затем **`systemctl restart`** отдельной командой (обрезка дерева после деплоя см. [PRODUCTION-VPS.md](PRODUCTION-VPS.md)). В `deploy/.env.deploy` задайте `DEPLOY_SKIP_SYSTEMD=1`, если перезапуск Gunicorn делаете вручную из панели.

### `npm error EACCES` / `permission denied, unlink` в `node_modules`

Деплой выполняется от пользователя SSH (например `kasatkin_da`). Если раньше **`npm`** или **`git`** в каталоге сайта запускали **от root**, часть файлов в `frontend/node_modules` или `admin-ui/node_modules` окажется с владельцем `root`, и `npm ci` не сможет их удалить.

**Исправление один раз (на сервере под root):** выровнять владельца на пользователя деплоя, затем снова `sync-to-production`:

```bash
sudo chown -R kasatkin_da:kasatkin_da /var/www/kasatkin_da/data/www/fabrika-tentov.ru
```

(замените путь и пользователя на ваши из `DEPLOY_APP_PATH` / `DEPLOY_SSH_TARGET`.) В дальнейшем не запускайте `npm install` в этом дереве от root.

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

Очистка лишнего на сервере после каждого деплоя встроена в `sync-to-production.*` и workflow **Deploy VPS**: `deploy/prune-production-tree.sh --drop-sqlite` — подробности [PRODUCTION-VPS.md](PRODUCTION-VPS.md). Ручной прогон с другими флагами: `--keep-build-deps` (оставить `node_modules` и `*/src`), `--with-git` (удалить `.git`).

---

## Nginx: `robots.txt` и `sitemap.xml` (SEO)

Если снаружи **404** на `/robots.txt` или в `/sitemap.xml` виден **чужой домен** (например placeholder), а в репозитории уже есть `path("robots.txt", …)` и `path("sitemap.xml", …)` в Django:

1. В основном HTTPS vhost добавьте **exact** `location = /robots.txt` и `location = /sitemap.xml` с `proxy_pass` на Gunicorn — готовый текст: `deploy/nginx-seo-robots-sitemap-snippet.conf`; эталонный полный vhost: `deploy/nginx-fabrika-tentov.ru.full.conf`.
2. Однократно на VPS от root (пути при необходимости через `VPS_NGINX_VHOST`, `VPS_GUNICORN_PROXY`):  
   `sudo bash deploy/vps-nginx-inject-seo-exact-once.sh`
3. Плейсхолдеры в корне репо на сервере:  
   `bash deploy/vps-remove-placeholder-seo-files-once.sh "$DEPLOY_APP_PATH"`
4. Перегенерация файлов в `dist` и корне: в backend после деплоя уже вызывается `manage.py generate_public_seo_files`.

**Soft 404:** витрина должна идти через `location / { proxy_pass … }` на Django (корректные **404** для несуществующих путей), а не через `try_files … /index.html` на SPA.

---

## Проверка после выкладки

- `https://ваш-домен/api/health/`
- главная, `/admin/`, при необходимости `/staff/`

Логи Gunicorn: `journalctl -u fabrika-gunicorn -f` (имя unit — как у вас).
