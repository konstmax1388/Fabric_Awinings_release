import pytest


@pytest.mark.django_db
def test_storefront_shell_prefers_prerender_html_for_catalog(client, settings, tmp_path, monkeypatch):
    backend_dir = tmp_path / "backend"
    backend_dir.mkdir(parents=True)
    dist = tmp_path / "frontend" / "dist"
    (dist / "catalog").mkdir(parents=True)
    (dist / "catalog" / "index.html").write_bytes(b"<html><body>PRERENDER_CATALOG</body></html>")
    (dist / "index.html").write_bytes(b"<html><body>SPA_SHELL</body></html>")
    monkeypatch.setattr(settings, "BASE_DIR", backend_dir)

    r = client.get("/catalog")
    assert r.status_code == 200
    body = r.content
    assert b"PRERENDER_CATALOG" in body
    assert b"SPA_SHELL" not in body


@pytest.mark.django_db
def test_storefront_shell_falls_back_when_no_prerender_file(client, settings, tmp_path, monkeypatch):
    backend_dir = tmp_path / "backend"
    backend_dir.mkdir(parents=True)
    dist = tmp_path / "frontend" / "dist"
    dist.mkdir(parents=True)
    (dist / "index.html").write_text(
        "<!doctype html><html lang=\"ru\"><head></head><body>SPA_ONLY</body></html>",
        encoding="utf-8",
    )
    monkeypatch.setattr(settings, "BASE_DIR", backend_dir)

    r = client.get("/catalog")
    assert r.status_code == 200
    body = r.content
    assert b"SPA_ONLY" in body
    assert b"<title>" in body
