# Перенос данных из устаревших колонок `api_sitesettings` (если остались после старой 0071)
# и удаление этих колонок.

from django.db import connection, migrations


def _legacy_ozon_seller_columns_exist() -> bool:
    with connection.cursor() as c:
        v = connection.vendor
        if v == "mysql":
            c.execute(
                """
                SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'api_sitesettings'
                  AND COLUMN_NAME = 'ozon_seller_client_id'
                """
            )
            return c.fetchone()[0] > 0
        if v == "sqlite":
            c.execute("PRAGMA table_info(api_sitesettings)")
            cols = {row[1] for row in c.fetchall()}
            return "ozon_seller_client_id" in cols
        if v == "postgresql":
            c.execute(
                """
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'api_sitesettings' AND column_name = 'ozon_seller_client_id'
                """
            )
            return c.fetchone() is not None
    return False


def forwards(apps, schema_editor):
    if not _legacy_ozon_seller_columns_exist():
        return
    SiteSettings = apps.get_model("api", "SiteSettings")
    OzonSellerApiSettings = apps.get_model("api", "OzonSellerApiSettings")
    s = SiteSettings.objects.get(pk=1)
    v = connection.vendor
    with connection.cursor() as c:
        if v == "sqlite":
            c.execute(
                "SELECT ozon_seller_client_id, ozon_seller_api_key FROM api_sitesettings WHERE id = ?",
                [s.pk],
            )
        else:
            c.execute(
                "SELECT ozon_seller_client_id, ozon_seller_api_key FROM api_sitesettings WHERE id = %s",
                [s.pk],
            )
        row = c.fetchone()
    cid = (row[0] or "") if row else ""
    key = (row[1] or "") if row else ""
    OzonSellerApiSettings.objects.update_or_create(
        site=s, defaults={"client_id": str(cid), "api_key": str(key)}
    )
    with connection.cursor() as c:
        if v == "mysql":
            c.execute(
                "ALTER TABLE api_sitesettings DROP COLUMN ozon_seller_client_id, "
                "DROP COLUMN ozon_seller_api_key"
            )
        elif v == "sqlite":
            c.execute("ALTER TABLE api_sitesettings DROP COLUMN ozon_seller_client_id")
            c.execute("ALTER TABLE api_sitesettings DROP COLUMN ozon_seller_api_key")
        elif v == "postgresql":
            c.execute('ALTER TABLE api_sitesettings DROP COLUMN IF EXISTS "ozon_seller_client_id"')
            c.execute('ALTER TABLE api_sitesettings DROP COLUMN IF EXISTS "ozon_seller_api_key"')


def backwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0071_ozon_seller_api_settings"),
    ]

    operations = [migrations.RunPython(forwards, backwards)]
