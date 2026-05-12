import pytest


INDEX_EMPTY_ROOT = """<!doctype html><html lang="ru"><head></head><body>
<div id="root"></div>
</body></html>"""


@pytest.mark.django_db
def test_storefront_unknown_path_returns_spa_shell_404(client, settings, tmp_path, monkeypatch):
    backend_dir = tmp_path / "backend"
    backend_dir.mkdir(parents=True)
    dist = tmp_path / "frontend" / "dist"
    dist.mkdir(parents=True)
    (dist / "index.html").write_text(
        '<!doctype html><html lang="ru"><head><title>x</title></head><body>'
        '<div id="root"></div><script type="module" src="/assets/index.js"></script></body></html>',
        encoding="utf-8",
    )
    monkeypatch.setattr(settings, "BASE_DIR", backend_dir)

    r = client.get("/this-route-does-not-exist-abc123")
    assert r.status_code == 404
    body = r.content.decode("utf-8")
    assert 'id="root"' in body
    assert "/assets/index.js" in body
    assert "Перейти на главную" not in body

    rh = client.head("/this-route-does-not-exist-abc123")
    assert rh.status_code == 404


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


@pytest.mark.django_db
def test_maybe_inject_meta_description_when_only_title_in_head(rf):
    import re

    from api.storefront_shell_meta import maybe_inject_shell_head_meta

    req = rf.get("/")
    html = (
        '<!doctype html><html><head><meta charset="utf-8"/>'
        "<title>Главная из prerender</title></head><body></body></html>"
    )
    out = maybe_inject_shell_head_meta(html, req)
    assert "storefront_shell_meta_description" in out

    m = re.search(r'name=["\']description["\'][^>]*content=["\']([^"\']{40,})', out)
    assert m, "meta description with non-trivial content expected"


def test_rewrite_local_preview_canonical_and_og_url(rf):
    from api.storefront_shell_meta import rewrite_local_preview_urls_in_html

    req = rf.get("/catalog")
    html = (
        "<head>"
        '<link rel="canonical" href="http://127.0.0.1:4182/catalog" />'
        '<meta property="og:url" content="http://127.0.0.1:4182/catalog" />'
        "</head>"
    )
    out = rewrite_local_preview_urls_in_html(html, req)
    assert "127.0.0.1" not in out
    assert "http://testserver/catalog" in out


@pytest.mark.django_db
def test_home_shell_body_word_count_and_single_h1(client, settings, tmp_path, monkeypatch):
    import re

    backend_dir = tmp_path / "backend"
    backend_dir.mkdir(parents=True)
    dist = tmp_path / "frontend" / "dist"
    dist.mkdir(parents=True)
    (dist / "index.html").write_text(INDEX_EMPTY_ROOT, encoding="utf-8")
    monkeypatch.setattr(settings, "BASE_DIR", backend_dir)

    r = client.get("/")
    assert r.status_code == 200
    html = r.content.decode("utf-8")
    assert html.count("<h1") == 1
    start = html.find("storefront-shell-body")
    end = html.find("</main>", start)
    assert start != -1 and end != -1
    blob = html[start:end]
    n_words = len(
        re.findall(r"[0-9A-Za-zА-Яа-яЁёІіЇїЄєҐґ\-]+", blob),
    )
    assert n_words >= 300


