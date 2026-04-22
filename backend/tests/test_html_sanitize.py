from api.html_sanitize import sanitize_html_fragment


def test_sanitize_keeps_safe_table_markup():
    raw = '<table><thead><tr><th colspan="2" scope="col">H</th></tr></thead><tbody><tr><td rowspan="2">A</td><td>B</td></tr></tbody></table>'
    cleaned = sanitize_html_fragment(raw)
    assert "<table>" in cleaned
    assert 'colspan="2"' in cleaned
    assert 'rowspan="2"' in cleaned
    assert 'scope="col"' in cleaned


def test_sanitize_strips_script_and_js_urls():
    raw = '<p onclick="alert(1)">X</p><script>alert(2)</script><a href="javascript:alert(3)">bad</a>'
    cleaned = sanitize_html_fragment(raw)
    assert "<script" not in cleaned
    assert "onclick" not in cleaned
    assert "javascript:" not in cleaned
