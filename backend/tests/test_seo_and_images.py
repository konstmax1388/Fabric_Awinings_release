import pytest
from PIL import Image

from api.models import SiteSettings


@pytest.mark.django_db
def test_sitemap_xml_ok(client):
    r = client.get("/sitemap.xml")
    assert r.status_code == 200
    assert "application/xml" in r.headers.get("Content-Type", "")
    body = r.content.decode()
    assert "urlset" in body
    assert "http://" in body or "https://" in body


@pytest.mark.django_db
def test_sitemap_xml_empty_when_indexing_disabled(client):
    s = SiteSettings.get_solo()
    s.seo_allow_indexing = False
    s.save(update_fields=["seo_allow_indexing"])
    r = client.get("/sitemap.xml")
    assert r.status_code == 200
    body = r.content.decode()
    assert "<urlset" in body
    assert "<url>" not in body


@pytest.mark.django_db
def test_robots_txt_ok(client, settings):
    settings.PUBLIC_SITE_URL = "https://example.test"
    r = client.get("/robots.txt")
    assert r.status_code == 200
    assert "text/plain" in r.headers.get("Content-Type", "")
    body = r.content.decode()
    assert "User-agent:" in body
    assert "Sitemap: https://example.test/sitemap.xml" in body
    assert "Disallow: /api/" in body
    assert "Host: https://example.test" in body
    assert "Clean-param:" in body


@pytest.mark.django_db
def test_robots_txt_disallow_all_when_indexing_disabled(client, settings):
    settings.PUBLIC_SITE_URL = "https://example.test"
    s = SiteSettings.get_solo()
    s.seo_allow_indexing = False
    s.save(update_fields=["seo_allow_indexing"])
    r = client.get("/robots.txt")
    assert r.status_code == 200
    body = r.content.decode()
    assert "Disallow: /" in body
    assert "Sitemap:" not in body


@pytest.mark.django_db
def test_generate_public_seo_files_writes_dist(tmp_path, settings):
    settings.PUBLIC_SITE_URL = "https://example.test"
    dest = tmp_path / "dist"
    dest.mkdir()
    from django.core.management import call_command

    call_command("generate_public_seo_files", "--output", str(dest))
    sm = (dest / "sitemap.xml").read_text(encoding="utf-8")
    rb = (dest / "robots.txt").read_text(encoding="utf-8")
    assert "urlset" in sm
    assert "https://example.test/" in sm
    assert "Sitemap: https://example.test/sitemap.xml" in rb


@pytest.mark.django_db
def test_generate_public_seo_files_writes_dist_and_site_root(tmp_path, settings, monkeypatch):
    repo = tmp_path / "fabrika-site"
    backend_dir = repo / "backend"
    backend_dir.mkdir(parents=True)
    (repo / "frontend" / "dist").mkdir(parents=True)
    monkeypatch.setattr(settings, "BASE_DIR", backend_dir)
    settings.PUBLIC_SITE_URL = "https://example.test"
    from django.core.management import call_command

    call_command("generate_public_seo_files")
    dist_sm = repo / "frontend" / "dist" / "sitemap.xml"
    root_sm = repo / "sitemap.xml"
    assert dist_sm.is_file() and root_sm.is_file()
    assert dist_sm.read_text(encoding="utf-8") == root_sm.read_text(encoding="utf-8")
    assert (repo / "robots.txt").read_text(encoding="utf-8") == (repo / "frontend" / "dist" / "robots.txt").read_text(
        encoding="utf-8"
    )


@pytest.mark.django_db
def test_image_variant_rejects_traversal(client, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    r = client.get("/api/image-variant/", {"path": "../../../etc/passwd", "w": 640, "f": "webp"})
    assert r.status_code == 400


@pytest.mark.django_db
def test_image_variant_webp_from_png(client, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    sub = tmp_path / "products"
    sub.mkdir()
    Image.new("RGB", (900, 600), color=(40, 80, 120)).save(sub / "t.png")
    r = client.get("/api/image-variant/", {"path": "products/t.png", "w": 640, "f": "webp"})
    assert r.status_code == 200
    assert "image/webp" in r.headers.get("Content-Type", "")
    # повтор — из кэша
    r2 = client.get("/api/image-variant/", {"path": "products/t.png", "w": 640, "f": "webp"})
    assert r2.status_code == 200


@pytest.mark.django_db
def test_image_variant_unknown_file(client, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    r = client.get("/api/image-variant/", {"path": "nope/missing.jpg", "w": 640, "f": "webp"})
    assert r.status_code == 404
