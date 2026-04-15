"""Лимиты для Staff API (спецификация §4.5)."""

from rest_framework.throttling import SimpleRateThrottle


class StaffAuthThrottle(SimpleRateThrottle):
    """Жёсткий лимит на выдачу staff JWT по IP."""

    scope = "staff_auth"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        if ident is None:
            return None
        return self.cache_format % {"scope": self.scope, "ident": ident}
