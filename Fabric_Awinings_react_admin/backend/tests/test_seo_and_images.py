import pytest
from PIL import Image


@pytest.mark.django_db
def test_sitemap_xml_ok(client):
    r = client.get("/sitemap.xml")
    assert r.status_code == 200
    assert "application/xml" in r.headers.get("Content-Type", "")
    body = r.content.decode()
    assert "urlset" in body
    assert "http://" in body or "https://" in body


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
