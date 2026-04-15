"""Проверка пары Account/Secure против CDEK OAuth (тестовый или боевой контур из настроек)."""

from django.core.management.base import BaseCommand

from api.models import SiteSettings
from api.services.cdek_http import CdekAuthError, fetch_cdek_access_token


class Command(BaseCommand):
    help = "Запросить access_token у CDEK API v2 (проверка учётных данных)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force-refresh",
            action="store_true",
            help="Игнорировать кэш и запросить новый токен.",
        )

    def handle(self, *args, **options):
        s = SiteSettings.get_solo()
        try:
            tok = fetch_cdek_access_token(s, force_refresh=options["force_refresh"])
        except CdekAuthError as e:
            self.stderr.write(self.style.ERROR(str(e)))
            raise SystemExit(1) from e
        self.stdout.write(self.style.SUCCESS(f"OK, токен получен (длина {len(tok)} символов)."))
