"""
Однократное или повторяемое заполнение реквизитов, контактов и SEO под ИП/фабрику (fabrika-tentov.ru).

Перед прогоном на проде сделайте бэкап БД. Повторный запуск перезаписывает те же поля.

  python manage.py apply_fabrika_site_identity
  python manage.py apply_fabrika_site_identity --dry-run
  python manage.py apply_fabrika_site_identity --only-site-settings
  python manage.py apply_fabrika_site_identity --only-home-meta
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from django.core.management.base import BaseCommand
from django.db import transaction

from ...models import HomePageContent, SiteSettings, default_seo_title_templates


# --- Публичные реквизиты ---
ENTREPRENEUR = "ИП Четверикова Лариса Юрьевна"
INN = "370207333295"
OGRNIP = "326370000001370"
ADDRESS = "153550, Ивановская область, г. Кохма, ул. Связи, 27"
PHONE_DISPLAY = "+7 901 696-32-26"
PHONE_HREF = "tel:+79016963226"
EMAIL = "sale@fabrika-tentov.ru"
SITE_NAME = "Фабрика Тентов"

LEGAL_LINE = f"{ENTREPRENEUR}, ИНН {INN}, ОГРНИП {OGRNIP}"

CONTACTS_INTRO = (
    "Свяжитесь с нами по телефону или e-mail. "
    "Производство в Иваново (Ивановская область), доставка готовой продукции по всей РФ — по согласованию. "
    "Работа с клиентами в регионе и в других субъектах России."
)

CONTACTS_META_DESCRIPTION = (
    f"Контакты {SITE_NAME} в Иваново (Ивановская область): телефон {PHONE_DISPLAY}, e-mail {EMAIL}, "
    f"адрес: {ADDRESS}. "
    "Производство тентов и навесов, доставка по всей РФ, заявка на fabrika-tentov.ru. "
    f"Реквизиты: {LEGAL_LINE}."
)

DEFAULT_META_DESCRIPTION = (
    f"Производство и монтаж тентов, навесов и шатров. Ивановская область, доставка готовой продукции по всей РФ. "
    f"Каталог и заявка на fabrika-tentov.ru. {PHONE_DISPLAY}, {EMAIL}."
)

SEO_TITLE_SUFFIX = "— Фабрика Тентов"

CATALOG_INTRO = (
    "Тенты, навесы и шатры для транспорта, складов, общепита и мероприятий. "
    "Производство в Иваново (Ивановская область), доставка по всей РФ — по согласованию."
)

HOME_META = {
    "title": f"{SITE_NAME} в Иваново (Ивановская область) — производство тентов и навесов",
    "description": (
        f"Тенты, навесы и шатры: изготовление в Иваново (Ивановская область), доставка готовой продукции по всей РФ, "
        f"заявка и каталог на fabrika-tentov.ru. {PHONE_DISPLAY}, {EMAIL}."
    ),
    "orgName": ENTREPRENEUR,
    "orgDescription": (
        f"Производство тентов, навесов и сопутствующие работы; доставка по всей РФ — по согласованию. "
        f"ИНН {INN}, ОГРНИП {OGRNIP}. {ADDRESS}."
    ),
}


def _merge_seo_templates() -> dict[str, str]:
    base = default_seo_title_templates()
    base.update(
        {
            "home": "{title}{suffix}",
            "listing": "{title}{suffix}",
            "static": "{title} — {siteName}",
            "article": "{title}{suffix}",
            "emdash": "{title} — {siteName}",
        }
    )
    return base


def _merge_home_meta(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        payload = {}
    out = deepcopy(payload)
    prev = out.get("meta")
    if not isinstance(prev, dict):
        prev = {}
    out["meta"] = {**prev, **HOME_META}
    return out


class Command(BaseCommand):
    help = "Заполнить SiteSettings (реквизиты, контакты, SEO) и meta главной (HomePageContent)"

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Показать изменения без записи в БД",
        )
        parser.add_argument(
            "--only-site-settings",
            action="store_true",
            help="Только Настройки сайта",
        )
        parser.add_argument(
            "--only-home-meta",
            action="store_true",
            help="Только блок meta главной (JSON)",
        )

    def handle(self, *args: object, **options: object) -> None:
        dry: bool = bool(options["dry_run"])
        only_ss: bool = bool(options.get("only_site_settings"))
        only_home: bool = bool(options.get("only_home_meta"))
        if only_ss and only_home:
            self.stderr.write("Нельзя одновременно --only-site-settings и --only-home-meta.\n")
            return

        do_settings = not only_home
        do_home = not only_ss

        self.stdout.write("=== apply_fabrika_site_identity ===\n")

        if dry:
            if do_settings:
                s = SiteSettings.get_solo()
                self._describe_settings(s)
            if do_home:
                self._describe_home()
            self.stdout.write(self.style.WARNING("dry-run: БД не изменялась."))
            return

        with transaction.atomic():
            if do_settings:
                s = SiteSettings.get_solo()
                self._apply_settings(s)
            if do_home:
                hp = HomePageContent.get_solo()
                self._apply_home_meta(hp)

        self.stdout.write(self.style.SUCCESS("Готово."))

    def _describe_settings(self, s: SiteSettings) -> None:
        self.stdout.write("--- SiteSettings ---\n")
        self.stdout.write(
            f"  site_name: {s.site_name!r} -> {SITE_NAME!r}\n"
            f"  phone_display: {s.phone_display!r} -> {PHONE_DISPLAY!r}\n"
            f"  phone_href: {s.phone_href!r} -> {PHONE_HREF!r}\n"
            f"  email: {s.email!r} -> {EMAIL!r}\n"
            f"  address, legal, catalog_intro, contacts_*, SEO — см. код команды\n"
        )

    def _apply_settings(self, s: SiteSettings) -> None:
        s.site_name = SITE_NAME
        s.phone_display = PHONE_DISPLAY
        s.phone_href = PHONE_HREF
        s.email = EMAIL
        s.address = ADDRESS
        s.legal = LEGAL_LINE
        s.contacts_intro = CONTACTS_INTRO
        s.contacts_meta_description = CONTACTS_META_DESCRIPTION
        s.seo_default_meta_description = DEFAULT_META_DESCRIPTION
        s.seo_title_suffix = SEO_TITLE_SUFFIX
        s.seo_title_templates = _merge_seo_templates()
        s.catalog_intro = CATALOG_INTRO
        s.full_clean()
        s.save()

    def _describe_home(self) -> None:
        self.stdout.write("--- HomePageContent.payload.meta ---\n")
        for k, v in HOME_META.items():
            self.stdout.write(f"  {k}: {v!r}\n")

    def _apply_home_meta(self, hp: HomePageContent) -> None:
        hp.payload = _merge_home_meta(hp.payload)
        hp.save()
