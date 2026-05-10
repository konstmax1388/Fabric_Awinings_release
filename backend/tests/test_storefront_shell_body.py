import pytest


INDEX_EMPTY_ROOT = """<!doctype html><html lang="ru"><head></head><body>
<div id="root"></div>
</body></html>"""


@pytest.mark.django_db
def test_storefront_shell_injects_product_into_root(client, settings, tmp_path, monkeypatch):
    from api.models import Product, ProductCategory

    backend_dir = tmp_path / "backend"
    backend_dir.mkdir(parents=True)
    dist = tmp_path / "frontend" / "dist"
    dist.mkdir(parents=True)
    (dist / "index.html").write_text(INDEX_EMPTY_ROOT, encoding="utf-8")
    monkeypatch.setattr(settings, "BASE_DIR", backend_dir)

    cat = ProductCategory.objects.create(title="Кат", slug="cat-shell-body", is_published=True)
    p = Product.objects.create(
        title="Товар Shell SEO",
        slug="tovar-shell-seo",
        excerpt="Кратко о товаре для первого HTML.",
        category=cat,
        price_from=1500,
        is_published=True,
    )
    p.refresh_from_db()

    r = client.get(f"/catalog/{p.slug}")
    assert r.status_code == 200
    html = r.content.decode("utf-8")
    assert "Товар Shell SEO" in html
    assert "Кратко о товаре" in html
    assert "1500" in html
    assert "application/ld+json" in html
    assert '"@type": "Product"' in html


@pytest.mark.django_db
def test_storefront_shell_injects_blog_into_root(client, settings, tmp_path, monkeypatch):
    from api.models import BlogPost

    backend_dir = tmp_path / "backend"
    backend_dir.mkdir(parents=True)
    dist = tmp_path / "frontend" / "dist"
    dist.mkdir(parents=True)
    (dist / "index.html").write_text(INDEX_EMPTY_ROOT, encoding="utf-8")
    monkeypatch.setattr(settings, "BASE_DIR", backend_dir)

    BlogPost.objects.create(
        slug="post-shell-seo",
        title="Статья для first HTML",
        excerpt="Анонс статьи виден роботам.",
        body="",
        is_published=True,
    )

    r = client.get("/blog/post-shell-seo")
    assert r.status_code == 200
    html = r.content.decode("utf-8")
    assert "Статья для first HTML" in html
    assert "Анонс статьи виден роботам" in html
    assert "BlogPosting" in html


@pytest.mark.django_db
def test_storefront_shell_skips_inject_when_root_not_empty(client, settings, tmp_path, monkeypatch):
    from api.models import Product, ProductCategory

    backend_dir = tmp_path / "backend"
    backend_dir.mkdir(parents=True)
    dist = tmp_path / "frontend" / "dist"
    dist.mkdir(parents=True)
    (dist / "index.html").write_text(
        INDEX_EMPTY_ROOT,
        encoding="utf-8",
    )
    (dist / "catalog").mkdir(parents=True)
    (dist / "catalog" / "index.html").write_text(
        '<!doctype html><html><body><div id="root"><div>PRERENDERED</div></div></body></html>',
        encoding="utf-8",
    )
    monkeypatch.setattr(settings, "BASE_DIR", backend_dir)

    cat = ProductCategory.objects.create(title="Кат2", slug="cat-shell-body2", is_published=True)
    p = Product.objects.create(
        title="No Inject",
        slug="prerender-test-p",
        category=cat,
        price_from=1,
        is_published=True,
    )
    p.refresh_from_db()

    r = client.get("/catalog")
    assert r.status_code == 200
    assert b"PRERENDERED" in r.content
    assert b"storefront-shell-body" not in r.content
