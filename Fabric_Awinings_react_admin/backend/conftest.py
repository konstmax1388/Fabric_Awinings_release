"""
Тесты Unfold/Django admin ходят в /admin/. В pytest используется `config.settings_pytest`
(DJANGO_ADMIN_ENABLED=True), см. pytest.ini. Переменная ниже — запасной вариант для инструментов,
читающих env до загрузки settings_pytest.
"""

import os

os.environ.setdefault("DJANGO_ADMIN_ENABLED", "true")
