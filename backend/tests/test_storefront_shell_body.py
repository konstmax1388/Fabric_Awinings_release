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
        '<!doctype html><html><body><div id="root"><main>'
        f'<h1>Каталог</h1><p>{"Тенты и навесы. " * 50}</p></main></div></body></html>',
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
    assert "Каталог".encode() in r.content
    assert b"storefront-shell-body" not in r.content


@pytest.mark.django_db
def test_storefront_shell_replaces_loading_prerender_for_catalog(client, settings, tmp_path, monkeypatch):
    backend_dir = tmp_path / "backend"
    backend_dir.mkdir(parents=True)
    dist = tmp_path / "frontend" / "dist"
    dist.mkdir(parents=True)
    (dist / "index.html").write_text(INDEX_EMPTY_ROOT, encoding="utf-8")
    (dist / "catalog").mkdir(parents=True)
    (dist / "catalog" / "index.html").write_text(
        '<!doctype html><html><head><title>Фабрика Тентов</title>'
        '<link rel="canonical" href="https://example.test/catalog" /></head><body>'
        '<div id="root"><div>Загрузка…</div></div><aside>cookies</aside></body></html>',
        encoding="utf-8",
    )
    monkeypatch.setattr(settings, "BASE_DIR", backend_dir)

    r = client.get("/catalog")
    html = r.content.decode("utf-8")
    assert r.status_code == 200
    assert "storefront-shell-body" in html
    assert "Каталог" in html
    assert "Загрузка" not in html
    assert "storefront_shell_meta (Django)" in html
    assert "каталог" in html.lower()
    assert html.count("<title>") == 1


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
    assert "storefront_shell_meta" in out

    m = re.search(r'name=["\']description["\'][^>]*content=["\']([^"\']{40,})', out)
    assert m, "meta description with non-trivial content expected"


@pytest.mark.django_db
@pytest.mark.parametrize(
    "path,weak_title",
    [
        ("/catalog", "Фабрика Тентов"),
        ("/blog", "Фабрика Тентов"),
        ("/portfolio", "Фабрика Тентов"),
        ("/contacts", "Фабрика Тентов"),
        ("/reviews", "Фабрика Тентов"),
    ],
)
def test_maybe_inject_full_meta_for_weak_prerender_titles(rf, path, weak_title):
    from api.storefront_shell_meta import maybe_inject_shell_head_meta

    req = rf.get(path)
    html = (
        f"<!doctype html><html><head><title>{weak_title}</title>"
        f'<link rel="canonical" href="https://example.test{path}" />'
        "</head><body></body></html>"
    )
    out = maybe_inject_shell_head_meta(html, req)
    assert "storefront_shell_meta (Django)" in out
    assert out.count("<title>") == 1
    assert weak_title not in out or out.index("<title>") < out.index(weak_title)


@pytest.mark.django_db
@pytest.mark.parametrize("path", ["/", "/catalog", "/blog", "/portfolio", "/contacts", "/reviews", "/sales"])
def test_shell_seo_injects_for_weak_prerender_on_main_paths(rf, path):
    """Слабый prerender (site_name + Загрузка) на всех ключевых разделах."""
    from api.storefront_shell_body import maybe_inject_shell_root_content
    from api.storefront_shell_meta import build_shell_head_meta_for_request, maybe_inject_shell_head_meta

    req = rf.get(path, HTTP_HOST="localhost")
    meta = build_shell_head_meta_for_request(req)
    assert meta and meta.title and meta.description and meta.canonical_url

    weak = (
        f"<!doctype html><html><head><title>Фабрика Тентов</title>"
        f'<link rel="canonical" href="{meta.canonical_url}" />'
        f"</head><body><div id=\"root\"><div>Загрузка…</div><aside></aside></body></html>"
    )
    html = maybe_inject_shell_head_meta(weak, req)
    html = maybe_inject_shell_root_content(html, req)
    assert "storefront_shell_meta (Django)" in html
    assert "storefront-shell-body" in html
    assert meta.title in html
    assert "Загрузка" not in html
    assert html.count("<title>") == 1


@pytest.mark.django_db
def test_skips_full_inject_when_prerender_head_already_complete(rf):
    from api.storefront_shell_meta import (
        build_shell_head_meta_for_request,
        maybe_inject_shell_head_meta,
        render_shell_head_fragment,
    )

    req = rf.get("/catalog", HTTP_HOST="localhost")
    meta = build_shell_head_meta_for_request(req)
    assert meta
    frag = render_shell_head_fragment(meta)
    html = f"<!doctype html><html><head>{frag}</head><body></body></html>"
    out = maybe_inject_shell_head_meta(html, req)
    assert out.count("storefront_shell_meta (Django)") == 1
    assert out.count("<title>") == 1
    assert meta.title in out


@pytest.mark.django_db
def test_maybe_inject_full_meta_when_prerender_title_is_only_site_name(rf):
    from api.models import SiteSettings

    from api.storefront_shell_meta import maybe_inject_shell_head_meta

    ss = SiteSettings.get_solo()
    ss.site_name = "Фабрика Тентов"
    ss.seo_catalog_listing_meta_description = "Каталог тентов для роботов."
    ss.save()

    req = rf.get("/catalog")
    html = (
        "<!doctype html><html><head>"
        "<title>Фабрика Тентов</title>"
        '<link rel="canonical" href="https://example.test/catalog" />'
        "</head><body></body></html>"
    )
    out = maybe_inject_shell_head_meta(html, req)
    assert "storefront_shell_meta (Django)" in out
    assert out.count("<title>") == 1
    assert "Каталог" in out
    assert "Каталог тентов для роботов" in out


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


