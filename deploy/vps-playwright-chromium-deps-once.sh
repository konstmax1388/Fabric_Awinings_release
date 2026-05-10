#!/usr/bin/env bash
# Однократно на VPS (Ubuntu/Debian): пакеты для bundled Chromium Playwright (ошибка libatk-1.0.so.0 и др.).
# На сервере из корня репозитория:  sudo bash deploy/vps-playwright-chromium-deps-once.sh
# Полный список от Microsoft (при наличии Node):  cd frontend && sudo npx playwright install-deps chromium
set -euo pipefail

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Нужен root: sudo bash $0"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq

apt-get install -y \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libatspi2.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libcairo2 \
  libx11-xcb1 \
  libxcb-dri3-0 \
  libxcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxkbcommon0 \
  libxrandr2

# ALSA: имя пакета на 24.04 может быть libasound2t64
apt-get install -y libasound2t64 2>/dev/null || apt-get install -y libasound2

echo "[vps-playwright-chromium-deps-once] готово."
