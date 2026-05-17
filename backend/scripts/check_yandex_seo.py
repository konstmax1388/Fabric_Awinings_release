#!/usr/bin/env python3
"""Проверка HTML для индексации Яндексом (curl с User-Agent YandexBot)."""
from __future__ import annotations

import re
import sys
import urllib.request

BASE = "https://fabrika-tentov.ru"
UA = "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)"

PATHS = [
    "/",
    "/catalog",
    "/blog",
    "/portfolio",
    "/contacts",
    "/reviews",
    "/sales",
    "/catalog/category/chekhly-dlia-mebeli",
]


def fetch(path: str) -> tuple[int, str]:
    url = BASE + path
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, r.read().decode("utf-8", errors="replace")


def first_title(html: str) -> str:
    m = re.search(r"<title>\s*([^<]+?)\s*</title>", html, re.I)
    return (m.group(1).strip() if m else "")


def meta_description(html: str) -> str:
    for m in re.finditer(r'<meta\s[^>]+>', html, re.I):
        tag = m.group(0)
        if not re.search(r'\bname\s*=\s*["\']description["\']', tag, re.I):
            continue
        cm = re.search(r'\bcontent\s*=\s*["\']([^"\']*)["\']', tag, re.I)
        if cm:
            return cm.group(1).strip()
    return ""


def canonical(html: str) -> str:
    m = re.search(
        r'<link\s[^>]*rel\s*=\s*["\']canonical["\'][^>]*href\s*=\s*["\']([^"\']+)["\']',
        html,
        re.I,
    )
    if m:
        return m.group(1).strip()
    m = re.search(
        r'<link\s[^>]*href\s*=\s*["\']([^"\']+)["\'][^>]*rel\s*=\s*["\']canonical["\']',
        html,
        re.I,
    )
    return m.group(1).strip() if m else ""


def robots_meta(html: str) -> str:
    for m in re.finditer(r'<meta\s[^>]+>', html, re.I):
        tag = m.group(0)
        if re.search(r'\bname\s*=\s*["\']robots["\']', tag, re.I):
            cm = re.search(r'\bcontent\s*=\s*["\']([^"\']*)["\']', tag, re.I)
            if cm:
                return cm.group(1).strip()
    return ""


def has_shell_meta(html: str) -> bool:
    return "storefront_shell_meta (Django)" in html


def has_shell_body(html: str) -> bool:
    return "storefront-shell-body" in html


def has_loading_in_root(html: str) -> bool:
    m = re.search(r'<div[^>]*id\s*=\s*["\']root["\'][^>]*>(.*?)</div>\s*<aside', html, re.I | re.S)
    if not m:
        m = re.search(r'<motion id="root"[^>]*>(.*?)</motion.div>', html, re.I | re.S)
    inner = m.group(1) if m else ""
    return bool(re.search(r"загрузка|loading", inner, re.I))


def h1_text(html: str) -> str:
    m = re.search(r"<h1[^>]*>([^<]+)</h1>", html, re.I)
    return re.sub(r"\s+", " ", (m.group(1) if m else "").strip())


def audit(path: str) -> dict[str, object]:
    status, html = fetch(path)
    title = first_title(html)
    desc = meta_description(html)
    canon = canonical(html)
    expected_canon = (BASE + path).rstrip("/") or BASE + "/"
    if path == "/":
        expected_canon = BASE + "/"
    issues: list[str] = []
    if status != 200:
        issues.append(f"HTTP {status}")
    if not title:
        issues.append("нет <title>")
    elif title.strip() in ("Фабрика Тентов", "Сайт"):
        issues.append(f"слабый title: {title[:60]}")
    if len(desc) < 40:
        issues.append(f"нет/короткий description ({len(desc)} симв.)")
    if not canon:
        issues.append("нет canonical")
    elif canon.rstrip("/") != expected_canon.rstrip("/"):
        issues.append(f"canonical {canon} != {expected_canon}")
    rob = robots_meta(html)
    if rob and "noindex" in rob.lower():
        issues.append(f"robots: {rob}")
    if has_loading_in_root(html):
        issues.append("в #root «Загрузка»")
    if not has_shell_body(html) and path in {"/", "/catalog", "/blog", "/portfolio", "/contacts", "/reviews", "/sales"}:
        if has_loading_in_root(html) or not h1_text(html):
            issues.append("нет storefront-shell-body для робота")
    if not has_shell_meta(html) and "storefront_shell_meta_description" not in html:
        if path != "/":  # главная может быть только body
            issues.append("нет полного Django SEO-блока (нужен деплой?)")
    elif has_shell_meta(html):
        pass  # ok
    elif "storefront_shell_meta_description" in html and not title.startswith("Каталог") and path == "/catalog":
        issues.append("только description-фрагмент, title не исправлен (старый деплой?)")

    return {
        "path": path,
        "status": status,
        "title": title[:80],
        "desc_len": len(desc),
        "canonical": canon,
        "h1": h1_text(html)[:60],
        "shell_meta": has_shell_meta(html),
        "shell_body": has_shell_body(html),
        "issues": issues,
    }


def main() -> int:
    print(f"Проверка {BASE} (User-Agent: YandexBot)\n")
    failed = 0
    for path in PATHS:
        try:
            row = audit(path)
        except Exception as e:
            print(f"FAIL {path}: {e}")
            failed += 1
            continue
        flag = "OK" if not row["issues"] else "WARN"
        if row["issues"]:
            failed += 1
        print(f"[{flag}] {path}")
        print(f"  title: {row['title']}")
        print(f"  description: {row['desc_len']} симв.")
        print(f"  canonical: {row['canonical']}")
        print(f"  h1: {row['h1'] or '—'}")
        print(f"  Django shell meta: {row['shell_meta']}, body: {row['shell_body']}")
        if row["issues"]:
            for i in row["issues"]:
                print(f"  ! {i}")
        print()
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
