import pytest

from api.slug_utils import latin_slug_from_text, slug_is_ascii_only, unique_slug_for_instance


def test_latin_slug_from_text_cyrillic():
    s = latin_slug_from_text("Аксессуары для банных печей", 64)
    assert slug_is_ascii_only(s)
    s.encode("ascii")  # только латиница / цифры / - / _
    assert "pech" in s or "pec" in s  # транслит от «печ»


def test_slug_is_ascii_only():
    assert slug_is_ascii_only("truck-tents")
    assert slug_is_ascii_only("wb-123")
    assert not slug_is_ascii_only("")
    assert not slug_is_ascii_only("печи")
    assert not slug_is_ascii_only("mix-cyrillic-а")


@pytest.mark.django_db
def test_product_category_save_replaces_non_ascii_slug():
    from api.models import ProductCategory

    obj = ProductCategory.objects.create(slug="ascii-slug-keep", title="Тенты")
    obj.slug = "не-ascii-слаг"
    obj.save()
    obj.refresh_from_db()
    assert slug_is_ascii_only(obj.slug)


@pytest.mark.django_db
def test_unique_slug_for_instance_respects_collision():
    from api.models import ProductCategory
    import uuid

    u = str(uuid.uuid4())[:10]
    title = f"Коллизия {u}"
    base = latin_slug_from_text(title, 64)
    ProductCategory.objects.create(slug=base, title="first")
    other = ProductCategory.objects.create(slug=f"z-{u}", title="z")
    s2 = unique_slug_for_instance(other, title, field_name="slug")
    assert slug_is_ascii_only(s2)
    assert s2 != base
