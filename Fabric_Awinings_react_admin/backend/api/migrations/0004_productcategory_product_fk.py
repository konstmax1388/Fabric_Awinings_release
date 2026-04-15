import django.db.models.deletion
from django.db import migrations, models


def forwards(apps, schema_editor):
    Product = apps.get_model("api", "Product")
    ProductCategory = apps.get_model("api", "ProductCategory")
    rows = [
        ("truck", "Для транспорта", 10),
        ("warehouse", "Ангары и склады", 20),
        ("cafe", "Кафе и террасы", 30),
        ("events", "Мероприятия", 40),
    ]
    slug_to_pk = {}
    for slug, title, order in rows:
        c, _ = ProductCategory.objects.get_or_create(
            slug=slug,
            defaults={"title": title, "sort_order": order, "is_published": True},
        )
        slug_to_pk[slug] = c.pk
    default_pk = slug_to_pk["truck"]
    for p in Product.objects.all():
        slug = getattr(p, "category", None)
        if slug not in slug_to_pk:
            slug = "truck"
        p.category_new_id = slug_to_pk[slug]
        p.save(update_fields=["category_new_id"])


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0003_site_customer_address"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProductCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.SlugField(db_index=True, max_length=64, unique=True, verbose_name="Слаг")),
                ("title", models.CharField(max_length=120, verbose_name="Название")),
                ("sort_order", models.PositiveIntegerField(default=0, verbose_name="Порядок в списках")),
                ("is_published", models.BooleanField(db_index=True, default=True, verbose_name="На сайте")),
            ],
            options={
                "verbose_name": "Категория товара",
                "verbose_name_plural": "Категории товаров",
                "ordering": ["sort_order", "title"],
            },
        ),
        migrations.AddField(
            model_name="product",
            name="category_new",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="+",
                to="api.productcategory",
                verbose_name="Категория",
            ),
        ),
        migrations.RunPython(forwards, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="product",
            name="category",
        ),
        migrations.AlterField(
            model_name="product",
            name="category_new",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="products",
                to="api.productcategory",
                verbose_name="Категория",
            ),
        ),
        migrations.RenameField(
            model_name="product",
            old_name="category_new",
            new_name="category",
        ),
    ]
